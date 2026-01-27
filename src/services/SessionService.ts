import { redis } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class SessionService {
    private static PREFIX = 'session:';
    private static TTL = 3600; // 1 hour

    static async createSession(userId: string): Promise<string> {
        const sessionId = uuidv4();
        const key = `${this.PREFIX}${sessionId}`;

        await redis.set(key, userId, { ex: this.TTL });
        return sessionId;
    }

    static async validateSession(sessionId: string): Promise<{ isValid: boolean; userId?: string }> {
        const key = `${this.PREFIX}${sessionId}`;
        const userId = await redis.get(key) as string | null;

        if (!userId) {
            return { isValid: false };
        }

        // Refresh session
        await redis.expire(key, this.TTL);
        return { isValid: true, userId };
    }

    static async invalidateSession(sessionId: string): Promise<void> {
        const key = `${this.PREFIX}${sessionId}`;
        await redis.del(key);
    }
}
