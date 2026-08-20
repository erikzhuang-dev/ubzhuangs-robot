# 持久化与配置存储

## localStorage 键规划

- `molds` — 业务数据（模具列表），数据结构为 `Mold[]`
- 配置项统一前缀 `config_`，与业务数据完全隔离：
  - `config_factories`
  - `config_products`
  - `config_runnerTypes`
  - `config_materials`
  - `config_locations`
  - `config_suppliers`
  - `config_assetOwnerships`

配置项存 `{ cn, en }[]`（中英文成对），避免语言切换信息丢失。

## config-store.ts 接口模式

```ts
export function getSuppliers(): { cn: string; en: string }[] {
  const raw = localStorage.getItem(KEYS.suppliers);
  if (!raw) return DEFAULT_SUPPLIERS;
  try { return JSON.parse(raw); } catch { return DEFAULT_SUPPLIERS; }
}
export function setSuppliers(list) {
  localStorage.setItem(KEYS.suppliers, JSON.stringify(list));
}
```

每加一个新配置项（如资产归属），按「DEFAULT 常量 + KEYS 键 + getter + setter」四件套补齐。

## 读写竞态防护（关键）

React StrictMode 开发模式下 effect 会执行两次，导致挂载时"保存 effect 先用初始数据覆盖，加载 effect 再读到脏数据"。

正确模式：

```ts
const [molds, setMolds] = useState<Mold[]>(INITIAL_MOLDS);
const [moldsLoaded, setMoldsLoaded] = useState(false);

// 加载（只在挂载后执行一次真实读取）
useEffect(() => {
  const saved = localStorage.getItem('molds');
  if (saved) {
    try { setMolds(JSON.parse(saved)); } catch {}
  }
  setMoldsLoaded(true);
}, []);

// 保存（moldsLoaded 之前绝不写）
useEffect(() => {
  if (!moldsLoaded) return;
  localStorage.setItem('molds', JSON.stringify(molds));
}, [molds, moldsLoaded]);
```

## 配置保存的隔离性

后台管理只写 `config_*` 键，绝不触碰 `molds`；首页只读 `config_*` 供下拉选项使用。二者互不覆盖，是数据不丢的关键。

## 兜底策略

- 所有 `localStorage.getItem` 都用 try/catch + 默认值兜底，防手改/损坏的 JSON。
- 配置读写失败时回退到 `DEFAULT_*`，不让页面白屏。