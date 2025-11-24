// Dans Flutter
import 'package:web_socket_channel/web_socket_channel.dart';

class RealtimeService {
  WebSocketChannel? _channel;
  String? _clientId;

  void connect() {
    try {
      _channel = WebSocketChannel.connect(
        Uri.parse('ws://votre-domaine/api/realtime'),
      );

      _channel!.stream.listen(
        (message) {
          final data = json.decode(message);
          _handleMessage(data);
        },
        onError: (error) {
          print('SSE Error: $error');
          // Reconnexion
          Future.delayed(Duration(seconds: 5), connect);
        },
        onDone: () {
          print('SSE Connection closed');
          // Reconnexion
          Future.delayed(Duration(seconds: 5), connect);
        },
      );
    } catch (e) {
      print('Connection error: $e');
    }
  }

  void _handleMessage(Map<String, dynamic> data) {
    switch (data['type']) {
      case 'connected':
        _clientId = data['clientId'];
        break;
      case 'match_updated':
        // Mettre à jour l'interface
        break;
      case 'new_message':
        // Afficher le nouveau message
        break;
    }
  }

  void subscribeToMatch(int matchId) {
    if (_clientId == null) return;
    
    // Envoyer la subscription au serveur
    // Implémentez l'appel API vers /api/realtime/subscribe
  }

  void disconnect() {
    _channel?.sink.close();
  }
}