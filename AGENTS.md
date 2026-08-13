# AGENTS.md - 模具信息管理系统

## 项目概览
模具信息管理系统，用于管理注射器、采血针、胰岛素注射器、分血器等产品的模具数据。支持BU维度统计、模具筛选搜索、展开编辑详情、Excel导出等功能。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **导出**: xlsx
- **图表**: recharts

## 目录结构
```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面（模具列表 + 导航栏）
│   ├── admin/
│   │   └── page.tsx        # 后台管理页面（工厂/产品/流道/材料/所在地/供应商配置）
│   └── globals.css         # 全局样式
├── components/
│   └── Analysis.tsx        # 数据分析页面（7个分析模块）
├── lib/
│   ├── types.ts            # 类型定义（Mold, Product, BU, Factory）
│   ├── mock-data.ts        # 模拟数据（4BU, 5工厂, 30产品, 180模具）
│   ├── translator.ts       # 模具名称中→英自动翻译（词汇映射表+通用规则）
│   ├── config-store.ts     # 配置数据持久化（localStorage读写工厂/产品等列表）
│   └── utils.ts            # 通用工具函数
└── components/ui/          # shadcn/ui 组件库
```

## 核心功能
1. **BU卡片行**：4个BU卡片，显示模具总数/平均OEE/平均损耗率，点击筛选
2. **操作工具栏**：搜索框、工厂筛选、BU筛选、记录数、导出Excel
3. **模具列表表格**：编号/名称/供应商/工厂/腔数/OEE/状态/单价
4. **展开详情**：左右两栏，可编辑所有字段，自动保存
5. **自动计算**：每小时产能 = 腔数×(3600/周期)，合计价格 = 数量×单价
6. **高亮提醒**：OEE<0.9红色边框+原因填写，损耗系数≠0.05橙色边框+原因填写
7. **Excel导出**：导出当前筛选后的完整数据
8. **Excel导入**：导入更新后的Excel文件更新模具数据
9. **数据分析**：7个分析模块（投资概览/产能分布/OEE/损耗/供应商/产品工厂矩阵/异常预警）
10. **后台管理**：配置工厂/产品/流道/材料/所在地/供应商等选项

## 数据说明
- 4个BU：BU1注射器&针头、BU2采血针、BU3胰岛素注射器、BU4分血器
- 5个工厂：LD、PMM、Winner、KDL、ZJKDL
- 30款产品，每款5-8个模具，共约180个模具
- 数据在 `src/lib/mock-data.ts` 中通过种子随机数生成

## 开发命令
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm ts-check` - TypeScript 类型检查
- `pnpm lint` - ESLint 检查
