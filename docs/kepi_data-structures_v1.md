# 《客批》数据结构 / 状态清单 v1（给 Murphy 直接建表）

> 基于 PRD V1.6。这是把 PRD 里散落的数值变量整理成可直接定义的数据结构，省去从文档抠数的时间。命名为建议，可改。

---

## 1. 全局对局状态 GameState

| 字段 | 类型 | 初始值 | 取值/规则 | 说明 |
|---|---|---|---|---|
| stage | int | 1 | 1–6 | 当前关卡 |
| totalStages | int | 6 | 固定 | 总关卡 |
| survival | int | 2 | 0–2，输一关-1，0=出局 | 寨子存续度（生存线） |
| kebi | int | 0 | 0–5，赢一关+1 | 客批数（胜场计数，达5可归乡） |
| kebiThreshold | int | 5 | 固定 | 通关阈值 |
| sangzi | int | 0 | ≥0 | 桑梓值（胜利客批随信带回的修家园资源；Demo 口径下同一结算中通常被乡贤消耗回 0） |
| homeRepair | int | 0 | 0–100，只升不降 | 家园修复值（温情线，驱动土楼三阶段） |
| gold | int | 10 | ≥0 | 金币 |
| population | int | 3 | 3–6 | 人口（上场棋位上限） |
| winStreak | int | 0 | — | 连胜计数（经济奖励用） |
| loseStreak | int | 0 | — | 连败计数 |
| result | enum | null | playing/win/lose | 对局结果 |

**派生/判定逻辑：**
- 土楼视觉态 = homeRepair<34 ? 破败 : homeRepair<67 ? 修缮 : 翻新
- 胜负判定见 §6 状态机

---

## 1A. 结算摘要 SettlementSummary

> 用于胜利结算过场和摘要卡。引擎只记录事实；过场层根据这些字段播放"水客送信→桑梓显现→乡贤修楼→土楼变化"。

| 字段 | 类型 | 说明 |
|---|---|---|
| won | boolean | 本关是否胜利 |
| kebiGained | int | 本关新增客批数；胜利固定为 1，失败为 0 |
| sangziGained | int | 本关随信带回的桑梓；Demo 口径胜利为 1 |
| sangziConsumed | int | 本关被乡贤用于修楼的桑梓；通常等于 sangziGained |
| homeRepairBefore | int | 结算前家园修复值 |
| homeRepairGained | int | 本关家园修复提升值；建议每份桑梓约 +15~17 |
| homeRepairAfter | int | 结算后家园修复值，封顶 100 |
| survivalLost | int | 本关损失存续度；失败为 1，胜利为 0 |

---

## 2. 棋子定义 Piece（武力棋子，进战斗区）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一ID |
| type | enum | farmer/guard/teacher/fengshui/patriarch（农夫/守卫/教书/风水/族长） |
| cost | float | 招募价：1/2/3/4/5（固定不变） |
| star | int | 星级 1/2/3（3个同名同星→合成+1星） |
| hp | int | 当前血量 |
| maxHp | int | 满血（升星×2） |
| atk | int | 攻击（升星×2） |
| atkSpeed | float | 攻速（升星不变） |
| armor | int | 护甲（升星不变） |
| range | enum | melee/mid/ranged |
| clan | string | 宗族羁绊归属（用于宗族羁绊判定） |
| position | {x,y} | 棋盘坐标（己方战斗区） |

**棋子基础数值表（1星）：**

| type | cost | hp | atk | atkSpeed | armor | range | 技能 |
|---|---|---|---|---|---|---|---|
| farmer 农夫 | 1 | 450 | 35 | 0.6 | 5 | melee | 每2回合产1金币 |
| guard 守卫 | 2 | 950 | 40 | 0.5 | 25 | melee | 前排扛伤 |
| teacher 教书先生 | 3 | 550 | 45 | 0.6 | 8 | mid | 相邻棋子攻速+10% |
| fengshui 风水先生 | 4 | 600 | 60 | 0.65 | 10 | ranged | 预知下波敌人 + 随机1友方攻击+20%一回合 |
| patriarch 族长 | 5 | 800 | 75 | 0.7 | 15 | mid | 全队增益光环 |

