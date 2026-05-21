import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:kokowa_tv/utils/colors.dart';
import 'package:kokowa_tv/utils/data_utils.dart';
import 'package:kokowa_tv/utils/send_interaction.dart';
import 'package:kokowa_tv/widgets/buildMatchCard.dart';
import 'package:kokowa_tv/widgets/error_widget.dart';
import 'dart:async';

import 'package:kokowa_tv/widgets/fighter_image.dart';
import 'package:kokowa_tv/widgets/functions.dart';
import 'package:kokowa_tv/widgets/widgets.dart'
    hide getMatchStatusIcon, getMatchStatusColor, getMatchStatusText;

import '../../widgets/transferts_detail_card.dart';

class FighterPage extends StatefulWidget {
  final int fighterId;
  final String fighterName;

  FighterPage({super.key, required this.fighterId, required this.fighterName});

  @override
  State<FighterPage> createState() => _FighterPageState();
}

class _FighterPageState extends State<FighterPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLiked = false;
  int _likeCount = 0;
  bool _isLoading = true;
  bool _isLoadingLike = false;
  final auth = FirebaseAuth.instance;

  bool _hasError = false;
  String _errorMessage = '';
  String? _statusMessage = '';
  // Données de l'API
  Map<String, dynamic> _fighterData = {};
  Map<String, dynamic> _regionData = {};
  Map<String, dynamic> _stats = {};
  List<dynamic> _achievements = [];
  List<dynamic> _transfers = [];
  List<dynamic> _cards = [];
  List<dynamic> _matches = [];

  List<dynamic> _editions = [];
  int? _selectedEditionId;
  bool _isLoadingMatches = false;

  String? uid = FirebaseAuth.instance.currentUser!.uid;

  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadCompleteFighterData();
    _loadMatchesByEdition(0);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _toggleLike() async {
    if (_isLoadingLike || auth.currentUser == null) return;

    if (auth.currentUser!.isAnonymous) {
      showCompteRequiredDialog(context);
      return;
    }

    setState(() => _isLoadingLike = true);

    try {
      // Utiliser votre fonction d'interaction

      final response = await ApiInteractionService.sendInteraction(
        userId: uid ?? "",
        entityType: 'fighter',
        entityId: widget.fighterId,
      );

      if (mounted) {
        if (response.success) {
          setState(() {
            _isLiked = !_isLiked;
            _likeCount = _isLiked ? _likeCount + 1 : _likeCount - 1;

            // Mettre à jour l'article local
            _fighterData = {
              ..._fighterData,
              'isMyFavorite': _isLiked,
              'likes': _likeCount.toString(),
            };
          });

          // Afficher un feedback
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_isLiked ? 'Lutteur aimé !' : 'Like retiré'),
              backgroundColor: _isLiked ? Colors.green : Colors.grey,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.message ?? 'Erreur'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Erreur réseau'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingLike = false);
      }
    }
  }

  Future<void> _loadCompleteFighterData({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        _isLoading = true;
        _hasError = false;
        _statusMessage = null;
      });
    }

    try {
      // Utiliser la fonction corrigée qui retourne tout l'objet data
      final completeData = await fetchCompleteFighterDataWithCache(
        fighterId: widget.fighterId,
        uid: uid ?? "",
      );

      if (mounted) {
        setState(() {
          _fighterData = getSafeValue(completeData, 'fighter', {});
          _regionData = getSafeValue(_fighterData, 'region', {});
          _stats = getSafeValue(_fighterData, 'stats', {});
          _achievements = getSafeValue(_fighterData, 'achievements', []);
          _transfers = getSafeValue(_fighterData, 'transfers', []);
          _cards = getSafeValue(_fighterData, 'cards', []);
          _editions = getSafeValue(_fighterData, 'editions', []);
          _isLoading = false;
          _isLiked = getSafeValue(_fighterData, "isMyFavorite", false);
          _likeCount = getSafeValue(_fighterData, "likes", 0);
        });
      }
    } catch (e) {
      if (mounted) {
        final errorMessage = e.toString().replaceFirst('Exception: ', '');

        // Vérifier si l'erreur indique qu'on utilise le cache
        if (errorMessage.contains('Cache utilisé') ||
            errorMessage.contains('Mode Hors Ligne')) {
          // Essayer de charger uniquement depuis le cache
          await _loadFromCacheOnly();

          if (!_hasError) {
            setState(() {
              _statusMessage =
                  'Mode Hors Ligne : Données chargées depuis le cache.';
            });
          }
        } else {
          setState(() {
            _isLiked = getSafeValue(_fighterData, "isMyFavorite", false);
            _likeCount = getSafeValue(_fighterData, "likes", 0);
            _isLoading = false;
            _hasError = true;
            _errorMessage = errorMessage;
            _statusMessage = '$errorMessage';
          });
        }
      }
    }
  }

  Future<void> _loadFromCacheOnly() async {
    try {
      // Charger les détails depuis le cache
      final cachedDetails = await loadFromCache(
        'fighter_detail_${widget.fighterId}',
      );
      final cachedMatches = await loadFromCache(
        'fighter_matches_${widget.fighterId}',
      );

      if (mounted) {
        if (cachedDetails.isNotEmpty) {
          final data = cachedDetails.first;

          setState(() {
            _fighterData = getSafeValue(data, 'fighter', {});
            _regionData = getSafeValue(data, 'region', {});
            _stats = getSafeValue(data, 'stats', {});
            _achievements = getSafeValue(data, 'achievements', []);
            _transfers = getSafeValue(data, 'transfers', []);
            _cards = getSafeValue(data, 'cards', []);

            if (cachedMatches.isNotEmpty) {
              _matches = cachedMatches.cast<dynamic>();
            }
            _isLiked = getSafeValue(_fighterData, "isMyFavorite", false);
            _likeCount = getSafeValue(_fighterData, "likes", 0);
            _isLoading = false;
            _hasError = false;
          });
        } else {
          setState(() {
            _isLiked = getSafeValue(_fighterData, "isMyFavorite", false);
            _likeCount = getSafeValue(_fighterData, "likes", 0);
            _isLoading = false;
            _hasError = true;
            _errorMessage = 'Aucune donnée disponible en cache';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
          _errorMessage = 'Erreur de chargement du cache: $e';
        });
      }
    }
  }

  Future<void> _loadMatchesByEdition(int? editionId) async {
    setState(() {
      _isLoadingMatches = true;
      _selectedEditionId = editionId;
    });

    try {
      final newMatches = await fetchEditionMatchesWithCache(
        fighterId: widget.fighterId,
        editionId: editionId ?? 0,
        table: "fighters",
        onUpdate: (updatedMatches) {
          if (mounted) {
            setState(() {
              _matches = updatedMatches;
              _isLoadingMatches = false;
            });
          }
        },
      );
      print(newMatches);

      // Mise à jour initiale
      if (mounted) {
        setState(() {
          _matches = newMatches;
          _isLoadingMatches = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingMatches = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur lors du chargement des matchs')),
        );
      }
    }
  }

  // Widget pour l'en-tête du lutteur
  Widget _buildFighterHeader() {
    final nickname = getSafeValue(_fighterData, 'nickname', '');
    final firstName = getSafeValue(_fighterData, 'firstName', '');
    final lastName = getSafeValue(_fighterData, 'lastName', '');
    final profileImage = getSafeValue(_fighterData, 'profileImage', '');
    final ranking = getSafeValue(_fighterData, 'ranking', 0);
    final height = getSafeValue(_fighterData, 'height', 0.0);
    final weight = getSafeValue(_fighterData, 'weight', 0.0);
    final isChampion = getSafeValue(_fighterData, 'isChampion', false);
    final regionName = getSafeValue(_regionData, 'name', '');
    final regionCode = getSafeValue(_regionData, 'code', '');

    final totalMatches = getSafeValue(_stats, 'totalMatches', 0);
    final wins = getSafeValue(_stats, 'wins', 0);
    final losses = getSafeValue(_stats, 'losses', 0);
    final winRate = getSafeValue(_stats, 'winRate', 0.0);
    final regionColor = primaryColor;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [regionColor, regionColor.withValues(alpha: 0.7)],
        ),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo du lutteur
              Stack(
                children: [
                  InkWell(
                    onTap:
                        () =>
                            profileImage.isNotEmpty
                                ? openImage(context, [profileImage])
                                : null,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: whiteColor, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Hero(
                        tag: profileImage,
                        child: ClipOval(
                          child: buildFighterImage({
                            'first_name': firstName,
                            'last_name': lastName,
                            'profile_image': profileImage,
                          }),
                        ),
                      ),
                    ),
                  ),
                  if (isChampion)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.emoji_events,
                          color: whiteColor,
                          size: 16,
                        ),
                      ),
                    ),
                ],
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$firstName $lastName',

                      style: TextStyle(
                        color: whiteColor,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    if (nickname.isNotEmpty) ...[
                      Text(
                        nickname.isNotEmpty ? nickname : '$firstName $lastName',
                        style: TextStyle(
                          color: whiteColor70,
                          fontSize: 16,
                          fontFamily: 'Poppins',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    SizedBox(height: 8),
                    Row(
                      children: [
                        _buildStatItem('Rang', ranking.toString()),
                        SizedBox(width: 16),
                        _buildStatItem(
                          'Taille',
                          '${height.toStringAsFixed(2)}m',
                        ),
                        SizedBox(width: 16),
                        _buildStatItem(
                          'Poids',
                          '${weight.toStringAsFixed(1)}kg',
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: regionColor,
                          ),
                          child: Center(
                            child: Text(
                              regionCode.isNotEmpty ? regionCode[0] : '?',
                              style: TextStyle(
                                color: whiteColor,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 8),
                        Text(
                          regionName.isNotEmpty
                              ? regionName
                              : 'Région inconnue',
                          style: TextStyle(color: whiteColor, fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Bouton favori
              Container(
                // padding: EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: whiteColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: IconButton(
                  onPressed: () {
                    // setState(() {
                    //   if (_isLiked && _likeCount > 0) {
                    //     _likeCount--;
                    //   } else if (!_isLiked) {
                    //     _likeCount++;
                    //   }
                    //   _isLiked = !_isLiked;
                    //   _sendFighterInteraction();
                    // });

                    _toggleLike();
                  },
                  icon: Column(
                    children: [
                      Icon(
                        _isLiked ? Icons.favorite : Icons.favorite_border,
                        color: _isLiked ? Colors.red : whiteColor,
                        size: 30,
                      ),
                      Text(
                        _likeCount.toString(),
                        style: TextStyle(color: whiteColor),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          // Statistiques rapides
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildQuickStat(totalMatches.toString(), 'Matchs'),
                _buildQuickStat(wins.toString(), 'Victoires'),
                _buildQuickStat(losses.toString(), 'Défaites'),
                _buildQuickStat('${winRate.toStringAsFixed(1)}%', 'Ratio'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: whiteColor70, fontSize: 12)),
        Text(
          value,
          style: TextStyle(
            color: whiteColor,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: whiteColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(label, style: TextStyle(color: whiteColor70, fontSize: 12)),
      ],
    );
  }

  // Tab 1: Vue d'ensemble
  Widget _buildOverviewTab() {
    final liveMatches =
        _matches.where((match) {
          final status = getSafeValue(match, 'status', '');
          return status == 'live' || status == 'round_break';
        }).toList();

    final upcomingMatches =
        _matches.where((match) {
          return getSafeValue(match, 'status', '') == 'scheduled';
        }).toList();

    final recentMatches =
        _matches
            .where((match) {
              return getSafeValue(match, 'status', '') == 'completed';
            })
            .take(5)
            .toList();

    String bio = getSafeValue(_fighterData, 'bio', '');
    final firstName = getSafeValue(_fighterData, 'firstName', '');
    final LastName = getSafeValue(_fighterData, 'lastName', '');
    String dateNaiss = getSafeValue(_fighterData, 'birthDate', '');
    final lieuNaiss = getSafeValue(_fighterData, 'birthPlace', '');
    final fightingStyle = getSafeValue(_fighterData, 'fightingStyle', '');

    if (bio.isEmpty && dateNaiss.isNotEmpty && lieuNaiss.isNotEmpty) {
      dateNaiss = formatDate(dateNaiss);
      bio = "M. $firstName $LastName est n'est le $dateNaiss à $lieuNaiss";
    }

    return ListView(
      padding: EdgeInsets.symmetric(vertical: 16, horizontal: 0),
      children: [
        // Match en direct
        if (liveMatches.isNotEmpty) ...[
          Container(
            margin: EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              'MATCH EN DIRECT',
              style: TextStyle(
                color: Colors.red,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          SizedBox(height: 12),
          ...liveMatches.map(
            (match) => buildMatchCard(
              match,
              "red",
              "green",
              context,
              withRegion: true,
              isLive: true,
            ),
          ),
          SizedBox(height: 20),
        ],

        // Prochains matchs
        if (upcomingMatches.isNotEmpty) ...[
          Container(
            margin: EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              'PROCHAINS MATCHS',
              style: TextStyle(
                color: blackColor,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          SizedBox(height: 12),
          ...upcomingMatches
              .take(3)
              .map(
                (match) => buildMatchCard(
                  match,
                  "red",
                  "green",
                  context,
                  withRegion: true,
                ),
              ),
          SizedBox(height: 20),
        ],

        // Statistiques détaillées
        Padding(padding: EdgeInsets.all(8.0), child: _buildDetailedStats()),

        // Bio et informations
        if (bio.isNotEmpty) ...[
          SizedBox(height: 20),
          Padding(padding: EdgeInsets.all(8.0), child: _buildBioSection(bio)),
        ],

        // Style de combat
        if (fightingStyle.isNotEmpty) ...[
          SizedBox(height: 20),
          Padding(
            padding: EdgeInsets.all(8.0),
            child: _buildFightingStyleSection(fightingStyle),
          ),
        ],

        // Derniers matchs
        if (recentMatches.isNotEmpty) ...[
          SizedBox(height: 20),
          Container(
            margin: EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              'DERNIERS MATCHS',
              style: TextStyle(
                color: Colors.green,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          SizedBox(height: 12),
          ...recentMatches.map(
            (match) => buildMatchCard(
              match,
              "red",
              "green",
              context,
              withRegion: true,
            ),
          ),
        ],
      ],
    );
  }

  // Tab 2: Statistiques
  Widget _buildStatsTab() {
    final yellowCards = getSafeValue(_stats, 'yellowCards', 0);
    final redCards = getSafeValue(_stats, 'redCards', 0);
    final totalFightTime = getSafeValue(
      _stats,
      'totalFightTime',
      <String, dynamic>{},
    );

    final averageFightTime = getSafeValue(
      _stats,
      'averageFightTime',
      <String, dynamic>{},
    );

    return ListView(
      padding: EdgeInsets.all(16),
      children: [
        // Cartes de performance
        GridView(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.2,
          ),
          children: [
            _buildStatCard(
              'Victoires',
              getSafeValue(_stats, 'wins', 0).toString(),
              Icons.emoji_events,
              Colors.green,
            ),
            _buildStatCard(
              'Défaites',
              getSafeValue(_stats, 'losses', 0).toString(),
              Icons.sentiment_dissatisfied,
              Colors.red,
            ),
            _buildStatCard(
              'Ratio Victoires',
              '${getSafeValue(_stats, 'winRate', 0.0).toStringAsFixed(1)}%',
              Icons.trending_up,
              Colors.blue,
            ),
            _buildStatCard(
              'Matchs Total',
              getSafeValue(_stats, 'totalMatches', 0).toString(),
              Icons.sports_mma,
              Colors.orange,
            ),
            _buildStatCard(
              'Cartons Jaunes',
              yellowCards.toString(),
              Icons.warning_amber,
              Colors.yellow,
            ),
            _buildStatCard(
              'Cartons Rouges',
              redCards.toString(),
              Icons.warning,
              Colors.red,
            ),
          ],
        ),

        SizedBox(height: 20),

        // Temps de combat
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: getRegionColor(_regionData["color"])),
          ),
          child: Column(
            children: [
              Text(
                'TEMPS DE COMBAT',
                style: TextStyle(
                  color: whiteColor,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildTimeStat(
                    'Total',
                    getSafeValue(totalFightTime, 'formatted', '0m'),
                  ),
                  _buildTimeStat(
                    'Moyenne/Match',
                    getSafeValue(averageFightTime, 'formatted', '0m'),
                  ),
                ],
              ),
            ],
          ),
        ),

        SizedBox(height: 20),

        // Graphique de performance (simplifié)
        _buildPerformanceChart(),

        SizedBox(height: 20),

        // Détails des cartons
        if (_cards.isNotEmpty) _buildCardsDetails(),
      ],
    );
  }

  // Tab 3: Matchs
  Widget _buildMatchesTab() {
    return Column(
      children: [
        // Sélecteur d'Édition
        Container(
          margin: EdgeInsets.all(10),
          padding: EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: greyColor.withValues(alpha: 0.3)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int?>(
              isExpanded: true,
              // La clé ici : on vérifie si la valeur existe dans la liste
              // Si elle n'existe pas, on force à null pour éviter le crash
              value:
                  _editions.any((e) => e['id'] == _selectedEditionId)
                      ? _selectedEditionId
                      : null,
              hint: Text("Filtrer par édition"),
              items: [
                // Option "Toutes les éditions"
                DropdownMenuItem<int?>(
                  value: null,
                  child: Text("Toutes les éditions"),
                ),
                // On transforme la liste des éditions en items
                ..._editions.map((edition) {
                  return DropdownMenuItem<int?>(
                    value: edition['id'],
                    child: Text(
                      edition['theme'] ?? "Édition ${edition['year']}",
                    ),
                  );
                }).toList(),
              ],
              onChanged: (int? newValue) {
                _loadMatchesByEdition(newValue);
              },
            ),
          ),
        ),

        // Liste des Matchs
        Expanded(
          child:
              _isLoadingMatches
                  ? Center(child: CircularProgressIndicator())
                  : _matches.isEmpty
                  ? Center(child: Text('Aucun match pour cette édition'))
                  : ListView.builder(
                    itemCount: _matches.length,
                    itemBuilder: (context, index) {
                      return buildMatchCard(
                        _matches[index],
                        "red",
                        "green",
                        context,
                        withRegion: true,
                      );
                    },
                  ),
        ),
      ],
    );
  }

  // Tab 4: Palmarès
  Widget _buildAchievementsTab() {
    // Grouper les achievements par année
    final achievementsByYear = <int, List<dynamic>>{};

    for (final achievement in _achievements) {
      final year = getSafeValue(achievement, 'year', 0);
      if (!achievementsByYear.containsKey(year)) {
        achievementsByYear[year] = [];
      }
      achievementsByYear[year]!.add(achievement);
    }

    return ListView(
      padding: EdgeInsets.all(16),
      children: [
        if (_achievements.isEmpty)
          Center(
            child: Text(
              'Aucun palmarès enregistré',
              style: TextStyle(color: greyColor, fontSize: 16),
            ),
          )
        else
          ...achievementsByYear.entries.map((entry) {
            final year = entry.key;
            final yearAchievements = entry.value;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Année $year',
                  style: TextStyle(
                    color: whiteColor,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 12),
                ...yearAchievements.map(
                  (achievement) => _buildAchievementCard(achievement),
                ),
                SizedBox(height: 20),
              ],
            );
          }),
      ],
    );
  }

  // Tab 5: Carrière
  Widget _buildCareerTab() {
    // Combiner transferts et achievements pour la chronologie
    final careerEvents = <Map<String, dynamic>>[];

    // Ajouter les transferts
    for (final transfer in _transfers) {
      careerEvents.add({
        'type': 'transfer',
        'date': getSafeValue(transfer, 'transferDate', ''),
        'data': transfer,
      });
    }

    // Ajouter les achievements
    for (final achievement in _achievements) {
      careerEvents.add({
        'type': 'achievement',
        'date': '${getSafeValue(achievement, 'year', '')}-01-01',
        'data': achievement,
      });
    }

    // Trier par date
    careerEvents.sort((a, b) => b['date'].compareTo(a['date']));

    final debutYear = getSafeValue(_fighterData, 'debutYear', "");

    return ListView(
      padding: EdgeInsets.all(16),
      children: [
        // Début de carrière
        if (debutYear.isNotEmpty)
          _buildCareerEvent(
            'Début de carrière',
            'Premier match professionnel',
            '$debutYear-01-01',
            Icons.start,
            Colors.green,
          ),

        // Événements de carrière
        if (careerEvents.isEmpty)
          Center(
            child: Text(
              'Aucun événement de carrière',
              style: TextStyle(color: greyColor, fontSize: 16),
            ),
          )
        else
          ...careerEvents.map((event) {
            if (event['type'] == 'transfer') {
              final transfer = event['data'] as Map<String, dynamic>;
              return buildTransferCard(context, transfer);
            } else {
              final achievement = event['data'] as Map<String, dynamic>;
              return _buildAchievementEvent(achievement);
            }
          }),
      ],
    );
  }

  // Widgets pour les sections
  Widget _buildDetailedStats() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'STATISTIQUES DÉTAILLÉES',
            style: TextStyle(
              color: blackColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 16),
          GridView(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 3,
            ),
            children: [
              _buildStatDetail(
                'Matchs joués',
                getSafeValue(_stats, 'totalMatches', 0).toString(),
              ),
              _buildStatDetail(
                'Victoires',
                getSafeValue(_stats, 'wins', 0).toString(),
              ),
              _buildStatDetail(
                'Défaites',
                getSafeValue(_stats, 'losses', 0).toString(),
              ),
              _buildStatDetail(
                'Ratio victoires',
                '${getSafeValue(_stats, 'winRate', 0.0).toStringAsFixed(1)}%',
              ),
              _buildStatDetail(
                'Cartons jaunes',
                getSafeValue(_stats, 'yellowCards', 0).toString(),
              ),
              _buildStatDetail(
                'Cartons rouges',
                getSafeValue(_stats, 'redCards', 0).toString(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBioSection(String bio) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'BIOGRAPHIE',
            style: TextStyle(
              color: greyColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8),
          Text(
            bio,
            style: TextStyle(color: greyColor, fontSize: 14, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildFightingStyleSection(String fightingStyle) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'STYLE DE COMBAT',
            style: TextStyle(
              color: greyColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8),
          Text(
            fightingStyle,
            style: TextStyle(color: greyColor, fontSize: 14, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 30),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(color: greyColor, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildStatDetail(String label, String value) {
    return Row(
      children: [
        Expanded(
          child: Text(label, style: TextStyle(color: greyColor, fontSize: 14)),
        ),
        Text(
          value,
          style: TextStyle(
            color: greyColor,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildTimeStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: whiteColor,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(label, style: TextStyle(color: whiteColor70, fontSize: 12)),
      ],
    );
  }

  Widget _buildPerformanceChart() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            'PERFORMANCE PAR ANNÉE',
            style: TextStyle(
              color: whiteColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 16),
          Container(
            height: 100,
            decoration: BoxDecoration(
              border: Border.all(color: greyColor),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                'Graphique de performance',
                style: TextStyle(color: whiteColor70, fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardsDetails() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            'HISTORIQUE DES CARTONS',
            style: TextStyle(
              color: whiteColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 12),
          ..._cards.map((card) => _buildCardDetail(card)),
        ],
      ),
    );
  }

  Widget _buildCardDetail(Map<String, dynamic> card) {
    final cardType = getSafeValue(card, 'cardType', 'yellow');
    final minuteGiven = getSafeValue(card, 'minuteGiven', '');
    final opponentNickname = getSafeValue(card, 'opponentNickname', '');
    final matchDate = getSafeValue(card, 'matchDate', '');

    return Container(
      margin: EdgeInsets.only(bottom: 8),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color:
            cardType == 'red'
                ? Colors.red.withValues(alpha: 0.1)
                : Colors.yellow.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: cardType == 'red' ? Colors.red : Colors.yellow,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: cardType == 'red' ? Colors.red : Colors.yellow,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                cardType == 'red' ? 'R' : 'J',
                style: TextStyle(
                  color: whiteColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Minute $minuteGiven',
                  style: TextStyle(
                    color: whiteColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Contre $opponentNickname',
                  style: TextStyle(color: whiteColor70, fontSize: 12),
                ),
              ],
            ),
          ),
          if (matchDate.isNotEmpty)
            Text(
              formatDate(matchDate),
              style: TextStyle(color: greyColor, fontSize: 12),
            ),
        ],
      ),
    );
  }

  Widget _buildAchievementCard(Map<String, dynamic> achievement) {
    final title = getSafeValue(achievement, 'title', '');
    final year = getSafeValue(achievement, 'year', 0);
    final position = getSafeValue(achievement, 'position', '');
    final editionTheme = getSafeValue(achievement, 'editionTheme', '');

    return Container(
      margin: EdgeInsets.only(bottom: 8),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: getAchievementColor(position),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                getAchievementIcon(position),
                style: TextStyle(
                  color: whiteColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: whiteColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$editionTheme - $year',
                  style: TextStyle(color: whiteColor70, fontSize: 12),
                ),
                Text(
                  getPositionText(position),
                  style: TextStyle(
                    color: getAchievementColor(position),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCareerEvent(
    String title,
    String description,
    String date,
    IconData icon,
    Color color,
  ) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 30),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  description,
                  style: TextStyle(color: greyColor, fontSize: 14),
                ),
              ],
            ),
          ),
          Text(
            date.substring(0, 4),
            style: TextStyle(color: greyColor, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildTransferEvent(Map<String, dynamic> transfer) {
    final fromRegionName = getSafeValue(transfer, 'fromRegionName', '');
    final toRegionName = getSafeValue(transfer, 'toRegionName', '');
    final transferDate = getSafeValue(transfer, 'transferDate', '');
    final transferReason = getSafeValue(transfer, 'transferReason', '');
    final currentRegionId = getSafeValue(_fighterData, 'regionId', 0);
    final toRegionId = getSafeValue(transfer, 'toRegionId', 0);
    final isCurrentRegion = toRegionId == currentRegionId;

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, 5),
          ),
        ],
        border: Border.all(
          color: isCurrentRegion ? Colors.green : Colors.orange,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isCurrentRegion ? Icons.login : Icons.logout,
            color: isCurrentRegion ? Colors.green : Colors.orange,
            size: 30,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isCurrentRegion ? 'Arrivée' : 'Départ',
                  style: TextStyle(
                    color: isCurrentRegion ? Colors.green : Colors.orange,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'De $fromRegionName à $toRegionName',
                  style: TextStyle(color: greyColor, fontSize: 14),
                ),
                if (transferReason.isNotEmpty)
                  Text(
                    transferReason,
                    style: TextStyle(color: greyColor, fontSize: 12),
                  ),
              ],
            ),
          ),
          Text(
            formatDate(transferDate),
            style: TextStyle(color: greyColor, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildAchievementEvent(Map<String, dynamic> achievement) {
    final title = getSafeValue(achievement, 'title', '');
    final year = getSafeValue(achievement, 'year', 0);
    final position = getSafeValue(achievement, 'position', '');
    final editionTheme = getSafeValue(achievement, 'editionTheme', '');

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: getAchievementColor(position),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                getAchievementIcon(position),
                style: TextStyle(
                  color: whiteColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: greyColor,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$editionTheme - $year',
                  style: TextStyle(color: greyColor, fontSize: 14),
                ),
                Text(
                  getPositionText(position),
                  style: TextStyle(
                    color: getAchievementColor(position),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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
            'Chargement des données...',
            style: TextStyle(color: whiteColor70),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: whiteColor,
        appBar: AppBar(
          title: Text(widget.fighterName),
          backgroundColor: Color(0xFF1B5E20),
        ),
        body: _buildLoadingState(),
      );
    }

    if (_hasError) {
      return Scaffold(
        backgroundColor: whiteColor,
        appBar: AppBar(
          title: Text(widget.fighterName),
          backgroundColor: Color(0xFF1B5E20),
        ),
        body: errorWidgetNormal(
          "lutteur",
          onPressed: () {
            _loadCompleteFighterData();
          },
        ),
      );
    }

    return Scaffold(
      backgroundColor: whiteBackground,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 300,
              floating: false,
              pinned: true,
              backgroundColor: primaryColor, //getRegionColor(),
              flexibleSpace: FlexibleSpaceBar(
                background: SafeArea(child: _buildFighterHeader()),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: whiteColor,
                  unselectedLabelColor: whiteColor70,
                  isScrollable: true,
                  indicatorColor: Colors.orange,
                  indicatorWeight: 3,
                  labelStyle: TextStyle(fontWeight: FontWeight.bold),
                  tabs: [
                    Tab(text: 'Infos'),
                    Tab(text: 'Stats'),
                    Tab(text: 'Matchs'),
                    Tab(text: 'Titres'),
                    Tab(text: 'Carrière'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildOverviewTab(),
            _buildStatsTab(),
            _buildMatchesTab(),
            _buildAchievementsTab(),
            _buildCareerTab(),
          ],
        ),
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _SliverAppBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(color: Color(0xFF1B5E20), child: tabBar);
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
