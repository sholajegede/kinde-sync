# @sholajegede/kinde-sync

A [Convex component](https://www.convex.dev/components) that syncs [Kinde](https://kinde.com) auth events into Convex in real time via webhooks. When a user is created, updated, or deleted in Kinde, the change appears in your Convex database instantly — no polling, no manual sync.

[![npm version](https://badge.fury.io/js/@sholajegede%2Fkinde-sync.svg)](https://badge.fury.io/js/@sholajegede%2Fkinde-sync)

Found a bug? Feature request? [File it here](https://github.com/sholajegede/kinde-sync/issues).

<!-- START: Include on https://convex.dev/components -->

## How it works

Kinde sends a JWT-signed webhook to your Convex HTTP endpoint on every user event. This component verifies the JWT against Kinde's JWKS endpoint, deduplicates events by webhook ID, and upserts the user data into a component-owned Convex table. Your frontend subscribes to the data reactively via `useQuery` — no extra work needed.

## Prerequisites

- A [Kinde](https://kinde.com) account with at least one application configured
- Your Kinde domain (e.g. `https://yourapp.kinde.com`)

## Installation
```sh
npm install @sholajegede/kinde-sync
```

Add the component to your `convex/convex.config.ts`:
```ts
import { defineApp } from "convex/server";
import kindeSync from "@sholajegede/kinde-sync/convex.config.js";

const app = defineApp();
app.use(kindeSync);

export default app;
```

## Setup

**1. Mount the webhook handler in `convex/http.ts`:**
```ts
import { httpRouter } from "convex/server";
import { components } from "./_generated/api.js";
import { KindeSync } from "@sholajegede/kinde-sync";

const kindeSync = new KindeSync(components.kindeSync, {
  KINDE_DOMAIN: process.env.KINDE_DOMAIN!,
});

const http = httpRouter();

http.route({
  path: "/webhooks/kinde",
  method: "POST",
  handler: kindeSync.webhookHandler,
});

export default http;
```

**2. Set your environment variable:**
```sh
npx convex env set KINDE_DOMAIN https://yourapp.kinde.com
```

**3. Point your Kinde webhook at your Convex deployment:**

In your Kinde dashboard, go to **Settings → Webhooks** and add:
```
https://<your-deployment>.convex.site/webhooks/kinde
```

Enable the `user.created`, `user.updated`, and `user.deleted` events.

## Usage

Query synced users reactively from anywhere in your app:
```ts
import { query } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { v } from "convex/values";

export const getUser = query({
  args: { kindeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.kindeSync.lib.getUser, {
      kindeId: args.kindeId,
    });
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.kindeSync.lib.listUsers, {});
  },
});
```
```tsx
// React component
const user = useQuery(api.myFunctions.getUser, { kindeId: "kp_..." });
const users = useQuery(api.myFunctions.listUsers, {});
```

## API

### `KindeSync` class

| Constructor option | Type | Description |
|---|---|---|
| `KINDE_DOMAIN` | `string` | Your Kinde domain e.g. `https://yourapp.kinde.com` |

| Property | Description |
|---|---|
| `webhookHandler` | HTTP action to mount in your `convex/http.ts` |

### Reactive queries (call via `ctx.runQuery`)

| Function | Args | Returns |
|---|---|---|
| `components.kindeSync.lib.getUser` | `{ kindeId: string }` | User or `null` |
| `components.kindeSync.lib.getUserByEmail` | `{ email: string }` | User or `null` |
| `components.kindeSync.lib.listUsers` | `{}` | Array of users |

### User shape
```ts
{
  kindeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  isSuspended: boolean;
  organizations: { code: string; roles?: string; permissions?: string; }[];
  lastSyncedAt: number;
}
```

### Supported webhook events

| Event | Effect |
|---|---|
| `user.created` | Inserts user into Convex |
| `user.updated` | Updates existing user |
| `user.deleted` | Removes user from Convex |

<!-- END: Include on https://convex.dev/components -->

## Example app

See [`example/`](./example) for a working Vite + React demo showing live user sync from Kinde into Convex.

## Development
```sh
npm i
npm run dev
```

## License

Apache-2.0