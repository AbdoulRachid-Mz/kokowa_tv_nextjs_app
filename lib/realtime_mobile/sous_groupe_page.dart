import 'dart:async';

import 'package:flutter/material.dart';
import 'package:kokowa_tv/pages/others/view_video.dart';
import 'package:kokowa_tv/pages/regions/region_details.dart';
import 'package:kokowa_tv/utils/colors.dart';
import 'package:kokowa_tv/utils/constants.dart';
import 'package:kokowa_tv/utils/data_utils.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:kokowa_tv/widgets/buildMatchCard.dart';
import 'package:kokowa_tv/widgets/error_widget.dart';
import 'package:kokowa_tv/widgets/fighter_image.dart';
import 'package:kokowa_tv/widgets/functions.dart';
import 'package:kokowa_tv/widgets/live_button.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

class SousGroupePage extends StatefulWidget {
  final int subGroupId;
  final String subGroupName;

  SousGroupePage({
    super.key,
    required this.subGroupId,
    required this.subGroupName,
  });

  @override
  State<SousGroupePage> createState() => _SousGroupePageState();
}

class _SousGroupePageState extends State<SousGroupePage> {
  Map<String, dynamic> _subGroupData = {};
  Map<String, dynamic>? _liveMatch;
  List<dynamic> _allMatches = [];
  List<dynamic> _liveMatches = [];

  // Nouvelles données
  final Map<String, dynamic> _belts = {};
  Map<String, dynamic>? _referee;
  Map<String, dynamic> _coaches = {};
  String _belt1 = "red";
  String _belt2 = "green";

  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';

    final TextEditingController _urlController = TextEditingController();
  String? _errorText;

  // // Timer pour les mises à jour en temps réel
  // Timer? _refreshTimer;

  StreamSubscription<DatabaseEvent>? _matchesSubscription;
  StreamSubscription<DatabaseEvent>? _subGroupSubscription;

  @override
  void initState() {
    super.initState();
    _loadData();
    _setupWebSocket();
  }

  @override
  void dispose() {
    _matchesSubscription?.cancel();
    _subGroupSubscription?.cancel();
    super.dispose();
  }

  void _setupWebSocket() {
    // Écoute des mises à jour des matchs du sous-groupe
    final matchesRef = FirebaseDatabase.instance.ref('subGroups/${widget.subGroupId}/matches');
    _matchesSubscription = matchesRef.onChildChanged.listen((DatabaseEvent event) {
      if (event.snapshot.value != null) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        final matchIdStr = event.snapshot.key;
        if (matchIdStr != null && mounted) {
          final matchId = int.tryParse(matchIdStr) ?? 0;
          _handleMatchUpdate(matchId, data);
        }
      }
    });

