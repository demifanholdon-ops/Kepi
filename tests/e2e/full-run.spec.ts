import { test, expect, type Page } from "@playwright/test";
import {
  ALLY_ROWS,
  BOARD_COLS,
  boardToPixel,
  computeBoardMetrics,
} from "../../src/lib/game/boardLayout";

/**
 * Plays a full 1-6 stage run by driving the real game UI (`/`).
 *
 * Strategy B: best-effort play — buy/upgrade to fill the army, place pieces in a
 * front/back formation, fight, then advance. Win or lose, the run walks all the
 * way to the ending scene. We only assert that the ending is reached.
 *
 * Watch it:    pnpm exec playwright test --project=demo --headed
 * Slower/faster: PW_SLOWMO=1000 pnpm exec playwright test --project=demo --headed
 * Take over manually mid-run: PWPAUSE=1 ... --project=demo --headed --debug
 */

const PAUSE_FOR_MANUAL = !!process.env.PWPAUSE;

// Buy priority: tanks first so board order maps front -> back.
const BUY_PRIORITY = ["guard", "teacher", "fengshui", "patriarch", "farmer"];

// Formation cells (ally rows 3/4). Front row first, center-out.
const FORMATION_CELLS = [
  { x: 3, y: ALLY_ROWS[ALLY_ROWS.length - 1] },
  { x: 2, y: ALLY_ROWS[ALLY_ROWS.length - 1] },
  { x: 4, y: ALLY_ROWS[ALLY_ROWS.length - 1] },
  { x: 1, y: ALLY_ROWS[ALLY_ROWS.length - 1] },
  { x: 5, y: ALLY_ROWS[ALLY_ROWS.length - 1] },
  { x: 3, y: ALLY_ROWS[0] },
  { x: 2, y: ALLY_ROWS[0] },
  { x: 4, y: ALLY_ROWS[0] },
].filter((cell) => cell.x >= 0 && cell.x < BOARD_COLS);

function benchPieces(page: Page) {
  return page.locator('[data-testid="bench-piece"]');
}

function startBattleButton(page: Page) {
  return page.getByRole("button", { name: /^开战/ });
}

function advanceButton(page: Page) {
  return page.getByRole("button", { name: /进入下一关|查看结局/ });
}

async function inPrep(page: Page): Promise<boolean> {
  return startBattleButton(page).isVisible();
}

/** Buy pieces by priority and upgrade population until nothing else is affordable. */
async function buildArmy(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const before = await benchPieces(page).count();

    let bought = false;
    for (const type of BUY_PRIORITY) {
      const slot = page
        .locator(`[data-testid="shop-slot"][data-piece="${type}"]`)
        .first();
      if ((await slot.count()) === 0) continue;
      await slot.click();
      await page.waitForTimeout(120);
      if ((await benchPieces(page).count()) > before) {
        bought = true;
        break;
      }
    }
    if (bought) continue;

    // Couldn't buy (population full or short on gold): try to grow population.
    const upgrade = page.getByRole("button", { name: /升人口/ });
    const canUpgrade = await upgrade.isEnabled().catch(() => false);
    if (canUpgrade) {
      await upgrade.click();
      await page.waitForTimeout(120);
      continue;
    }
    break;
  }
}

/** Select each bench piece and drop it onto the next formation cell. */
async function placeArmy(page: Page): Promise<void> {
  const bench = benchPieces(page);
  const count = await bench.count();
  if (count === 0) return;

  const canvas = page.locator('canvas[aria-label="客批棋盘"]');
  const box = await canvas.boundingBox();
  if (!box) return;

  const metrics = computeBoardMetrics(box.width, box.height);

  for (let i = 0; i < count && i < FORMATION_CELLS.length; i += 1) {
    await bench.nth(i).click(); // select piece -> highlights ally cells
    const pixel = boardToPixel(FORMATION_CELLS[i]!, metrics);
    await canvas.click({ position: { x: pixel.x, y: pixel.y } });
    await page.waitForTimeout(150);
  }
}

/** Start the battle, wait for settlement, advance. Returns true if the run ended. */
async function fightAndAdvance(page: Page): Promise<boolean> {
  await startBattleButton(page).click();

  const advance = advanceButton(page);
  await advance.waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(900); // linger on the settlement panel

  const ended = /查看结局/.test(await advance.innerText());
  await advance.click();
  return ended;
}

test("plays a full 1-6 stage run to the ending", async ({ page }) => {
  test.setTimeout(180_000);

  // Start from a clean slate so we always begin at stage 1.
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  await page.goto("/");
  await expect(startBattleButton(page)).toBeVisible({ timeout: 20_000 });

  for (let stage = 1; stage <= 6; stage += 1) {
    if (!(await inPrep(page))) break;

    await buildArmy(page);
    await placeArmy(page);

    if (PAUSE_FOR_MANUAL) {
      // Hand control to you in the live browser; resume from the Inspector.
      await page.pause();
    }

    const ended = await fightAndAdvance(page);
    if (ended) break;

    // Wait for the next prep phase before looping.
    await expect(startBattleButton(page)).toBeVisible({ timeout: 20_000 });
  }

  await expect(page.getByLabel("结局过场")).toBeVisible({ timeout: 20_000 });
});
