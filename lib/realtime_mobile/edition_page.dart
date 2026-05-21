import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:kokowa_tv/pages/edition/edition_region_page.dart';
import 'package:kokowa_tv/utils/colors.dart';
import 'package:kokowa_tv/utils/constants.dart';
import 'package:kokowa_tv/utils/data_utils.dart';
import 'package:kokowa_tv/pages/sous_group/sous_groupe_page.dart';
import 'package:kokowa_tv/widgets/app_title.dart';
import 'package:kokowa_tv/widgets/buildMatchCard.dart';
import 'package:kokowa_tv/widgets/error_widget.dart';
import 'package:kokowa_tv/widgets/fighter_image.dart';
import 'package:kokowa_tv/widgets/functions.dart';
import 'package:kokowa_tv/widgets/live_point.dart';
import 'package:kokowa_tv/widgets/widgets.dart';

class EditionPage extends StatefulWidget {
  final int? id;
  const EditionPage({super.key, this.id});

  @override
  State<EditionPage> createState() => _EditionPageState();
}

class _EditionPageState extends State<EditionPage> {
  Map<String, dynamic>? _selectedGroup;
  Map<String, dynamic>? _currentEdition;
  List<Map<String, dynamic>> _activeGroups = [];
  List<Map<String, dynamic>> _subGroups = [];
  List<Map<String, dynamic>> _phases = [];
  int editionId = 0;
  String editionName = "";
  bool _isLoading = true;
  String _errorMessage = '';

  // Nouvelle variable pour gérer le contenu affiché
  String _currentView = 'regions'; // 'regions' ou 'groups'
  Widget? _currentContent;

  final ScrollController _groupsScrollController = ScrollController();
  final Map<dynamic, GlobalKey> _groupKeys = {};
  final GlobalKey _regionsKey = GlobalKey();

  StreamSubscription<DatabaseEvent>? _editionSubscription;

  // Vérifier si une phase est de type groupe
  bool _isGroupPhase(Map<String, dynamic> phase) {
    final phaseType = getSafeValue(phase, 'phaseType', '');
    return phaseType == 'group';
  }

  @override
  void initState() {
    super.initState();
    _loadEditionData();
  }

  @override
  void dispose() {
    _editionSubscription?.cancel();
    super.dispose();
  }

