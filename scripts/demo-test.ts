import { chromium } from "playwright";

const appUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const email = process.env.E2E_TEST_EMAIL?.trim();
const password = process.env.E2E_TEST_PASSWORD?.trim();
const requireAuthenticated = process.env.REQUIRE_AUTH_E2E === "true";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(appUrl, { waitUntil: "networkidle" });
    const landing = await page.locator("body").innerText();
    if (!landing.includes("SURGE") || !landing.includes("Get Started Free") || !landing.includes("Sign In")) {
      throw new Error("Canonical landing state did not render");
    }

    await page.getByRole("button", { name: "Sign In", exact: true }).first().click();
    await page.locator('input[type="email"]').waitFor({ state: "visible" });
    await page.locator('input[type="password"]').waitFor({ state: "visible" });

    if (!email || !password) {
      if (requireAuthenticated) {
        throw new Error("Authenticated E2E is required but E2E_TEST_EMAIL/E2E_TEST_PASSWORD are missing");
      }
      console.log("Canonical unauthenticated shell passed; authenticated E2E skipped because runtime credentials are absent.");
      return;
    }

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign In", exact: true }).last().click();

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes("Explore") || text.includes("Let's set you up") || text.includes("Something went wrong");
    }, undefined, { timeout: 15_000 });

    const authenticatedState = await page.locator("body").innerText();
    if (authenticatedState.includes("Something went wrong")) {
      throw new Error("Application error boundary rendered after authentication");
    }
    if (authenticatedState.includes("Let's set you up")) {
      throw new Error("E2E identity authenticated but has no completed Surge profile");
    }

    for (const label of ["Map", "Explore", "Spots", "Chats", "Me"]) {
      if (!(await page.getByRole("button", { name: label, exact: true }).isVisible())) {
        throw new Error(`Canonical app navigation is missing: ${label}`);
      }
    }

    await page.getByRole("button", { name: "Map", exact: true }).click();
    await page.getByRole("button", { name: "Spots", exact: true }).click();
    await page.getByRole("button", { name: "Chats", exact: true }).click();
    await page.getByRole("button", { name: "Me", exact: true }).click();
    await page.getByRole("button", { name: "Explore", exact: true }).click();

    console.log("Canonical state-driven E2E passed.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
