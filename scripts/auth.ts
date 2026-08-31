import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, BrowserContext, ConsoleMessage, Page } from "playwright";
import { chromium } from "playwright";
import { TEST_USER } from "./testUser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = join(__dirname, "..", "tmp");
const AUTH_STATE_MAX_AGE_MINUTES = 50;

function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:5173";
}

function getTestId(): string {
  const scriptPath = process.argv[1] || "default";
  const name = basename(scriptPath, ".ts");
  const hash = createHash("md5").update(scriptPath).digest("hex").slice(0, 8);
  return `${name}-${hash}`;
}

function getAuthStatePath(): string {
  return join(TMP_DIR, `auth-state-${getTestId()}.json`);
}

export interface ConsoleLog {
  type: string;
  text: string;
  timestamp: Date;
  location?: string;
}

export interface PageDebugInfo {
  url: string;
  title: string;
  content: string;
  consoleLogs: ConsoleLog[];
}

export class PageHelper {
  private consoleLogs: ConsoleLog[] = [];

  constructor(
    public readonly page: Page,
    public readonly browser: Browser,
    public readonly context: BrowserContext,
  ) {
    this.page.on("console", (msg: ConsoleMessage) => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date(),
        location: msg.location().url,
      });
    });
  }

  getConsoleLogs(): ConsoleLog[] {
    return [...this.consoleLogs];
  }

  clearConsoleLogs(): void {
    this.consoleLogs = [];
  }

  printConsoleLogs(): void {
    if (this.consoleLogs.length === 0) {
      console.log("\nConsole Logs: (none)\n");
      return;
    }
    console.log("\nConsole Logs:");
    console.log("-".repeat(60));
    for (const log of this.consoleLogs) {
      console.log(`[${log.type.toUpperCase()}] ${log.text}`);
    }
    console.log("-".repeat(60));
  }

  async getPageContent(): Promise<string> {
    return await this.page.locator("body").innerText();
  }

  async printPageContent(): Promise<void> {
    const content = await this.getPageContent();
    console.log("\nPage Content:");
    console.log("-".repeat(60));
    console.log(content || "(empty)");
    console.log("-".repeat(60));
  }

  async getDebugInfo(): Promise<PageDebugInfo> {
    return {
      url: this.page.url(),
      title: await this.page.title(),
      content: await this.getPageContent(),
      consoleLogs: this.getConsoleLogs(),
    };
  }

  async printDebugInfo(): Promise<void> {
    const info = await this.getDebugInfo();
    console.log(`\nURL: ${info.url}`);
    console.log(`Title: ${info.title}`);
    await this.printPageContent();
    this.printConsoleLogs();
  }

  async screenshot(name?: string): Promise<string> {
    await mkdir(TMP_DIR, { recursive: true });
    const filename = name || `screenshot-${Date.now()}.png`;
    const path = join(TMP_DIR, filename);
    await this.page.screenshot({ path, fullPage: true });
    console.log(`Screenshot saved: ${path}`);
    return path;
  }

  async goto(path: string): Promise<void> {
    const url = path.startsWith("http") ? path : `${getAppUrl()}${path}`;
    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  async close(): Promise<void> {
    await this.browser.close();
  }
}

async function isAuthenticated(page: Page): Promise<boolean> {
  const exploreVisible = await page
    .getByRole("button", { name: "Explore", exact: true })
    .isVisible()
    .catch(() => false);
  if (exploreVisible) return true;

  return await page
    .getByText("Let's set you up", { exact: false })
    .isVisible()
    .catch(() => false);
}

async function openSignInForm(page: Page): Promise<void> {
  await page.goto(`${getAppUrl()}/`, { waitUntil: "networkidle" });
  if (await isAuthenticated(page)) return;

  const signInCta = page.getByRole("button", { name: "Sign In", exact: true }).first();
  if (!(await signInCta.isVisible().catch(() => false))) {
    throw new Error("Canonical sign-in action is not visible");
  }
  await signInCta.click();
  await page.locator('input[type="email"]').waitFor({ state: "visible" });
  await page.locator('input[type="password"]').waitFor({ state: "visible" });
}

export async function signInTestUser(page: Page): Promise<void> {
  await openSignInForm(page);
  if (await isAuthenticated(page)) return;

  await page.locator('input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"]').fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).last().click();

  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return (
        text.includes("Explore") ||
        text.includes("Let's set you up") ||
        text.includes("Something went wrong")
      );
    },
    undefined,
    { timeout: 15_000 },
  );

  if (!(await isAuthenticated(page))) {
    await mkdir(TMP_DIR, { recursive: true });
    await page.screenshot({ path: join(TMP_DIR, "auth-debug.png") });
    throw new Error("Failed to reach an authenticated application state");
  }
}

