import { describe, expect, it, vi } from "vitest";
import { requireUserId } from "@/lib/supabase/auth";

describe("requireUserId", () => {
  it("returns the validated Supabase user id", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    await expect(
      requireUserId({ auth: { getUser } } as never)
    ).resolves.toBe("user-123");
  });

  it("rejects anonymous mutations", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      requireUserId({ auth: { getUser } } as never)
    ).rejects.toThrow("Not authenticated");
  });

  it("propagates Supabase authentication errors", async () => {
    const authError = new Error("invalid session");
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: authError,
    });

    await expect(
      requireUserId({ auth: { getUser } } as never)
    ).rejects.toBe(authError);
  });
});

