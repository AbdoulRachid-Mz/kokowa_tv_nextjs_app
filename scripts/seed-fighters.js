// scripts/seed-fighters.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_NW4aH3cJrSUD@ep-round-king-abilpiun-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Données des lutteurs par région
const fightersByRegion = {
  // Région ID 7: Agadez
  7: [
    { firstName: 'Adamou', lastName: 'Abdou', nickname: 'Le Titan du Nord' },
    { firstName: 'Gardaye', lastName: 'Zakari', nickname: 'Le Faucon des Sables' },
    { firstName: 'Hassan', lastName: 'Adamou', nickname: 'Le Rocher d\'Agadez' },
    { firstName: 'Issia', lastName: 'Harouna', nickname: 'L\'Éclair du Désert' },
    { firstName: 'Mamouda', lastName: 'Na Salla', nickname: 'Le Guerrier Nomade' },
    { firstName: 'Moussa', lastName: 'Ibrahim', nickname: 'Le Lion du Sahara' },
    { firstName: 'Moutari', lastName: 'Abdourahamane', nickname: 'Le Sabre du Nord' },
    { firstName: 'Nassirou', lastName: 'Lawali', nickname: 'Le Berbère Intrépide' },
    { firstName: 'Rabe', lastName: 'Kabori', nickname: 'Le Géant des Dunes' },
    { firstName: 'Zoulki', lastName: 'Alassane', nickname: 'Le Phénix du Sahel' },
  ],

  // Région ID 8: Diffa
  8: [
    { firstName: 'Anas', lastName: 'Adamou', nickname: 'Le Crocodile du Lac' },
    { firstName: 'Chapiou', lastName: 'Lawan', nickname: 'L\'Héritier du Fleuve' },
    { firstName: 'Kamilou', lastName: 'Lawan', nickname: 'Le Guépard de Diffa' },
    { firstName: 'Lawali', lastName: 'Oumarou', nickname: 'Le Stratège du Sud' },
    { firstName: 'Loutari', lastName: 'Miko', nickname: 'Le Buffalo du Lac Tchad' },
    { firstName: 'Mansour', lastName: 'Issa', nickname: 'L\'Aigle du Sud-Est' },
    { firstName: 'Nouhou', lastName: 'Ousman', nickname: 'Le Pêcheur Vaillant' },
    { firstName: 'Sani', lastName: 'Awal Malam', nickname: 'Le Sage de Diffa' },
    { firstName: 'Sanoussi', lastName: 'Abdoulaye', nickname: 'Le Gardien des Frontières' },
    { firstName: 'Saradji', lastName: 'Bodo', nickname: 'Le Guerrier du Fleuve' },
    { firstName: 'Issoufou', lastName: 'Moutari', nickname: 'Le Défenseur du Lac' },
    { firstName: 'Ousseini', lastName: 'Atto', nickname: 'Le Fils du Lac' },
  ],

  // Région ID 2: Dosso
  2: [
    { firstName: 'Issiakou', lastName: 'Moussa', nickname: 'Le Prince de Dosso' },
    { firstName: 'Kadri', lastName: 'Abdou', nickname: 'Le Guerrier Royale' },
    { firstName: 'Abana', lastName: 'Issoufou', nickname: 'L\'Étoile Montante' },
    { firstName: 'Alissa', lastName: 'Adamou', nickname: 'Le Jeune Lion' },
    { firstName: 'Ali', lastName: 'Seyni', nickname: 'L\'Héritier des Rois' },
    { firstName: 'Habibou', lastName: 'Moussa', nickname: 'Le Faucon de Dosso' },
    { firstName: 'Issa', lastName: 'Moussa', nickname: 'Le Guerrier Traditionnel' },
    { firstName: 'Ridouane', lastName: 'Seyni', nickname: 'Le Successeur' },
    { firstName: 'Siradji', lastName: 'Tahirou', nickname: 'Le Sabre de Dosso' },
    { firstName: 'Sofiane', lastName: 'Aboubacar', nickname: 'La Nouvelle Génération' },
  ],

  // Région ID 5: Maradi
  5: [
    { firstName: 'Aybo', lastName: 'Hassan', nickname: 'Le Lion de Maradi' },
    { firstName: 'Chaibou', lastName: 'Argi', nickname: 'Le Guerrier Rouge' },
    { firstName: 'Lawali', lastName: 'Abdou', nickname: 'Le Stratège du Centre' },
    { firstName: 'Matti', lastName: 'Souley', nickname: 'Le Rocher de Maradi' },
    { firstName: 'Tassiou', lastName: 'Souley', nickname: 'L\'Éclair du Centre' },
    { firstName: 'Akilou', lastName: 'Boule', nickname: 'Le Colosse' },
    { firstName: 'Badamasi', lastName: 'Oumarou', nickname: 'Le Vétéran Sage' },
    { firstName: 'Lawali', lastName: 'Moussa', nickname: 'Le Technicien' },
    { firstName: 'Ousseini', lastName: 'Maharazou', nickname: 'Le Champion du Peuple' },
    { firstName: 'Sani', lastName: 'Abbou', nickname: 'Le Dur à Cuire' },
    { firstName: 'Lawali', lastName: 'Ibrahim', nickname: 'Le Jeune Talent' },
  ],

  // Région ID 1: Niamey
  1: [
    { firstName: 'Habibou', lastName: 'Ado Jigo', nickname: 'Le Maître de la Capitale' },
    { firstName: 'Sabbo', lastName: 'Abdoulaye', nickname: 'Le Champion National' },
    { firstName: 'Hafissou', lastName: 'Ayouba', nickname: 'Le Guerrier Moderne' },
    { firstName: 'Abba', lastName: 'Ibrahim', nickname: 'Le Technique de Niamey' },
    { firstName: 'Abdoul Rachid', lastName: 'Aminou', nickname: 'L\'Athlète Complet' },
    { firstName: 'Ali', lastName: 'Yaro', nickname: 'Le Jeune Prodigé' },
    { firstName: 'Amadou', lastName: 'Bouda', nickname: 'Le Combattant Urbain' },
    { firstName: 'Maharazou', lastName: 'Dan Chago', nickname: 'L\'Héritier de la Lutte' },
    { firstName: 'Nazifi', lastName: 'Ibrahim', nickname: 'Le Stratège Urbain' },
    { firstName: 'Zayanou', lastName: 'Sala', nickname: 'Le Nouveau Phénomène' },
  ],

  // Région ID 3: Tahoua
  3: [
    { firstName: 'Abdoul Salam', lastName: 'Samaila', nickname: 'Le Sage de Tahoua' },
    { firstName: 'Aminou', lastName: 'Ibrahim', nickname: 'Le Guerrier Endurant' },
    { firstName: 'Bilyaminou', lastName: 'Adamou', nickname: 'Le Colosse du Nord' },
    { firstName: 'Idrissa Ibrahim', lastName: 'Yaro', nickname: 'Le Lion de l\'Ader' },
    { firstName: 'Noura', lastName: 'Hassan', nickname: 'Le Faucon de l\'Aïr' },
    { firstName: 'Tsahirou Zabeirou', lastName: 'Kalgo', nickname: 'Le Vétéran Honoré' },
    { firstName: 'Zakirou', lastName: 'Zakari', nickname: 'Le Jeune Faucon' },
    { firstName: 'Abdoulaye', lastName: 'Salifou', nickname: 'Le Gardien de la Tradition' },
    { firstName: 'Bello', lastName: 'Illa', nickname: 'Le Combattant Pur' },
    { firstName: 'Hachimou', lastName: 'Chaibou', nickname: 'L\'Esprit Guerrier' },
  ],

  // Région ID 4: Tillabéri
  4: [
    { firstName: 'Abdourahamane', lastName: 'Seydou', nickname: 'Le Fleuve Puissant' },
    { firstName: 'Hafissou', lastName: 'Hassan', nickname: 'Le Guerrier du Niger' },
    { firstName: 'Halirou', lastName: 'Aminou', nickname: 'Le Fils du Fleuve' },
    { firstName: 'Mawane', lastName: 'Maman Bello', nickname: 'Le Rocher de Tillabéri' },
    { firstName: 'Nouhou', lastName: 'Boubacar', nickname: 'Le Traditionnaliste' },
    { firstName: 'Ousman', lastName: 'Hassan', nickname: 'Le Jeune Espoir' },
    { firstName: 'Rakim', lastName: 'Chaibou', nickname: 'Le Combattant Agile' },
    { firstName: 'Saadou', lastName: 'Bagouma', nickname: 'Le Stratège Rural' },
    { firstName: 'Saley', lastName: 'Daouda', nickname: 'Le Gardien de l\'Ouest' },
    { firstName: 'Tsalha', lastName: 'Maman', nickname: 'Le Fils de la Terre' },
    { firstName: 'Yacouba', lastName: 'Garba', nickname: 'L\'Héritier des Ancêtres' },
  ],

  // Région ID 6: Zinder
  6: [
    { firstName: 'Abdourahamane', lastName: 'Rabe', nickname: 'Le Sultan du Sabre' },
    { firstName: 'Hamissou', lastName: 'Nouhou', nickname: 'Le Gardien du Sultanat' },
    { firstName: 'Idi Chaibou', lastName: 'Mani', nickname: 'Le Maître Traditionnel' },
    { firstName: 'Kabirou', lastName: 'Gali', nickname: 'Le Lion de Damagaram' },
    { firstName: 'Mahamandou', lastName: 'Zakariyaou', nickname: 'Le Prince Héritier' },
    { firstName: 'Magagi', lastName: 'Houdou', nickname: 'Le Guerrier Noble' },
    { firstName: 'Mortala', lastName: 'Abdou', nickname: 'Le Défenseur du Trône' },
    { firstName: 'Rabe', lastName: 'Oumarou', nickname: 'Le Sabre de Zinder' },
    { firstName: 'Roufay', lastName: 'Goga', nickname: 'L\'Étoile Montante du Sud' },
    { firstName: 'Sitou', lastName: 'Ibrahim', nickname: 'Le Jeune Sultan' },
    { firstName: 'Issa', lastName: 'Oudou', nickname: 'Le Vétéran Sage' },
  ],
};

