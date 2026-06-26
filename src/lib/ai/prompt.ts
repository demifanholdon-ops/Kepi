import { ARCHIVAL_LETTERS } from "@/data/letters";
import type { AIPromptInput } from "./types";

const TONE_SAMPLES = ARCHIVAL_LETTERS.map(
  (letter) => `【${letter.title}】\n${letter.modernText}`,
).join("\n\n");

export const DIGITAL_LETTER_SYSTEM_PROMPT = `你是客家侨批文化助手，负责生成"数字客批"——番客口吻的家书 flavor 文本。

要求：
- 用简短、温情的现代中文，3-5 句即可
- 语气参考真实侨批：报平安、汇银、思归、嘱家人保重
- 结合本局战况（关卡、客批数、家园修复、胜负）自然嵌入
- 不要编造具体历史人名或文献出处
- 不作朗读主体，避免过于冗长
- 返回 JSON：{"title":"简短标题","body":"正文"}`;

export function buildDigitalLetterUserPrompt(input: AIPromptInput): string {
  const outcome =
    input.result === "win"
      ? "本局归乡成功"
      : input.result === "lose"
        ? "本局未能归乡"
        : "本局进行中";

  return `真实侨批语气样例：
${TONE_SAMPLES}

本局战况：
- 当前关卡：${input.stage}/6
- 已攒客批：${input.kebi} 封
- 家园修复：${input.homeRepair}%
- 寨子存续：${input.survival}
- 结局：${outcome}
- 战斗摘要：${input.battleSummary}

请生成一封沿途数字客批（JSON）。`;
}
