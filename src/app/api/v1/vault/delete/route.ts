import { NextRequest, NextResponse } from 'next/server';
import { db, redis } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'edge';

const DeleteSchema = z.object({
    id: z.string().uuid()
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = DeleteSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                error: 'Validation Failed',
                details: result.error.flatten()
            }, { status: 400 });
        }

        const { id } = result.data;

        // 1. Delete from Neon (vault_shards_a)
        const deleteFromNeon = db.query('DELETE FROM vault_shards_a WHERE id = $1', [id]);

        // 2. Delete from Upstash Redis (shard_b:{id})
        const deleteFromRedis = redis.del(`shard_b:${id}`);

        // Wait for both to complete
        await Promise.all([deleteFromNeon, deleteFromRedis]);

        return NextResponse.json({ message: 'Deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