// Fonction pour générer des données aléatoires réalistes
function generateFighterData(fighter, regionId) {
  const birthYears = [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999];
  const heights = [1.75, 1.78, 1.80, 1.82, 1.85, 1.88, 1.90];
  const weights = [85.0, 88.0, 90.0, 92.0, 94.0, 96.0, 98.0];
  
  const birthYear = birthYears[Math.floor(Math.random() * birthYears.length)];
  const debutYear = birthYear + 18 + Math.floor(Math.random() * 5);
  const height = heights[Math.floor(Math.random() * heights.length)];
  const weight = weights[Math.floor(Math.random() * weights.length)];
  
  const birthPlaces = {
    1: 'Niamey',
    2: 'Dosso',
    3: 'Tahoua',
    4: 'Tillabéri',
    5: 'Maradi',
    6: 'Zinder',
    7: 'Agadez',
    8: 'Diffa'
  };

  const fightingStyles = [
    'Force brute',
    'Technique',
    'Polyvalent',
    'Défensif',
    'Rapide',
    'Agressif',
    'Équilibré',
    'Puissant',
    'Stratégique',
    'Expérimenté'
  ];

  const bios = [
    `Jeune lutteur prometteur de ${birthPlaces[regionId]}`,
    `Spécialiste des prises techniques`,
    `Connu pour sa résistance et son endurance`,
    `Style agressif et imprévisible`,
    `En progression constante`,
    `Force physique impressionnante`,
    `Nouveau talent prometteur`,
    `Future star du sabre`,
    `Carrière exemplaire`,
    `Performance exceptionnelle`
  ];

  const profileImages = [
    'https://cloudinary.com/kokowa/fighters/profile1.jpg',
    'https://cloudinary.com/kokowa/fighters/profile2.jpg',
    'https://cloudinary.com/kokowa/fighters/profile3.jpg',
    'https://cloudinary.com/kokowa/fighters/profile4.jpg',
    'https://cloudinary.com/kokowa/fighters/profile5.jpg'
  ];

  const coverImages = [
    'https://cloudinary.com/kokowa/fighters/cover1.jpg',
    'https://cloudinary.com/kokowa/fighters/cover2.jpg',
    'https://cloudinary.com/kokowa/fighters/cover3.jpg',
    'https://cloudinary.com/kokowa/fighters/cover4.jpg'
  ];

  return {
    first_name: fighter.firstName,
    last_name: fighter.lastName,
    nickname: fighter.nickname,
    birth_date: `${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    birth_place: birthPlaces[regionId],
    region_id: regionId,
    height: height,
    weight: weight,
    profile_image: profileImages[Math.floor(Math.random() * profileImages.length)],
    cover_image: Math.random() > 0.7 ? coverImages[Math.floor(Math.random() * coverImages.length)] : null,
    bio: bios[Math.floor(Math.random() * bios.length)],
    fighting_style: fightingStyles[Math.floor(Math.random() * fightingStyles.length)],
    debut_year: debutYear,
    ranking: Math.floor(Math.random() * 20),
    is_active: true,
    is_champion: Math.random() > 0.9, // 10% chance d'être champion
    social_links: JSON.stringify({
      facebook: Math.random() > 0.5 ? `${fighter.firstName.toLowerCase()}.${fighter.lastName.toLowerCase()}` : null,
      instagram: Math.random() > 0.5 ? `${fighter.firstName.toLowerCase()}_${fighter.lastName.toLowerCase()}` : null,
      twitter: Math.random() > 0.7 ? `@${fighter.firstName.toLowerCase()}${fighter.lastName.toLowerCase()}` : null
    })
  };
}

// Fonction principale pour insérer les lutteurs
async function seedFighters() {
  const client = await pool.connect();
  
  try {
    console.log('Début de l\'insertion des lutteurs...');
    
    // Commencer une transaction
    await client.query('BEGIN');
    
    let totalInserted = 0;
    
    // Parcourir toutes les régions
    for (const [regionId, fighters] of Object.entries(fightersByRegion)) {
      console.log(`\nInsertion des lutteurs pour la région ID ${regionId}...`);
      
      for (const fighter of fighters) {
        const fighterData = generateFighterData(fighter, parseInt(regionId));
        
        const query = `
          INSERT INTO fighters (
            first_name, last_name, nickname, birth_date, birth_place, 
            region_id, height, weight, profile_image, cover_image, 
            bio, fighting_style, debut_year, ranking, is_active, 
            is_champion, social_links, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
          RETURNING id
        `;
        
        const values = [
          fighterData.first_name,
          fighterData.last_name,
          fighterData.nickname,
          fighterData.birth_date,
          fighterData.birth_place,
          fighterData.region_id,
          fighterData.height,
          fighterData.weight,
          fighterData.profile_image,
          fighterData.cover_image,
          fighterData.bio,
          fighterData.fighting_style,
          fighterData.debut_year,
          fighterData.ranking,
          fighterData.is_active,
          fighterData.is_champion,
          fighterData.social_links
        ];
        
        const result = await client.query(query, values);
        
        console.log(`✓ ${fighter.firstName} ${fighter.lastName} inséré (ID: ${result.rows[0].id})`);
        totalInserted++;
      }
    }
    
    // Valider la transaction
    await client.query('COMMIT');
    
    console.log(`\n✅ ${totalInserted} lutteurs ont été insérés avec succès !`);
    
    // Mettre à jour les compteurs des régions
    console.log('\nMise à jour des compteurs des régions...');
    await client.query(`
      UPDATE regions SET total_fighters = (
        SELECT COUNT(*) FROM fighters 
        WHERE region_id = regions.id AND is_active = true
      );
    `);
    
    await client.query(`
      UPDATE regions SET total_champions = (
        SELECT COUNT(*) FROM fighters 
        WHERE region_id = regions.id AND is_champion = true AND is_active = true
      );
    `);
    
    console.log('✅ Compteurs des régions mis à jour !');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de l\'insertion des lutteurs:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
seedFighters();