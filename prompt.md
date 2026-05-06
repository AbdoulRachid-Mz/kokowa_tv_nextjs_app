Tu es un expert senior en architecture backend, optimisation PostgreSQL et performance frontend (React / Next.js / TanStack Query).

Contexte :
Je développe une application complexe de gestion de compétitions sportives avec une base PostgreSQL fortement relationnelle (competitions → editions → phases → groups → subgroups → matches).

Problème actuel :
Les requêtes sont trop lourdes car elles récupèrent toutes les relations imbriquées avec JSON_AGG, ce qui cause :

* des lenteurs SQL importantes
* un overfetching massif
* une mauvaise scalabilité
* une mauvaise UX sur mobile

Objectif :
analyser d'abord toutes les actions backend et frontend et identifier les problemes et les points a corriger.
ensuite et surtout et avant tout les besoins des pages admins
Refactoriser complètement les actions backend pour adopter une architecture performante, scalable et optimisée.
corection des requetes dans les pages admin et publiques.

Contraintes importantes :

1. Séparation des responsabilités :

* Créer des endpoints distincts pour chaque niveau :
  editions, phases, groups, subgroups, matches
* Interdire les requêtes monolithiques avec toutes les relations imbriquées

2. Stratégie de récupération :

* Implémenter un système de "card queries" ultra légères avec uniquement les champs essentiels
* Charger les relations uniquement à la demande (lazy loading)

3. Optimisation SQL :

* Remplacer tous les IN (SELECT ...) par des JOIN
* Limiter fortement l'utilisation de JSON_AGG
* Utiliser des index composites adaptés aux filtres fréquents
* Optimiser les COUNT avec FILTER

4. Frontend :

* Utiliser TanStack (dans les hooks des entites) Query pour le caching et la gestion des requêtes
* Découper les appels API par entité
* Charger dynamiquement les données selon l'interaction utilisateur

5. UI Components :

* Créer un système de cards réutilisables avec :

  * isClickable
  * defaultAction (onView par défaut)
  * dropdown pour actions secondaires (edit, delete)

6. Performance :

* Minimiser le payload réseau
* Éviter toute surcharge inutile
* Optimiser pour mobile en priorité

Livrables attendus :

* Nouvelle structure des endpoints
* Exemples de requêtes SQL optimisées
* Organisation des hooks TanStack Query
* Stratégie de découpage UI ↔ API
* Bonnes pratiques pour éviter les requêtes lourdes

Important :
Chaque décision doit être justifiée par un gain de performance ou de scalabilité.

Après chaque etape on fait un "npx tsc --noEmit" pour verifier les erreur