    // Écoute des mises à jour du sous-groupe lui-même (score, status, etc.)
    final subGroupRef = FirebaseDatabase.instance.ref('subGroups/${widget.subGroupId}');
    _subGroupSubscription = subGroupRef.onValue.listen((DatabaseEvent event) {
       if (event.snapshot.value != null && mounted) {
         final data = Map<String, dynamic>.from(event.snapshot.value as Map);
         setState(() {
           if (data['score'] != null) {
             final scoreData = Map<String, dynamic>.from(data['score']);
             _subGroupData['score1'] = scoreData['region1'];
             _subGroupData['score2'] = scoreData['region2'];
             _subGroupData['nulls'] = scoreData['nulls'];
           }
           if (data['status'] != null) {
             _subGroupData['status'] = data['status'];
           }
         });
       }
    });
  }

  void _handleMatchUpdate(
    int matchId,
    Map<String, dynamic> data,
  ) {
    setState(() {
      // Mettre à jour _allMatches
      for (var i = 0; i < _allMatches.length; i++) {
        if (_allMatches[i]['id'] == matchId) {
          _allMatches[i] = {..._allMatches[i], ...data};
          
          // Gérer le status live localement si reçu de RTDB
          if (data['status'] != null) {
            _allMatches[i]['status'] = data['status'];
          }
          break;
        }
      }

      // Detect if the updated match becomes live/round_break
      final status = data['status'] as String?;
      if (status == 'live' || status == 'round_break') {
        // Get full match data and set as active live match
        final updatedMatch = _allMatches.firstWhere((m) => m['id'] == matchId);
        _liveMatch = updatedMatch;
      } else if (_liveMatch != null && _liveMatch!['id'] == matchId) {
        // Update existing live match with new data
        _liveMatch = {..._liveMatch!, ...data};
      }
    });
  }

  // Calcul de score géré par RTDB via _subGroupSubscription

  // void _startAutoRefresh() {
  //   _refreshTimer = Timer.periodic(Duration(seconds: 30), (timer) {
  //     if (mounted) {
  //       _loadData(silent: true);
  //     }
  //   });
  // }

  Future<void> _loadData({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        _isLoading = true;
      });
    }

    try {
      // Utilisation de la fonction avec cache ET callback
      final data = await fetchSubGroupDataWithCache(
        subGroupId: widget.subGroupId,
        onUpdate: (updatedData) {
          if (mounted) {
            _updateSubGroupUI(updatedData);
          }
        },
      );

      // Mise à jour initiale
      if (mounted) {
        _updateSubGroupUI(data);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
          _errorMessage = errorMessage;
        });
      }
    }
  }

  void _updateSubGroupUI(Map<String, dynamic> data) {
    setState(() {
      _subGroupData = getSafeValue(data, 'subGroup', <String, dynamic>{});
      _liveMatch = getSafeValue(data, 'liveMatch', null);

      final matchesData = getSafeValue(data, 'matches', <String, dynamic>{});

      _allMatches = getSafeValue(matchesData, 'all', []);
      _liveMatches = getSafeValue(matchesData, 'live', []);

      // Récupération des ceintures, arbitre et coachs
      final belts = getSafeValue(_subGroupData, 'belts', <String, dynamic>{});

      final belt1Map = getSafeValue(belts, "region1", <String, dynamic>{});
      final belt2Map = getSafeValue(belts, "region2", <String, dynamic>{});

      _belt1 = getSafeValue(belt1Map, 'color', "");
      _belt2 = getSafeValue(belt2Map, 'color', "");

      _referee = getSafeValue(_subGroupData, 'referee', <String, dynamic>{});

      _coaches = getSafeValue(_subGroupData, 'coaches', <String, dynamic>{});

      // Si pas de liveMatch direct, vérifier s'il y a des matchs en direct
      if (_liveMatch == null && _liveMatches.isNotEmpty) {
        _liveMatch = _liveMatches.first;
      }

      _isLoading = false;
      _hasError = false;
    });
  }

  // Widget pour l'en-tête avec les régions
  Widget _buildRegionsHeader() {
    final region1Id = getSafeValue(_subGroupData, 'region1Id', 0);
    final region2Id = getSafeValue(_subGroupData, 'region2Id', 0);
    final isCompleted = getSafeValue(_subGroupData, 'isCompleted', false);
    final status = getSafeValue(_subGroupData, "status", "upcoming");
    final score1 = getScore(_subGroupData, 1);
    final score2 = getScore(_subGroupData, 2);
    final nulls = getScore(_subGroupData, 3);

    // Score format : Region1 X:Y Region2
    final scoreText = "$score1 : $score2";
    final nullText = "$nulls null(s)";

    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(top: 20, bottom: 0, left: 16, right: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1B5E20), Color(0xFF2E7D32).withValues(alpha: 0.8)],
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Région 1
              _buildRegionWidget(region1Id, true),

              // VS et statut
              Column(
                children: [
                  if (status == "completed" || status == "ongoing") ...[
                    RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        children: <TextSpan>[
                          TextSpan(
                            text: '$scoreText',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 35,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if ((int.tryParse(nulls) ?? 0) > 0) ...[
                            TextSpan(
                              text: '\n$nullText',
                              style: TextStyle(color: whiteColor),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (isCompleted) ...[
                      SizedBox(height: 4),
                      Icon(Icons.check_circle, color: Colors.green, size: 20),
                    ],
                  ] else ...[
                    Text(
                      "VS",
                      style: TextStyle(
                        color: whiteColor,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),

                    Icon(Icons.schedule, color: whiteColor, size: 20),
                  ],
                  SizedBox(height: 8),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color:
                          isCompleted
                              ? Colors.green
                              : status == "ongoing"
                              ? Colors.orange
                              : Colors.grey,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isCompleted
                          ? 'TERMINÉ'
                          : status == "ongoing"
                          ? 'EN COURS'
                          : 'A VENIR',
                      style: TextStyle(
                        color: whiteColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),

              // Région 2
              _buildRegionWidget(region2Id, false),
            ],
          ),

          SizedBox(height: 10),
          Text(
            "Arbitre : ${_referee!['firstName']} ${_referee!['lastName']}",
            style: TextStyle(color: whiteColor),
          ),
          SizedBox(height: 5),
          // _buildStatsSection(),
        ],
      ),
    );
  }

  // Widget _buildStatsSection() {
  //   final totalMatches = _allMatches.length;
  //   final liveMatchesCount = _liveMatches.length;
  //   final scheduledMatchesCount = _scheduledMatches.length;
  //   final completedMatchesCount = _completedMatches.length;

  //   return Row(
  //     mainAxisAlignment: MainAxisAlignment.spaceAround,
  //     children: [
  //       _buildStatItem('$totalMatches', 'Total', Colors.blue),
  //       _buildStatItem('$liveMatchesCount', 'En Direct', Colors.red),
  //       _buildStatItem('$scheduledMatchesCount', 'Programmés', Colors.orange),
  //       _buildStatItem('$completedMatchesCount', 'Terminés', Colors.green),
  //     ],
  //   );
  // }

  // Widget _buildStatItem(String value, String label, Color color) {
  //   return Column(
  //     children: [
  //       Container(
  //         width: 40,
  //         height: 40,
  //         decoration: BoxDecoration(
  //           color: color.withValues(alpha:0.2),
  //           shape: BoxShape.circle,
  //           border: Border.all(color: color),
  //         ),
  //         child: Center(
  //           child: Text(
  //             value,
  //             style: TextStyle(
  //               color: color,
  //               fontSize: 16,
  //               fontWeight: FontWeight.bold,
  //             ),
  //           ),
  //         ),
  //       ),
  //        SizedBox(height: 4),
  //       Text(
  //         label,
  //         style:  TextStyle(color: whiteColor70, fontSize: 12),
  //       ),
  //     ],
  //   );
  // }

  Widget _buildRegionWidget(int regionId, bool isRegion1) {
    final regionName = getSafeValue(
      _subGroupData,
      isRegion1 ? 'region1Name' : 'region2Name',
      '',
    );

    final flagImage = getSafeValue(
      _subGroupData,
      isRegion1 ? 'region1FlagImage' : 'region2FlagImage',
      '',
    );

    return Expanded(
      child: GestureDetector(
        onTap: () => _navigateToRegionPage(regionId),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: greyColor,
                shape: BoxShape.circle,
                border: Border.all(color: whiteColor, width: 2),
              ),
              child: buildRegionImage(flagImage, regionName),
            ),
            SizedBox(height: 8),
            Text(
              regionName,
              style: TextStyle(
                color: whiteColor,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }

  // Navigation
  void _navigateToRegionPage(int regionId) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => RegionPage(regionId: regionId)),
    );
  }

  // Widget de chargement
  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Colors.orange),
          SizedBox(height: 16),
          Text(
            'Chargement des matchs...',
            style: TextStyle(color: whiteColor70),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = getSafeValue(_subGroupData, "status", "upcoming");
    final _liveUrl = getSafeValue(_subGroupData, "videoUrl", "");
    return Scaffold(
      backgroundColor: whiteBackground,
      appBar: AppBar(
        title: Text(
          widget.subGroupName,
          style: TextStyle(color: whiteColor, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Color(0xFF1B5E20),
        elevation: 0,
        iconTheme: IconThemeData(color: whiteColor),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadData,
            tooltip: 'Actualiser',
          ),
        ],
      ),
      body:
          _isLoading
              ? _buildLoadingState()
              : _hasError
              ? errorWidgetNormal(
                "rencontre",
                onPressed: () {
                  _loadData();
                },
                type: "e",
              )
              : Column(
                children: [
                  // En-tête avec les régions
                  _buildRegionsHeader(),

                  // Contenu principal
                  Expanded(
                    child: CustomScrollView(
                      slivers: [
                        if (_liveUrl.isNotEmpty && status == "ongoing") ...[
                          SliverToBoxAdapter(
                            child: PremiumLiveButton(
                              onTap:
                                  () => _openVideo(_liveUrl)
                            ),
                          ),
                        ],

                        // Match en direct (s'il existe)
                        if (_liveMatch != null) ...[
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.live_tv,
                                    color: Colors.red.shade300,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'MATCH EN DIRECT',
                                    style: TextStyle(
                                      color: Colors.red.shade300,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'Poppins',
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Container(
                                    width: 12,
                                    height: 12,
                                    decoration: BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SliverToBoxAdapter(
                            child: buildMatchCard(
                              _liveMatch!,
                              _belt1,
                              _belt2,
                              context,
                              isLive: true,
                            ),
                          ),
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Divider(color: greyColor),
                            ),
                          ),
                        ],

                        if (_allMatches.isEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.all(32.0),
                              child: Text(
                                'Aucun match programmé',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: blackColor,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          )
                        else
                          SliverList(
                            delegate: SliverChildBuilderDelegate((
                              context,
                              index,
                            ) {
                              final match = _allMatches[index];

                              return buildMatchCard(
                                match,
                                _belt1,
                                _belt2,
                                context,
                              );
                            }, childCount: _allMatches.length),
                          ),

                        SliverToBoxAdapter(child: SizedBox(height: 20)),
                      ],
                    ),
                  ),
                ],
              ),
    );
  }

    void _openVideo(String url) {

    if (url.isEmpty) {
      setState(() => _errorText = 'Veuillez entrer une URL YouTube.');
      return;
    }

    String? videoId = YoutubePlayer.convertUrlToId(url);

    // 🔧 Fallback pour les liens live
    if (videoId == null && url.contains('/live/')) {
      final uri = Uri.parse(url);
      videoId =
          uri.pathSegments.contains('live') ? uri.pathSegments.last : null;
    }

    if (videoId == null) {
      setState(() => _errorText = 'URL invalide. Vérifiez le lien YouTube.');
      return;
    }

    setState(() => _errorText = null);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => YoutubePlayerPage(videoId: videoId!, videoUrl: url),
      ),
    );
  }
}
