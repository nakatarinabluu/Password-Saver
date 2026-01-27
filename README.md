# ZeroKeep - Ghost Vault (Backend)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Obsidian_Hardened-black.svg)
![Runtime](https://img.shields.io/badge/runtime-Edge-green.svg)

> **Headless. Zero-Knowledge. Obsidian Hardened.**

This is the server-side component of the **ZeroKeep** ecosystem. It is a "Ghost Vault"—a headless, dumb storage mechanism designed to hold opaque encrypted blobs without ever having the ability to decrypt them.

## 🏗️ Architecture

*   **Runtime**: Next.js App Router (Edge Runtime).
*   **Database**:
    *   **Neon (PostgreSQL)**: Stores Shard A (AES-256-GCM Encrypted).
    *   **Upstash (Redis)**: Stores Shard B (AES-256-GCM Encrypted).
*   **Zero-Knowledge**: The server **never** receives the Master Key or the plain-text data.

## 🛡️ Security Features (Obsidian Level)

### 1. Middleware Hardening (`src/middleware.ts`)
*   ** invisible Presence**: Root path `/` returns `404`. No UI, no login page.
*   **Strict Geo-Fencing**: Rejects all requests not originating from **Indonesia (ID)**.
*   **VPN/Proxy Detection**: Blocks requests with headers like `Via`, `Proxy-Connection`.
*   **Device-Bound HMAC**:
    *   Requests must be signed: `HMAC-SHA256(API_KEY + Timestamp + UserAgent + DeviceID + Body)`.
*   **User-Agent Whitelist**: Only accepts `ZeroKeep-Android/1.0`.
*   **Lockdown Mode**: Automatically bans an IP for **1 hour** after 10 failed signature/auth checks.

### 2. Dual-Key Sharding
*   Data is split into two shards.
*   **Shard A** is encrypted with server-side `PEPPER_NEON`.
*   **Shard B** is encrypted with server-side `PEPPER_REDIS`.
*   Compromising one database renders the data useless.

## 🚀 Deployment (Vercel)

### Environment Variables
| Variable | Description |
| :--- | :--- |
| `APP_API_KEY` | Shared secret for initial handshake. |
| `HMAC_SECRET` | Secret key for request signing. |
| `PEPPER_NEON` | 32-byte Hex Key for Shard A encryption. |
| `PEPPER_REDIS` | 32-byte Hex Key for Shard B encryption. |
| `NEON_DATABASE_URL` | PostgreSQL Connection String. |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token. |

## 📡 API Endpoints

*   `POST /api/v1/vault/save`: Stores encrypted shards.
*   `GET /api/v1/vault/fetch`: Retrieves and recombines shards.
*   `POST /api/v1/vault/delete`: Removes a specific entry.
*   `POST /api/v1/vault/wipe`: **Kill Switch**. Deletes ALL data.

---
*Powered by ZeroKeep.*
