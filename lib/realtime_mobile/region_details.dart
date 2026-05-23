import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:kokowa_tv/utils/colors.dart';
import 'package:kokowa_tv/pages/lutteur/lutteur_details.dart';
import 'package:kokowa_tv/utils/constants.dart';
import 'package:kokowa_tv/utils/data_utils.dart';
import 'package:kokowa_tv/utils/send_interaction.dart';
import 'package:kokowa_tv/widgets/buildMatchCard.dart';
import 'package:kokowa_tv/widgets/error_widget.dart';
import 'package:kokowa_tv/widgets/fighter_image.dart';
import 'package:kokowa_tv/widgets/transferts_detail_card.dart';
import 'package:kokowa_tv/widgets/widgets.dart';

class RegionPage extends StatefulWidget {
  final int regionId;

  RegionPage({super.key, required this.regionId});

  @override
  State<RegionPage> createState() => _RegionPageState();
}

class _RegionPageState extends State<RegionPage>
    with SingleTickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  late TabController _tabController;
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  Timer? _refreshTimer;
  final auth = FirebaseAuth.instance;

  bool _isLiked = false;
  int _likeCount = 0;
  bool _isLoadingLike = false;
  String? uid = FirebaseAuth.instance.currentUser!.uid;

  List<dynamic> _editions = [];
  int? _selectedEditionId;
  bool _isLoadingMatches = false;

  // Données de la région
  Map<String, dynamic> _regionData = {};
  List<dynamic> _fighters = [];
  List<dynamic> _matches = [];
  List<dynamic> _transfers = [];
  Map<String, dynamic> _achievementsData = {};
  Map<String, dynamic> _stats = {};
  Map<String, dynamic> _summary = {};

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadRegionData();
    _loadMatchesByEdition(0);
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

 void _startAutoRefresh() {
  _refreshTimer = Timer.periodic(Duration(minutes: 3), (timer) {
    if (mounted) {
      _loadRegionData(silent: true);
    }
  });
}

  Future<void> _loadRegionData({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        _isLoading = true;
        _hasError = false;
      });
    }

    try {
      // Utilisation de la fonction avec cache ET callback
      final data = await fetchRegionDetailsWithCache(
        regionId: widget.regionId,
        uid: uid ?? '',
        onUpdate: (updatedData) {
          if (mounted) {
            _updateRegionDetailUI(updatedData);
          }
        },
      );

      // Mise à jour initiale
      if (mounted) {
        _updateRegionDetailUI(data);
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

  void _updateRegionDetailUI(Map<String, dynamic> data) {
    setState(() {
      _regionData = getSafeValue(data, 'region', <String, dynamic>{});
      _fighters = getSafeValue(_regionData, 'fighters', []);
      _editions = getSafeValue(_regionData, 'editions', []);
      _transfers = getSafeValue(_regionData, 'transfers', []);
      _achievementsData = getSafeValue(
        data,
        'achievements',
        <String, dynamic>{},
      );
      _stats = getSafeValue(_regionData, 'stats', <String, dynamic>{});
      _summary = getSafeValue(_regionData, 'summary', <String, dynamic>{});
      _isLiked = getSafeValue(_regionData, "isMyFavorite", false);
      _likeCount = getSafeValue(_regionData, "likes", 0);
      _isLoading = false;
    });
  }

  Future<void> _loadMatchesByEdition(int? editionId) async {
    setState(() {
      _isLoadingMatches = true;
      _selectedEditionId = editionId;
    });

    try {
      final newMatches = await fetchEditionMatchesWithCache(
        fighterId: widget.regionId,
        editionId: editionId ?? 0,
        table: "regions",
        onUpdate: (updatedMatches) {
          if (mounted) {
            setState(() {
              _matches = updatedMatches;
              _isLoadingMatches = false;
            });
          }
        },
      );

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
        entityType: 'region',
        entityId: widget.regionId,
      );

      if (mounted) {
        if (response.success) {
          setState(() {
            _isLiked = !_isLiked;
            _likeCount = _isLiked ? _likeCount + 1 : _likeCount - 1;

            // Mettre à jour l'article local
            _regionData = {
              ..._regionData,
              'isMyFavorite': _isLiked,
              'likes': _likeCount.toString(),
            };
          });

          // Afficher un feedback
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_isLiked ? 'Région aimé !' : 'Like retiré'),
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

  // Widget pour l'en-tête de la région
  Widget _buildRegionHeader() {
    final regionName = getSafeValue(_regionData, 'name', '');
    final description = getSafeValue(_regionData, 'description', '');
    final totalChampions = getSafeValue(_regionData, 'totalChampions', 0);
    final flagImage = getSafeValue(_regionData, 'flagImage', '');

    // Utiliser _summary si disponible, sinon _stats
    final totalFighters =
        _summary.isNotEmpty
            ? getSafeValue(_summary, 'totalFighters', 0)
            : getSafeValue(_stats, 'totalFighters', 0);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 40, horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryColor, primaryColor.withValues(alpha: 0.5)],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Logo de la région
              Container(
                width: 80,
                height: 80,
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
                child: buildRegionImage(flagImage, regionName),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      regionName,
                      style: TextStyle(
                        color: whiteColor,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Poppins',
                      ),
                    ),

                    SizedBox(height: 5),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatItem(
                            Icons.people,
                            '$totalFighters Lutteurs',
                          ),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: _buildStatItem(
                            Icons.emoji_events,
                            '$totalChampions Champions',
                          ),
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
                    setState(() {
                      _toggleLike();
                    });
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
              // Bouton actualiser
              // IconButton(
              //   onPressed: _loadRegionData,
              //   icon:  Icon(Icons.refresh, color: whiteColor, size: 30),
              //   tooltip: 'Actualiser',
              // ),
            ],
          ),
          if (description.isNotEmpty) ...[
            SizedBox(height: 10),
            Text(
              description,
              style: TextStyle(
                color: whiteColor,
                fontSize: 14,
                fontFamily: 'Roboto',
              ),
              // textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatisticsSection() {
    // Utiliser _summary si disponible
    final totalMatches =
        _summary.isNotEmpty
            ? getSafeValue(_summary, 'totalMatches', 0)
            : getSafeValue(_stats, 'totalMatches', 0);

    final totalFighters =
        _summary.isNotEmpty
            ? getSafeValue(_summary, 'totalFighters', 0)
            : getSafeValue(_stats, 'totalFighters', 0);

    final liveMatches =
        _summary.isNotEmpty ? getSafeValue(_summary, 'liveMatches', 0) : 0;

    final totalAchievements =
        _summary.isNotEmpty
            ? getSafeValue(_summary, 'totalAchievements', 0)
            : getSafeValue(_stats, 'totalAchievements', 0);

    // Les autres stats viennent toujours de _stats
    final wins = getSafeValue(_stats, 'wins', 0);
    final losses = getSafeValue(_stats, 'losses', 0);
    final winRate = getSafeValue(_stats, 'winRate', 0);
    final champions = getSafeValue(_stats, 'champions', 0);

    return Container(
      padding: EdgeInsets.all(16),
      margin: EdgeInsets.only(left: 10, right: 10, bottom: 10),
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
        children: [
          Text(
            'STATISTIQUES',
            style: TextStyle(
              color: blackColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            alignment: WrapAlignment.spaceAround,
            children: [
              _buildStatCircle('$totalMatches', 'Matchs', Colors.blue),
              _buildStatCircle('$wins', 'Victoires', Colors.green),
              _buildStatCircle('$losses', 'Défaites', Colors.red),
              _buildStatCircle('$winRate%', 'Victoires %', Colors.orange),
              _buildStatCircle('$totalFighters', 'Lutteurs', greyColor),
              _buildStatCircle('$champions', 'Champions', Colors.yellow),
              _buildStatCircle(
                '$totalAchievements',
                'Récompenses',
                Colors.purple,
              ),
              if (liveMatches > 0)
                _buildStatCircle('$liveMatches', 'En direct', Colors.red),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: whiteColor, size: 16),
        SizedBox(width: 2),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: whiteColor,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // Tab 1: Vue d'ensemble
  Widget _buildOverviewTab() {
    // final liveMatches = getSafeValue(_matches, 'live', []);

    final stadiumName = getSafeValue(_regionData, 'stadiumName', '');
    final stadiumImage = getSafeValue(_regionData, 'stadiumImage', '');

    final liveMatches =
        _matches.where((match) {
          final status = getSafeValue(match, 'status', '');
          return status == 'live' || status == 'round_break';
        }).toList();

    final scheduledMatches =
        _matches.where((match) {
          return getSafeValue(match, 'status', '') == 'scheduled';
        }).toList();

    final completedMatches =
        _matches
            .where((match) {
              return getSafeValue(match, 'status', '') == 'completed';
            })
            .take(5)
            .toList();

    return ListView(
      children: [
        // Match en direct
        if (liveMatches.isNotEmpty) ...[
          _buildSectionHeader('MATCH EN DIRECT', Colors.red),
          SizedBox(height: 12),
          ...liveMatches
              .take(2)
              .map(
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
        if (scheduledMatches.isNotEmpty) ...[
          _buildSectionHeader('PROCHAINS MATCHS', Colors.orange),
          SizedBox(height: 12),
          ...scheduledMatches
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

        // Statistiques
        _buildStatisticsSection(), SizedBox(height: 20),
        _buildSectionHeader('ARÉNA RÉGIONALE', Colors.green),
        Padding(
          padding: const EdgeInsets.all(10.0),
          child: Column(
            children: [
              if (stadiumImage.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: ColorFiltered(
                    colorFilter: ColorFilter.mode(
                      Colors.black.withValues(alpha: 0.3),
                      BlendMode.darken,
                    ),
                    child: CachedNetworkImage(
                      imageUrl: stadiumImage,
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) {
                        return SizedBox();
                      },
                    ),
                  ),
                ),
              ],
              SizedBox(height: 10),
              Text(
                stadiumName.toUpperCase(),
                style: TextStyle(
                  color: blackColor,
                  fontSize: 16,

                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        // Derniers résultats
        if (completedMatches.isNotEmpty) ...[
          _buildSectionHeader('DERNIERS RÉSULTATS', Colors.green),
          SizedBox(height: 12),
          ...completedMatches
              .take(5)
              .map(
                (match) => buildMatchCard(
                  match,
                  "red",
                  "green",
                  context,
                  withRegion: true,
                ),
              ),
        ],
        SizedBox(height: 20),
      ],
    );
  }

  // Tab 2: Lutteurs
  Widget _buildFightersTab() {
    if (_fighters.isEmpty) {
      return _buildEmptyState('Aucun lutteur dans cette région');
    }

    final coachFirstName = getSafeValue(_regionData, 'coachFirstName', '');
    final coachLastName = getSafeValue(_regionData, 'coachLastName', '');
    // final coachProfileImage = getSafeValue(
    //   _regionData,
    //   'coachProfileImage',
    //   '',
    // );
    return Column(
      children: [
        if (coachFirstName.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(8.0),
            margin: EdgeInsets.all(10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
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
                Text(
                  'Coach : ',
                  style: TextStyle(
                    color: blackColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                ),
                Text(
                  '$coachFirstName $coachLastName',
                  style: TextStyle(color: blackColor, fontSize: 20),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                ),
              ],
            ),
          ),

        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.8,
            ),
            itemCount: _fighters.length,
            itemBuilder: (context, index) {
              final fighter = _fighters[index];
              return _buildFighterCard(fighter);
            },
          ),
        ),
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

  // Tab 4: Transferts
  Widget _buildTransfersTab() {
    if (_transfers.isEmpty) {
      return _buildEmptyState('Aucun transfert récent');
    }

    return ListView(
      padding: EdgeInsets.all(16),
      children: [
        ..._transfers.map((transfer) => buildTransferCard(context, transfer)),
      ],
    );
  }

  // Tab 5: Palmarès
  Widget _buildAchievementsTab() {
    final achievementsByCompetition = getSafeValue(
      _achievementsData,
      'byCompetition',
      [],
    );
    final totalChampions = getSafeValue(_regionData, 'totalChampions', 0);

    if (achievementsByCompetition.isEmpty && totalChampions == 0) {
      return _buildEmptyState('Aucun palmarès pour cette région');
    }

    return ListView(
      padding: EdgeInsets.all(16),
      children: [
        // Titres de championnat
        if (totalChampions > 0) ...[
          _buildSectionHeader('TITRES DE CHAMPIONNAT', Colors.orange),
          SizedBox(height: 12),
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange),
            ),
            child: Row(
              children: [
                Icon(Icons.emoji_events, color: Colors.orange, size: 40),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$totalChampions Titres',
                        style: TextStyle(
                          color: Colors.orange,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Championnats remportés',
                        style: TextStyle(color: greyColor, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 20),
        ],

        // Récompenses par compétition
        if (achievementsByCompetition.isNotEmpty) ...[
          _buildSectionHeader('RÉCOMPENSES', Colors.green),
          SizedBox(height: 12),
          ...achievementsByCompetition.map((competitionData) {
            final edition = getSafeValue(
              competitionData,
              'edition',
              <String, dynamic>{},
            );
            final achievements = getSafeValue(
              competitionData,
              'achievements',
              [],
            );

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${getSafeValue(edition, 'theme', '')} ${getSafeValue(edition, 'year', '')}',
                  style: TextStyle(
                    color: whiteColor,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                ...achievements.map(
                  (achievement) => _buildAchievementCard(achievement),
                ),
                SizedBox(height: 16),
              ],
            );
          }),
        ],
      ],
    );
  }

  // Widget pour une carte de lutteur
  Widget _buildFighterCard(Map<String, dynamic> fighter) {
    final nickname = getSafeValue(fighter, 'nickname', '');
    final firstName = getSafeValue(fighter, 'firstName', '');
    final lastName = getSafeValue(fighter, 'lastName', '');
    final profilImage = getSafeValue(fighter, 'profileImage', '');

    return GestureDetector(
      onTap: () => _navigateToFighterPage(fighter),
      child: Container(
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
          children: [
            // Photo du lutteur
            Container(
              height: 100,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                color: primaryColor.withValues(alpha: 0.9),
              ),
              child: Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: greyColor, width: 2),
                  ),
                  child: ClipOval(
                    child: buildFighterImage({
                      "profile_image": profilImage,
                      "first_name": firstName,
                      "last_name": lastName,
                    }),
                  ),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(8),
              child: Column(
                children: [
                  Text(
                    '$firstName $lastName',
                    style: TextStyle(
                      color: blackColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                  ),
                  SizedBox(height: 4),
                  Text(
                    nickname,
                    style: TextStyle(color: greyColor, fontSize: 10),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget pour une carte d'achievement
  Widget _buildAchievementCard(Map<String, dynamic> achievement) {
    final fighterNickname = getSafeValue(achievement, 'fighterNickname', '');
    final editionYear = getSafeValue(achievement, 'editionYear', '');
    final position = getSafeValue(achievement, 'position', '');
    final title = getSafeValue(achievement, 'title', '');

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
            width: 30,
            height: 30,
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
                  title,
                  style: TextStyle(
                    color: whiteColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$fighterNickname - $editionYear',
                  style: TextStyle(color: greyColor, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCircle(String value, String label, Color color) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            shape: BoxShape.circle,
            border: Border.all(color: color),
          ),
          child: Center(
            child: Text(
              value,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ),
        SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(color: greyColor, fontSize: 10),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        children: [
          Container(width: 4, height: 20, color: color),
          SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.info_outline, color: greyColor, size: 64),
          SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(color: greyColor, fontSize: 16),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // Navigation
  void _navigateToFighterPage(Map<String, dynamic> fighter) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder:
            (context) => FighterPage(
              fighterId: fighter['id'],
              fighterName: '${fighter['firstName']} ${fighter['lastName']}',
            ),
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
          Text('Chargement des données...', style: TextStyle(color: greyColor)),
        ],
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: whiteBackground,
      body:
          _isLoading
              ? _buildLoadingState()
              : _hasError
              ? errorWidgetNormal(
                        "région",
                        onPressed: () {
                          _loadRegionData();
                        }, type:"e"
                      )
              : NestedScrollView(
                headerSliverBuilder: (context, innerBoxIsScrolled) {
                  return [
                    SliverAppBar(
                      expandedHeight: 220,
                      floating: false,
                      pinned: true,
                      backgroundColor: primaryColor,
                      flexibleSpace: FlexibleSpaceBar(
                        background: SafeArea(child: _buildRegionHeader()),
                      ),
                    ),
                    SliverPersistentHeader(
                      pinned: true,
                      delegate: _SliverAppBarDelegate(
                        TabBar(
                          controller: _tabController,
                          labelColor: whiteColor,
                          unselectedLabelColor: greyColor,
                          indicatorColor: Colors.orange,
                          isScrollable: true,
                          indicatorWeight: 3,
                          labelStyle: TextStyle(fontWeight: FontWeight.bold),
                          tabs: [
                            Tab(text: 'Vue Générale'),
                            Tab(text: 'Effectifs'),
                            Tab(text: 'Matchs'),
                            Tab(text: 'Transferts'),
                            Tab(text: 'Titres'),
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
                    _buildFightersTab(),
                    _buildMatchesTab(),
                    _buildTransfersTab(),
                    _buildAchievementsTab(),
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
