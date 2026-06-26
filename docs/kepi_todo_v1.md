# 《客批》TODO 文档 v1

> 目标：把 PRD、数据结构、架构设计落成可执行的开发清单
> 组织方式：按开发阶段推进，而不是按模块百科式罗列

## 0. 已确认的总前提

- 技术栈：`Next.js` + `App Router` + `TypeScript`
- 包管理器：`pnpm`
- Node.js：固定版本（推荐 22 LTS）
- 状态管理：`Zustand`
- 渲染：`React` + 原生 `Canvas 2D`
- 引擎：纯 `TS reducer`，唯一真相
- 配置：`src/data` 内的 `TS` 常量模块
- 校验：`Zod`
- 存档：`localStorage`
- AI：`app/api/*` 服务端代理
- 测试：`Vitest` + `Playwright`
- 部署：单包应用，Demo 优先，断网可玩
- 素材：独立素材计划文档（见 `kepi_assets-and-media-plan_v1.md`）
- 美术风格：独立风格设定文档（见 `kepi_art-style-design_v1.md`）

## 1. 交付目标

### P0

- 跑通一局完整主流程
- 可从开局进入对局，再进入结局
- 规则、数值、存档、AI 降级都可用
- 路演现场能稳定演示

### P1

- 视觉表现完整
- 调试效率足够高
- 核心流程有自动化测试兜底
- 架构边界清晰，方便后续继续开发

## 2. 开发阶段划分

### Phase 0 - 仓库与基础设施

- [x] 初始化 Next.js App Router 项目
- [x] 安装并配置 TypeScript
- [x] 配置 Tailwind CSS
- [x] 接入 shadcn/ui
- [x] 接入 Zustand
- [x] 接入 Zod
- [x] 接入 Vitest
- [x] 接入 Playwright
- [x] 配置 ESLint
- [x] 配置 Prettier
- [x] 建立 `src/` 分层目录
- [x] 建立 `public/` 素材目录
- [x] 建立 `src/data` 静态配置目录
- [x] 建立 `src/engine` 纯 TS 引擎目录
- [x] 建立 `src/store` 状态仓库目录
- [x] 建立 `src/lib` 工具与 schema 目录
- [x] 建立 `src/components` UI 目录
- [x] 建立 `docs/` 文档目录
- [x] 固定文档模板与命名规范
- [x] 建立 `.env.example` 环境变量模板
- [x] 固定美术风格基线与参考锚点
- [x] 整理角色 / 敌人出图 prompt 清单

### Phase 1 - 规则引擎骨架

- [x] 先搭最小引擎闭环：`GameState -> GameAction -> GameSnapshot`
- [x] 定义 `GameState`
- [x] 定义 `GameSnapshot`
- [x] 定义 `GameAction`
- [x] 定义 `Piece`
- [x] 定义 `Enemy`
- [x] 定义 `SupportUnit`
- [x] 定义 `BattleEvent`
- [x] 实现 `reduceGameState`
- [x] 实现 `stateMachine`
- [x] 实现 `battle` 子模块
- [x] 实现 `economy` 子模块
- [x] 实现 `shop` 子模块
- [x] 实现 `progression` 子模块
- [x] 实现基础 Zod schema
- [x] 为引擎写第一批单元测试

### Phase 2 - 静态数据与数值表

- [x] 落地棋子配置
- [x] 落地敌人配置
- [x] 落地关卡配置
- [x] 落地结局信件配置
- [x] 落地数值平衡表
- [x] 落地本地降级文案池
- [x] 统一字段命名
- [x] 对齐 PRD 与数据结构清单
- [x] 校验静态数据可被引擎消费
- [x] 对齐美术风格设定与资产命名
- [x] 输出角色 / 敌人 / 场景的素材引用清单

### Phase 3 - 对局主流程

- [x] 建立主游戏页面
- [x] 建立单页状态切换框架
- [x] 接入 Zustand 游戏镜像
- [x] 接入备战阶段
- [x] 接入商店刷新与购买
- [x] 接入人口与布阵
- [x] 接入自动战斗
- [x] 接入结算
- [x] 接入关卡推进
- [x] 接入胜负判定
- [x] 接入本机存档读写
- [x] 再接 AI 代理

### Phase 4 - Canvas 与 UI

- [x] 先搭 Canvas，后补 React UI
- [x] 搭建 Canvas 2D 分层结构
- [x] 实现棋盘渲染
- [x] 实现棋子渲染
- [x] 实现战斗特效层
- [x] 实现商店 UI
- [x] 实现面板 UI
- [x] 实现弹窗与提示
- [x] 实现调试页
- [x] 接入 Tailwind + CSS Variables 主题
- [x] 接入 shadcn/ui 基础组件
- [x] 接入土楼三阶段视觉
- [x] 接入角色 / 敌人立绘占位与正式图

### Phase 5 - AI 与结局

- [x] 实现 `app/api/ai` Route Handler
- [x] AI 数字客批作为唯一 P0 AI 点
- [x] 接入 AI 数字客批生成
- [x] 接入 AI 失败降级文案
- [x] 接入结局页信件展示
- [x] 接入结局手势/降级交互
- [x] 接入结局音频与素材
- [x] 接入真实馆藏侨批展示
- [x] 接入结局专用美术与字幕素材

### Phase 6 - 测试与收尾

- [ ] 先修主流程 bug，再补测试
- [ ] 补齐引擎单测
- [ ] 补齐 Playwright 冒烟测试
- [ ] 修复主流程 bug
- [ ] 调整数值手感
- [ ] 完成基础视觉统一
- [ ] 输出路演可演示版本
- [ ] 输出提交包

## 3. 当前待定项

- Phase 3 是否先打通存档，再接 AI

## 4. 进度口径

- `todo` 里的条目只表示“计划内任务”
- `done` 需要在代码、测试或文档中有明确结果
- `blocked` 只用于真实依赖阻塞
- 阶段之间可以有少量重叠，但主顺序不变
