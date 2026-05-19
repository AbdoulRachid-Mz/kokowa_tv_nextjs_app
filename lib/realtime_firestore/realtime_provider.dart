import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'realtime_client.dart';

class RealtimeProvider extends ChangeNotifier {
  late RealtimeClient _client;
  final String? baseUrl;
  bool _initialized = false;
  
  RealtimeProvider({this.baseUrl});
  
  RealtimeClient get client => _client;
  bool get isInitialized => _initialized;
  
  ConnectionStatus get connectionStatus => _client.status;
  bool get isConnected => _client.isConnected;
  bool get isAuthenticated => _client.isAuthenticated;
  int get subscriptionCount => _client.subscriptionCount;
  String? get userId => _client.userId;
  
  // Recent updates map to preserve backward compatibility for UI widgets
  final Map<String, List<RealtimeUpdatePayload>> _recentUpdates = {};
  
  List<RealtimeUpdatePayload> getUpdatesForEntity(String entityType, dynamic entityId) {
    final key = '$entityType:$entityId';
    return _recentUpdates[key] ?? [];
  }
  
  Future<void> initialize({bool autoConnect = true}) async {
    if (_initialized) return;
    
    _client = RealtimeClient(
      enableLogging: true,
    );
    
    // Wire up callbacks
    _client.onStatusChange = (status) {
      notifyListeners();
    };
    
    _client.onUpdate = (update) {
      final key = '${update.entityType.toString().split('.').last}:${update.entityId}';
      _recentUpdates[key] = [
        update,
        ...?_recentUpdates[key]?.take(9),
      ];
      notifyListeners();
    };
    
    _client.onAuthSuccess = () {
      notifyListeners();
    };
    
    _client.onError = (error) {
      debugPrint('Firestore Realtime error: $error');
      notifyListeners();
    };
    
    _initialized = true;
    
    if (autoConnect) {
      await connectWithFirebase();
    }
  }
  
  Future<void> connectWithFirebase() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      final token = await user.getIdToken();
      await _client.authenticate(token ?? '');
    } else {
      await _client.connect();
    }
  }
  
  Future<void> authenticateWithToken(String token) async {
    await _client.authenticate(token);
  }
  
  void subscribeToMatch(dynamic matchId) {
    _client.subscribeToMatch(matchId);
    notifyListeners();
  }
  
  void unsubscribeFromMatch(dynamic matchId) {
    _client.unsubscribeFromMatch(matchId);
    notifyListeners();
  }
  
  void subscribeToEdition(dynamic editionId) {
    _client.subscribeToEdition(editionId);
    notifyListeners();
  }
  
  void subscribeToFighter(dynamic fighterId) {
    _client.subscribeToFighter(fighterId);
    notifyListeners();
  }
  
  void disconnect() {
    _client.disconnect();
    notifyListeners();
  }
  
  @override
  void dispose() {
    _client.dispose();
    super.dispose();
  }
}
