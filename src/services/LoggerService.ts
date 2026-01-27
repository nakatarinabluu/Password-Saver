import mongoose, { Schema, Model } from 'mongoose';
import dbConnect from '@/lib/mongo';

// --- SCHEMA DEFINITION ---
export interface ILogEntry {
    level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
    message: string;
    metadata?: any;
    timestamp: Date;
    environment: string;
    traceId?: string; // Pillar 9: Distributed Tracing
}

const LogSchema = new Schema<ILogEntry>({
    level: { type: String, required: true, index: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }, // Flexible JSON payload
    timestamp: { type: Date, default: Date.now, index: true },
    environment: { type: String, default: process.env.NODE_ENV || 'development' },
    traceId: { type: String, index: true } // Pillar 9
});

// Helper to get Model safely (Next.js hot reload safe)
// FOOTNOTE [Pillar 8: Zero-Downtime Deployment support]
// Handling hot-reload models allows dev velocity (Pillar 12) and smoother updates.
const getLogModel = (): Model<ILogEntry> => {
    return mongoose.models.SystemLog || mongoose.model<ILogEntry>('SystemLog', LogSchema, 'audit_logs');
};

// --- SERVICE ---
export class LoggerService {

    /**
     * Async Log - Fire and Forget (mostly) logic to avoid blocking Main Thread
     */
    public static async write(level: ILogEntry['level'], message: string, metadata?: any, traceId?: string) {
        try {
            await dbConnect();
            const LogModel = getLogModel();

            // Sanitize Metadata (Remove PII/Secrets)
            const sanitizedMeta = this.sanitize(metadata);

            await LogModel.create({
                level,
                message,
                metadata: sanitizedMeta,
                traceId, // Pillar 9
                timestamp: new Date()
            });
        } catch (e) {
            // Fallback to console if DB fails (never crash app for logging)
            // FOOTNOTE [Pillar 5: Resilience]
            // Logging failure should never crash the main application.
            console.error('[LOGGER FAILURE]', e);
        }
    }

    static async info(message: string, metadata?: any, traceId?: string) {
        await this.write('INFO', message, metadata, traceId);
    }

    static async warn(message: string, metadata?: any, traceId?: string) {
        await this.write('WARN', message, metadata, traceId);
    }

    static async error(message: string, error?: any, traceId?: string) {
        const meta = error instanceof Error ? { stack: error.stack, name: error.name, msg: error.message } : error;
        await this.write('ERROR', message, meta, traceId);
    }

    static async security(event: string, meta: any, traceId?: string) {
        await this.write('SECURITY', event, meta, traceId);
    }

    // --- UTILS ---
    private static sanitize(obj: any): any {
        if (!obj) return obj;
        if (typeof obj !== 'object') return obj;

        // Pillar 8 Fix: Avoid JSON.parse(JSON.stringify) to prevent Heap Explosion / Circular Deps
        // We perform a Shallow Masking or limited depth traversal.

        try {
            // Using a simple non-recursive approach for metadata to avoid stack overflow
            // If it's an array, map it.
            if (Array.isArray(obj)) {
                return obj.map(item => this.sanitize(item)).slice(0, 10); // Limit array size
            }

            const copy: any = {};
            const secrets = ['password', 'secret', 'token', 'key', 'auth', 'encrypted_blob', 'mnemonic'];

            for (const k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    const val = obj[k];
                    const keyLower = k.toLowerCase();

                    if (secrets.some(s => keyLower.includes(s))) {
                        copy[k] = '***REDACTED***';
                    } else if (typeof val === 'object' && val !== null) {
                        // Stop recursion at depth 1 for safety, or just stringify if small
                        // Here we just return a marker to prevent deep cloning
                        copy[k] = '[Object]';
                    } else if (typeof val === 'string' && val.length > 5000) {
                        // Anti-DoS: Truncate massive strings
                        // FOOTNOTE [Pillar 5: Reliability & Anti-Fragility]
                        // Preventing large payloads from choking the logging system.
                        copy[k] = val.substring(0, 5000) + '... (Truncated)';
                    } else {
                        copy[k] = val;
                    }
                }
            }
            return copy;
        } catch (e) {
            return '[Sanitization Failed]';
        }
    }
}
