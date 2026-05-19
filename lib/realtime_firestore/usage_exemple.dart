import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'realtime_provider.dart';
import 'realtime_helpers.dart';
import 'realtime_client.dart';

// Make sure your firebase options are configured
// import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    // options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => RealtimeProvider()
        ..initialize(autoConnect: true),
      child: MaterialApp(
        title: 'Kokowa TV - Firestore Realtime',
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
    
    // Subscribe to match channels on Firestore
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
        title: const Text('Kokowa TV - Firestore Realtime'),
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
                '${realtime.subscriptionCount} écoutes Firestore',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Firestore update listener for match 1
          RealtimeListener(
            entityType: EntityType.match,
            entityId: 1,
            builder: (context, updates) {
              if (updates.isEmpty) {
                return const Card(
                  child: ListTile(
                    title: Text('Match #1'),
                    subtitle: Text('En attente de synchronisation Firestore...'),
                  ),
                );
              }
              
              final lastUpdate = updates.first;
              final data = lastUpdate.data as Map<String, dynamic>;
              
              // Get direct live status, scores, etc., from the synced document
              final isLive = data['liveState']?['isLive'] ?? false;
              final status = data['liveState']?['status'] ?? 'scheduled';
              final score1 = data['score']?['score_region1'] ?? 0;
              final score2 = data['score']?['score_region2'] ?? 0;

              return Card(
                color: isLive ? Colors.red.withOpacity(0.1) : null,
                child: ListTile(
                  title: Text('Match #1 - Statut: ${status.toUpperCase()}'),
                  subtitle: Text('Score Live: $score1 - $score2\nDernière sync: ${DateTime.fromMillisecondsSinceEpoch(lastUpdate.timestamp)}'),
                  trailing: Icon(
                    isLive ? Icons.live_tv : Icons.sports_mma,
                    color: isLive ? Colors.red : null,
                  ),
                ),
              );
            },
          ),
          
          // Action Buttons
          Wrap(
            spacing: 8,
            children: [
              ElevatedButton(
                onPressed: () => context.subscribeToMatch(3),
                child: const Text('S\'abonner au Match 3'),
              ),
              ElevatedButton(
                onPressed: () => context.subscribeToEdition(5),
                child: const Text('S\'abonner Édition 5'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
