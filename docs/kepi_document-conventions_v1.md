# 《客批》文档模板与命名规范 v1

> 目的：统一仓库内文档、代码与素材命名，降低协作与检索成本

## 1. 文档命名

### 1.1 格式

```txt
kepi_<主题>_<版本>.md
```

示例：

- `kepi_PRD_V1.6.md`
- `kepi_architecture-and-tech-stack_v1.md`
- `kepi_todo_v1.md`

### 1.2 版本后缀

- 产品需求：`V1.x`（大写 V）
- 技术 / 设计 / 计划文档：`_v1`、`_v2`（小写 v）
- 大版本迭代时递增，旧版保留不覆盖

### 1.3 文档头部模板

```markdown
# 《客批》<标题> v1

> 目的：<一句话说明本文档解决什么问题>
> 依据：<可选，链接到上游文档>
> 更新：<YYYY-MM-DD> — <变更摘要>
```

## 2. 代码目录命名

| 目录 | 职责 | 命名风格 |
|---|---|---|
| `src/app/` | 路由与 API | kebab-case 路由段 |
| `src/components/` | React UI | PascalCase 组件文件 |
| `src/engine/` | 纯 TS 引擎 | camelCase 模块 |
| `src/store/` | Zustand | `*Store.ts` |
| `src/data/` | 静态配置 | 复数名词模块 |
| `src/lib/` | 工具与 schema | 按子域拆分 |
| `src/types/` | 跨层类型 | `index.ts` 或领域名 |

## 3. 素材命名

根目录：`public/images/`、`public/audio/`

### 3.1 图片

```txt
public/images/<类别>/<kepi_主体>_<变体>.<ext>
```

类别：`board` | `characters` | `enemies` | `ui` | `ending`

示例：

- `public/images/characters/kepi_farmer_star1.png`
- `public/images/enemies/kepi_qianhai-stele.png`
- `public/images/board/kepi_tulou-stage2.png`

### 3.2 音频

```txt
public/audio/<类别>/kepi_<用途>.<ext>
```

类别：`bgm` | `sfx` | `voice`

## 4. 文档资产（docs/assets）

架构图、风格参考图等放在 `docs/assets/`，前缀 `kepi_`：

```txt
docs/assets/kepi_<主题>_<版本>.<svg|png|jpg|html>
```

## 5. 环境变量

- 模板：根目录 `.env.example`（可提交）
- 本地：`.env.local`（不提交）
- 服务端 AI 密钥仅出现在 `app/api/*`，禁止 `NEXT_PUBLIC_` 暴露

## 6. 测试文件

- 单元测试：与源文件同目录，`*.test.ts`
- E2E：`tests/e2e/*.spec.ts`

## 7. 相关文档

- [架构与技术栈 v1](kepi_architecture-and-tech-stack_v1.md)
- [目录职责与核心接口 v1](kepi_directory-responsibilities-and-core-interfaces_v1.md)
- [素材与媒体计划 v1](kepi_assets-and-media-plan_v1.md)（含角色 / 敌人出图 prompt）
- [美术风格设定 v1](kepi_art-style-design_v1.md)
