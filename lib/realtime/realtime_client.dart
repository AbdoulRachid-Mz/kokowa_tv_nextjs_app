import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import 'package:flutter/foundation.dart';

enum ConnectionStatus {
  disconnected,
  connecting,
  connected,
  reconnecting,
  authenticated
}

enum EntityType {
  edition,
  subGroup,
  match,
  fighter,
  region,
  admin
}

class RealtimeMessage {
  final String type;
  final dynamic data;
  final DateTime timestamp;

  RealtimeMessage({
    required this.type,
    required this.data,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory RealtimeMessage.fromJson(Map<String, dynamic> json) {
    return RealtimeMessage(
      type: json['type'] as String,
      data: json['data'],
    );
  }

  Map<String, dynamic> toJson() => {
    'type': type,
    'data': data,
  };
}

class RealtimeUpdatePayload {
  final EntityType entityType;
  final dynamic entityId;
  final String event;
  final dynamic data;
  final int timestamp;
  final String? instanceId;

  RealtimeUpdatePayload({
    required this.entityType,
    required this.entityId,
    required this.event,
    required this.data,
    required this.timestamp,
    this.instanceId,
  });

  factory RealtimeUpdatePayload.fromJson(Map<String, dynamic> json) {
    return RealtimeUpdatePayload(
      entityType: _parseEntityType(json['entityType']),
      entityId: json['entityId'],
      event: json['event'],
      data: json['data'],
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
      instanceId: json['_instance'],
    );
  }

  static EntityType _parseEntityType(dynamic value) {
    if (value is String) {
      return EntityType.values.firstWhere(
        (e) => e.toString().split('.').last == value,
        orElse: () => EntityType.match,
      );
    }
    return EntityType.match;
  }
}

class RateLimitInfo {
  final String message;
  final int limit;
  final int windowMs;

  RateLimitInfo({
    required this.message,
    required this.limit,
    required this.windowMs,
  });

  factory RateLimitInfo.fromJson(Map<String, dynamic> json) {
    return RateLimitInfo(
      message: json['message'] ?? 'Rate limit exceeded',
      limit: json['limit'] ?? 60,
      windowMs: json['windowMs'] ?? 60000,
    );
  }
}

class RealtimeClient {
  final String url;
  final Duration pingInterval;
  final Duration connectionTimeout;
  final int maxReconnectAttempts;
  final bool autoReconnect;
  final bool enableLogging;
  
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _pingTimer;
  Timer? _connectionTimer;
  bool _isManualDisconnect = false;
  
  ConnectionStatus _status = ConnectionStatus.disconnected;
  int _reconnectAttempts = 0;
  final Set<String> _subscriptions = {};
  String? _authToken;
  String? _userId;
  List<String>? _roles;
  
  // Callbacks
  Function(ConnectionStatus status)? onStatusChange;
  Function(RealtimeUpdatePayload update)? onUpdate;
  Function(RealtimeMessage message)? onMessage;
  Function(dynamic error)? onError;
  Function(RateLimitInfo info)? onRateLimit;
  Function()? onAuthSuccess;
  
  // Stream pour les updates
  final _updateController = StreamController<RealtimeUpdatePayload>.broadcast();
  Stream<RealtimeUpdatePayload> get updates => _updateController.stream;
  
  // Stream pour les messages bruts
  final _messageController = StreamController<RealtimeMessage>.broadcast();
  Stream<RealtimeMessage> get messages => _messageController.stream;
  
  ConnectionStatus get status => _status;
  bool get isConnected => _status == ConnectionStatus.connected || _status == ConnectionStatus.authenticated;
  bool get isAuthenticated => _status == ConnectionStatus.authenticated;
  String? get userId => _userId;
  List<String>? get roles => _roles;
  int get subscriptionCount => _subscriptions.length;

  RealtimeClient({
    required this.url,
    this.pingInterval = const Duration(seconds: 30),
    this.connectionTimeout = const Duration(seconds: 10),
    this.maxReconnectAttempts = 10,
    this.autoReconnect = true,
    this.enableLogging = kDebugMode,
  });

  void _log(String message) {
    if (enableLogging) {
      debugPrint('[Realtime] $message');
    }
  }

  void _setStatus(ConnectionStatus newStatus) {
    if (_status != newStatus) {
      _status = newStatus;
      _log('Status changed: ${_status.toString().split('.').last}');
      onStatusChange?.call(newStatus);
    }
  }

  Future<void> connect() async {
    if (_status == ConnectionStatus.connecting || 
        _status == ConnectionStatus.connected || 
        _status == ConnectionStatus.authenticated) {
      return;
    }

    _setStatus(ConnectionStatus.connecting);
    _isManualDisconnect = false;

    try {
      _log('Connecting to $url...');
      
      // Timeout de connexion
      _connectionTimer?.cancel();
      _connectionTimer = Timer(connectionTimeout, () {
        if (_status == ConnectionStatus.connecting) {
          _log('Connection timeout');
          _handleError(TimeoutException('Connection timeout'));
        }
      });

      _channel = WebSocketChannel.connect(Uri.parse(url));
      
      _subscription = _channel!.stream.listen(
        _handleMessage,
        onDone: _handleDisconnect,
        onError: _handleError,
      );

      _setStatus(ConnectionStatus.connected);
      _reconnectAttempts = 0;
      _connectionTimer?.cancel();
      
      // Démarrer le ping
      _startPing();
      
      // S'authentifier si token disponible
      if (_authToken != null) {
        _sendAuth();
      }
      
      // Se réabonner aux anciennes souscriptions
      _resubscribe();
      
    } catch (e) {
      _handleError(e);
    }
  }

  void _startPing() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(pingInterval, (_) {
      if (isConnected) {
        send('ping', {});
      }
    });
  }

  void _handleMessage(dynamic data) {
    try {
      final message = RealtimeMessage.fromJson(jsonDecode(data));
      _log('Received: ${message.type}');
      
      // Traiter les différents types de messages
      switch (message.type) {
        case 'connected':
          _reconnectAttempts = 0;
          _log('Connected to server (instance: ${message.data['instanceId']})');
          break;
          
        case 'auth_success':
          _setStatus(ConnectionStatus.authenticated);
          _userId = message.data['userId'];
          _roles = List<String>.from(message.data['roles'] ?? []);
          _log('Authenticated as $_userId');
          onAuthSuccess?.call();
          break;
          
        case 'subscribed':
          _log('Subscribed to ${message.data['entityType']}:${message.data['entityId']}');
          break;
          
        case 'unsubscribed':
          _log('Unsubscribed from ${message.data['entityType']}:${message.data['entityId']}');
          break;
          
        case 'update':
          final update = RealtimeUpdatePayload.fromJson(message.data);
          _updateController.add(update);
          onUpdate?.call(update);
          break;
          
        case 'pong':
          // Ignorer, c'est pour le keepalive
          break;
          
        case 'rate_limit_exceeded':
          final rateInfo = RateLimitInfo.fromJson(message.data);
          _log('⚠️ Rate limit: ${rateInfo.message}');
          onRateLimit?.call(rateInfo);
          break;
          
        case 'error':
          _log('❌ Server error: ${message.data['message']}');
          onError?.call(message.data);
          break;
      }
      
      _messageController.add(message);
      onMessage?.call(message);
      
    } catch (e, stack) {
      _log('Error parsing message: $e');
      if (enableLogging) {
        debugPrintStack(stackTrace: stack);
      }
    }
  }

  void _handleDisconnect() {
    _log('Disconnected');
    _setStatus(ConnectionStatus.disconnected);
    _pingTimer?.cancel();
    _connectionTimer?.cancel();
    
    if (!_isManualDisconnect && autoReconnect) {
      _reconnect();
    }
    
    onDisconnect?.call();
  }

  void _handleError(dynamic error) {
    _log('Error: $error');
    _setStatus(ConnectionStatus.disconnected);
    _pingTimer?.cancel();
    _connectionTimer?.cancel();
    
    if (!_isManualDisconnect && autoReconnect) {
      _reconnect();
    }
    
    onError?.call(error);
  }

  void _reconnect() {
    if (_reconnectAttempts >= maxReconnectAttempts) {
      _log('Max reconnect attempts reached');
      return;
    }

    _setStatus(ConnectionStatus.reconnecting);
    
    final delay = Duration(seconds: 1 * (1 << _reconnectAttempts));
    _log('Reconnecting in ${delay.inSeconds}s... (${_reconnectAttempts + 1}/$maxReconnectAttempts)');
    
    Future.delayed(delay, () {
      _reconnectAttempts++;
      connect();
    });
  }

  void _resubscribe() {
    if (_subscriptions.isEmpty) return;
    
    _log('Resubscribing to ${_subscriptions.length} subscriptions...');
    for (var sub in _subscriptions) {
      final parts = sub.split(':');
      _sendSubscribe(parts[0], parts[1]);
    }
  }

  void _sendSubscribe(String entityType, String entityId) {
    send('subscribe', {
      'entityType': entityType,
      'entityId': entityId,
    });
  }

  void _sendAuth() {
    if (_authToken != null && isConnected) {
      _log('Sending authentication...');
      send('auth', {'token': _authToken});
    }
  }

  // Méthodes publiques

  Future<void> authenticate(String token) async {
    _authToken = token;
    if (isConnected) {
      _sendAuth();
    } else {
      await connect();
    }
  }

  void subscribe(EntityType entityType, dynamic entityId) {
    final typeStr = entityType.toString().split('.').last;
    final subKey = '$typeStr:$entityId';
    
    _subscriptions.add(subKey);
    if (isConnected) {
      _sendSubscribe(typeStr, entityId.toString());
    }
  }

  void unsubscribe(EntityType entityType, dynamic entityId) {
    final typeStr = entityType.toString().split('.').last;
    final subKey = '$typeStr:$entityId';
    
    _subscriptions.remove(subKey);
    if (isConnected) {
      send('unsubscribe', {
        'entityType': typeStr,
        'entityId': entityId.toString(),
      });
    }
  }

  void send(String type, dynamic data) {
    if (_channel != null && _channel!.sink != null && isConnected) {
      final message = RealtimeMessage(type: type, data: data);
      _channel!.sink.add(jsonEncode(message.toJson()));
    } else {
      _log('Cannot send $type: not connected');
    }
  }

  void disconnect() {
    _log('Manual disconnect');
    _isManualDisconnect = true;
    _pingTimer?.cancel();
    _connectionTimer?.cancel();
    _subscription?.cancel();
    _channel?.sink.close(status.goingAway);
    _channel = null;
    _setStatus(ConnectionStatus.disconnected);
  }

  void clearSubscriptions() {
    _subscriptions.clear();
  }

  void dispose() {
    disconnect();
    _updateController.close();
    _messageController.close();
    _pingTimer?.cancel();
    _connectionTimer?.cancel();
  }

  // Méthodes helper pour les types d'entités
  void subscribeToMatch(dynamic matchId) => subscribe(EntityType.match, matchId);
  void unsubscribeFromMatch(dynamic matchId) => unsubscribe(EntityType.match, matchId);
  
  void subscribeToEdition(dynamic editionId) => subscribe(EntityType.edition, editionId);
  void unsubscribeFromEdition(dynamic editionId) => unsubscribe(EntityType.edition, editionId);
  
  void subscribeToSubGroup(dynamic subGroupId) => subscribe(EntityType.subGroup, subGroupId);
  void unsubscribeFromSubGroup(dynamic subGroupId) => unsubscribe(EntityType.subGroup, subGroupId);
  
  void subscribeToFighter(dynamic fighterId) => subscribe(EntityType.fighter, fighterId);
  void unsubscribeFromFighter(dynamic fighterId) => unsubscribe(EntityType.fighter, fighterId);
  
  void subscribeToRegion(dynamic regionId) => subscribe(EntityType.region, regionId);
  void unsubscribeFromRegion(dynamic regionId) => unsubscribe(EntityType.region, regionId);
  
  void subscribeToAdmin() => subscribe(EntityType.admin, 'stream');
  void unsubscribeFromAdmin() => unsubscribe(EntityType.admin, 'stream');
}