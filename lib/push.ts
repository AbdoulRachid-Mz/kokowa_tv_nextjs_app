// lib/push/index.ts
import admin from './firebase-admin';

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
          channelId: 'default',
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
          channelId: 'match_channel',
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