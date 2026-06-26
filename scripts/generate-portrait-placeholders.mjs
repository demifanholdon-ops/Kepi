import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const assets = [
  ["characters/farmer", "农", "#4a6fa5"],
  ["characters/guard", "卫", "#3d5a80"],
  ["characters/teacher", "师", "#5c7a99"],
  ["characters/fengshui", "风", "#2f4858"],
  ["characters/patriarch", "长", "#1b263b"],
  ["enemies/qianhaibei", "钱", "#7b4b4b"],
  ["enemies/luyinguanli", "陆", "#6b3a3a"],
  ["enemies/zhuzaiqi", "契", "#8c4a4a"],
  ["enemies/ehushan", "鹅", "#5c4033"],
  ["enemies/hongtouchuan", "船", "#9b2c2c"],
  ["enemies/xiedouhuo", "火", "#b45309"],
];

for (const [path, label, color] of assets) {
  const dir = join("public/images", path.split("/")[0]);
  mkdirSync(dir, { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img">
  <defs>
    <radialGradient id="g" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${color}"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="32" fill="url(#g)"/>
  <text x="32" y="38" text-anchor="middle" font-size="24" font-family="sans-serif" fill="#f8f9fa">${label}</text>
</svg>`;
  writeFileSync(join("public/images", `${path}.svg`), svg);
}
