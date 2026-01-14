import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.APP_API_KEY || 'test-api-key';
const HMAC_SECRET = process.env.HMAC_SECRET || 'test-hmac-secret';
const WIPE_TOKEN = process.env.X_WIPE_TOKEN || 'test-wipe-token';

const USER_AGENT = 'VaultGuard-Android/2.0';
const DEVICE_ID = 'test-device-id-123';

// Formula: HMAC(X-API-KEY + X-Timestamp + User-Agent + X-Device-ID + Body)
async function signBody(body: string, timestamp: string, userAgent: string, deviceId: string): Promise<string> {
    const hmac = crypto.createHmac('sha256', HMAC_SECRET);
    // Payload = apiKey + timestamp + userAgent + deviceId + body
    hmac.update(API_KEY + timestamp + userAgent + deviceId + body);
    return hmac.digest('hex');
}

async function testSave(id: string, ownerHash: string) {
    const payload = {
        id,
        owner_hash: ownerHash,
        title_hash: 'test-hash-123',
        encrypted_blob: 'partA-content-partB-content', // midpoint splitting will happen server-side
        iv: 'test-iv-vector'
    };
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = await signBody(body, timestamp, USER_AGENT, DEVICE_ID);

    console.log(`\nTesting POST /save for ID: ${id}`);
    try {
        const res = await fetch(`${BASE_URL}/api/v1/vault/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'user-agent': USER_AGENT,
                'x-timestamp': timestamp,
                'x-signature': signature,
                'x-device-id': DEVICE_ID
            },
            body
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

async function testFetch(ownerHash: string) {
    console.log(`\nTesting GET /fetch for owner: ${ownerHash}`);
    const timestamp = Date.now().toString();
    // For GET, body is empty
    const signature = await signBody('', timestamp, USER_AGENT, DEVICE_ID);

    try {
        const res = await fetch(`${BASE_URL}/api/v1/vault/fetch`, {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
                'user-agent': USER_AGENT,
                'x-timestamp': timestamp,
                'x-signature': signature,
                'x-device-id': DEVICE_ID,
                'x-owner-hash': ownerHash
            }
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

async function testDelete(id: string) {
    console.log(`\nTesting POST /delete for ID: ${id}`);
    const payload = { id };
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = await signBody(body, timestamp, USER_AGENT, DEVICE_ID);

    try {
        const res = await fetch(`${BASE_URL}/api/v1/vault/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'user-agent': USER_AGENT,
                'x-timestamp': timestamp,
                'x-signature': signature,
                'x-device-id': DEVICE_ID
            },
            body
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

async function testWipe() {
    console.log(`\nTesting POST /wipe`);
    const body = '{}';
    const timestamp = Date.now().toString();
    const signature = await signBody(body, timestamp, USER_AGENT, DEVICE_ID);

    try {
        const res = await fetch(`${BASE_URL}/api/v1/vault/wipe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'user-agent': USER_AGENT,
                'x-timestamp': timestamp,
                'x-signature': signature,
                'x-device-id': DEVICE_ID,
                'x-wipe-token': WIPE_TOKEN
            },
            body
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Main
(async () => {
    console.log(`Targeting: ${BASE_URL}`);
    const id = crypto.randomUUID();
    // Use the SAME ownerHash for save/fetch to test e2e
    const ownerHash = 'user-owner-hash-123';

    await testSave(id, ownerHash);
    await testFetch(ownerHash);
    await testDelete(id);
    // await testWipe(); // Use with caution
})();
