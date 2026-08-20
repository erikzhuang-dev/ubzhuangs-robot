# Excel 导入导出规范

## 导出列名（中/英）

导出列名必须与页面标签保持一致，中文用中文列名、英文用英文列名。

| 中文列 | 英文列 | 说明 |
|--------|--------|------|
| 模具编号 / 模具名称 / 项目编号 / 所属产品 | Mold Code / Mold Name / Project No. / Product | 名称类 |
| 供应商 / 所属BU / 工厂 / 所在地 / 状态 | Supplier / BU / Factory / Location / Status | |
| 模具类型 / 资产归属 / 流道类型 / 产品材料 | Mold Type / Asset Ownership / Runner Type / Material | |
| 腔数 / 注塑周期(秒) / 单价(万元) / 数量(台) | Cavities / Cycle Time(s) / Unit Price(10k) / Quantity | 数值 |
| 单只克重(g) / 水口料重量(g) / 模具长/宽/厚(mm) | Product Weight(g) / Sprue Weight(g) / Mold L/W/H(mm) | |
| 理论/实际每小时产能 | Theoretical/Actual Hourly Output | |
| 理论/实际月产能(万) | Theoretical/Actual Monthly Capacity(10k) | |
| OEE / 损耗系数 / 寿命 / 启用时间 | OEE / Loss Coeff. / Lifetime / Commission Date | |

## 单位换算（万元）

- 单价存储单位是「元」，导出时 `unitPrice / 10000` 保留 2 位，列名「单价(万元)」。
- 导入时：列名为「单价(万元)/Unit Price(10k)」按 `×10000` 还原；兼容旧列「单价/Unit Price」按元直接读。

## 导入映射规则

1. 每个字段同时识别中文列名与英文列名，例如：
   ```ts
   const v = row['Product'] ?? row['产品'] ?? row['所属产品'];
   ```
2. 字符串字段统一 `String(v ?? '')` 并 `trim()`；数值字段 `Number(v ?? 0)`。
3. 生命周期字段（启用时间）保留原始字符串或日期对象转 `YYYY-MM-DD`。
4. 名称枚举字段（供应商/材料/所在地/资产归属）若导入只有中文或英文单侧值，需通过配置表补齐另一侧。
5. 项目编号/模具编号缺失时用模具编号兜底；OEE/损耗用 `??` 保留默认 0.9 / 0.05，避免 `||` 把合法 0 覆盖。

## 导出兜底

"按 id 到配置里查 name" 的字段（产品、BU 等）必须带冗余字段兜底：

```ts
const p = products.find(pp => pp.id === m.productId);
const label = lang === 'zh'
  ? (p?.name || m.productName || '')
  : (p?.nameEn || p?.name || m.productNameEn || m.productName || '');
```

配置与数据失配时绝不能让单元格空白。

## 导入数据一致性

- 导入后应在内存 `setMolds(...)` 并立即 `persistMolds`，不要在导入后静默丢失。
- 导入的模具 id 用 `imported_${index}_${Date.now()}` 避免与 mock id 冲突。