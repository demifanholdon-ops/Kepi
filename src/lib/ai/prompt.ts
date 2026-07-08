import { ARCHIVAL_LETTERS } from "@/data/letters";
import type { AIPromptInput } from "./types";

const TONE_SAMPLES = ARCHIVAL_LETTERS.map(
  (letter) => `【${letter.title}】\n${letter.modernText}`,
).join("\n\n");

export const DIGITAL_LETTER_SYSTEM_PROMPT = `你是客家侨批文化助手，负责生成"数字客批"——一段完整的番客归乡叙事独白。

要求：
- 用第一人称"我"的视角，写一段自然段叙事，段数等于收到的客批封数，每段之间用 \\n\\n 分隔
- 语气参考真实侨批的质朴与温存，带诗意的怀旧感
- 内容围绕番客在异乡的漂泊：做工、思乡、写信寄银、遥望归途
- 不要出现具体历史人名或文献出处
- 每段 2–3 句，总长按段数调整（1 段约 80–120 字，多段约 300–500 字）
- 全文是一个连贯的内心独白，不是写给收信人的短笺
- 每段开头用【二字标题】作为段标题，如【启程】【夜航】【思归】
- 返回 JSON：{"title":"二字总标题","body":"每段以【标题】开头，\\n\\n分隔的叙事正文"}`;

export function buildDigitalLetterUserPrompt(input: AIPromptInput): string {
  const outcome =
    input.result === "win"
      ? "本局归乡成功"
      : input.result === "lose"
        ? "本局未能归乡"
        : "本局进行中";
  const kebi = Math.max(1, input.kebi);
  const paraCount = kebi === 1 ? "1 段" : `${kebi} 段`;

  return `真实侨批语气样例：
${TONE_SAMPLES}

本局战况：
- 当前关卡：${input.stage}/6
- 已攒客批：${input.kebi} 封
- 家园修复：${input.homeRepair}%
- 寨子存续：${input.survival}
- 结局：${outcome}
- 战斗摘要：${input.battleSummary}

请生成一段沿途数字客批叙事（${paraCount}，JSON）。`;
}