**伤害公式**：实际伤害 = 攻击力 × 100 / (100 + 护甲)
**升星**：star+1 → hp、atk 各 ×2；atkSpeed/armor/range 不变。

---

## 3. 公益后勤角色 SupportUnit（不进战斗区，开局固定2个）

| 字段 | 类型 | 说明 |
|---|---|---|
| type | enum | shuike（水客）/ xiangxian（乡贤） |
| slot | enum | 固定后勤槽位，不占 population |

**逻辑（非数值棋子，是功能位）：**
- 水客：每场胜利 → kebi+1；信附带的 sangzi 随信收回。纯运信，不消耗、不建设。
- 乡贤：同一胜利结算过场中 → 消耗本关 sangzi 转 homeRepair（建议每赢一关推进 homeRepair +15~17%，3关跨一档）。纯建设。
- 二者皆通过胜利结算过场表现：海上送信、交信、桑梓显现、修楼、跨阶段高亮。

---

## 4. 敌人 Enemy（遗忘军团）

| 字段 | 类型 | 说明 |
|---|---|---|
| type | enum | qianhaibei/luyinguanli/zhuzaiqi/ehushan/hongtouchuan/xiedouhuo（迁海碑/路引关吏/猪仔契/饿虎山/红头船/械斗火） |
| hp / atk / atkSpeed / armor / range | — | 同棋子结构 |
| stageScaling | float | 关卡强度系数：第1-2关×1 / 3-4关×1.5 / 5-6关×2 |

**每关敌人数量**：第1-2关3个 / 3-4关4个 / 5-6关5个（数量随关卡递增）。

---

## 5. 经济规则 Economy

| 项 | 规则 |
|---|---|
| 回合工资 | +5/关 |
| 利息 | 每存10金币+1/回合，上限+5（存50封顶） |
| 连胜/连败奖励 | 连续2/3/4+场额外+1/+2/+3 |
| 刷新商店 | 2金币/次 |
| 升人口 | 固定价（如4金币/级），上限6 |
| 卖出 | 1星=原价；高星≈合成成本折算 |

---

## 6. 对局状态机（胜负判定）

```
每关结束：
  if 本关胜:
     kebi += 1
     sangzi += 1
     if 乡贤在场:
        consumed = sangzi
        sangzi -= consumed
        homeRepair = min(100, homeRepair + consumed * 16)
     winStreak++; loseStreak=0
  else 本关负:
     survival -= 1
     loseStreak++; winStreak=0

  # 判定（顺序重要）
  if survival <= 0:            # 输到第2关
     result = lose → 救信结局
  elif stage == 6:             # 末关结束
     if kebi >= 5: result = win → 归乡结局
     else:         result = lose → 救信结局
  else:
     stage += 1 → 下一关
```

**关键不变式（防数值打架）：**
- 可容忍输N关，须满足：survival > N 且 (6−N) ≥ kebiThreshold。
- 当前 N=1：survival=2、threshold=5 → 咬合 ✓。
- 客批只由胜场+1产生，任何加成不得改 kebi（只能改 sangzi）。
- homeRepair 只升不降（取历史最高，战败不回退）。
- sangzi 是修复过程资源，不是第二套货币；若乡贤在场，胜利结算后余额通常为 0，结算摘要负责展示"+1 → 已修缮"。

---

## 7. AI 接口（P0：数字客批）

| 项 | 说明 |
|---|---|
| 触发 | 每攒一封客批 / 结局展示沿途信件时 |
| 输入 | 本局战况变量（关数、胜负、homeRepair%、救起信数）+ 真实侨批语气样例 |
| 输出 | 几句番客口吻的家书文本（flavor，不作朗读主体） |
| 降级 | 弱网/超时 → 预置文案池随机取 |
| 红线 | 结局正式朗读用真实馆藏侨批原文，AI文本仅作沿途展示 |
