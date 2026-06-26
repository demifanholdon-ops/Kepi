import type { ArchivalLetter, DigitalLetterFallback } from "./types";

/** Museum letter shape used by ending UI and AI prompt tone samples. */
export type MuseumLetter = {
  id: string;
  author: string;
  recipient: string;
  traditional: string;
  modern: string;
  source: string;
  voiceAudio: string | null;
};

/** Real archival letters for ending narration — PRD §11.4. */
export const ARCHIVAL_LETTERS: readonly ArchivalLetter[] = [
  {
    id: "ye-heren-1887",
    title: "叶和仁寄母",
    originalText: `母親大人膝下福安：
　兒在叻身體安穩，無病無痛，萬勿掛念。今付洋銀弍元，家中吃用切莫吝嗇。
　兒日夜思唐，待積少許銀兩，便歸侍奉高堂。
　男 和仁 叩上`,
    modernText: `母亲大人安好：
　我在新加坡身体平安，没有病痛，千万不要挂念。这次捎回两块银元，家里日常开销别舍不得花钱。
　我日日思念家乡，等攒下一点积蓄，就回乡陪您尽孝。
　儿子 和仁 敬上`,
    source: "梅州/汕头档案馆公开馆藏 · 清光绪年间马来亚（叻）叶和仁寄母亲家书",
    voiceAudio: "/audio/voice/kepi_letter-ye-heren.mp3",
  },
  {
    id: "lin-ahfa-1910",
    title: "林阿发寄妻",
    originalText: `贤妻如面：
　兒今在暹羅做工，身體尚好。此付洋銀壹元，可買米度日。
　聞鄉中旱情，望保重。兒在外省食儉用，只盼來年能歸。
　夫 阿發 上`,
    modernText: `妻子亲启：
　我在泰国做工，身体还好。这次寄回一块银元，可以买米度日。
　听说乡里旱情，望多保重。我在外省吃俭用，只盼来年能回家。
　丈夫 阿发 上`,
    source: "汕头侨批馆公开馆藏 · 民国初年暹罗寄批",
    voiceAudio: null,
  },
  {
    id: "zhang-mingde-1920",
    title: "张明德寄叔父",
    originalText: `叔父大人钧鉴：
　侄在槟榔屿貿易，尚能糊口。今汇批银叁元，请为祖母买药。
　围屋墙门破损，请用此钱修补。侄每夜梦归松口，不敢忘本。
　侄 明德 顿首`,
    modernText: `叔父台鉴：
　侄子在槟城做生意，尚能糊口。今汇批银三元，请为祖母买药。
　围屋墙门破损，请用此钱修补。侄每晚梦见回到松口，不敢忘本。
　侄子 明德 顿首`,
    source: "梅州侨批文化研究中心公开文献",
    voiceAudio: null,
  },
] as const;

export const MUSEUM_LETTERS: readonly MuseumLetter[] = [
  {
    id: "ye-heren",
    author: "叶和仁",
    recipient: "母亲",
    traditional: ARCHIVAL_LETTERS[0]!.originalText,
    modern: ARCHIVAL_LETTERS[0]!.modernText,
    source: ARCHIVAL_LETTERS[0]!.source,
    voiceAudio: ARCHIVAL_LETTERS[0]!.voiceAudio,
  },
  {
    id: "lin-ahfa",
    author: "林阿发",
    recipient: "妻子",
    traditional: ARCHIVAL_LETTERS[1]!.originalText,
    modern: ARCHIVAL_LETTERS[1]!.modernText,
    source: ARCHIVAL_LETTERS[1]!.source,
    voiceAudio: ARCHIVAL_LETTERS[1]!.voiceAudio,
  },
  {
    id: "zhang-mingde",
    author: "张明德",
    recipient: "叔父",
    traditional: ARCHIVAL_LETTERS[2]!.originalText,
    modern: ARCHIVAL_LETTERS[2]!.modernText,
    source: ARCHIVAL_LETTERS[2]!.source,
    voiceAudio: ARCHIVAL_LETTERS[2]!.voiceAudio,
  },
] as const;

