-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 13 mai 2026 à 23:28
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `test`
--

-- --------------------------------------------------------

--
-- Structure de la table `team_achievements`
--

CREATE TABLE `team_achievements` (
  `id` int(11) NOT NULL,
  `team_member_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `achievement_date` date DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `team_achievements`
--

INSERT INTO `team_achievements` (`id`, `team_member_id`, `title`, `description`, `achievement_date`, `category`, `icon`, `color`, `created_at`) VALUES
(1, 1, 'Lauréat prix de l\'innovation UDH 2023', 'Première place au concours d\'innovation technologique', '2022-11-15', 'award', NULL, '#FFD700', '2026-03-09 11:02:30'),
(2, 1, 'Lauréat CONCIT IUT', 'Première place au concours de créativité et de l\'innovation technologique', '2023-03-20', 'certification', NULL, '#FF9900', '2026-03-09 11:02:30');

-- --------------------------------------------------------

--
-- Structure de la table `team_members`
--

CREATE TABLE `team_members` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` varchar(100) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `position_order` int(11) DEFAULT 0,
  `is_lead` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `profile_image` varchar(255) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `quote` text DEFAULT NULL,
  `expertise` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`expertise`)),
  `languages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`languages`)),
  `social_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT json_object() CHECK (json_valid(`social_links`)),
  `projects_count` int(11) DEFAULT 0,
  `years_experience` int(11) DEFAULT 0,
  `contributions_count` int(11) DEFAULT 0,
  `badges` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`badges`)),
  `availability` varchar(50) DEFAULT 'full-time',
  `joined_date` date NOT NULL DEFAULT curdate(),
  `last_active` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `team_members`
--

INSERT INTO `team_members` (`id`, `first_name`, `last_name`, `nickname`, `email`, `phone`, `role`, `department`, `specialization`, `position_order`, `is_lead`, `is_active`, `profile_image`, `cover_image`, `bio`, `quote`, `expertise`, `languages`, `social_links`, `projects_count`, `years_experience`, `contributions_count`, `badges`, `availability`, `joined_date`, `last_active`, `created_at`, `updated_at`) VALUES
(1, 'HAROUNA IDRISSA', 'Salihou', NULL, 'salifoudev@gmail.com', '96722530', 'Développeur mobile', 'Développement', 'Full Stack & Architecture', 1, 0, 1, 'https://res.cloudinary.com/dwgbrbcf7/image/upload/WhatsApp_Image_2026-01-18_at_16.25.38-modified_wqvt1l.png', NULL, 'Passionné par les architectures propres et les solutions innovantes. Je crois en la puissance du code pour transformer des idées en réalité.', 'Le code est comme l\'art, il n\'y a pas de bonne ou de mauvaise façon de le faire, mais il y a des façons plus élégantes.', '[\"Flutter\",\"Java\",\"PHP\"]', '[\"Français\",\"Anglais\",\"Arabe\"]', '{\"github\":\"https://github.com/amadou\",\"linkedin\":\"https://linkedin.com/in/amadou\",\"twitter\":\"https://twitter.com/amadou\",\"website\":\"https://amadou.dev\"}', 15, 10, 234, '[{\"name\":\"Architecte Solution\",\"icon\":\"🏗️\",\"color\":\"#FF6B6B\"},{\"name\":\"Mentor\",\"icon\":\"👨‍🏫\",\"color\":\"#4ECDC4\"}]', 'full-time', '2018-01-15', NULL, '2026-03-09 11:02:30', '2026-03-09 17:23:48'),
(2, 'Fatoumata', 'Koné', 'La Magicienne', 'fatoumata.kone@kokowa.tv', NULL, 'Développeuse Mobile Senior', 'Développement', 'Flutter & iOS', 2, 0, 1, 'https://randomuser.me/api/portraits/women/1.jpg', NULL, 'Spécialiste en applications mobiles avec une passion pour les interfaces fluides et les animations. Je transforme les designs en expériences utilisateur mémorables.', NULL, '[\"Flutter\",\"Swift\",\"Kotlin\",\"Firebase\",\"UI/UX\"]', '[\"Français\",\"Anglais\",\"Bambara\"]', '{\"github\":\"https://github.com/fatoumata\",\"linkedin\":\"https://linkedin.com/in/fatoumata\",\"twitter\":\"https://twitter.com/fatoumata\"}', 12, 7, 156, '[{\"name\":\"Flutter Expert\",\"icon\":\"📱\",\"color\":\"#54B689\"},{\"name\":\"Animation Master\",\"icon\":\"✨\",\"color\":\"#FFA07A\"}]', 'full-time', '2019-03-10', NULL, '2026-03-09 11:02:30', '2026-03-09 17:23:56'),
(3, 'Ibrahim', 'Traoré', 'Le Créatif', 'ibrahim.traore@kokowa.tv', NULL, 'Lead Designer UI/UX', 'Design', 'UI/UX & Design System', 3, 1, 1, 'https://randomuser.me/api/portraits/men/2.jpg', NULL, 'Designer avec 8 ans d\'expérience dans la création d\'interfaces intuitives. Je crois que le bon design est invisible et améliore la vie des utilisateurs.', NULL, '[\"Figma\",\"Adobe XD\",\"Sketch\",\"Principle\",\"After Effects\"]', '[\"Français\",\"Anglais\"]', '{\"github\":\"https://github.com/ibrahim\",\"linkedin\":\"https://linkedin.com/in/ibrahim\",\"behance\":\"https://behance.net/ibrahim\"}', 8, 8, 89, '[{\"name\":\"Design System Expert\",\"icon\":\"🎨\",\"color\":\"#9B59B6\"},{\"name\":\"UX Award 2023\",\"icon\":\"🏆\",\"color\":\"#F1C40F\"}]', 'full-time', '2018-06-01', NULL, '2026-03-09 11:02:30', '2026-03-09 17:24:00');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `team_achievements`
--
ALTER TABLE `team_achievements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `team_member_id` (`team_member_id`);

--
-- Index pour la table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_team_members_role` (`role`),
  ADD KEY `idx_team_members_department` (`department`),
  ADD KEY `idx_team_members_is_active` (`is_active`),
  ADD KEY `idx_team_members_is_lead` (`is_lead`),
  ADD KEY `idx_team_members_position` (`position_order`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `team_achievements`
--
ALTER TABLE `team_achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `team_achievements`
--
ALTER TABLE `team_achievements`
  ADD CONSTRAINT `team_achievements_ibfk_1` FOREIGN KEY (`team_member_id`) REFERENCES `team_members` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
