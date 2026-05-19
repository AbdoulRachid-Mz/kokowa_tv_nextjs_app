import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
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

  factory RealtimeUpdatePayload.fromFirestore(
    EntityType entityType,
    dynamic entityId,
    Map<String, dynamic> docData,
  ) {
    // Extract event from document data
    String event = 'update';
    if (docData['realtime'] != null && docData['realtime']['lastEvent'] != null) {
      event = docData['realtime']['lastEvent'] as String;
    }

    int timestamp = DateTime.now().millisecondsSinceEpoch;
    if (docData['updatedAt'] != null) {
      timestamp = docData['updatedAt'] as int;
    }

    return RealtimeUpdatePayload(
      entityType: entityType,
      entityId: entityId,
      event: event,
      data: docData,
      timestamp: timestamp,
      instanceId: 'firestore',
    );
  }
}

class RealtimeClient {
  final bool enableLogging;
  
  ConnectionStatus _status = ConnectionStatus.disconnected;
  final Map<String, StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>> _activeSubscriptions = {};
  
  // Callbacks for API compatibility
  Function(ConnectionStatus status)? onStatusChange;
  Function(RealtimeUpdatePayload update)? onUpdate;
  Function(dynamic error)? onError;
  Function()? onAuthSuccess;
  
  // Broadcast stream for updates
  final _updateController = StreamController<RealtimeUpdatePayload>.broadcast();
  Stream<RealtimeUpdatePayload> get updates => _updateController.stream;
  
  ConnectionStatus get status => _status;
  bool get isConnected => _status == ConnectionStatus.connected || _status == ConnectionStatus.authenticated;
  bool get isAuthenticated => _status == ConnectionStatus.authenticated;
  String? get userId => FirebaseAuth.instance.currentUser?.uid;
  int get subscriptionCount => _activeSubscriptions.length;

  RealtimeClient({
    this.enableLogging = kDebugMode,
  });

  void _log(String message) {
    if (enableLogging) {
      debugPrint('[RealtimeFirestore] $message');
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
    if (isConnected) return;
    
    _setStatus(ConnectionStatus.connecting);
    _log('Initializing Firestore Realtime listener...');

    try {
      // Connect to Firestore and sync status
      // Firestore automatically connects under the hood, so we can transition to connected/authenticated immediately
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        _setStatus(ConnectionStatus.authenticated);
        onAuthSuccess?.call();
      } else {
        _setStatus(ConnectionStatus.connected);
      }
      
      _log('Firestore Realtime connected successfully.');
    } catch (e) {
      _setStatus(ConnectionStatus.disconnected);
      onError?.call(e);
    }
  }

  Future<void> authenticate(String token) async {
    // Authenticate with Firebase if custom token is provided
    if (token.isNotEmpty) {
      _log('Authenticating with custom token...');
      try {
        await connect();
      } catch (e) {
        onError?.call(e);
      }
    }
  }

  String _getCollectionName(EntityType type) {
    switch (type) {
      case EntityType.match:
        return 'realtime_matches';
      case EntityType.subGroup:
        return 'realtime_subgroups';
      case EntityType.edition:
        return 'realtime_editions';
      default:
        return 'realtime_${type.toString().split('.').last}s';
    }
  }

  void subscribe(EntityType entityType, dynamic entityId) {
    final typeStr = entityType.toString().split('.').last;
    final subKey = '$typeStr:$entityId';

    if (_activeSubscriptions.containsKey(subKey)) {
      _log('Already subscribed to $subKey. Ignoring.');
      return;
    }

    final collectionName = _getCollectionName(entityType);
    _log('Subscribing to Firestore document: $collectionName/$entityId');

    try {
      final docRef = FirebaseFirestore.instance.collection(collectionName).doc(entityId.toString());
      
      final subscription = docRef.snapshots().listen(
        (snapshot) {
          if (snapshot.exists && snapshot.data() != null) {
            _log('Received snapshot update for $subKey');
            final payload = RealtimeUpdatePayload.fromFirestore(
              entityType,
              entityId,
              snapshot.data()!,
            );
            _updateController.add(payload);
            onUpdate?.call(payload);
          } else {
            _log('Snapshot update for $subKey but document does not exist.');
          }
        },
        onError: (err) {
          _log('Error listening to $subKey: $err');
          onError?.call(err);
        },
      );

      _activeSubscriptions[subKey] = subscription;
    } catch (e) {
      _log('Exception during subscription to $subKey: $e');
      onError?.call(e);
    }
  }

  void unsubscribe(EntityType entityType, dynamic entityId) {
    final typeStr = entityType.toString().split('.').last;
    final subKey = '$typeStr:$entityId';

    if (_activeSubscriptions.containsKey(subKey)) {
      _log('Unsubscribing from $subKey');
      _activeSubscriptions[subKey]?.cancel();
      _activeSubscriptions.remove(subKey);
    }
  }

  void disconnect() {
    _log('Disconnecting and clearing subscriptions...');
    clearSubscriptions();
    _setStatus(ConnectionStatus.disconnected);
  }

  void clearSubscriptions() {
    _log('Clearing all active subscriptions');
    for (var sub in _activeSubscriptions.values) {
      sub.cancel();
    }
    _activeSubscriptions.clear();
  }

  void dispose() {
    disconnect();
    _updateController.close();
  }

  // Helpers
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
}
