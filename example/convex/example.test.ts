import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test";
import { api } from "./_generated/api";

describe("kinde-sync example", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("getUser returns null when user does not exist", async () => {
    const t = initConvexTest();
    const result = await t.query(api.example.getUser, {
      kindeId: "kp_nonexistent",
    });
    expect(result).toBeNull();
  });

  test("getUserByEmail returns null when user does not exist", async () => {
    const t = initConvexTest();
    const result = await t.query(api.example.getUserByEmail, {
      email: "test@example.com",
    });
    expect(result).toBeNull();
  });

  test("listUsers returns empty array when no users synced", async () => {
    const t = initConvexTest();
    const result = await t.query(api.example.listUsers, {});
    expect(result).toHaveLength(0);
  });
});