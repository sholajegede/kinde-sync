import { describe, expect, test } from "vitest";
import { KindeSync } from "./index.js";
import { components } from "./setup.test.js";

describe("KindeSync client", () => {
  test("instantiates with required options", () => {
    const client = new KindeSync(components.kindeSync, {
      KINDE_DOMAIN: "https://example.kinde.com",
    });
    expect(client).toBeDefined();
    expect(client.component).toBeDefined();
    expect(client.webhookHandler).toBeDefined();
  });
});