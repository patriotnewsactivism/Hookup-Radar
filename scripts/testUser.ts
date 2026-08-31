function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required test environment variable: ${name}`);
  return value;
}

export const TEST_USER = {
  email: required("E2E_TEST_EMAIL"),
  password: required("E2E_TEST_PASSWORD"),
  name: process.env.E2E_TEST_NAME?.trim() || "E2E Test User",
} as const;
