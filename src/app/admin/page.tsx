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
  getAssetOwnerships, setAssetOwnerships,
} from '@/lib/config-store';
import type { Product } from '@/lib/types';

type Tab = 'factories' | 'products' | 'runners' | 'materials' | 'locations' | 'suppliers' | 'assetOwnerships';
type Lang = 'en' | 'zh';

const translations = {
  en: {
    title: 'Admin Panel',
    subtitle: 'Manage dropdown options. Changes take effect after saving.',
    unsaved: 'Unsaved changes',
    save: 'Save',
    back: 'Back to Home',
    logout: 'Logout',
    factories: 'Factories',
    products: 'Products',
    runners: 'Runner Types',
    materials: 'Materials',
    locations: 'Locations',
    suppliers: 'Suppliers',
    assetOwnerships: 'Asset Ownership',
    factoryList: 'Factory List',
    productList: 'Product List',
    runnerList: 'Runner Type List',
    materialList: 'Material List',
    locationList: 'Location List',
    supplierList: 'Supplier List',
    assetOwnershipList: 'Asset Ownership List',
    add: '+ Add',
    chineseName: 'Chinese Name',
    englishName: 'English Name',
    empty: 'No data. Click "+ Add" to create.',
    bu: 'BU',
    loginTitle: 'Admin Login',
    username: 'Username',
    password: 'Password',
    loginBtn: 'Login',
    errorMsg: 'Invalid username or password',
    placeholderUser: 'Enter username',
    placeholderPass: 'Enter password',
    timeoutMsg: 'Session expired. Please log in again.',
  },
  zh: {
    title: '后台管理',
    subtitle: '管理下拉选项配置，修改后点击保存生效',
    unsaved: '有未保存的更改',
    save: '保存',
    back: '返回首页',
    logout: '退出登录',
    factories: '工厂',
    products: '产品',
    runners: '流道类型',
    materials: '产品材料',
    locations: '所在地',
    suppliers: '供应商',
    assetOwnerships: '资产归属',
    factoryList: '工厂列表',
    productList: '产品列表',
    runnerList: '流道类型列表',
    materialList: '产品材料列表',
    locationList: '所在地列表',
    supplierList: '供应商列表',
    assetOwnershipList: '资产归属列表',
    add: '+ 添加',
    chineseName: '中文名',
    englishName: '英文名',
    empty: '暂无数据，点击"+ 添加"新增',
    bu: 'BU',
    loginTitle: '后台管理登录',
    username: '用户名',
    password: '密码',
    loginBtn: '登录',
    errorMsg: '用户名或密码错误',
    placeholderUser: '请输入用户名',
    placeholderPass: '请输入密码',
    timeoutMsg: '登录已超时，请重新登录',
  },
};

