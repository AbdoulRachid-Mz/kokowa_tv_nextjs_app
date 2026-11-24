// lib/push/index.ts
import admin from './firebase-admin';

/** Canal de notifications créé par l'application mobile (NotificationService). */
const ANDROID_CHANNEL_ID = 'high_importance_channel';

/**
 * Catégories de notifications que l'utilisateur peut activer/couper dans l'app
 * (Paramètres > Notifications). Chaque catégorie = un sujet FCM du même nom.
 */
export type PushCategory = 'live' | 'results' | 'news' | 'transfers';

/**
 * Sujet « marqueur » auquel s'abonnent les versions de l'app qui gèrent les
 * catégories. Les anciennes versions ne sont abonnées qu'à `global`.
 */
const PREFS_MARKER_TOPIC = 'prefs_v2';

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high' as const,
        notification: {
          channelId: ANDROID_CHANNEL_ID,
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push envoyée:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Erreur push:', error);
    return { success: false, error };
  }
}

export async function sendPushToTopic(
  topic: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    // Nettoyer le topic (pas de caractères spéciaux)
    const cleanTopic = topic.replace(/[^a-zA-Z0-9-_.]/g, '_');
    
    const message = {
      topic: cleanTopic,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: ANDROID_CHANNEL_ID,
          sound: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
          },
        },
        headers: {
          'apns-priority': '10',
        },
      },
    };

    console.log('📤 Envoi push au topic:', cleanTopic, message);
    const response = await admin.messaging().send(message);
    console.log('✅ Push envoyée au topic:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Erreur push topic:', error);
    return { success: false, error };
  }
}

/**
 * Envoie une notification d'une catégorie donnée en respectant les choix de
 * l'utilisateur, sans couper les anciennes versions de l'app :
 *  - app récente (abonnée à `prefs_v2`) : reçue seulement si la catégorie est activée ;
 *  - ancienne app (abonnée seulement à `global`) : reçue comme avant.
 * FCM n'envoie qu'une fois par appareil même si plusieurs sujets correspondent.
 */
export async function sendPushToCategory(
  category: PushCategory,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  const condition =
    `'${category}' in topics || ('global' in topics && !('${PREFS_MARKER_TOPIC}' in topics))`;
  try {
    const response = await admin.messaging().send({
      condition,
      notification: { title, body },
      data: { ...data, category },
      android: {
        priority: 'high',
        notification: { channelId: ANDROID_CHANNEL_ID, sound: 'default' },
      },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    return { success: true, response };
  } catch (error) {
    console.error(`❌ Erreur push catégorie ${category}:`, error);
    return { success: false, error };
  }
}
