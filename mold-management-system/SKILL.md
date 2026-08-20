---
name: mold-management-system
description: 用于快速搭建"模具信息管理系统"这类数据密集型管理后台，覆盖 BU 维度统计、多维筛选搜索、展开编辑详情、配置驱动下拉框、中英文双语切换、Excel 导入导出、数据分析看板与后台配置管理；当用户需要构建含模具/设备/资产等实体台账、明细编辑、批量导入导出与统计看板的 Web 应用时使用。
---

# Mold Management System

## 概述

沉淀「模具信息管理系统」的完整实施套路：数据建模、页面信息架构、字段计算规则、配置驱动下拉、中英文双语、Excel 闭环、数据分析与后台管理，以及最容易踩的坑。可直接复用到模具、设备、资产、物料等"台账 + 明细编辑 + 批量导入导出"类管理后台。

核心交付目标：让智能体少走弯路，一次把数据一致性（页面 ↔ 配置 ↔ Excel ↔ 存储）做对。

## 何时使用

- 用户要做一个模具/设备/资产/物料等实体的信息管理系统或台账
- 需求包含 BU/部门维度统计卡片、搜索 + 多维筛选、清单表格、展开编辑详情
- 需要 Excel 导入导出（含中英文双列名）
- 需要中英文界面切换、配置驱动的下拉选项（供应商/材料/所在地/归属等）
- 需要镜像一个已经成型的数据管理后台的字段与交互

## 技术栈约定

- Framework: Next.js 16 (App Router, 默认 `--src-dir`)
- Core: React 19 + TypeScript 5
- UI: shadcn/ui + Tailwind CSS 4
- 导出/导入: xlsx (`XLSX.read` / `XLSX.utils` / `writeFile`)
- 图表: recharts
- 持久化: 纯前端 localStorage（配置与数据分离存储，见 `references/persistence.md`）

## 目录结构

```
src/
├── app/
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 主页面（BU卡片 + 工具栏 + 清单 + 详情）
│   ├── admin/page.tsx    # 后台配置管理
│   └── globals.css
├── components/
│   └── Analysis.tsx      # 数据分析看板
├── lib/
│   ├── types.ts          # 类型定义（Mold/Product/BU/Factory）
│   ├── mock-data.ts      # 种子随机数据（可替代，见 data-model）
│   ├── translator.ts     # 中→英名称翻译（映射表 + 通用规则）
│   ├── config-store.ts   # 配置持久化（工厂/产品/材料/所在地/供应商/资产归属）
│   └── utils.ts
└── components/ui/        # shadcn/ui 组件库
```

## 实施步骤（按顺序）

1. **数据建模**：先读 `references/data-model.md`，确定实体字段、枚举、计算字段。关键原则：凡是"选中后想在各处一致复用"的枚举（供应商、材料、所在地、资产归属、流道类型、产品）一律走配置驱动，不硬编码进组件。

2. **设计规范**：按 `references/design-tokens.md` 落地 DESIGN.md，先定视觉基调再写 UI（医疗器械类产品推荐浅绿中性、大圆角、柔和阴影）。

3. **主页面信息架构**（`page.tsx`）：
   - 顶部 BU 卡片行（总数/均值 + 点击筛选）
   - 工具栏：搜索（名称/供应商/编号/项目号）+ 工厂/BU 筛选 + 记录数 + 导出/导入/新增按钮
   - 清单表格：可展开行，行尾漏填黄点提示
   - 展开详情：左右两栏，失焦自动保存，高亮提醒（OEE、损耗系数）

4. **计算逻辑**：统一放进 `references/data-model.md` 的"计算公式"一节，更新/新增/导入三处共用同一套公式，避免口径漂移。

5. **配置驱动下拉**：后台管理可增删选项，详情页/新增弹窗从配置读取；对不在配置中的历史值做"兜底 option"保留，避免数据丢失。

6. **中英文双语**：翻译字典集中在 `page.tsx` 的 `T` 对象，`lang` state 切换；名称类字段存 `xxx` + `xxxEn` 双字段，中文输入时用 `translator.ts` 自动补英文。

7. **Excel 闭环**：导出列名与页面标签一致（中/英），导入同时兼容中英文双列名并 `trim`，详见 `references/excel.md`。

8. **数据分析与后台管理**：Analysis 7 模块（投资/产能/OEE/损耗/供应商/产品工厂矩阵/异常预警）；后台管理用 tab 分区，复用同一个中英文双列表单组件。

## 资源索引

- `references/data-model.md`：实体字段字典、枚举值、计算公式、mock 数据生成思路。**涉及字段增删、计算口径、枚举值时必读**。
- `references/design-tokens.md`：视觉基调与 Design Tokens。**调整 UI 样式、配色、字体、间距前先读**。
- `references/excel.md`：列名映射表、导入兜底、单位换算（万元）、导出冗字段兜底策略。**涉及导入导出、列名或单位变更时必读**。
- `references/pitfalls.md`：本项目踩过的 6 个坑与正确做法。**实现任何数据持久化、下拉框、受控输入前必读**。
- `references/persistence.md`：localStorage 键规划与读写竞态防护。**涉及数据加载/保存逻辑时必读**。

## 注意事项

- 所有下拉选项严禁硬编码进组件，必须从 `config-store.ts` 读取，否则后台删除后前端仍显示旧项。
- 详情页/新增弹窗任何"仅更新 id"的选择器，必须同步写冗余的 name 字段（如选产品同步 productName/productNameEn）。
- 导出数据时"按 id 到配置里查 name"必须带冗余字段兜底，防止配置与数据失配时导出空白。
- 中英文字段成对出现（`supplier/supplierEn`、`assetOwnership/assetOwnershipEn` 等），切换语言时的显示/回填都要成对处理。
- 不要引入后端/数据库，本项目定位纯前端 + localStorage，除非用户明确要求。