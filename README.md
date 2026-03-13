# @sholajegede/kinde-sync

A [Convex component](https://www.convex.dev/components) that syncs [Kinde](https://kinde.com) users into your Convex database in real time via webhooks. When a user is created, updated, or deleted in Kinde, your Convex database updates instantly — no polling, no boilerplate JWT verification, no manual sync logic.

[![npm version](https://badge.fury.io/js/@sholajegede%2Fkinde-sync.svg)](https://badge.fury.io/js/@sholajegede%2Fkinde-sync)
[![Convex Component](https://www.convex.dev/components/badge/sholajegede/kinde-sync)](https://www.convex.dev/components/sholajegede/kinde-sync)

Found a bug? Feature request? [File it here](https://github.com/sholajegede/kinde-sync/issues).

<!-- START: Include on https://convex.dev/components -->

## How it works

Without this component, every Convex + Kinde app has to write the same webhook handler: validate the JWT, parse the event, upsert the user. This component does all of that for you. Point your Kinde webhook at your Convex deployment and your users are synced automatically.

Kinde sends a JWT-signed `POST` request to your endpoint on every user event. The component verifies the signature against Kinde's JWKS endpoint, deduplicates events by webhook ID, and upserts or deletes the user in a component-owned Convex table. Your frontend subscribes reactively via `useQuery`.

## Prerequisites

- A [Kinde](https://kinde.com) account with an application configured
- Your Kinde issuer URL, client ID, and client secret (see below for how to find these)

## Getting your Kinde credentials

**1. Create a Kinde account and application**

Go to [kinde.com](https://kinde.com) and sign up. Once inside the dashboard, you will already have a default application created. Click **View details** on your app.

**2. Find your credentials**

On the application details page you will find:
- **KINDE_ISSUER_URL** — shown as your domain e.g. `https://yourapp.kinde.com`
- **KINDE_CLIENT_ID** — labeled "Client ID"
- **KINDE_CLIENT_SECRET** — labeled "Client secret" (click to reveal)

**3. Set your redirect URLs**

Still on the application details page, set:
- **Allowed callback URLs**: `http://localhost:3000` (add your production URL when deploying)
- **Allowed logout redirect URLs**: `http://localhost:3000`

Your `.env.local` should look like this:
```sh
KINDE_CLIENT_ID=your_client_id
KINDE_CLIENT_SECRET=your_client_secret
KINDE_ISSUER_URL=https://yourapp.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard
```

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
  KINDE_ISSUER_URL: process.env.KINDE_ISSUER_URL!,
});

const http = httpRouter();

http.route({
  path: "/webhooks/kinde",
  method: "POST",
  handler: kindeSync.webhookHandler,
});

export default http;
```

**2. Set your Convex environment variables:**
```sh
npx convex env set KINDE_ISSUER_URL https://yourapp.kinde.com
npx convex env set KINDE_CLIENT_ID your_client_id
npx convex env set KINDE_CLIENT_SECRET your_client_secret
```

**3. Configure Kinde auth for `ctx.auth`:**

This component handles webhook sync only. To enable `ctx.auth` in your Convex functions, create `convex/auth.config.ts`:
```ts
const authConfig = {
  providers: [
    {
      domain: process.env.KINDE_ISSUER_URL,
      applicationID: process.env.KINDE_CLIENT_ID,
    },
  ],
};

export default authConfig;
```

**4. Register the webhook in your Kinde dashboard:**

1. Go to your Kinde dashboard → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Give it a name e.g. `Convex user sync`
4. In the **Endpoint URL** field, enter your Convex HTTP actions URL:
```
   https://<your-deployment>.convex.site/webhooks/kinde
```
   You can find your Convex site URL by running `npx convex dev` and looking for `VITE_CONVEX_SITE_URL` in your `.env.local`, or on the [Convex dashboard](https://dashboard.convex.dev) under your deployment settings.
5. Under **Event triggers**, select:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Click **Save**

To verify it's working, create a user in your Kinde dashboard and check your Convex dashboard logs — you should see the webhook fire and the user appear in your `kindeUsers` table instantly.

## Usage

Query synced users reactively from your Convex functions:
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
// React
const user = useQuery(api.myFunctions.getUser, { kindeId: "kp_..." });
const users = useQuery(api.myFunctions.listUsers, {});
```

## API

### `KindeSync` class

| Option | Type | Description |
|---|---|---|
| `KINDE_ISSUER_URL` | `string` | Your Kinde issuer URL e.g. `https://yourapp.kinde.com` |

| Property | Description |
|---|---|
| `webhookHandler` | HTTP action to mount in `convex/http.ts` |

### Reactive queries

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