export const ENDING_ASSETS = {
  background: "/images/ending/storm-bg.svg",
  paperTexture: "/images/ending/paper-texture.svg",
  waveSfx: "/audio/sfx/ending-wave.mp3",
  openSfx: "/audio/sfx/letter-open.mp3",
} as const;

export const ENDING_SUBTITLES = {
  win: (kebi: number) =>
    `你让 ${kebi} 个客家人的牵挂回了家。侨批于 2013 年入选《世界记忆名录》。`,
  lose: (kebi: number) =>
    kebi > 0
      ? `风浪卷走了归途，但 ${kebi} 封客批已被护在怀中。侨批于 2013 年入选《世界记忆名录》。`
      : "风浪卷走了归途，但寨子的牵挂仍在。侨批于 2013 年入选《世界记忆名录》。",
} as const;

/** Local fallback pool when AI digital-letter generation fails — PRD §6.13. */
export const DIGITAL_LETTER_FALLBACKS: readonly DigitalLetterFallback[] = [
  {
    id: "fallback-01",
    title: "番客家书",
    body: "阿娘，儿在叻埠做工安稳，勿念。今寄银贰元，家中吃穿莫省。儿夜夜梦回乡井，待银两稍积，便买船票归唐侍奉。",
    tags: ["early", "sangzi"],
  },
  {
    id: "fallback-02",
    title: "番客家书",
    body: "贤妻安好。此番风浪大，信迟几日，万勿挂心。儿省下一口粮，多寄几文钱修井砌墙，望族中老少平安。",
    tags: ["mid", "homeRepair"],
  },
  {
    id: "fallback-03",
    title: "番客家书",
    body: "胞弟收阅。寨中可还安稳？儿这边橡胶园苦役，手磨出茧，心却念着祖屋炊烟。待得放工，再汇银信。",
    tags: ["struggle"],
  },
  {
    id: "fallback-04",
    title: "番客家书",
    body: "族长尊前：儿在外谨守本分，每得闲便念宗族教诲。今略汇薄银，烦请乡贤修缮祠堂门楣，不敢忘根本。",
    tags: ["clan", "homeRepair"],
  },
  {
    id: "fallback-05",
    title: "番客家书",
    body: "阿爸，儿梦见土楼天井又亮了灯。此信附银不多，先修歪了的门扇。儿还在攒，总有一天要踏回门槛。",
    tags: ["homeRepair", "hope"],
  },
  {
    id: "fallback-06",
    title: "番客家书",
    body: "吾妻，儿名已在船票上写下又划去三回。路费还差一截，且把信先寄回。你在乡中保重，莫让等候空了心肠。",
    tags: ["late", "ticket"],
  },
  {
    id: "fallback-07",
    title: "番客家书",
    body: "乡里诸亲：儿在海外得同乡照应，尚能温饱。所寄之银，一半奉母，一半请贤达修桥补路，略尽绵薄。",
    tags: ["sangzi", "community"],
  },
  {
    id: "fallback-08",
    title: "番客家书",
    body: "母亲，儿昨夜听潮声，像极韩江。此身虽远，心系桑梓。信到之日，便请水客代儿叩首。",
    tags: ["emotional"],
  },
] as const;

export const LETTERS = {
  archival: ARCHIVAL_LETTERS,
  museum: MUSEUM_LETTERS,
  fallbacks: DIGITAL_LETTER_FALLBACKS,
} as const;

export function pickDigitalLetterFallback(seed = Date.now()): DigitalLetterFallback {
  const index = Math.abs(seed) % DIGITAL_LETTER_FALLBACKS.length;
  return DIGITAL_LETTER_FALLBACKS[index]!;
}

export function archivalLetterById(id: string): ArchivalLetter | undefined {
  return ARCHIVAL_LETTERS.find((letter) => letter.id === id);
}

export function toAILetterResponse(fallback: DigitalLetterFallback) {
  return {
    title: fallback.title,
    body: fallback.body,
    source: "local-fallback",
  };
}
