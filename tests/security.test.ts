import { describe, expect, test } from "bun:test";
import {
  assertCoordinates,
  identityMatches,
  requireProfileOwner,
  toPublicProfile,
} from "../convex/security";

const profile = {
  _id: "profile_123",
  _creationTime: 1,
  auth_id: "auth_123",
  auth_email: "private@example.test",
  username: "tester",
  display_name: "Tester",
  age: 30,
  lat: 33.123456,
  lng: -84.654321,
  show_distance: true,
  safe_contact_name: "Private Contact",
  safe_contact_info: "private",
  blocked_users: ["blocked"],
  favorite_users: ["favorite"],
};

describe("authorization helpers", () => {
  test("identity matching accepts only the authenticated profile identities", () => {
    expect(identityMatches(profile, "profile_123")).toBe(true);
    expect(identityMatches(profile, "auth_123")).toBe(true);
    expect(identityMatches(profile, "someone_else")).toBe(false);
  });

  test("cross-profile ownership is rejected", () => {
    expect(() => requireProfileOwner(profile, "profile_123")).not.toThrow();
    expect(() => requireProfileOwner(profile, "profile_999")).toThrow("Not authorized");
  });
});

describe("location privacy", () => {
  test("public profiles strip private identity/contact fields and coarsen coordinates", () => {
    const publicProfile = toPublicProfile(profile, 1234) as Record<string, unknown>;
    expect(publicProfile.auth_id).toBeUndefined();
    expect(publicProfile.auth_email).toBeUndefined();
    expect(publicProfile.safe_contact_name).toBeUndefined();
    expect(publicProfile.safe_contact_info).toBeUndefined();
    expect(publicProfile.blocked_users).toBeUndefined();
    expect(publicProfile.favorite_users).toBeUndefined();
    expect(publicProfile.lat).toBe(33.12);
    expect(publicProfile.lng).toBe(-84.65);
    expect(publicProfile.distance).toBe(1234);
  });

  test("invalid coordinates fail closed", () => {
    expect(() => assertCoordinates(33, -84)).not.toThrow();
    expect(() => assertCoordinates(91, -84)).toThrow();
    expect(() => assertCoordinates(33, 181)).toThrow();
  });
});
