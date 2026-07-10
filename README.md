# 客批（Kepi）· 一封归乡的信

AI 驱动的「微肉鸽（Roguelite）+ 情感自走棋」，题材取自客家先民下南洋、寄客批（侨批）归乡的故事。腾讯云黑客松「AI CAN DO IT · 游戏极限开发挑战赛」参赛作品，融合**公益**与**文化**双赛题，限时几天内完成的可玩 demo。

## 项目背景

客家侨批（海外番客寄回老家的"银信合一"家书）2013 年入选联合国教科文组织《世界记忆名录》，承载着近代客家人离乡背井、终身难返的家国乡愁——这是一个极强但很少被游戏化的文化母题。

传统国风自走棋（云顶之弈、金铲铲）靠历史名人的"全民数值共识"撑起棋子体系，客家文化没有这样一套全民英雄名录，但这恰是差异化的切入点：**客家棋子的等级不靠武力，靠宗族社会地位**（族长 > 风水先生 > 乡贤 > 教书先生 > 守卫 > 农夫），这套逻辑客家人有共鸣、外人也秒懂。

项目的设计原则是让**文化与公益等于机制，而非贴在机制上**：围龙屋是棋盘，宗族是羁绊，侨批是胜利目标；水客收信攒下的桑梓值用来修复家园，土楼从破败到焕然肉眼可见，机制本身就是公益叙事，不是贴皮的成就系统或宣传语。

## 核心体验一句话

> 在结合 AI 编排的归乡路线中，通过极限自走棋战斗与残酷典当抉择，体验客家先民的羁绊与乡愁。

一局约 10–12 分钟：

```txt
开局
  │
  ▼
归乡路线节点 1（共 6–8 个）
  │
  ├─ 战斗节点     → 自走棋战斗 → 结算
  ├─ 客批典当行   → 双向典当   → 资源 / 阈值变化
  └─ 篝火夜话     → AI 文本二选一 → 本地效果结算
  │
  ▼
终点胜负判定 → 风浪抓信结局演出
```

## 核心玩法拆解

### 1. 归乡路线（局外）

一张从"南洋"指向"故乡"的单向航线图，6–8 个节点，路线结构写死在本地，保证现场演出情绪曲线不崩盘。AI 不负责节点生成或跳转，只负责内容填充。

| 节点 | 玩法 | 本地职责 | AI 职责 |
|---|---|---|---|
| 战斗节点 | 进入核心自走棋局内 | 生成敌人、开战、结算胜负与资源 | 不参与 |
| 客批典当行 | 花钱买命，或卖命换钱 | 执行典当规则、资源变化、阈值变化 | 不参与 |
| 篝火夜话 | 纯文本二选一抉择 | 维护选项效果白名单并结算 | 仅生成文案 |

### 2. 核心战斗：死保水客

水客是产出「客批」与「桑梓值」的唯一核心单位——无战斗力、必须留在战场上、可被攻击击杀。玩家需要用肉身筑墙保护他，只有战斗胜利且水客存活，才产出客批与桑梓值。这把"胜利但没保护好最重要的人"变成一种情感惩罚，也是整局最核心的阵型张力。

每场战斗开局，天上随机飘落"乡音符"（开局 Buff），玩家通过摄像头伸手抓取来激活；无摄像头或识别失败时，降级为鼠标/触控点击，保证现场设备不稳定也能演示。

凑齐【宗族】最高级羁绊时，触发全屏 Juice 大招"落叶归根"：全体获得高额攻速与吸血，屏幕出现落叶、归潮、土楼灯火的全屏高光——这是宗族羁绊的终局爽点，不替代基本数值平衡。

### 3. 经济核心：双向典当

抛弃传统自走棋的利息/连胜连败系统，只留固定微薄底薪，想爆发就必须典当。典当有强仪式感：点击后全屏暗下，一封写着"家常"的客批出现在屏幕中央，玩家需长按鼠标或手势，看着信在火焰中一点点烧成灰烬，随后金币掉落。

| 策略分支 | 条件 | 代价 | 收益 | 定位 |
|---|---|---|---|---|
| A · 防守反击 | 手里 ≥ 1 封已获得的客批 | 扣除 1 封客批，通关进度倒退 | 立即获得 15 金币 | 残局苟活、临时补强 |
| B · 极致进攻 | 任何时候均可使用，哪怕 0 封信 | 通关所需客批阈值永久 +1 | 立即获得 35 金币 | 卖未来换当下，开局冲连胜 |

这是"卖血理财"：玩家赢在当下，但未来的路更长、更险。

### 4. 养成：土楼的反哺

自走棋战斗胜利且水客存活时产出桑梓值，自动注入土楼修复进度条，达成阈值后反哺后续战斗：

| 修复度 | 阶段 | UI 表现 | Gameplay 反哺 |
|---|---|---|---|
| 33% | 修缮 | 水井出水 | 全军开局获得最大生命值 20% 的阵型护盾 |
| 66% | 翻新 | 高墙立起 | 全军获得 15% 攻速加成 |
| 99% | 焕然 | 灯火通明 | 解锁"不屈"被动：全体一次致死免疫并无敌 1.5 秒 |

家园修复值只升不降——玩家亲眼看着自己守护的家，反过来庇护自己。

### 5. AI 叙事系统：只旁白，不判断

为了保障黑客松现场体验的绝对流畅，AI 调用必须遵守以下红线：

