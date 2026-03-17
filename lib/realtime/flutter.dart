// lib/realtime/flutter.dart
import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';

class RealtimeClient {
  final String url;
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  bool _isConnected = false;
  int _reconnectAttempts = 0;
  final Set<String> _subscriptions = {};

  // Callbacks
  Function()? onConnect;
  Function()? onDisconnect;
  Function(Map<String, dynamic>)? onMessage;
  Function(dynamic)? onError;

  RealtimeClient(this.url);

  void connect() {
    if (_isConnected) return;

    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _isConnected = true;

      _subscription = _channel!.stream.listen(
        (data) {
          _handleMessage(data);
        },
        onDone: () {
          _handleDisconnect();
        },
        onError: (error) {
          _handleError(error);
        },
      );

      if (onConnect != null) onConnect!();
      _resubscribe();
    } catch (e) {
      _handleError(e);
    }
  }

  void _handleMessage(dynamic data) {
    try {
      final Map<String, dynamic> message = jsonDecode(data);
      if (message['type'] == 'connected') {
        _reconnectAttempts = 0;
      }
      if (onMessage != null) onMessage!(message);
    } catch (e) {
      print('Error parsing message: $e');
    }
  }

  void _handleDisconnect() {
    _isConnected = false;
    if (onDisconnect != null) onDisconnect!();
    _reconnect();
  }

  void _handleError(dynamic error) {
    _isConnected = false;
    if (onError != null) onError!(error);
    _reconnect();
  }

  void _reconnect() {
    if (_reconnectAttempts >= 10) return;

    final delay = Duration(seconds: 1 * (1 << _reconnectAttempts));
    print('Reconnecting in ${delay.inSeconds}s...');

    Timer(delay, () {
      _reconnectAttempts++;
      connect();
    });
  }

  void _resubscribe() {
    for (var sub in _subscriptions) {
      final parts = sub.split(':');
      subscribe(parts[0], parts[1]);
    }
  }

  void subscribe(String entityType, String entityId) {
    _subscriptions.add('$entityType:$entityId');
    _send('subscribe', {'entityType': entityType, 'entityId': entityId});
  }

  void auth(String token) {
    _send('auth', {'token': token});
  }

  void _send(String type, dynamic data) {
    if (_channel != null && _isConnected) {
      _channel!.sink.add(jsonEncode({'type': type, 'data': data}));
    }
  }

  void disconnect() {
    _subscription?.cancel();
    _channel?.sink.close();
    _isConnected = false;
  }
}
