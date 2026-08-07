'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BUS,
  getFactories, setFactories,
  getProducts, setProducts,
  getRunnerTypes, setRunnerTypes,
  getMaterials, setMaterials,
  getLocations, setLocations,
  getSuppliers, setSuppliers,
} from '@/lib/config-store';
import type { Product } from '@/lib/types';

type Tab = 'factories' | 'products' | 'runners' | 'materials' | 'locations' | 'suppliers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'factories', label: '工厂' },
  { key: 'products', label: '产品' },
  { key: 'runners', label: '流道类型' },
  { key: 'materials', label: '产品材料' },
  { key: 'locations', label: '所在地' },
  { key: 'suppliers', label: '供应商' },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('factories');
  const [factories, setFactoriesState] = useState<string[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [runnerTypes, setRunnerTypesState] = useState<string[]>([]);
  const [materials, setMaterialsState] = useState<string[]>([]);
  const [locations, setLocationsState] = useState<string[]>([]);
  const [suppliers, setSuppliersState] = useState<{ cn: string; en: string }[]>([]);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setFactoriesState(getFactories());
    setProductsState(getProducts());
    setRunnerTypesState(getRunnerTypes());
    setMaterialsState(getMaterials());
    setLocationsState(getLocations());
    setSuppliersState(getSuppliers());
  }, []);

  const markDirty = () => setSaved(false);

  const handleSave = () => {
    setFactories(factories);
    setProducts(products);
    setRunnerTypes(runnerTypes);
    setMaterials(materials);
    setLocations(locations);
    setSuppliers(suppliers);
    setSaved(true);
  };

  // ── List helpers ──
  const addItem = (list: string[], setter: (v: string[]) => void) => {
    setter([...list, '']);
    markDirty();
  };
  const updateItem = (list: string[], setter: (v: string[]) => void, idx: number, val: string) => {
    const next = [...list];
    next[idx] = val;
    setter(next);
    markDirty();
  };
  const removeItem = (list: string[], setter: (v: string[]) => void, idx: number) => {
    setter(list.filter((_, i) => i !== idx));
    markDirty();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#dce8d0' }}>
      <div className="mx-auto max-w-[960px] px-6 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#2d3b2d' }}>后台管理</h1>
            <p className="mt-0.5 text-xs" style={{ color: '#6b7c6b' }}>管理下拉选项配置，修改后点击保存生效</p>
          </div>
          <div className="flex items-center gap-3">
            {!saved && (
              <span className="text-xs font-medium text-orange-500">有未保存的更改</span>
            )}
            <button
              onClick={handleSave}
              disabled={saved}
              className="h-9 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: saved ? '#ccc' : '#4a7c59', color: saved ? '#999' : '#fff' }}
            >
              保存
            </button>
            <Link
              href="/"
              className="flex h-9 items-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e0e8dc', color: '#4a7c59' }}
            >
              返回首页
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: tab === t.key ? '#4a7c59' : '#fff',
                color: tab === t.key ? '#fff' : '#2d3b2d',
                border: tab === t.key ? 'none' : '1px solid #e0e8dc',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {tab === 'factories' && (
            <StringList
              title="工厂列表"
              items={factories}
              onAdd={() => addItem(factories, setFactoriesState)}
              onUpdate={(i, v) => updateItem(factories, setFactoriesState, i, v)}
              onRemove={(i) => removeItem(factories, setFactoriesState, i)}
            />
          )}
          {tab === 'products' && (
            <ProductList
              items={products}
              onChange={(v) => { setProductsState(v); markDirty(); }}
            />
          )}
          {tab === 'runners' && (
            <StringList
              title="流道类型列表"
              items={runnerTypes}
              onAdd={() => addItem(runnerTypes, setRunnerTypesState)}
              onUpdate={(i, v) => updateItem(runnerTypes, setRunnerTypesState, i, v)}
              onRemove={(i) => removeItem(runnerTypes, setRunnerTypesState, i)}
            />
          )}
          {tab === 'materials' && (
            <StringList
              title="产品材料列表"
              items={materials}
              onAdd={() => addItem(materials, setMaterialsState)}
              onUpdate={(i, v) => updateItem(materials, setMaterialsState, i, v)}
              onRemove={(i) => removeItem(materials, setMaterialsState, i)}
            />
          )}
          {tab === 'locations' && (
            <StringList
              title="所在地列表"
              items={locations}
              onAdd={() => addItem(locations, setLocationsState)}
              onUpdate={(i, v) => updateItem(locations, setLocationsState, i, v)}
              onRemove={(i) => removeItem(locations, setLocationsState, i)}
            />
          )}
          {tab === 'suppliers' && (
            <SupplierList
              items={suppliers}
              onChange={(v) => { setSuppliersState(v); markDirty(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Simple string list ──
function StringList({
  title,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (idx: number, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>{title}</h3>
        <button
          onClick={onAdd}
          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#4a7c59' }}
        >
          + 添加
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(idx, e.target.value)}
              className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#4a7c59]"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            <button
              onClick={() => onRemove(idx)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-8 text-center text-xs" style={{ color: '#6b7c6b' }}>暂无数据，点击"添加"新增</div>
        )}
      </div>
    </div>
  );
}

// ── Product list (with BU) ──
function ProductList({
  items,
  onChange,
}: {
  items: Product[];
  onChange: (v: Product[]) => void;
}) {
  const add = () => {
    onChange([...items, { id: `p${Date.now()}`, name: '', nameEn: '', buId: BUS[0].id }]);
  };
  const update = (idx: number, field: keyof Product, val: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>产品列表</h3>
        <button
          onClick={add}
          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#4a7c59' }}
        >
          + 添加
        </button>
      </div>
      <div className="space-y-2">
        {items.map((p, idx) => (
          <div key={p.id || idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="中文名"
              value={p.name}
              onChange={(e) => update(idx, 'name', e.target.value)}
              className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            <input
              type="text"
              placeholder="English name"
              value={p.nameEn || ''}
              onChange={(e) => update(idx, 'nameEn', e.target.value)}
              className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            <select
              value={p.buId}
              onChange={(e) => update(idx, 'buId', e.target.value)}
              className="h-9 w-24 rounded-lg border px-2 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            >
              {BUS.map((bu) => (
                <option key={bu.id} value={bu.id}>{bu.shortName}</option>
              ))}
            </select>
            <button
              onClick={() => remove(idx)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-8 text-center text-xs" style={{ color: '#6b7c6b' }}>暂无数据，点击"添加"新增</div>
        )}
      </div>
    </div>
  );
}

// ── Supplier list (cn + en) ──
function SupplierList({
  items,
  onChange,
}: {
  items: { cn: string; en: string }[];
  onChange: (v: { cn: string; en: string }[]) => void;
}) {
  const add = () => onChange([...items, { cn: '', en: '' }]);
  const update = (idx: number, field: 'cn' | 'en', val: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>供应商列表</h3>
        <button
          onClick={add}
          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#4a7c59' }}
        >
          + 添加
        </button>
      </div>
      <div className="space-y-2">
        {items.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="中文名"
              value={s.cn}
              onChange={(e) => update(idx, 'cn', e.target.value)}
              className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            <input
              type="text"
              placeholder="English name"
              value={s.en}
              onChange={(e) => update(idx, 'en', e.target.value)}
              className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            <button
              onClick={() => remove(idx)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-8 text-center text-xs" style={{ color: '#6b7c6b' }}>暂无数据，点击"添加"新增</div>
        )}
      </div>
    </div>
  );
}