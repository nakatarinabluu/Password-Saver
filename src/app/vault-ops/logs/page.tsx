
import LogsDashboard from './LogsDashboard';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongo';

export const dynamic = 'force-dynamic';

export default async function SecurityCenterPage({ searchParams }: { searchParams: Promise<{ tab?: string, page?: string }> }) {
    await dbConnect(); // Ensure Mongo Connection

    // 1. Resolve Params
    const { tab = 'apps', page = '1' } = await searchParams;
    const currentPage = Math.max(1, parseInt(page, 10));
    const limit = 20; // Items per page
    const skip = (currentPage - 1) * limit;

    // 2. Define Schema/Model
    const LogSchema = new mongoose.Schema({
        level: String,
        message: String,
        metadata: mongoose.Schema.Types.Mixed,
        timestamp: Date
    });
    const LogModel = mongoose.models.SystemLog || mongoose.model('SystemLog', LogSchema, 'audit_logs');

    // 3. Build Filter (Single View - "Strict Critical")
    // User Requirement:
    // - Show: App Crashes (ERROR), System Errors (ERROR), Attacks (Blocked)
    // - Hide: Login Failures (Wrong Password), Success, Info

    // Logic:
    // (Level == ERROR) OR (Message contains "Blocked") OR (Action contains "BLOCKED")
    // 3. Build Filter based on Tab
    let filter: any = {};

    if (tab === 'apps') {
        // CLIENT CRASHES (Explicitly from Mobile/Native)
        filter = {
            level: 'ERROR',
            message: { $regex: '^CRASH:' }
        };
    } else if (tab === 'backend') {
        // SERVER ERRORS (Internal Server Errors)
        filter = {
            level: 'ERROR',
            message: { $not: { $regex: '^CRASH:' } }
        };
    } else if (tab === 'security') {
        // SECURITY INCIDENTS (Blocked Attacks)
        filter = {
            $or: [
                { message: { $regex: 'Blocked' } },
                { 'metadata.action': { $regex: 'BLOCKED' } }
            ]
        };
    } else {
        // Fallback
        filter = {
            level: 'ERROR',
            message: { $regex: '^CRASH:' }
        };
    }

    // 4. Execute Query (Count + Fetch)
    // Parallelize for speed
    const [totalDocs, rawLogs] = await Promise.all([
        LogModel.countDocuments(filter),
        LogModel.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    ]);

    const totalPages = Math.ceil(totalDocs / limit);

    // 5. Transform Data (Only populate the active array)
    // We populate the specific array for the current tab, and pass empty arrays for others.
    // Dashboard just renders the active tab's array anyway.

    // Helper to transform doc to UI shape
    const transform = (l: any) => ({
        id: l._id.toString(),
        timestamp: l.timestamp || l.newTimestamp, // standard
        created_at: l.timestamp, // for audit/login views
        level: l.level, // NEEDED for Critical View

        // Crash Specific
        device: l.metadata?.device || 'Unknown',
        os_version: l.metadata?.os_version || '',
        app_version: l.metadata?.app_version || '', // Mapped Version
        exception: l.message.replace('CRASH: ', ''),
        stacktrace: l.metadata?.stacktrace || null,

        // Audit/Login Specific
        action: l.message,
        status: l.level,
        actor_ip: l.metadata?.ip || l.metadata?.userId || 'Unknown',

        // Shared
        message: l.message,
        metadata: typeof l.metadata === 'string' ? l.metadata : JSON.stringify(l.metadata || {})
    });
    const logs = rawLogs.map(transform);

    return (
        <LogsDashboard
            logs={logs}
            pagination={{
                currentPage,
                totalPages,
                limit
            }}
        />
    );
}
