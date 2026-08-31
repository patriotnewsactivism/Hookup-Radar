export interface TestUserCredentials {
  email: string;
  password: string;
  name: string;
}

export function getTestUser(): TestUserCredentials {
  const email = process.env.E2E_TEST_EMAIL?.trim();
  const password = process.env.E2E_TEST_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error(
      "Missing required E2E_TEST_EMAIL/E2E_TEST_PASSWORD runtime variables",
    );
  }

  return {
    email,
    password,
    name: process.env.E2E_TEST_NAME?.trim() || "E2E Test User",
  };
}

// Compatibility view for older helpers. Getters defer environment access until
// authentication is actually attempted, so unauthenticated tooling can import
// this module without requiring test secrets.
export const TEST_USER = {
  get email() {
    return getTestUser().email;
  },
  get password() {
    return getTestUser().password;
  },
  get name() {
    return getTestUser().name;
  },
};
