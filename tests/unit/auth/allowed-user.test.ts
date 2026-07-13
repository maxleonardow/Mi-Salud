import { afterEach, describe, expect, it } from "vitest";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

const originalAllowedEmail = process.env.ALLOWED_EMAIL;

afterEach(() => {
  if (originalAllowedEmail === undefined) delete process.env.ALLOWED_EMAIL;
  else process.env.ALLOWED_EMAIL = originalAllowedEmail;
});

describe("isAllowedUserEmail", () => {
  it("matches the configured email case-insensitively", () => {
    process.env.ALLOWED_EMAIL = "Owner@Example.com";
    expect(isAllowedUserEmail(" owner@example.com ")).toBe(true);
  });

  it("rejects another email", () => {
    process.env.ALLOWED_EMAIL = "owner@example.com";
    expect(isAllowedUserEmail("other@example.com")).toBe(false);
  });

  it("allows an existing Auth user when the optional allowlist is missing", () => {
    delete process.env.ALLOWED_EMAIL;
    expect(isAllowedUserEmail("owner@example.com")).toBe(true);
  });
});
