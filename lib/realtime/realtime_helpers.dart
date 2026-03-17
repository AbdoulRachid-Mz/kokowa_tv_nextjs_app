import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'realtime_provider.dart';
import 'realtime_client.dart';

// Widget pour écouter les updates d'une entité spécifique
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
    final key = '${entityType.toString().split('.').last}:$entityId';
    
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

// Widget pour afficher le statut de connexion
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
            text = 'Connecté';
            icon = Icons.wifi;
            break;
          case ConnectionStatus.authenticated:
            color = Colors.green;
            text = 'Authentifié';
            icon = Icons.verified_user;
            break;
          case ConnectionStatus.connecting:
            color = Colors.orange;
            text = 'Connexion...';
            icon = Icons.wifi_find;
            break;
          case ConnectionStatus.reconnecting:
            color = Colors.orange;
            text = 'Reconnexion...';
            icon = Icons.sync;
            break;
          case ConnectionStatus.disconnected:
            color = Colors.red;
            text = 'Déconnecté';
            icon = Icons.wifi_off;
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

// Extension pour faciliter l'utilisation
extension RealtimeProviderExtension on BuildContext {
  RealtimeProvider get realtime => Provider.of<RealtimeProvider>(this, listen: false);
  
  void subscribeToMatch(dynamic matchId) => realtime.subscribeToMatch(matchId);
  void subscribeToEdition(dynamic editionId) => realtime.subscribeToEdition(editionId);
  void subscribeToFighter(dynamic fighterId) => realtime.subscribeToFighter(fighterId);
}