  void _setupRTDBListener() {
    if (editionId == 0) return;
    
    _editionSubscription?.cancel();
    final ref = FirebaseDatabase.instance.ref('editions/$editionId');
    
    _editionSubscription = ref.onValue.listen((DatabaseEvent event) {
      if (event.snapshot.value != null && mounted) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        if (data['liveMatch'] != null) {
          final liveMatchData = Map<String, dynamic>.from(data['liveMatch']);
          final newSubGroupId = liveMatchData['subGroupId'];
          final newMatchId = liveMatchData['matchId'];
          
          final currentLiveMatch = _liveMatch;
          final currentSubGroupId = currentLiveMatch?['subGroupId'];
          final currentMatchId = currentLiveMatch?['id'];
          
          if (newSubGroupId != currentSubGroupId || newMatchId != currentMatchId) {
             // Si le live match a changé, on refetch l'édition pour avoir les nouvelles données statiques du match
             _loadEditionData(silent: true);
          }
        }
      }
    });
  }

  Future<void> _loadEditionData({bool silent = false}) async {
    try {
      if (!silent) {
        setState(() {
          _isLoading = true;
          _errorMessage = '';
        });
      }

      String url = widget.id == null ? "editions" : "editions/${widget.id}";
      String cacheKey =
          widget.id != null ? "edition_id_${widget.id}" : "current_edition";

      // Récupérer la dernière édition depuis l'API (OBJET SINGLE)
      final editionData = await fetchSingleDataWithCache(
        apiUrl: url,
        cacheKey: cacheKey,
        dataKey: 'edition',
        onUpdate: (updatedData) {
          // Ce callback sera appelé quand les nouvelles données arrivent
          _updateUIWithNewData(updatedData);
        },
      );

      if (editionData.isNotEmpty) {
        _updateUIWithNewData(editionData);
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = errorMessage;
      });
    }
  }

  // Nouvelle méthode pour mettre à jour l'UI
  void _updateUIWithNewData(Map<String, dynamic> newEditionData) {
    setState(() {
      _currentEdition = newEditionData;

      // Extraire les phases de l'édition
      _phases = getSafeValue(
        _currentEdition!,
        'phases',
        <Map<String, dynamic>>[],
      );

      editionId = getSafeValue(_currentEdition!, 'id', 0);
      
      _setupRTDBListener();

      // Récupérer tous les groupes actifs de toutes les phases
      _activeGroups = [];
      for (final phase in _phases) {
        final groups = getSafeValue(phase, 'groups', <Map<String, dynamic>>[]);
        _activeGroups.addAll(groups);
      }

      // Re-sélectionner le groupe approprié
      _reselectGroupBasedOnDate();
    });
  }

  void _reselectGroupBasedOnDate() {
    final currentDate = formatDate(DateTime.now().toString());
    Map<String, dynamic>? groupForToday;

    for (final group in _activeGroups) {
      final groupDate = formatDate(getSafeValue(group, 'date', ''));
      if (groupDate == currentDate) {
        groupForToday = group;
        break;
      }
    }

    if (groupForToday != null) {
      _selectedGroup = groupForToday;
      _loadSubGroupsForSelectedGroup();
      _currentView = 'groups';
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _selectInitialGroup();
      });
    } else if (_activeGroups.isNotEmpty) {
      // Sélectionner le premier groupe non terminé si possible
      Map<String, dynamic>? firstNonCompleted;
      for (final group in _activeGroups) {
        if (getSafeValue(group, 'isCompleted', false) == false) {
          firstNonCompleted = group;
          break;
        }
      }
      _selectedGroup = firstNonCompleted ?? _activeGroups.first;
      _loadSubGroupsForSelectedGroup();
      _currentView = 'groups';
    } else {
      _currentView = 'regions';
      _loadRegionsContent();
    }
  }

  void _selectInitialGroup() {
    if (_selectedGroup == null) return;

    // ⚠️ double sécurité : frame + délai
    Future.delayed(const Duration(milliseconds: 100), () {
      final key = _groupKeys[_selectedGroup!['id']];
      if (key?.currentContext != null) {
        Scrollable.ensureVisible(
          key!.currentContext!,
          alignment: 0.5,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _loadSubGroupsForSelectedGroup() {
    if (_selectedGroup == null) return;

    // Récupérer la phase associée à ce groupe
    Map<String, dynamic>? parentPhase;
    for (final phase in _phases) {
      final groups = getSafeValue(phase, 'groups', <Map<String, dynamic>>[]);
      if (groups.any((g) => g['id'] == _selectedGroup!['id'])) {
        parentPhase = phase;
        break;
      }
    }

    final isGroupPhase = _isGroupPhase(parentPhase ?? {});

    if (isGroupPhase) {
      // Pour les phases de groupe : charger les subGroups
      _subGroups = getSafeValue(
        _selectedGroup!,
        'subGroups',
        <Map<String, dynamic>>[],
      );

      // Classer les sous-groupes par période (matin/soir)
      _subGroups.sort((a, b) {
        final periodeA = getSafeValue(a, 'period', 'matin').toLowerCase();
        final periodeB = getSafeValue(b, 'period', 'matin').toLowerCase();
        if (periodeA == 'matin' && periodeB == 'soir') return -1;
        if (periodeA == 'soir' && periodeB == 'matin') return 1;
        return getSafeValue(
          a,
          'subGroupOrder',
          0,
        ).compareTo(getSafeValue(b, 'subGroupOrder', 0));
      });
    } else {
      // Pour les phases éliminatoires : extraire les matches des subGroups
      _subGroups = [];
      final subGroupsList = getSafeValue(
        _selectedGroup!,
        'subGroups',
        <Map<String, dynamic>>[],
      );

      for (final subGroup in subGroupsList) {
        final matches = getSafeValue(
          subGroup,
          'matches',
          <Map<String, dynamic>>[],
        );
        _subGroups.addAll(matches);
      }
    }

    setState(() {});
  }

  void _loadRegionsContent() {
    // Préparer le contenu des régions
    setState(() {
      _currentContent = EditionRegionsPage(
        editionId: editionId,
        editionName: editionName,
      );
      _currentView = 'regions';
    });
  }

  void _onGroupSelected(Map<String, dynamic> group) {
    setState(() {
      _selectedGroup = group;
      _loadSubGroupsForSelectedGroup();
      _currentView = 'groups';
      _currentContent = null; // Réinitialiser le contenu personnalisé
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final key = _groupKeys[group['id']];
      if (key?.currentContext != null) {
        Scrollable.ensureVisible(
          key!.currentContext!,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
          alignment: 0.5, // 🎯 centré
        );
      }
    });
  }

  void _onRegionsSelected() {
    _loadRegionsContent();
  }

  // Récupérer le match en direct depuis l'édition
  Map<String, dynamic>? get _liveMatch {
    return getSafeValue(_currentEdition ?? {}, 'liveMatch', null);
  }

  // Widget pour l'en-tête du championnat
  Widget _buildChampionshipHeader() {
    final competition = getSafeValue(
      _currentEdition ?? {},
      'competition',
      <String, dynamic>{},
    );

    final competitionName = getSafeValue(competition, "name", "Competition");
    final theme = getSafeValue(
      _currentEdition ?? {},
      'theme',
      'Championnat National de Kokowa',
    );
    final editionNumber = getSafeValue(
      _currentEdition ?? {},
      'editionNumber',
      '',
    );
    final year = getSafeValue(_currentEdition ?? {}, 'year', '');

    editionName = 'Édition $editionNumber - $theme - $year';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF1B5E20),
            const Color(0xFF2E7D32).withValues(alpha: 0.8),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.green.shade900.withValues(alpha: 0.5),
            blurRadius: 15,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            competitionName,
            style: TextStyle(
              color: whiteColor,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Édition $editionNumber - $theme - $year',
            style: TextStyle(
              color: whiteColor70,
              fontSize: 14,
              fontFamily: 'Poppins',
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // Widget pour la liste horizontale des groupes avec bouton RégionsWidget
  _buildGroupsSelector() {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.green.shade800, width: 1),
        ),
      ),
      child: ListView.builder(
        controller: _groupsScrollController,
        scrollDirection: Axis.horizontal,
        itemCount: _activeGroups.length + 1, // +1 pour Régions
        itemBuilder: (context, index) {
          // ================== RÉGIONS ==================
          if (index == 0) {
            return Container(
              key: _regionsKey,
              padding: const EdgeInsets.all(5),
              child: GestureDetector(
                onTap: _onRegionsSelected,
                child: _buildChip(
                  isSelected: _currentView == 'regions',
                  icon: Icons.map,
                  label: 'Régions',
                ),
              ),
            );
          }

          // ================== GROUPES ==================
          final group = _activeGroups[index - 1];
          final groupId = group['id'];

          _groupKeys.putIfAbsent(groupId, () => GlobalKey());

          final bool isSelected =
              _currentView == 'groups' && _selectedGroup?['id'] == groupId;

          return Container(
            key: _groupKeys[groupId], // ⚠️ clé sur Container
            padding: const EdgeInsets.all(5),
            child: GestureDetector(
              onTap: () => _onGroupSelected(group),
              child: _buildChip(
                isSelected: isSelected,
                icon:
                    getSafeValue(group, 'isCompleted', false)
                        ? Icons.check_circle
                        : Icons.schedule,
                label: getSafeValue(group, 'name', 'Groupe'),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildChip({
    required bool isSelected,
    required IconData icon,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        gradient:
            isSelected
                ? LinearGradient(
                  colors: [Colors.orange.shade600, Colors.orange.shade400],
                )
                : LinearGradient(
                  colors: [
                    const Color(0xFF1B5E20).withValues(alpha: 0.8),
                    const Color(0xFF0F2A0F).withValues(alpha: 0.8),
                  ],
                ),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: isSelected ? Colors.orange : Colors.green.shade600,
          width: 2,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: whiteColor, size: 16),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: whiteColor,
              fontWeight: FontWeight.w600,
              fontSize: 14,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }

  // Widget pour le match en direct avec design premium
  Widget _buildLiveMatch() {
    final liveMatch = _liveMatch;
    if (liveMatch == null) return const SizedBox();

    final fighters = getSafeValue(liveMatch, 'fighters', <String, dynamic>{});
    final fighter1 = getSafeValue(fighters, 'fighter1', <String, dynamic>{});
    final fighter2 = getSafeValue(fighters, 'fighter2', <String, dynamic>{});

    final subGroupId = getSafeValue(liveMatch, 'subGroupId', 0);
    final subGroupName = getSafeValue(liveMatch, 'subGroupName', '');
    final fighter1Region = getSafeValue(
      fighter1,
      'region',
      <String, dynamic>{},
    );
    final fighter2Region = getSafeValue(
      fighter2,
      'region',
      <String, dynamic>{},
    );

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => SousGroupePage(
                  subGroupId: subGroupId,
                  subGroupName: subGroupName,
                ),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Stack(
          children: [
            // Carte du match en cours
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFF1B5E20).withValues(alpha: 0.9),
                    const Color(0xFF0A1A0A).withValues(alpha: 0.9),
                  ],
                ),
                borderRadius: BorderRadius.circular(25),
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.withValues(alpha: 0.4),
                    blurRadius: 25,
                    spreadRadius: 5,
                  ),
                ],
                border: Border.all(
                  color: Colors.orange.withValues(alpha: 0.6),
                  width: 2,
                ),
              ),
              child: Column(
                children: [
                  // Petit point rouge LIVE en haut
                  BlinkingDot(),
                  const SizedBox(height: 8),

                  // Corps du match - Lutteurs
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildFighterCard(fighter1, true),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'VS',
                            style: TextStyle(
                              color: Colors.orange,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: _buildInfoItem(
                              Icons.timer,
                              '02:58',
                              // getSafeValue(liveMatch, 'totalDuration', '--:--'),
                            ),
                          ),
                        ],
                      ),
                      _buildFighterCard(fighter2, false),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildRegionFlag(fighter1Region, true),
                      Column(
                        children: [
                          Text(
                            'vs',
                            style: TextStyle(
                              color: whiteColor70,
                              fontSize: 14,
                              fontWeight: FontWeight.w300,
                              fontFamily: 'Roboto',
                            ),
                          ),
                        ],
                      ),
                      _buildRegionFlag(fighter2Region, false),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegionFlag(Map<String, dynamic> region, bool isLeft) {
    final regionName = getSafeValue(region, 'name', 'Région');
    return Column(
      children: [
        Text(
          regionName,
          style: TextStyle(
            color: whiteColor,
            fontSize: 25,
            fontWeight: FontWeight.bold,
            fontFamily: 'Poppins',
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildFighterCard(Map<String, dynamic> fighter, bool isLeft) {
    final firstName = getSafeValue(fighter, 'firstName', '');
    final lastName = getSafeValue(fighter, 'lastName', '');
    final profileImage = getSafeValue(fighter, 'profileImage', '');

    return Expanded(
      child: Column(
        children: [
          // Photo du lutteur avec ceinture
          Stack(
            alignment: Alignment.center,
            children: [
              // Photo du lutteur
              Container(
                width: 100,
                height: 100,
                margin: const EdgeInsets.only(top: 10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isLeft ? Colors.red : Colors.green,
                    width: 3,
                  ),
                  // boxShadow: [
                  //   BoxShadow(
                  //     color: getRegionColor(regionColor).withValues(alpha:0.4),
                  //     blurRadius: 15,
                  //     spreadRadius: 3,
                  //   ),
                  // ],
                ),
                child: ClipOval(
                  child: buildFighterImage({
                    'profile_image': profileImage,
                    'first_name': firstName,
                    "last_name": lastName,
                  }),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Prénom
          Text(
            "$firstName $lastName",
            style: TextStyle(
              color: whiteColor70,
              fontSize: 12,
              fontFamily: 'Roboto',
            ),
            textAlign: TextAlign.center,
          ),

          // // Surnom
          // if (nickname.isNotEmpty) ...[
          //   const SizedBox(height: 4),
          //   Text(
          //     '"$nickname"',
          //     style: const TextStyle(
          //       color: Colors.orange,
          //       fontSize: 10,
          //       fontStyle: FontStyle.italic,
          //       fontFamily: 'Roboto',
          //     ),
          //     textAlign: TextAlign.center,
          //   ),
          // ],
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: Colors.orange, size: 16),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            color: whiteColor,
            fontSize: 12,
            fontFamily: 'Roboto',
          ),
        ),
      ],
    );
  }

  // Widget pour un sous-groupe simple
  Widget _buildSubGroup(Map<String, dynamic> subGroup) {
    // final wins = _getRegionWins(subGroup);
    final region1Name = getSafeValue(subGroup, 'region1Name', 'Région 1');
    final region2Name = getSafeValue(subGroup, 'region2Name', 'Région 2');
    final isCompleted = getSafeValue(subGroup, 'isCompleted', false);
    final subGroupName = getSafeValue(subGroup, 'name', 'Sous-groupe');
    final status = getSafeValue(subGroup, "status", "upcoming");
    final subGroupId = getSafeValue(subGroup, 'id', 0);
    final periode = getSafeValue(subGroup, 'period', 'matin');
    final flagImage1 = getSafeValue(subGroup, 'region1FlagImage', '');
    final flagImage2 = getSafeValue(subGroup, 'region2FlagImage', '');

    final score1 = getScore(subGroup, 1);
    final score2 = getScore(subGroup, 2);
    final nulls = getScore(subGroup, 3);

    // Score format : Region1 X:Y Region2
    final scoreText = "$score1 : $score2";
    final nullText = "$nulls nul(s)";

    return InkWell(
      onTap: () {
        // Navigation vers la page de sous-groupe
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => SousGroupePage(
                  subGroupId: subGroupId,
                  subGroupName: subGroupName,
                ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: whiteColor,
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withValues(alpha: 0.3),
              blurRadius: 15,
              spreadRadius: 2,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          children: [
            // Petit point rouge LIVE en haut
            if (status == "ongoing") ...[
              BlinkingDot(),
              // const SizedBox(height: 8),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Région 1
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: greyColor.withAlpha(
                            100,
                          ), //getRegionColor(region1Color),
                          shape: BoxShape.circle,
                        ),
                        child: buildRegionImage(flagImage1, region1Name),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        region1Name,
                        style: TextStyle(
                          color: blackColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                      ),
                    ],
                  ),
                ),

                // Score ou VS
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      if (status == "completed" || status == "ongoing") ...[
                        RichText(
                          textAlign: TextAlign.center,
                          text: TextSpan(
                            children: <TextSpan>[
                              TextSpan(
                                text: '$scoreText',
                                style: TextStyle(
                                  color: Colors.green,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if ((int.tryParse(nulls) ?? 0) > 0) ...[
                                TextSpan(
                                  text: '\n$nullText',
                                  style: TextStyle(
                                    color: greyColor,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (isCompleted) ...[
                          const SizedBox(height: 4),
                          Icon(
                            Icons.check_circle,
                            color: Colors.green,
                            size: 20,
                          ),
                        ],
                      ] else ...[
                        Text(
                          "VS",
                          style: TextStyle(
                            color: blackColor,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Icon(Icons.schedule, color: blackColor, size: 20),
                      ],
                      const SizedBox(height: 8),
                      // Indicateur de période (Matin/Soir)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          // vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color:
                              periode == 'matin'
                                  ? Colors.blue.withValues(alpha: 0.2)
                                  : Colors.purple.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color:
                                periode == 'matin'
                                    ? Colors.blue
                                    : Colors.purple,
                            width: 1,
                          ),
                        ),
                        child: Text(
                          periode.toUpperCase(),
                          style: TextStyle(
                            color:
                                periode == 'matin'
                                    ? Colors.blue
                                    : Colors.purple,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Région 2
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: greyColor.withAlpha(100),
                          // color: getRegionColor(region2Color),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: buildRegionImage(flagImage2, region2Name),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        region2Name,
                        style: TextStyle(
                          color: blackColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Widget de chargement
  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
          ),
          SizedBox(height: 16),
          Text(
            'Chargement des données...',
            style: TextStyle(color: greyColor, fontSize: 16),
          ),
        ],
      ),
    );
  }

  // Widget d'erreur
  Widget _buildError() {
    return errorWidget(
      "édition",
      onPressed: () {
        _loadEditionData();
      },
      type: "e",
    );
  }

  // Widget pour afficher le contenu des groupes/matchs
  Widget _buildGroupsContent() {
    if (_selectedGroup == null) {
      return const Center(child: Text('Aucune donnée disponible'));
    }

    // Trouver la phase parente
    Map<String, dynamic>? parentPhase;
    for (final phase in _phases) {
      final groups = getSafeValue(phase, 'groups', <Map<String, dynamic>>[]);
      if (groups.any((g) => g['id'] == _selectedGroup!['id'])) {
        parentPhase = phase;
        break;
      }
    }

    final isGroupPhase = _isGroupPhase(parentPhase ?? {});

    return CustomScrollView(
      slivers: [
        // Match en direct (si existe)
        if (_liveMatch != null) SliverToBoxAdapter(child: _buildLiveMatch()),

        // En-tête du groupe sélectionné
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              getSafeValue(_selectedGroup ?? {}, 'name', 'Rencontres'),
              style: TextStyle(
                color: primaryColor,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ),

        // Liste des contenus (subGroups pour phases groupe, matches pour phases éliminatoires)
        if (_subGroups.isNotEmpty)
          SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              if (isGroupPhase) {
                // Affichage des subGroups (matchs régionaux)
                return _buildSubGroup(_subGroups[index]);
              } else {
                // Affichage des matches individuels
                final match = _subGroups[index];
                final subGroup = _findSubGroupContainingMatch(match['id']);

                // Récupérer les couleurs des ceintures (à adapter selon votre logique)
                String belt1 = _getBeltColorFromMatch(match, 'fighter1');
                String belt2 = _getBeltColorFromMatch(match, 'fighter2');

                return buildMatchCard(
                  match,
                  belt1,
                  belt2,
                  context,
                  isLive: false,
                  withRegion: true,
                );
              }
            }, childCount: _subGroups.length),
          ),

        const SliverToBoxAdapter(child: SizedBox(height: 20)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(backgroundColor: whiteBackground, body: _buildLoading());
    }

    if (_errorMessage.isNotEmpty) {
      return Scaffold(
        appBar:
            widget.id != null
                ? AppBar(
                  automaticallyImplyLeading: false,
                  title: buildAppTitle(),
                  centerTitle: true,
                  backgroundColor: const Color(0xFF1B5E20),
                  elevation: 0,
                )
                : null,
        backgroundColor: whiteBackground,
        body: CustomScrollView(slivers: [_buildError()]),
      );
    }
    return Scaffold(
      appBar:
          widget.id != null
              ? AppBar(
                automaticallyImplyLeading: false,
                title: buildAppTitle(),
                centerTitle: true,
                backgroundColor: const Color(0xFF1B5E20),
                elevation: 0,
              )
              : null,

      backgroundColor: whiteBackground,
      body: SafeArea(
        child: Column(
          children: [
            // En-tête du championnat
            _buildChampionshipHeader(),

            // Sélecteur avec bouton Régions et liste des groupes
            if (_activeGroups.isNotEmpty) _buildGroupsSelector(),

            // Contenu principal
            Expanded(
              child:
                  _currentView == 'regions'
                      ? _currentContent ?? const SizedBox()
                      : _buildGroupsContent(),
            ),
          ],
        ),
      ),
    );
  }

  // Trouver le subGroup qui contient un match spécifique
  Map<String, dynamic>? _findSubGroupContainingMatch(int matchId) {
    if (_selectedGroup == null) return null;

    final subGroupsList = getSafeValue(
      _selectedGroup!,
      'subGroups',
      <Map<String, dynamic>>[],
    );

    for (final subGroup in subGroupsList) {
      final matches = getSafeValue(
        subGroup,
        'matches',
        <Map<String, dynamic>>[],
      );
      if (matches.any((m) => m['id'] == matchId)) {
        return subGroup;
      }
    }
    return null;
  }

  // Récupérer la couleur de ceinture d'un combattant depuis un match
  String _getBeltColorFromMatch(Map<String, dynamic> match, String fighterKey) {
    // Cette méthode dépend de comment les ceintures sont stockées dans votre API
    // À adapter selon votre structure de données

    // Option 1: Si les ceintures sont dans le match
    if (fighterKey == 'fighter1') {
      return getSafeValue(match, 'beltRegion1Color', 'red');
    } else {
      return getSafeValue(match, 'beltRegion2Color', 'green');
    }

    // Option 2: Si les ceintures sont dans les fighters
    // final fighters = getSafeValue(match, 'fighters', <String, dynamic>{});
    // final fighter = getSafeValue(fighters, fighterKey, <String, dynamic>{});
    // return getSafeValue(fighter, 'beltColor', 'blue');
 }
}
