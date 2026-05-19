import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'realtime_provider.dart';
import 'realtime_client.dart';

// Widget for listening to real-time updates for a specific entity from Firestore
class RealtimeListener<T> extends StatelessWidget {
  final EntityType entityType;
  final dynamic entityId;
  final Widget Function(BuildContext context, List<RealtimeUpdatePayload> updates) builder;
  final Widget? loadingWidget;
  final bool Function(RealtimeUpdatePayload update)? filter;

  const RealtimeListener({
    Key? key,
    required this.entityType,
    required this.entityId,
    required this.builder,
    this.loadingWidget,
    this.filter,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<RealtimeProvider>(context, listen: true);
    
    var updates = provider.getUpdatesForEntity(
      entityType.toString().split('.').last,
      entityId,
    );
    
    if (filter != null) {
      updates = updates.where(filter!).toList();
    }
    
    return builder(context, updates);
  }
}

// Widget to show the Firestore realtime connection status in Flutter
class ConnectionStatusWidget extends StatelessWidget {
  final VoidCallback? onReconnect;

  const ConnectionStatusWidget({Key? key, this.onReconnect}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<RealtimeProvider>(
      builder: (context, provider, child) {
        final status = provider.connectionStatus;
        
        Color color;
        String text;
        IconData icon;
        
        switch (status) {
          case ConnectionStatus.connected:
            color = Colors.green;
            text = 'Firestore Actif';
            icon = Icons.cloud_done;
            break;
          case ConnectionStatus.authenticated:
            color = Colors.green;
            text = 'Firestore Sécurisé';
            icon = Icons.verified_user;
            break;
          case ConnectionStatus.connecting:
            color = Colors.orange;
            text = 'Initialisation...';
            icon = Icons.cloud_sync;
            break;
          case ConnectionStatus.reconnecting:
            color = Colors.orange;
            text = 'Reconnexion...';
            icon = Icons.sync;
            break;
          case ConnectionStatus.disconnected:
            color = Colors.red;
            text = 'Firestore Inactif';
            icon = Icons.cloud_off;
            break;
        }
        
        return GestureDetector(
          onTap: status == ConnectionStatus.disconnected ? () {
            if (onReconnect != null) {
              onReconnect!();
            } else {
              provider.connectWithFirebase();
            }
          } : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withOpacity(0.5)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: color),
                const SizedBox(width: 4),
                Text(
                  text,
                  style: TextStyle(
                    fontSize: 12,
                    color: color,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// BuildContext extension for easy access
extension RealtimeProviderExtension on BuildContext {
  RealtimeProvider get realtime => Provider.of<RealtimeProvider>(this, listen: false);
  
  void subscribeToMatch(dynamic matchId) => realtime.subscribeToMatch(matchId);
  void subscribeToEdition(dynamic editionId) => realtime.subscribeToEdition(editionId);
  void subscribeToFighter(dynamic fighterId) => realtime.subscribeToFighter(fighterId);
}
