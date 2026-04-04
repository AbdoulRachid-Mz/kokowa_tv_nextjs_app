import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'realtime/realtime_provider.dart';
import 'realtime/realtime_helpers.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => RealtimeProvider(
        baseUrl: 'wss://kokowa-tv.up.railway.app', // URL de production
        // baseUrl: 'ws://localhost:3001', // URL de développement
      )..initialize(autoConnect: true),
      child: MaterialApp(
        title: 'Kokowa TV',
        theme: ThemeData.dark(),
        home: const HomePage(),
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    
    // S'abonner aux matchs après connexion
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final realtime = context.realtime;
      if (realtime.isConnected) {
        realtime.subscribeToMatch(1);
        realtime.subscribeToMatch(2);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final realtime = context.watch<RealtimeProvider>();
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kokowa TV'),
        actions: [
          const ConnectionStatusWidget(),
          const SizedBox(width: 16),
          if (realtime.subscriptionCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                '${realtime.subscriptionCount} abonnements',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Écouter les updates du match 1
          RealtimeListener(
            entityType: EntityType.match,
            entityId: 1,
            builder: (context, updates) {
              if (updates.isEmpty) {
                return const Card(
                  child: ListTile(
                    title: Text('Match #1'),
                    subtitle: Text('En attente de mise à jour...'),
                  ),
                );
              }
              
              final lastUpdate = updates.first;
              return Card(
                child: ListTile(
                  title: Text('Match #1 - ${lastUpdate.event}'),
                  subtitle: Text('Dernière mise à jour: ${DateTime.fromMillisecondsSinceEpoch(lastUpdate.timestamp)}'),
                  trailing: const Icon(Icons.sports_mma),
                ),
              );
            },
          ),
          
          // Boutons de contrôle
          Wrap(
            children: [
              ElevatedButton(
                onPressed: () => context.subscribeToMatch(3),
                child: const Text('S\'abonner au Match 3'),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => context.subscribeToEdition(5),
                child: const Text('S\'abonner Édition 5'),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Envoyer un ping
          context.realtime.client.send('ping', {});
        },
        child: const Icon(Icons.ping),
      ),
    );
  }
  
  @override
  void dispose() {
    context.realtime.dispose();
    super.dispose();
  }
}