const TABS: Tab[] = ['factories', 'products', 'runners', 'materials', 'locations', 'suppliers', 'assetOwnerships'];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('factories');
  const [lang, setLang] = useState<Lang>('en');
  const [factories, setFactoriesState] = useState<string[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [runnerTypes, setRunnerTypesState] = useState<string[]>([]);
  const [materials, setMaterialsState] = useState<string[]>([]);
  const [locations, setLocationsState] = useState<string[]>([]);
  const [suppliers, setSuppliersState] = useState<{ cn: string; en: string }[]>([]);
  const [assetOwnerships, setAssetOwnershipsState] = useState<{ cn: string; en: string }[]>([]);
  const [saved, setSaved] = useState(true);

  // Login state
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginChecked, setLoginChecked] = useState(false);
  const [timeoutMsg, setTimeoutMsg] = useState('');

  // Check login + timeout on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_logged_in');
    const lastActivity = sessionStorage.getItem('admin_last_activity');
    if (stored === 'true' && lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed > 20 * 60 * 1000) {
        sessionStorage.removeItem('admin_logged_in');
        sessionStorage.removeItem('admin_last_activity');
        setTimeoutMsg(translations[lang].timeoutMsg);
      } else {
        setLoggedIn(true);
      }
    }
    setLoginChecked(true);
  }, []);

  const handleLogin = () => {
    if (loginUser === 'admin' && loginPass === '123456') {
      sessionStorage.setItem('admin_logged_in', 'true');
      sessionStorage.setItem('admin_last_activity', Date.now().toString());
      setLoggedIn(true);
      setLoginError('');
      setTimeoutMsg('');
    } else {
      setLoginError(t.errorMsg);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_last_activity');
    setLoggedIn(false);
    setLoginUser('');
    setLoginPass('');
    setTimeoutMsg('');
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const t = translations[lang];

  useEffect(() => {
    if (loggedIn) {
      setFactoriesState(getFactories());
      setProductsState(getProducts());
      setRunnerTypesState(getRunnerTypes());
      setMaterialsState(getMaterials());
      setLocationsState(getLocations());
      setSuppliersState(getSuppliers());
      setAssetOwnershipsState(getAssetOwnerships());
    }
  }, [loggedIn]);

  // Auto-logout after 20 minutes of inactivity
  useEffect(() => {
    if (!loggedIn) return;

    const updateActivity = () => {
      sessionStorage.setItem('admin_last_activity', Date.now().toString());
    };

    // Update on user activity
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('mousemove', updateActivity);

    // Check every 30 seconds
    const interval = setInterval(() => {
      const lastActivity = sessionStorage.getItem('admin_last_activity');
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > 20 * 60 * 1000) {
          sessionStorage.removeItem('admin_logged_in');
          sessionStorage.removeItem('admin_last_activity');
          setLoggedIn(false);
          setTimeoutMsg(translations[lang].timeoutMsg);
          clearInterval(interval);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
      clearInterval(interval);
    };
  }, [loggedIn, lang]);

  if (!loginChecked) return null;

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#dce8d0' }}>
        <div className="w-full max-w-md rounded-2xl bg-white p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: '#2d3b2d' }}>{t.loginTitle}</h2>
            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="flex h-8 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e0e8dc', color: '#4a7c59' }}
            >
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
          </div>

          <div className="space-y-4">
            {timeoutMsg && (
              <div className="rounded-lg border px-4 py-3 text-sm font-medium" style={{ borderColor: '#f39c12', backgroundColor: '#fef9e7', color: '#b45309' }}>
                {timeoutMsg}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#2d3b2d' }}>{t.username}</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => { setLoginUser(e.target.value); setLoginError(''); setTimeoutMsg(''); }}
                onKeyDown={handleLoginKeyDown}
                placeholder={t.placeholderUser}
                className="w-full h-10 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#4a7c59]"
                style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#2d3b2d' }}>{t.password}</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => { setLoginPass(e.target.value); setLoginError(''); setTimeoutMsg(''); }}
                onKeyDown={handleLoginKeyDown}
                placeholder={t.placeholderPass}
                className="w-full h-10 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#4a7c59]"
                style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
              />
            </div>
            {loginError && (
              <p className="text-sm font-medium" style={{ color: '#e74c3c' }}>{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              className="h-10 w-full rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#4a7c59' }}
            >
              {t.loginBtn}
            </button>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="text-xs transition-colors hover:underline"
              style={{ color: '#6b7c6b' }}
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const markDirty = () => setSaved(false);

  const handleSave = () => {
    setFactories(factories);
    setProducts(products);
    setRunnerTypes(runnerTypes);
    setMaterials(materials);
    setLocations(locations);
    setSuppliers(suppliers);
    setAssetOwnerships(assetOwnerships);
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
            <h1 className="text-xl font-bold" style={{ color: '#2d3b2d' }}>{t.title}</h1>
            <p className="mt-0.5 text-xs" style={{ color: '#6b7c6b' }}>{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e0e8dc', color: '#4a7c59' }}
            >
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
            {!saved && (
              <span className="text-xs font-medium text-orange-500">{t.unsaved}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saved}
              className="h-9 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: saved ? '#ccc' : '#4a7c59', color: saved ? '#999' : '#fff' }}
            >
              {t.save}
            </button>
            <Link
              href="/"
              className="flex h-9 items-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e0e8dc', color: '#4a7c59' }}
            >
              {t.back}
            </Link>
            <button
              onClick={handleLogout}
              className="flex h-9 items-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-red-50"
              style={{ borderColor: '#e0e8dc', color: '#e74c3c' }}
            >
              {t.logout}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {TABS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: tab === key ? '#4a7c59' : '#fff',
                color: tab === key ? '#fff' : '#2d3b2d',
                border: tab === key ? 'none' : '1px solid #e0e8dc',
              }}
            >
              {t[key]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {tab === 'factories' && (
            <StringList
              title={t.factoryList}
              lang={lang}
              items={factories}
              onAdd={() => addItem(factories, setFactoriesState)}
              onUpdate={(i, v) => updateItem(factories, setFactoriesState, i, v)}
              onRemove={(i) => removeItem(factories, setFactoriesState, i)}
            />
          )}
          {tab === 'products' && (
            <ProductList
              lang={lang}
              items={products}
              onChange={(v) => { setProductsState(v); markDirty(); }}
            />
          )}
          {tab === 'runners' && (
            <StringList
              title={t.runnerList}
              lang={lang}
              items={runnerTypes}
              onAdd={() => addItem(runnerTypes, setRunnerTypesState)}
              onUpdate={(i, v) => updateItem(runnerTypes, setRunnerTypesState, i, v)}
              onRemove={(i) => removeItem(runnerTypes, setRunnerTypesState, i)}
            />
          )}
          {tab === 'materials' && (
            <StringList
              title={t.materialList}
              lang={lang}
              items={materials}
              onAdd={() => addItem(materials, setMaterialsState)}
              onUpdate={(i, v) => updateItem(materials, setMaterialsState, i, v)}
              onRemove={(i) => removeItem(materials, setMaterialsState, i)}
            />
          )}
          {tab === 'locations' && (
            <StringList
              title={t.locationList}
              lang={lang}
              items={locations}
              onAdd={() => addItem(locations, setLocationsState)}
              onUpdate={(i, v) => updateItem(locations, setLocationsState, i, v)}
              onRemove={(i) => removeItem(locations, setLocationsState, i)}
            />
          )}
          {tab === 'suppliers' && (
            <SupplierList
              lang={lang}
              title={t.supplierList}
              items={suppliers}
              onChange={(v) => { setSuppliersState(v); markDirty(); }}
            />
          )}
          {tab === 'assetOwnerships' && (
            <SupplierList
              lang={lang}
              title={t.assetOwnershipList}
              items={assetOwnerships}
              onChange={(v) => { setAssetOwnershipsState(v); markDirty(); }}
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
  lang,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  lang: Lang;
  items: string[];
  onAdd: () => void;
  onUpdate: (idx: number, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const t = translations[lang];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>{title}</h3>
        <button
          onClick={onAdd}
          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#4a7c59' }}
        >
          {t.add}
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
          <div className="py-8 text-center text-xs" style={{ color: '#6b7c6b' }}>{t.empty}</div>
        )}
      </div>
    </div>
  );
}

// ── Product list (with BU) ──
function ProductList({
  lang,
  items,
  onChange,
}: {
  lang: Lang;
  items: Product[];
  onChange: (v: Product[]) => void;
}) {
  const t = translations[lang];
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
        <h3 className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>{t.productList}</h3>
        <button
          onClick={add}
          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#4a7c59' }}
        >
          {t.add}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((p, idx) => (
          <div key={p.id || idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.chineseName}
              value={p.name}
              onChange={(e) => update(idx, 'name', e.target.value)}
              className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            <input
              type="text"
              placeholder={t.englishName}
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
          <div className="py-8 text-center text-xs" style={{ color: '#6b7c6b' }}>{t.empty}</div>
        )}
      </div>
    </div>
  );
}

// ── Supplier list (cn + en) ──
function SupplierList({
  lang,
  title,
  items,
  onChange,
}: {
  lang: Lang;
  title: string;
  items: { cn: string; en: string }[];
  onChange: (v: { cn: string; en: string }[]) => void;
}) {
  const t = translations[lang];
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
        <h3 className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>{title}</h3>
        <button
          onClick={add}
          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#4a7c59' }}
        >
          {t.add}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.chineseName}
              value={s.cn}
              onChange={(e) => update(idx, 'cn', e.target.value)}
              className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            <input
              type="text"
              placeholder={t.englishName}
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
          <div className="py-8 text-center text-xs" style={{ color: '#6b7c6b' }}>{t.empty}</div>
        )}
      </div>
    </div>
  );
}