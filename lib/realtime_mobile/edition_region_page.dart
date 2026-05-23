import 'dart:async';

import 'package:flutter/material.dart';
import 'package:kokowa_tv/pages/edition/region_detail.dart';
import 'package:kokowa_tv/pages/lutteur/lutteur_details.dart';
import 'package:kokowa_tv/pages/regions/region_details.dart';
import 'package:kokowa_tv/utils/colors.dart';
import 'package:kokowa_tv/utils/constants.dart';
import 'package:kokowa_tv/utils/data_utils.dart';
import 'package:kokowa_tv/widgets/widgets.dart';

class EditionRegionsPage extends StatefulWidget {
  final int editionId;
  final String editionName;

  const EditionRegionsPage({
    super.key,
    required this.editionId,
    required this.editionName,
  });

  @override
  State<EditionRegionsPage> createState() => _EditionRegionsPageState();
}

class _EditionRegionsPageState extends State<EditionRegionsPage> {
  // Données
  Map<String, dynamic> _editionData = {};
  List<dynamic> _regions = [];
  List<dynamic> _editionFighters = [];

  int? _selectedLossFilter; // null = aucun filtre

  // États
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';

  // Options de tri
  String _sortBy = 'unbeaten'; // 'unbeaten', 'victoires', 'name'
  bool _showUnbeatenFighters = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadEditionData();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(minutes: 2), (timer) {
      if (mounted) {
        _loadEditionData(silent: true);
      }
    });
  }

  Future<void> _loadEditionData({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        _isLoading = true;
        _hasError = false;
      });
    }

    try {
      // Utilisation de la nouvelle fonction avec cache ET callback
      final data = await fetchEditionRegionsWithCache(
        editionId: widget.editionId,
        onUpdate: (updatedData) {
          // Ce callback sera appelé quand les nouvelles données arrivent en arrière-plan
          if (mounted) {
            _updateEditionUI(updatedData);
          }
        },
      );

      // Mise à jour initiale avec les données (cache ou API)
      if (mounted) {
        _updateEditionUI(data);
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

  // Nouvelle méthode pour mettre à jour l'UI
  void _updateEditionUI(Map<String, dynamic> data) {
    setState(() {
      _editionData = getSafeValue(data, 'edition', <String, dynamic>{});
      _regions = getSafeValue(data, 'regions', []);
      _editionFighters = getSafeValue(data, 'fighters', []);

      // Trier les régions selon l'option sélectionnée
      _sortRegions();

      // Trier les lutteurs par ordre alphabétique
      _editionFighters.sort((a, b) {
        final firstCompare = (a['firstName'] ?? '')
            .toString()
            .toLowerCase()
            .compareTo((b['firstName'] ?? '').toString().toLowerCase());

        if (firstCompare != 0) return firstCompare;

        return (a['lastName'] ?? '').toString().toLowerCase().compareTo(
          (b['lastName'] ?? '').toString().toLowerCase(),
        );
      });

      _isLoading = false;
    });
  }

  void _sortRegions() {
    final sortedList = List.of(_regions);

    switch (_sortBy.trim()) {
      case 'victoires':
        sortedList.sort((a, b) {
          final statsA = getSafeValue(a, 'stats', <String, dynamic>{});
          final statsB = getSafeValue(b, 'stats', <String, dynamic>{});

          final winsA = getSafeValue(statsA, 'totalWins', 0);
          final winsB = getSafeValue(statsB, 'totalWins', 0);

          return winsB.compareTo(winsA);
        });
        break;

      case 'name':
        sortedList.sort((a, b) {
          final nameA =
              getSafeValue(a, 'regionName', '').toString().toLowerCase();
          final nameB =
              getSafeValue(b, 'regionName', '').toString().toLowerCase();

          return nameA.compareTo(nameB);
        });
        break;

      case 'unbeaten':
      default:
        sortedList.sort((a, b) {
          final statsA = getSafeValue(a, 'stats', <String, dynamic>{});
          final statsB = getSafeValue(b, 'stats', <String, dynamic>{});

          final unbeatenA = getSafeValue(statsA, 'unbeatenFighters', 0);
          final unbeatenB = getSafeValue(statsB, 'unbeatenFighters', 0);

          return unbeatenB.compareTo(unbeatenA);
        });
        break;
    }

    _regions = sortedList;
  }

  // Widget pour l'en-tête de l'édition
  Widget _buildEditionHeader() {
    final totalRegions = getSafeValue(_editionData, "totalRegions", 0);
    final totalUnbeatenFighters = getSafeValue(
      _editionData,
      "totalUnbeatenFighters",
      0,
    );
    final totalFighters = getSafeValue(_editionData, "totalFighters", 0);

    final activeRegions =
        _regions.where((r) {
          Map<String, dynamic> stats = getSafeValue(
            r,
            'stats',
            <String, dynamic>{},
          );
          return getSafeValue(stats, 'unbeatenFighters', 0) != 0;
        }).length;

    return Container(
      padding: const EdgeInsets.all(16),
      // decoration: BoxDecoration(
      //   gradient: LinearGradient(
      //     begin: Alignment.topLeft,
      //     end: Alignment.bottomRight,
      //     colors: [
      //       const Color(0xFF1B5E20),
      //       const Color(0xFF2E7D32).withValues(alpha:0.8),
      //     ],
      //   ),
      // ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('$totalRegions', 'Régions', Icons.flag),
              _buildStatItem('$activeRegions', 'En course', Icons.check_circle),
              _buildStatItem('${totalFighters}', 'Lutteurs', Icons.people),
              _buildStatItem(
                '${totalUnbeatenFighters}',
                'Invaincus',
                Icons.emoji_events,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label, IconData icon) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: primaryColor.withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: primaryColor, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            color: primaryColor,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: primaryColor.withValues(alpha: 0.8),
            fontSize: 11,
          ),
        ),
      ],
    );
  }


  // Widget pour une carte de région
  Widget _buildRegionCard(Map<String, dynamic> region, int index) {
    final regionId = getSafeValue(region, 'regionId', 0);
    final regionName = getSafeValue(region, 'regionName', '');
    final regionCode = getSafeValue(region, 'regionCode', '');
    final isEliminated = getSafeValue(region, 'isEliminated', false);
    final rank = getSafeValue(region, 'rank', index + 1);
    final stats = getSafeValue(region, 'stats', <String, dynamic>{});
    final unbeatenFighters = getSafeValue(stats, 'unbeatenFighters', 0);
    final totalFighters = getSafeValue(stats, 'totalFighters', 0);
    final championFighters = getSafeValue(stats, 'championFighters', 0);
    final winRate = getSafeValue(stats, 'winRate', 0.0);
    final totalWins = getSafeValue(stats, 'totalWins', 0);
    final totalLosses = getSafeValue(stats, 'totalLosses', 0);

    final cardColor = getRegionColorByStats(rank, _regions.length);

    return GestureDetector(
      onTap: () => showRegionDetailsBottomSheet(region, _editionFighters, context),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isEliminated ? Colors.grey : cardColor,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            // En-tête de la région
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: greyColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(14),
                ),
              ),
              child: Row(
                children: [
                  // Rang
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: cardColor,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '#$rank',
                        style: TextStyle(
                          color: whiteColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Nom et code
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          regionName,
                          style: TextStyle(
                            color: isEliminated ? Colors.grey : whiteColor,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        Text(
                          regionCode,
                          style: TextStyle(
                            color: isEliminated ? Colors.grey : whiteColor,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Points
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: whiteColor.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: borderColor),
                    ),
                    child: Text(
                      '$totalWins victoires',
                      style: TextStyle(
                        color: whiteColor,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Corps de la carte
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Statistiques principales
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMiniStat(
                        '$unbeatenFighters/$totalFighters',
                        'Invaincus',
                        Icons.shield,
                        Colors.green,
                      ),
                      _buildMiniStat(
                        '$championFighters',
                        'Champions',
                        Icons.emoji_events,
                        Colors.yellow,
                      ),
                      _buildMiniStat(
                        '$winRate%',
                        'Victoires',
                        Icons.trending_up,
                        Colors.blue,
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Barre de progression des victoires
                  if (totalWins + totalLosses > 0) ...[
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Performance',
                          style: TextStyle(
                            color: blackColor,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Stack(
                          children: [
                            Container(
                              height: 8,
                              decoration: BoxDecoration(
                                color: Colors.grey.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            Container(
                              height: 8,
                              width:
                                  (totalWins + totalLosses) > 0
                                      ? (totalWins /
                                              (totalWins + totalLosses)) *
                                          (MediaQuery.of(context).size.width -
                                                  64)
                                              .clamp(0.0, double.infinity)
                                      : 0,

                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Colors.green, Colors.greenAccent],
                                ),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '$totalWins V',
                              style: const TextStyle(
                                color: Colors.green,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '$totalLosses D',
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],

                  // Indicateur d'élimination
                  if (isEliminated) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.cancel, color: Colors.grey, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'ÉLIMINÉE',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(
    String value,
    String label,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 4),
            Text(
              value,
              style: TextStyle(
                color: textColor,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        Text(label, style: TextStyle(color: textColor, fontSize: 10)),
      ],
    );
  }

  // Widget pour la liste des lutteurs invaincus
  Widget _buildUnbeatenFightersList() {
    if (_editionFighters.isEmpty) {
      return _buildEmptyState('Aucun lutteur');
    }

    // 🔎 Filtrage
    final filteredFighters =
        _selectedLossFilter == null
            ? _editionFighters
            : _editionFighters.where((fighter) {
              final losses = fighter['losses'] ?? 0;
              return losses == _selectedLossFilter;
            }).toList();

    String title;

    if (_selectedLossFilter == null) {
      title = "Tous les lutteurs (${_editionFighters.length})";
    } else if (_selectedLossFilter == 0) {
      title = "Lutteurs jamais terrassés (${filteredFighters.length})";
    } else {
      title =
          "Lutteurs terrassés $_selectedLossFilter fois (${filteredFighters.length}/${_editionFighters.length})";
    }
    return Column(
      children: [
        const SizedBox(height: 12),

        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: Text(
            title,
            key: ValueKey(title),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 12),

        SizedBox(
          height: 45,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: 9,
            itemBuilder: (context, index) {
              final isAll = index == 0;
              final lossValue = isAll ? null : index - 1;

              final isSelected = _selectedLossFilter == lossValue;

              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedLossFilter = lossValue;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.redAccent : Colors.grey[200],
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                        color:
                            isSelected
                                ? Colors.redAccent
                                : Colors.grey.shade400,
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        isAll ? "Tous" : "x$lossValue",
                        style: TextStyle(
                          color:
                              isSelected ? Colors.white : Colors.grey.shade800,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 16),

        if (filteredFighters.isEmpty)
          _buildEmptyState('Aucun lutteur avec x$_selectedLossFilter défaites')
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: filteredFighters.length,
            itemBuilder: (context, index) {
              final fighter = filteredFighters[index];
              return _buildUnbeatenFighterCard(fighter, index + 1);
            },
          ),
      ],
    );
  }

  Widget _buildUnbeatenFighterCard(Map<String, dynamic> fighter, int position) {
    final fighterId = getSafeValue(fighter, 'fighterId', 0);

    final firstName = getSafeValue(fighter, 'firstName', '');
    final lastName = getSafeValue(fighter, 'lastName', '');
    final regionName = getSafeValue(fighter, 'regionName', '');
    final isChampion = getSafeValue(fighter, 'is_champion', false);
    final terraces = getSafeValue(fighter, 'losses', 0);
    final totalMatches = getSafeValue(fighter, 'total_matches', 0);
    final wins = getSafeValue(fighter, 'wins', 0);
    final winRate = getSafeValue(fighter, 'win_rate', 0.0);
    final yellowCards = getSafeValue(fighter, 'yellow_cards', 0);
    final redCards = getSafeValue(fighter, 'red_cards', 0);

    // Déterminer la couleur basée sur le nombre de terraces (x0 à x7)
    Color getTerracesColor(int terraces) {
      switch (terraces) {
        case 7:
          return hexToColor('#B71C1C'); // Rouge foncé
        case 6:
          return hexToColor('#C62828'); // Rouge
        case 5:
          return hexToColor('#D84315'); // Rouge-orange
        case 4:
          return hexToColor('#EF6C00'); // Orange
        case 3:
          return hexToColor('#F9A825'); // Jaune foncé
        case 2:
          return hexToColor('#9E9D24'); // Olive
        case 1:
          return hexToColor('#558B2F'); // Vert
        case 0:
          return hexToColor('#2E7D32'); // Vert foncé
        default:
          return hexToColor('#616161'); // Gris
      }
    }

    final terracesColor = getTerracesColor(terraces);

    return GestureDetector(
      onTap: () => _navigateToFighterPage(fighterId, "$firstName $lastName"),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(8),
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

        child: Row(
          children: [
            // Position et indicateur de terraces
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: terracesColor,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'x$terraces',
                      style: TextStyle(
                        color: whiteColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '#$position',
                      style: TextStyle(color: whiteColor, fontSize: 10),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(width: 16),

            // Informations du lutteur
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '$firstName $lastName',
                          style: TextStyle(
                            color: blackColor,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                      if (isChampion)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.yellow.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.yellow),
                          ),
                          child: const Text(
                            'CHAMPION',
                            style: TextStyle(
                              color: Colors.yellow,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),

                  // Text(
                  //   '$firstName $lastName',
                  //   style: TextStyle(color: blackColor, fontSize: 12),
                  // ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: blackColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          regionName,
                          style: TextStyle(
                            color: blackColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Statistiques
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildFighterStat(
                        '$totalMatches',
                        'Matchs',
                        Icons.sports_kabaddi_sharp,
                      ),
                      _buildFighterStat(
                        '$wins',
                        'Victoires',
                        Icons.emoji_events,
                      ),
                      _buildFighterStat(
                        '$winRate%',
                        'Victoires',
                        Icons.trending_up,
                      ),
                      _buildCardStats(yellowCards, redCards),
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

  Widget _buildFighterStat(String value, String label, IconData icon) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.orange, size: 12),
            const SizedBox(width: 2),
            Text(
              value,
              style: TextStyle(
                color: greyColor,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        Text(label, style: TextStyle(color: whiteColor, fontSize: 8)),
      ],
    );
  }

  Widget _buildCardStats(int yellow, int red) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: Colors.yellow,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$yellow',
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 6,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 2),
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$red',
                  style: TextStyle(
                    color: whiteColor,
                    fontSize: 6,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
        Text('Cartons', style: TextStyle(color: whiteColor, fontSize: 8)),
      ],
    );
  }

  // Barre d'outils avec options de tri
  Widget _buildToolbar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        // color: Colors.black.withValues(alpha:0.5),
        border: Border(
          bottom: BorderSide(color: whiteColor.withValues(alpha: 0.1)),
        ),
      ),
      child: Row(
        children: [
          // Bouton pour basculer entre régions et lutteurs invaincus
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _showUnbeatenFighters = !_showUnbeatenFighters;
                });
              },
              icon: Icon(
                _showUnbeatenFighters ? Icons.flag : Icons.people,
                size: 16,
              ),
              label: Text(
                _showUnbeatenFighters ? 'Voir Régions' : 'Voir Lutteurs',
                style: const TextStyle(fontSize: 12),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: whiteColor,
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Sélecteur de tri
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: whiteColor.withValues(alpha: 0.2)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _sortBy,
                  icon: Icon(Icons.arrow_drop_down, color: whiteColor),
                  iconSize: 24,
                  elevation: 16,
                  style: TextStyle(color: whiteColor, fontSize: 14),
                  dropdownColor: const Color(0xFF1B5E20),
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      setState(() {
                        _sortBy = newValue;
                        _sortRegions();
                      });
                    }
                  },
                  items: const [
                    DropdownMenuItem(
                      value: 'unbeaten',
                      child: Row(
                        children: [
                          Icon(Icons.shield, size: 16),
                          SizedBox(width: 8),
                          Text('Par Invaincus'),
                        ],
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'victoires',
                      child: Row(
                        children: [
                          Icon(Icons.star, size: 16),
                          SizedBox(width: 8),
                          Text('Par victoires'),
                        ],
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'name',
                      child: Row(
                        children: [
                          Icon(Icons.sort_by_alpha, size: 16),
                          SizedBox(width: 8),
                          Text('Par Nom'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
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
            style: TextStyle(color: whiteColor),
          ),
        ],
      ),
    );
  }

  // Widget d'erreur
  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 64),
          const SizedBox(height: 16),
          const Text(
            'Erreur de chargement',
            style: TextStyle(
              color: Colors.red,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              _errorMessage,
              textAlign: TextAlign.center,
              style: TextStyle(color: whiteColor),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadEditionData,
            icon: const Icon(Icons.refresh),
            label: const Text('Réessayer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: whiteColor,
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
          Icon(Icons.info_outline, color: blackColor, size: 64),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(color: blackColor, fontSize: 16),
            textAlign: TextAlign.center,
          ),
        ],
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

  void _navigateToFighterPage(int fighterId, String fighterName) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder:
            (context) =>
                FighterPage(fighterId: fighterId, fighterName: fighterName),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: whiteBackground,

      body:
          _isLoading
              ? _buildLoadingState()
              : _hasError
              ? _buildErrorState()
              : SingleChildScrollView(
                child: Column(
                  children: [
                    // En-tête de l'édition
                    _buildEditionHeader(),

                    // Barre d'outils
                    _buildToolbar(),

                    // Contenu principal
                    _showUnbeatenFighters
                        ? _buildUnbeatenFightersList()
                        : _regions.isEmpty
                        ? _buildEmptyState(
                          'Aucune région participant à cette édition',
                        )
                        : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _regions.length,
                          itemBuilder: (context, index) {
                            final region = _regions[index];
                            return _buildRegionCard(region, index);
                          },
                        ),
                  ],
                ),
              ),
    );
  }
}


