import { httpRouter } from "convex/server";
import { components } from "./_generated/api.js";
import { KindeSync } from "../../src/client/index.js";

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