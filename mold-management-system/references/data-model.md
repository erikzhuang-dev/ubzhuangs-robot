# 数据模型与计算逻辑

## 实体与枚举

### Mold（模具）字段字典

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识（mock 用 `m1-1` 之类，导入用 `imported_${index}_${ts}`） |
| code | string | 模具编号，如 `M1-0004`（`M{bu序号}-{4位序号}`） |
| name / nameEn | string | 模具名称中/英文，中文输入自动翻译英文 |
| projectNumber | string | 项目编号，如 `PRJ-1234` |
| productId | string | 所属产品 id |
| productName / productNameEn | string | 产品名冗余（选择产品时同步） |
| supplier / supplierEn | string | 供应商中/英文（配置驱动） |
| buId | string | 所属 BU id（bu1~bu4） |
| factory | string | 工厂（LD/PMM/Winner/KDL/ZJKDL） |
| location | string | 所在地（配置驱动） |
| status | 'active' \| 'maintenance' \| 'retired' \| 'pending' | 状态 |
| moldType | 'mass-production' \| 'trial' | 模具类型 |
| assetOwnership / assetOwnershipEn | string | 资产归属中/英文（配置驱动） |
| cavities | number | 腔数 |
| runnerType | string | 流道类型（配置驱动） |
| cycleTime | number | 注塑周期（秒） |
| oee | number | OEE（0~1，默认 0.9） |
| oeeReason | string | OEE < 0.9 时需填原因 |
| lossCoefficient | number | 损耗系数（默认 0.05） |
| lossReason | string | 损耗系数 ≠ 0.05 时需填原因 |
| material | string | 产品材料（配置驱动） |
| materialLossCoeff | number | 材料损耗系数 |
| productWeight | number | 单只克重（g） |
| wasteWeight | number | 废料克重 |
| sprueWeight | number | 水口料重量（g） |
| moldLength / moldWidth / moldThickness | number | 模具长/宽/厚（mm） |
| unitPrice | number | 单价（元，存储单位；界面按万元显示） |
| quantity | number | 数量（台） |
| theoreticalHourlyCapacity | number | 理论每小时产能 |
| actualHourlyCapacity | number | 实际每小时产能 |
| theoreticalMonthlyCapacity | number | 理论月产能（万） |
| actualMonthlyCapacity | number | 实际月产能（万） |
| commissionDate | string | 启用时间（YYYY-MM-DD） |
| depreciationYears | number | 寿命（年，手动填写） |

### 其他实体

- **BU**：bu1 注射器&针头、bu2 采血针、bu3 胰岛素注射器、bu4 分血器
- **Product**：`{ id, name, nameEn, buId }`
- **Factory / Location / Supplier / Material / RunnerType / AssetOwnership**：均 `{ cn, en }`（配置项，后台可增删）

## 配置默认值

- 资产归属：千禧光/Qianxiguang、龙德/Longde、普昂/Puang、稳健/Wenjian、凯乐/Kaile
- 供应商、所在地、材料、流道类型默认值见 `config-store.ts` 的 `DEFAULT_*`

## 计算公式（全系统统一，更新/新增/导入三处共用）

```
理论每小时产能 = 腔数 × (3600 / 周期)        # 等价：腔数 × (60/周期) × 60
实际每小时产能 = 理论每小时产能 × OEE
实际 24H 产能  = 实际每小时产能 × 24         # 只读，实时计算不落库
理论月产能(万) = 理论每小时产能 × 24 × 25 / 10000
实际月产能(万) = 实际每小时产能 × 24 × 25 / 10000
合计金额(元)   = 数量 × 单价(元)
```

注意：单价的存储单位是「元」，界面/Excel 展示单位是「万元」（÷10000 / ×10000 换算），换算只在输入层与展示层做，存储与合计计算始终保持「元」，避免口径漂移。

## 状态颜色映射

- active（In Use/在用）→ 绿 `#4a7c59`
- maintenance（维护中）→ 红 `#e74c3c`
- retired（已报废）→ 灰 `#7f8c8d`
- pending（In Design/设计中）→ 黄 `#f39c12`

清单标签用 Tailwind 任意值类（`bg-[#...]`），环形图用十六进制直接填充，两处必须同源。

## 漏填判定（清单行尾黄点提示）

以下任一为空/≤0 即视为有漏填，悬停显示缺失字段名：

- 文本/选择：中文名、英文名、项目编号、所属产品、模具编号、供应商、所在地、资产归属、产品材料、流道类型、启用时间
- 数值（需 > 0）：腔数、注塑周期、单价、数量、模具长/宽/厚

## mock 数据生成思路

用固定随机种子（如 mulberry32）生成，保证每次刷新一致；4 BU × 每 BU 若干产品 × 每产品 5-8 个模具，共约 180 条；产品按 `buProducts[i % buProducts.length]` 循环分配。