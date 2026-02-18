import admin from './firebase-admin';

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
    });

    console.log('Push envoyée');
  } catch (error) {
    console.error('Erreur push:', error);
  }
}

export async function sendPushToTopic(
  topic: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    await admin.messaging().send({
      topic,
      notification: {
        title,
        body,
      },
      data,
    });

    console.log(`Push envoyée au topic ${topic}`);
  } catch (error) {
    console.error('Erreur push:', error);
  }
}

