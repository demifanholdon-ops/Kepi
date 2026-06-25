# 客批（Kepi）

AI 驱动的客家文化自走棋。

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
  app/          # Next.js 路由与 API
  components/   # React UI（game/ + ui/）
  engine/       # 纯 TS 规则引擎
  store/        # Zustand 镜像层
  data/         # 静态配置
  lib/          # schema、存档、AI 封装
  types/        # 跨层共享类型
public/
  images/       # 棋盘、立绘、UI、结局图
  audio/        # BGM、音效、语音
docs/           # PRD、架构、美术与计划文档
tests/e2e/      # Playwright 测试
```

## 文档

- [产品需求文档（PRD V1.6）](docs/kepi_PRD_V1.6.md)
- [数据结构清单 v1](docs/kepi_data-structures_v1.md)
- [架构与技术栈方案 v1](docs/kepi_architecture-and-tech-stack_v1.md)
- [目录职责与核心接口清单 v1](docs/kepi_directory-responsibilities-and-core-interfaces_v1.md)
- [TODO 文档 v1](docs/kepi_todo_v1.md)
- [文档模板与命名规范 v1](docs/kepi_document-conventions_v1.md)
- [美术风格设定 v1](docs/kepi_art-style-design_v1.md)
- [素材与媒体计划 v1](docs/kepi_assets-and-media-plan_v1.md)（含角色 / 敌人出图 prompt）
