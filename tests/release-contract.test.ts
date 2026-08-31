import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("release security contract", () => {
  test("preview authentication flags cannot split frontend and backend behavior", () => {
    const files = [
      "src/components/TestUserLoginSection.tsx",
      "convex/auth.ts",
      "convex/seedTestUser.ts",
      "convex/testAuth.ts",
    ];
    const combined = files.map(read).join("\n");
    expect(combined).not.toContain("VITE_IS_PREVIEW");
    expect(combined).not.toContain("VIKTOR_SPACES_IS_PREVIEW");
    expect(combined).not.toContain("@test.local");
  });

  test("moderation is not authorized by verification status", () => {
    const moderation = read("convex/surgeModeration.ts");
    expect(moderation).toContain("requireModerator");
    expect(moderation).not.toContain("is_verified");
  });

  test("actor-sensitive modules use authenticated authorization helpers", () => {
    for (const path of [
      "convex/surgeUsers.ts",
      "convex/surgeMessages.ts",
      "convex/surgeReports.ts",
      "convex/surgeMedia.ts",
      "convex/surgeRatings.ts",
      "convex/surgeSpots.ts",
    ]) {
      const source = read(path);
      expect(source).toMatch(/requireSurgeUser|getAuthUserId/);
    }
  });

  test("production error UI never renders a raw stack", () => {
    const boundary = read("src/components/ErrorBoundary.tsx");
    expect(boundary).not.toContain("error?.stack");
    expect(boundary).not.toContain("this.state.error?.stack");
  });
});
