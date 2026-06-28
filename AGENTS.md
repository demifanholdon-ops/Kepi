<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
 # 客批（Kepi）— 项目速览
 
 ## 项目简介
 
 「客批」是一款 **AI 驱动的客家文化自走棋**（auto-chess），面向浏览器运行。
 玩家在一局 6 关的自走棋中招募客家角色、布阵、自动战斗，沿途攒下"客批"（侨批/家书），最终在结局亲手接住一封真实侨批，听客家话朗读——用游戏体验百年客家侨民的乡愁与反哺。
 
 - **产品名称**：客批（Kepi）
 - **定位**：单人、短局、轻策略、强叙事自走棋
 - **赛道**：腾讯云黑客松（AI CAN DO IT · 游戏极限开发挑战赛），融合"公益 + 文化"双赛道
 - **PRD 当前版本**：V1.6
 
 ## 技术栈
 
 | 层面 | 选型 |
 |---|---|
 | 框架 | Next.js 16（App Router） |
 | UI | React 19 |
 | 语言 | TypeScript（strict） |
 | 样式 | Tailwind CSS 4 + shadcn/ui + CSS Variables |
 | 状态管理 | Zustand |
 | 校验 | Zod |
 | 画布 | 原生 Canvas 2D（分层渲染） |
 | 包管理 | pnpm 8 |
 | Node | 22 LTS |
 | 测试 | Vitest（单元）+ Playwright（E2E） |
 | 格式 | ESLint + Prettier |
 | AI 端 | `app/api/ai` 服务端代理（不暴露密钥给客户端） |
 | 存储 | localStorage（带 Zod schema 校验） |
 | 部署 | 单包应用，Demo 优先，断网可玩 |
 
 ## 目录结构与职责
 
 ```txt
 src/
   app/          # Next.js 路由与 API（含 /api/ai AI 代理）
   components/   # React UI（game/ 游戏组件 + ui/ 基础组件）
   engine/       # 纯 TS 规则引擎——唯一真相源（不可变、可测试）
     battle/     #   战斗模拟（tick 制，伤害公式：atk×100/(100+armor)）
     economy/    #   金币、利息、工资、连赢/连输奖励
     shop/       #   刷新、购买、卖出、人口扩容
     progression/#   胜负结算、关卡推进、结局判定
     stateMachine/#  阶段切换（prep → battle → settlement → ending）
   store/        # Zustand 镜像层（不写规则，只做 UI 镜像 + action 分发）
   data/         # 静态配置（棋子、敌人、关卡、平衡表、书信）
   lib/          # 工具库（schema、存档、AI 封装、游戏辅助函数）
   types/        # 跨层共享类型
 public/
   images/       # 棋盘、立绘、UI、结局图
   audio/        # BGM、音效、语音
 docs/           # PRD、架构、美术设定、TODO 等设计文档
 tests/e2e/      # Playwright 冒烟/全流程测试
 ```
 
 ## 核心架构原则
 
 ### 1. 引擎是唯一真相源
 - 所有游戏规则在 `src/engine/` 中实现，纯函数、不可变数据。
 - 核心入口：`reduceGameState(snapshot, action) → GameSnapshot`。
 - Engine 不依赖 React、不依赖 store、不联网。
 
 ### 2. Store 只做 UI 镜像
 - `gameStore.ts`：持有当前 `GameSnapshot`，把 UI 操作翻译成 `GameAction`，调 engine reducer。
 - `uiStore.ts`：纯 UI 状态（调试面板、弹窗、toast、设置面板、hover 等）。
 - `fxStore.ts`：特效/音效触发状态。
 - Store 不写规则，不推演数值。
 
 ### 3. Data 是引擎的配置源
 - `src/data/` 提供所有静态数据（棋子属性、敌人属性、平衡表、关卡定义、书信）。
 - 引擎从 data 读取配置，不做硬编码数值。
 - 修改数值只需改 data，不用碰引擎代码。
 
 ### 4. 数据流单向
 ```
 用户操作 → GameAction → reduceGameState() → GameSnapshot
   → Zustand gameStore → React 重新渲染 → Canvas 绘制 / UI 更新
   → localStorage 持久化
 ```
 
 ## 游戏核心概念
 
 ### 棋子（Piece）— 5 种，全部属客家宗族（hakka）
 
 | 棋子 | cost | 定位 |
 |---|---|---|
 | 农夫（farmer） | 1 | 廉价经济位，每 2 回合产 1 金币 |
 | 围屋守卫（guard） | 2 | 前排坦克，高护甲扛伤 |
 | 教书先生（teacher） | 3 | 相邻棋子攻速 +10% |
 | 风水先生（fengshui） | 4 | 远程输出，随机使 1 友方攻击 +20% 一回合 |
 | 族长（patriarch） | 5 | 中排核心输出，全队增益光环 |
 
 ### 敌人（Enemy）— 6 种历史阻力的拟人化
 迁海碑、路引关吏、猪仔契、饿虎山、红头船、械斗火——分别代表客家侨民归乡路上的真实历史障碍。
 
 ### 后援（Support）— 开局即驻，不占人口
 - **水客（shuike）**：纯运信收信，每胜客批 +1，信里自带桑梓值随信收回。
 - **乡贤（xiangxian）**：消耗桑梓值修家园，驱动土楼三阶段视觉变化。
 
 ### 双线与胜负判定
 - **客批（kebi）**：每赢一关 +1，纯胜场计数器，阈值 5。终关客批 ≥ 5 且完成 6 关 = 赢。
 - **生存度（survival）**：初始 2 条命，输一场扣 1，归零即出局（输）。
 - **家园修复（homeRepair）**：桑梓值驱动，土楼视觉 3 阶段（破败→修缮→翻新），只升不降，不参与输赢判定。
 
 ### 阶段流转
 ```
 prep（备战）→ battle（战斗）→ settlement（结算）→ prep → ... → ending（结局）
 ```
 - prep：30 秒自动开战超时
 - battle：全自动 tick 制，最多 40 秒
 - settlement：确认后推进下一关
 - ending：播结局动画 + 手势接信 + 真实侨批展示 + 客家话朗读
 
 ### 宗族（Clan）羁绊
 当前只保留 **客家宗族（hakka）** 一套主力羁绊，同族棋子达到 2/3/4 人时全员攻击 +10%/+20%/+30%。
 
 ## 开发流程
 
 ### 环境准备
 ```bash
 pnpm install
 cp .env.example .env.local   # 按需填写 AI 代理变量
 pnpm dev                      # http://localhost:3000
 ```
 
 ### 常用命令
 
 | 命令 | 说明 |
 |---|---|
 | `pnpm dev` | 开发服务器 |
 | `pnpm build` | 生产构建 |
 | `pnpm lint` | ESLint 检查 |
 | `pnpm lint:fix` | ESLint 自动修复 |
 | `pnpm format` | Prettier 格式化 |
 | `pnpm format:check` | Prettier 仅检查 |
 | `pnpm test` | Vitest 单元测试 |
 | `pnpm test:watch` | Vitest 监视模式 |
 | `pnpm test:coverage` | Vitest 覆盖率 |
 | `pnpm test:e2e` | Playwright E2E 测试 |
 | `pnpm test:e2e:ui` | Playwright UI 模式 |
 
 ### 实现顺序惯例
 1. 先定义类型（`src/types/`）
 2. 再定义数据（`src/data/`）
 3. 再实现引擎（`src/engine/`）
 4. 再接入 store（`src/store/`）
 5. 再接入 UI 组件（`src/components/`）
 6. 再接入 API（`src/app/api/`）
 7. 最后补测试和调试
 
 ### 测试策略
 - **Vitest**：覆盖 `src/engine/**` 和 `src/lib/**`，纯 Node 环境运行。
 - **Playwright**：E2E 冒烟测试 + 全流程跑通，Chromium 浏览器。
 - 测试文件命名：`*.test.ts`（单元）、`*.spec.ts`（E2E）。
 
 ## 命名规范
 
 ### 文档命名
 `kepi_<主题>_<版本>.md`，如 `kepi_PRD_V1.6.md`。
 文档头部模板见 [文档规范](docs/kepi_document-conventions_v1.md)。
 
 ### 代码命名
 - 组件：PascalCase（如 `GameShell.tsx`）
 - 引擎模块：camelCase（如 `battle/index.ts`）
 - Store：`*Store.ts`（如 `gameStore.ts`）
 - 路由：kebab-case（如 `app/debug/`）
 - 类型：`index.ts` 或按领域命名
 
 ### 素材命名
 `public/<类别>/kepi_<主体>_<变体>.<ext>`
 - 图片类别：board / characters / enemies / ui / ending
 - 音频类别：bgm / sfx / voice
 - 示例：`public/images/characters/kepi_farmer.png`
 
 ## 环境变量
 
 | 变量 | 说明 | 暴露给客户端 |
 |---|---|---|
 | `AI_API_KEY` | AI 服务密钥 | 否 |
 | `AI_API_BASE_URL` | AI 接口地址 | 否 |
 | `AI_MODEL` | AI 模型名 | 否 |
 | `KEPI_DEBUG` | 调试模式开关 | 否 |
 
 模板文件 `.env.example` 可提交；`.env.local` 不可提交。
 
 ## 存储键名
 
 | Key | 用途 |
 |---|---|
 | `kepi.snapshot` | 当前对局存档（JSON，经 Zod 校验） |
 | `kepi.settings` | 用户偏好（音量、手势等） |
 | `kepi.debug` | 调试面板偏好 |
 
 ## 关键约束
 
 - **禁止批量删除文件/目录**——不要使用 `Remove-Item -Recurse`、`rm -rf`、`del /s` 等命令。每次只删一个明确路径的文件。
 - 引擎代码不依赖 React、不联网、不操作 DOM。
 - Store 不放规则逻辑。
 - AI 密钥只出现在服务端 `app/api/*`，禁止以 `NEXT_PUBLIC_` 前缀暴露。
 - 静态数据一律放 `src/data/`，用 TS 常量模块，不用 JSON 或 YAML。
 - `.env.local` 永远不提交。
 
 ## 相关文档
 
 - [PRD V1.6](docs/kepi_PRD_V1.6.md) — 产品需求文档，包含完整设计、数值、叙事
 - [架构与技术栈](docs/kepi_architecture-and-tech-stack_v1.md)
 - [目录职责与核心接口](docs/kepi_directory-responsibilities-and-core-interfaces_v1.md)
 - [数据结构清单](docs/kepi_data-structures_v1.md)
 - [美术风格设定](docs/kepi_art-style-design_v1.md)
 - [素材与媒体计划](docs/kepi_assets-and-media-plan_v1.md)
 - [TODO 文档](docs/kepi_todo_v1.md) — 开发阶段与进度
 - [文档模板与命名规范](docs/kepi_document-conventions_v1.md)
