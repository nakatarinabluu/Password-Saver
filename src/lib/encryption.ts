export const runtime = 'edge';

const ALGORITHM = 'AES-GCM';

function hexToBuf(hex: string): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bufToHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function getKey(keyHex: string): Promise<CryptoKey> {
    if (!keyHex || keyHex.length !== 64) throw new Error('Invalid Encryption Key');

    // We import the raw key (32 bytes for AES-256)
    const keyBytes = hexToBuf(keyHex);

    return crypto.subtle.importKey(
        'raw',
        keyBytes as unknown as BufferSource,
        { name: ALGORITHM },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(text: string, keyHex: string): Promise<string> {
    const key = await getKey(keyHex);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv: iv as unknown as BufferSource
        },
        key,
        data
    );

    const ivHex = bufToHex(iv.buffer as ArrayBuffer);
    const encryptedHex = bufToHex(encryptedBuffer);

    return `${ivHex}:${encryptedHex}`;
}

export async function decrypt(encryptedText: string, keyHex: string): Promise<string> {
    const key = await getKey(keyHex);

    const parts = encryptedText.split(':');
    let ivHex, encryptedHex;

    if (parts.length === 3) {
        const [pIv, pTag, pContent] = parts;
        ivHex = pIv;
        encryptedHex = pContent + pTag;
    } else if (parts.length === 2) {
        [ivHex, encryptedHex] = parts;
    } else {
        throw new Error('Invalid encrypted format');
    }

    const iv = hexToBuf(ivHex);
    const encryptedBytes = hexToBuf(encryptedHex);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: iv as unknown as BufferSource
            },
            key,
            encryptedBytes as unknown as BufferSource
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        console.error('Decryption failed:', e);
        throw new Error('Decryption Failed');
    }
}
