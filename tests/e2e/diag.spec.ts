import { test } from "@playwright/test";

test("diagnose shop buy", async ({ page }) => {
  test.setTimeout(60_000);
  const logs: string[] = [];
  page.on("console", (m) => logs.push(`[console] ${m.type()}: ${m.text()}`));

  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
  });
  await page.goto("/");
  await page.getByRole("button", { name: /^开战/ }).waitFor();

  const slot = page.locator('[data-testid="shop-slot"][data-piece="farmer"]').first();
  console.log("slot count:", await page.locator('[data-testid="shop-slot"]').count());
  console.log("farmer slot count:", await slot.count());

  const popText = page.locator("text=/人口\\s*\\d+\\/\\d+/");
  console.log("pop before:", (await popText.first().innerText()).trim());

  await slot.click();
  await page.waitForTimeout(500);

  console.log("pop after:", (await popText.first().innerText()).trim());
  console.log("bench count:", await page.locator('[data-testid="bench-piece"]').count());
  console.log("toasts:", await page.locator("body").innerText().then((t) => t.split("\n").filter((l) => l.includes("购入") || l.includes("无法")).join(" | ")));
  console.log("--- console logs ---\n" + logs.join("\n"));
});
