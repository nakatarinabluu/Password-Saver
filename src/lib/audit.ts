import { LoggerService } from '@/services/LoggerService';

export type AuditAction =
    | 'LOGIN_ATTEMPT'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'WIPE_INITIATED'
    | 'WIPE_COMPLETED'
    | 'VIEW_CRASH_LOGS';

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';

/**
 * Logs a security event to MongoDB (Immutable Audit Trail).
 */
export async function logAuditAction(
    action: AuditAction,
    status: AuditStatus,
    ip: string,
    metadata?: Record<string, any>
) {
    try {
        // Use the centralized LoggerService (MongoDB)
        LoggerService.security(action, {
            status,
            ip,
            ...metadata
        });

        console.log(`📝 AUDIT: [${action}] ${status} - ${ip}`);
    } catch (error) {
        // Fallback: If DB fails, we MUST log to stdout for recovery
        console.error('🚨 CRITICAL: FAILED TO WRITE AUDIT LOG', error);
    }
}
