# 踩过的坑与正确做法

## 1. localStorage 读写竞态（数据被初始值覆盖）

**现象**：导入 Excel 后去后台保存，回首页数据恢复成初始 100+ 条。

**根因**：React StrictMode 下挂载时 effect 双重执行；保存 effect 在 `moldsLoaded` 之前就把 `INITIAL_MOLDS` 覆盖回 localStorage，加载 effect 第二次执行读到的是被覆盖的数据。

**正确做法**：
```ts
const [moldsLoaded, setMoldsLoaded] = useState(false);
// 加载 effect 末尾 setMoldsLoaded(true)
// 保存 effect 开头 if (!moldsLoaded) return;
```
详见 `references/persistence.md`。

## 2. select 假象（value 不匹配时显示首选项）

**现象**：详情页"看起来已选产品"，但导出列为空。

**根因**：`<select value={undefinedOrEmpty}>` 没有匹配 option 时，浏览器显示第一个 option，React 状态仍是空。

**正确做法**：
1. 加「请选择」空占位 `<option value="">`，如实显示未选择。
2. 对"id 已失效但名称还在"的历史值，插入兜底 option 显示真实名称。
3. 选择时同步冗余 name 字段（`productId` ↔ `productName/productNameEn`）。

## 3. Excel 导入列名映射不完整

**现象**：导入后某字段（如产品材料）丢失，需重新手选。

**根因**：导出用了中文列名，导入只识别英文或旧列名。

**正确做法**：导出列名与页面标签一致，导入同时识别全部中英文（含全角括号、`(s)/(秒)` 等变体）并 `trim()`。改标签时必须同步检查导出列名 + 导入映射。

## 4. 受控输入 + 单位换算吞小数点

**现象**：单价改万元后，输入 `17.5` 会变成 `17`，小数点被实时格式化吃掉。

**根因**：受控 input 每次 onChange 都 `×10000` 再 `/10000` 回显，输入 `17.` 被 `Number("17.")` 截断。

**正确做法**：单位换算字段用非受控提交：
```tsx
<input
  type="number" step="0.01"
  key={`price-${mold.id}-${mold.unitPrice}`}  // 外部变化时重挂载
  defaultValue={mold.unitPrice ? (mold.unitPrice / 10000).toFixed(2) : ''}
  onBlur={e => onUpdate(mold.id, 'unitPrice', Math.round(Number(e.target.value) * 10000 * 100) / 100)}
/>
```

## 5. 配置驱动 vs 硬编码

**现象**：后台删了「针阀式热流道」，详情页下拉仍显示它。

**根因**：下拉选项硬编码在组件里。

**正确做法**：选项从 `config-store.ts` 读取（`runnerTypes.map(...)`），对不在配置中的现有值补兜底 option。

## 6. 字段改名断裂联动

**现象**：改 `折旧年数 → 寿命` 后，启用时间仍自动覆盖；改标签后 Excel 列名不一致。

**正确做法**：改字段名/语义时，同步检查五处——① 翻译字典 T；② 详情页；③ 新增弹窗；④ 导出列名；⑤ 导入映射 + 计算联动（如移除自动计算）。