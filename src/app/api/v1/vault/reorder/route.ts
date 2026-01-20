
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { VaultRepositoryImpl } from '@/repositories/VaultRepositoryImpl';

const vaultRepo = new VaultRepositoryImpl();

// Schema for Reorder Request
const reorderSchema = z.object({
    items: z.array(z.object({
        id: z.string().uuid(),
        order: z.number().int().min(0)
    })).min(1).max(500) // Limit to prevent overload
});

export async function PATCH(req: NextRequest) {
    try {
        const owner_hash_header = req.headers.get('x-owner-hash');
        if (!owner_hash_header || owner_hash_header.length < 32) {
            return NextResponse.json({ error: 'Unauthorized', details: 'Missing Owner Hash' }, { status: 401 });
        }
        const ownerHash = owner_hash_header;

        // 2. Parse Body
        const body = await req.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid Input', details: validation.error }, { status: 400 });
        }

        const { items } = validation.data;

        const t0 = performance.now();
        // Secure Reorder with Owner Check
        await vaultRepo.reorder(items, ownerHash);
        const t1 = performance.now();

        console.log(`[Reorder] Processed ${items.length} items for owner ${ownerHash.substring(0, 8)}... in ${Math.round(t1 - t0)}ms`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Reorder API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