- 游戏主流程、状态判定、节点跳转 100% 由本地代码掌控，AI 不能生成、决定或修正任何关键状态。
- 本地代码只向 AI 传递预设标签（如 `Death_Count`、`Did_Pawn`、`Win_Streak`），AI 只负责根据标签输出一段纯文本机制旁白或篝火夜话文案。
- 客户端调用 AI 接口设 1.5 秒超时熔断，策划提前写死"惨胜 / 苟活 / 碾压"等本地兜底文案；一旦超时或报错，无缝顶上本地预设文案，不阻断画面——评委看到的是连续叙事，而不是等待和报错。

### 6. 结局演出

走到归乡路线终点后统一判定：**胜利 = 存续度 > 0 且手中客批 ≥ 最终阈值（基础 5 封 + 泣血透支惩罚附加数）**。触发"风浪"动画后，AI 生成的信件与真实馆藏客批漫天飞舞，子弹时间开启，玩家在风浪中拼命抓取（无摄像头时降级为 pointer），最终定格情感字幕：

> 在这场漫长的对抗中，你没能赢下所有的期冀，但你让一个客家人的牵挂，回了家。

详细规则见 [PRD V3.1](docs/kepi_PRD_V3.1.md)；项目从标准自走棋一路重构到现在的形态，演进过程见 PRD [V1.6](docs/kepi_PRD_V1.6.md) → [V2.0](docs/kepi_PRD_V2.0.md) → [V3.1](docs/kepi_PRD_V3.1.md)。

## 宣传物料

体积较大的物料存放在飞书云文档，仓库内只保留链接，详见 [press-kit/README.md](press-kit/README.md)：

- [Demo 视频](https://my.feishu.cn/file/PGbNbxFf7ogph5xJ6DJcDNbCnzb?from=from_copylink)
- [作品介绍 PPT](https://my.feishu.cn/file/LGr8b0zCcojxJCxGtwBcsxwLnhe?from=from_copylink)
- [作品海报](https://my.feishu.cn/file/YPbvb0oBsorvQyx2ip0c41eOn0b?from=from_copylink)

## 技术栈

Next.js 16（App Router）· TypeScript · Tailwind CSS v4 · shadcn/ui · Zustand · Zod · 原生 Canvas 2D 渲染 · Vitest · Playwright · pnpm

架构分层原则（详见 [架构与技术栈方案 v1](docs/kepi_architecture-and-tech-stack_v1.md)）：

- **规则只认 `engine`**：纯 TypeScript reducer，是战斗、经济、商店、关卡推进、胜负判定的唯一真相。
- **展示只认 `store`**：Zustand 只做 UI 镜像和 action 分发，不承载规则真相。
- **配置只认 `data`**：棋子、敌人、数值、文案全部是 TS 常量模块。
- **AI 只走 `api`**：走 `app/api/*` 代理，不直接在客户端调用第三方模型。
- **存档只走 `localStorage`**：不引入数据库；断网时可完整跑一局，AI 内容降级为本地文案池。

## 快速开始

环境要求：Node.js 22 LTS · pnpm 8+

```bash
pnpm install
cp .env.example .env.local   # 按需填写 AI 代理变量
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 常用脚本

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm lint` | ESLint 检查 |
| `pnpm format` | Prettier 格式化 |
| `pnpm test` | Vitest 单元测试 |
| `pnpm test:e2e` | Playwright 冒烟测试 |

## 目录结构

```txt
src/
  app/          # Next.js 路由、页面壳子、app/api/* 的 AI 代理
  components/   # React UI（game/ + ui/）
  engine/       # 纯 TS 规则引擎：battle / economy / shop / progression / stateMachine / support
  store/        # Zustand 镜像层，只做 UI 镜像和 action 分发
  data/         # 棋子、敌人、关卡、数值、文案等静态配置
  lib/          # Zod schema、存档读写、AI 请求封装
  types/        # 跨层共享类型
public/
  images/       # 棋盘、立绘、UI、结局图
  audio/        # BGM、音效、语音
docs/           # PRD、架构、美术、素材与计划文档
press-kit/      # 对外物料链接（飞书）
tests/e2e/      # Playwright 测试
```

## 文档

### 产品与设计

- [PRD V3.1（最新）](docs/kepi_PRD_V3.1.md)
- [PRD V2.0](docs/kepi_PRD_V2.0.md)
- [PRD V1.6](docs/kepi_PRD_V1.6.md)
- [关卡交互设计 v1](docs/kepi_level-interaction-design_v1.md)
- [UI 设计规范 v1](docs/kepi_ui-design-spec_v1.md)

### 架构与数据

- [架构与技术栈方案 v1](docs/kepi_architecture-and-tech-stack_v1.md)
- [目录职责与核心接口清单 v1](docs/kepi_directory-responsibilities-and-core-interfaces_v1.md)
- [数据结构清单 v2](docs/kepi_data-structures_v2.md)
- [数据结构清单 v1](docs/kepi_data-structures_v1.md)

### 美术与音频

- [美术风格设定 v1](docs/kepi_art-style-design_v1.md)
- [音频设计 v1](docs/kepi_audio-design_v1.md)
- [生成素材索引 v1](docs/kepi_generated-assets-index_v1.md)

### 素材与媒体计划

- [素材与媒体计划 v3](docs/kepi_assets-and-media-plan_v3.md)
- [素材与媒体计划 v2](docs/kepi_assets-and-media-plan_v2.md)
- [素材与媒体计划 v1](docs/kepi_assets-and-media-plan_v1.md)（含角色 / 敌人出图 prompt）

### 项目管理

- [TODO v3](docs/kepi_todo_v3.md)
- [TODO v2](docs/kepi_todo_v2.md)
- [TODO v1](docs/kepi_todo_v1.md)
- [文档模板与命名规范 v1](docs/kepi_document-conventions_v1.md)
