import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, SendResponse } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

const DEAD_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

// FCM's HTTP v1 multicast send accepts at most 500 tokens per call.
const MULTICAST_CHUNK_SIZE = 500;

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private app: App | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const existing = getApps();
    if (existing.length) {
      this.app = existing[0];
      return;
    }

    try {
      // 1. Try explicit service account path or default local file
      const candidatePaths = [
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.resolve(__dirname, '../../firebase-service-account.json'),
      ].filter(Boolean) as string[];

      for (const filePath of candidatePaths) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          this.app = initializeApp({ credential: cert(parsed) });
          this.logger.log(`Initialized Firebase Admin from service account file: ${filePath}`);
          return;
        }
      }

      // 2. Try raw JSON string in environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        this.app = initializeApp({ credential: cert(parsed) });
        this.logger.log('Initialized Firebase Admin from FIREBASE_SERVICE_ACCOUNT_KEY');
        return;
      }

      // 3. Try individual env variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        this.app = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
        this.logger.log('Initialized Firebase Admin from environment variables');
        return;
      }
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin', err as Error);
    }

    this.logger.warn(
      'Firebase credentials not configured - push notifications disabled',
    );
  }

  // Fans out to every device registered for this user. Never throws -
  // callers (notably NotificationsService.createNotification) must never
  // fail because a push send failed.
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.app) return;
    try {
      const tokens = await this.prisma.pushToken.findMany({
        where: { userId },
        select: { token: true },
      });
      if (tokens.length === 0) return;
      await this.sendToTokens(
        tokens.map((t) => t.token),
        payload,
      );
    } catch (err) {
      this.logger.error('Failed to send push to user', err as Error);
    }
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<void> {
    if (!this.app || tokens.length === 0) return;
    const messaging = getMessaging(this.app);

    for (let i = 0; i < tokens.length; i += MULTICAST_CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + MULTICAST_CHUNK_SIZE);
      try {
        const result = await messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title: payload.title, body: payload.body },
          data: payload.data,
          android: {
            priority: 'high',
            notification: {
              channelId: 'default',
              sound: 'default',
            },
          },
        });
        await this.cleanupDeadTokens(chunk, result.responses);
      } catch (err) {
        this.logger.error('FCM multicast send failed', err as Error);
      }
    }
  }

  private async cleanupDeadTokens(tokens: string[], responses: SendResponse[]) {
    const dead: string[] = [];
    responses.forEach((response, index) => {
      if (!response.success && response.error?.code) {
        if (DEAD_TOKEN_ERROR_CODES.has(response.error.code)) {
          dead.push(tokens[index]);
        }
      }
    });
    if (dead.length === 0) return;

    await this.prisma.pushToken
      .deleteMany({ where: { token: { in: dead } } })
      .catch((err) =>
        this.logger.error('Failed to clean up dead push tokens', err),
      );
  }
}
