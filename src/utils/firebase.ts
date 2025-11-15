import * as admin from 'firebase-admin';
import configs from '../configs';

/**
 * Firebase Admin SDK initialization and notification service
 */
export class FirebaseService {
  private static app: admin.app.App | null = null;

  /**
   * Initialize Firebase Admin SDK
   */
  static initialize(): void {
    if (this.app) {
      console.log('🔥 Firebase already initialized');
      return;
    }

    try {
      let serviceAccount;
      
      // Try to parse service account key from environment
      if (configs.firebase.serviceAccountKey) {
        try {
          serviceAccount = JSON.parse(configs.firebase.serviceAccountKey);
        } catch (parseError) {
          console.error('❌ Failed to parse Firebase service account key:', parseError);
          throw new Error('Invalid Firebase service account key format');
        }
      } else {
        console.error('❌ Firebase service account key not found in environment variables');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required');
      }

      // Initialize Firebase Admin SDK
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: configs.firebase.projectId,
      });

      console.log('🔥 Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a single device
   */
  static async sendNotificationToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.app) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }

    try {
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            icon: 'launcher_icon',
            color: '#1E7177', // Your app's primary color
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: title,
                body: body,
              },
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-expiration': '0',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  static async sendNotificationToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
    if (!this.app) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    try {
      const message = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            icon: 'launcher_icon',
            color: '#1E7177', // Your app's primary color
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: title,
                body: body,
              },
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-expiration': '0',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`✅ Batch notification sent: ${response.successCount} successful, ${response.failureCount} failed`);
      
      // Extract failed tokens
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && tokens[idx]) {
          failedTokens.push(tokens[idx]);
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      console.error('❌ Failed to send batch notification:', error);
      return { successCount: 0, failureCount: tokens.length, failedTokens: tokens };
    }
  }

  /**
   * Send notification to all users (topic-based)
   */
  static async sendNotificationToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.app) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }

    try {
      const message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            icon: 'launcher_icon',
            color: '#1E7177', // Your app's primary color
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: title,
                body: body,
              },
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-expiration': '0',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Topic notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send topic notification:', error);
      return false;
    }
  }

  /**
   * Validate FCM token
   */
  static async validateToken(token: string): Promise<boolean> {
    if (!this.app) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }

    try {
      // Basic token format validation
      if (!token || typeof token !== 'string' || token.length < 10) {
        console.log(`❌ Invalid FCM token format: ${token}`);
        return false;
      }

      // For iOS, we'll do a lighter validation since APNs might not be configured
      // Try to send a minimal test message
      await admin.messaging().send({
        token,
        data: { test: 'validation' },
        apns: {
          payload: {
            aps: {
              'content-available': 1, // Silent notification
            },
          },
        },
        android: {
          data: { test: 'validation' },
        },
      });
      return true;
    } catch (error: any) {
      console.log(`❌ FCM token validation failed: ${error.message}`);
      
      // For iOS, if it's an APNs error, we'll still accept the token
      // as the issue might be APNs configuration, not the token itself
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return false;
      }
      
      // For other errors (like APNs configuration), we'll accept the token
      // and let the actual notification sending handle the error
      console.log(`⚠️ Accepting token despite validation error (likely APNs config issue): ${token}`);
      return true;
    }
  }
}

export default FirebaseService;