// Compatibility name retained for existing scripts. Test accounts are no
// longer auto-created from browser automation; they must be provisioned
// out-of-band and supplied through runtime-only E2E environment variables.
export async function ensureTestUserExists(page: Page): Promise<void> {
  await signInTestUser(page);
}

export async function saveAuthState(page: Page): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });
  await page.context().storageState({ path: getAuthStatePath() });
}

export async function loadAuthState(): Promise<string | undefined> {
  const path = getAuthStatePath();
  if (!existsSync(path)) return undefined;

  try {
    const ageMinutes = (Date.now() - statSync(path).mtimeMs) / 1000 / 60;
    if (ageMinutes > AUTH_STATE_MAX_AGE_MINUTES) {
      unlinkSync(path);
      return undefined;
    }
    return path;
  } catch {
    return undefined;
  }
}

export function clearAllAuthStates(): void {
  if (!existsSync(TMP_DIR)) return;
  for (const file of readdirSync(TMP_DIR)) {
    if (file.startsWith("auth-state-") && file.endsWith(".json")) {
      try {
        unlinkSync(join(TMP_DIR, file));
      } catch {
        // Best-effort local test cleanup.
      }
    }
  }
}

async function createBrowserContext(): Promise<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
}> {
  const storageState = await loadAuthState();
  const browser = await chromium.launch();
  const context = await browser.newContext(storageState ? { storageState } : {});
  const page = await context.newPage();
  return { browser, context, page };
}

export async function createAuthenticatedBrowser(): Promise<{
  browser: Browser;
  page: Page;
}> {
  const { browser, page } = await createBrowserContext();
  await page.goto(`${getAppUrl()}/`, { waitUntil: "networkidle" });
  if (!(await isAuthenticated(page))) {
    await signInTestUser(page);
    await saveAuthState(page);
  }
  return { browser, page };
}

export async function createPageHelper(): Promise<PageHelper> {
  const { browser, context, page } = await createBrowserContext();
  const helper = new PageHelper(page, browser, context);
  await page.goto(`${getAppUrl()}/`, { waitUntil: "networkidle" });

  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    if (!(await isAuthenticated(page))) {
      await signInTestUser(page);
      await saveAuthState(page);
    }
  }

  return helper;
}

async function fetchConvexLogs(maxLines = 30): Promise<string> {
  return await new Promise((resolve) => {
    const logs: string[] = [];
    const proc = spawn(
      "bunx",
      ["convex", "logs", "--history", String(maxLines), "--success"],
      {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: join(__dirname, ".."),
      },
    );

    proc.stdout.on("data", (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line.trim() && !line.startsWith("Watching logs")) logs.push(line);
      }
    });
    proc.stderr.on("data", (data: Buffer) => {
      const text = data.toString();
      if (!text.includes("WebSocket") && !text.includes("Attempting reconnect")) {
        logs.push(`[stderr] ${text.trim()}`);
      }
    });

    const timeout = setTimeout(() => {
      proc.kill("SIGTERM");
      resolve(logs.length ? logs.join("\n") : "(No recent log entries)");
    }, 5000);

    proc.on("close", () => {
      clearTimeout(timeout);
      resolve(logs.length ? logs.join("\n") : "(No recent log entries)");
    });
    proc.on("error", () => {
      clearTimeout(timeout);
      resolve("(Failed to fetch Convex logs)");
    });
  });
}

export async function runTest(
  testName: string,
  testFn: (helper: PageHelper) => Promise<void>,
): Promise<void> {
  console.log(`\nRunning: ${testName}\n`);
  const helper = await createPageHelper();

  try {
    await testFn(helper);
    console.log(`\n${testName} PASSED\n`);
  } catch (error) {
    console.error(`\n${testName} FAILED\n`);
    console.error("Error:", error instanceof Error ? error.message : error);
    try {
      await helper.screenshot(`error-${Date.now()}.png`);
      await helper.printDebugInfo();
      console.log("\nConvex Backend Logs:");
      console.log(await fetchConvexLogs());
    } catch (debugError) {
      console.error("Failed to capture debug info:", debugError);
    }
    throw error;
  } finally {
    try {
      await saveAuthState(helper.page);
    } catch {
      // Ignore local state persistence failures during cleanup.
    }
    await helper.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createPageHelper()
    .then(async (helper) => {
      console.log("Canonical browser helper initialized.");
      await helper.printDebugInfo();
      await helper.close();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
