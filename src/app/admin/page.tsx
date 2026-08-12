'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  BUS,
  getFactories, setFactories,
  getProducts, setProducts,
  getRunnerTypes, setRunnerTypes,
  getMaterials, setMaterials,
  getLocations, setLocations,
  getSuppliers, setSuppliers,
} from '@/lib/config-store';
import type { Mold, Product } from '@/lib/types';

type Tab = 'factories' | 'products' | 'runners' | 'materials' | 'locations' | 'suppliers';
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
    factoryList: 'Factory List',
    productList: 'Product List',
    runnerList: 'Runner Type List',
    materialList: 'Material List',
    locationList: 'Location List',
    supplierList: 'Supplier List',
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
    importExcel: 'Import Excel',
    importSuccess: (n: number) => `Successfully imported ${n} molds`,
    importFail: 'Import failed, please check the file format',
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
    factoryList: '工厂列表',
    productList: '产品列表',
    runnerList: '流道类型列表',
    materialList: '产品材料列表',
    locationList: '所在地列表',
    supplierList: '供应商列表',
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
    importExcel: '导入Excel',
    importSuccess: (n: number) => `成功导入 ${n} 条模具数据`,
    importFail: '导入失败，请检查文件格式',
  },
};

const TABS: Tab[] = ['factories', 'products', 'runners', 'materials', 'locations', 'suppliers'];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('factories');
  const [lang, setLang] = useState<Lang>('en');
  const [factories, setFactoriesState] = useState<string[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [runnerTypes, setRunnerTypesState] = useState<string[]>([]);
  const [materials, setMaterialsState] = useState<string[]>([]);
  const [locations, setLocationsState] = useState<string[]>([]);
  const [suppliers, setSuppliersState] = useState<{ cn: string; en: string }[]>([]);
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
            {/* Import Excel button */}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = ev.target?.result;
                      const workbook = XLSX.read(data, { type: 'array' });
                      const sheetName = workbook.SheetNames[0];
                      const worksheet = workbook.Sheets[sheetName];
                      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

                      const importedMolds: Mold[] = jsonData.map((row, index) => {
                        const buValue = String(row['Business Unit'] || row['所属BU'] || row['BU'] || '');
                        let bu = BUS.find((b) => b.name === buValue || b.nameEn === buValue);
                        if (!bu) {
                          const buPrefix = buValue.match(/BU\d/)?.[0]?.toLowerCase();
                          bu = BUS.find((b) => b.id === buPrefix || b.shortName.toLowerCase() === buPrefix);
                        }
                        const code = String(row['Mold Code'] || row['模具编号'] || '');
                        if (!bu) {
                          const codePrefix = code.match(/M(\d)/)?.[1];
                          bu = BUS.find((b) => b.id === `bu${codePrefix}`);
                        }
                        const statusStr = String(row['Status'] || row['状态'] || 'active').toLowerCase();
                        const statusMap: Record<string, string> = {
                          'in use': 'active',
                          '在用': 'active',
                          'active': 'active',
                          'maintenance': 'maintenance',
                          '维修中': 'maintenance',
                          'retired': 'retired',
                          '已报废': 'retired',
                          'pending': 'pending',
                          'in design': 'pending',
                          '设计中': 'pending',
                        };
                        const unitPriceStr = String(row['Unit Price'] ?? row['单价'] ?? '0').replace(/[¥,]/g, '');
                        return {
                          id: code || `imported_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                          code: String(code),
                          name: String(row['Mold Name'] || row['模具名称'] || ''),
                          nameEn: String(row['Mold Name'] || row['模具名称'] || ''),
                          supplier: String(row['Supplier'] || row['供应商'] || ''),
                          supplierEn: String(row['Supplier'] || row['供应商'] || ''),
                          buId: bu?.id || 'bu1',
                          productId: '',
                          productName: String(row['Product'] || row['产品'] || ''),
                          productNameEn: String(row['Product'] || row['产品'] || ''),
                          factory: String(row['Factory'] || row['工厂'] || ''),
                          cavities: Number(row['Cavities'] || row['腔数'] || 1),
                          runnerType: String(row['Runner Type'] || row['流道类型'] || 'cold'),
                          cycleTime: Number(row['Cycle Time(s)'] || row['注塑周期'] || 30),
                          hourlyCapacity: Number(row['Hourly Output'] || row['每小时产能'] || 0),
                          oee: Number(row['OEE'] || 0.9),
                          oeeReason: String(row['OEE Reason'] || row['OEE原因'] || ''),
                          oeeReasonEn: String(row['OEE Reason'] || row['OEE原因'] || ''),
                          quantity: Number(row['Quantity'] || row['数量'] || 0),
                          unitPrice: Number(unitPriceStr) || 0,
                          totalPrice: Number(row['Quantity'] || row['数量'] || 0) * (Number(unitPriceStr) || 0),
                          lossCoefficient: Number(row['Mold Loss Coeff.'] ?? row['模具损耗系数'] ?? row['Loss Coefficient'] ?? 0.05),
                          lossReason: String(row['Loss Reason'] || row['损耗原因'] || ''),
                          lossReasonEn: String(row['Loss Reason'] || row['损耗原因'] || ''),
                          material: String(row['Material'] || row['材料'] || ''),
                          materialLossCoeff: Number(row['Material Loss Coeff.'] ?? row['材料损耗系数'] ?? row['Material Loss Coefficient'] ?? 0),
                          productWeight: Number(row['Product Weight(g)'] || row['产品克重'] || 0),
                          wasteWeight: Number(row['Waste Weight(g)'] || row['废料克重'] || 0),
                          sprueWeight: Number(row['Sprue Weight(g)'] || row['水口料重量'] || 0),
                          monthlyCapacity: Number(row['Monthly Capacity(10k)'] || row['月产能'] || 0),
                          moldLength: Number(row['Mold Length(mm)'] || row['模具长度'] || 0),
                          moldWidth: Number(row['Mold Width(mm)'] || row['模具宽度'] || 0),
                          moldThickness: Number(row['Mold Thickness(mm)'] || row['模具厚度'] || 0),
                          location: String(row['Location'] || row['所在地'] || ''),
                          moldType: (() => {
                            const mt = String(row['Mold Type'] || row['模具类型'] || '');
                            if (mt === 'trial' || mt === '试验模' || mt === 'Trial Mold') return 'trial';
                            return 'mass';
                          })(),
                          theoreticalHourlyCapacity: Number(row['Theoretical Hourly Output'] || row['理论每小时产能'] || 0),
                          actualHourlyCapacity: Number(row['Actual Hourly Output'] || row['实际每小时产能'] || 0),
                          theoreticalMonthlyCapacity: Number(row['Theoretical Monthly Capacity(10k)'] || row['理论月产能'] || 0),
                          actualMonthlyCapacity: Number(row['Actual Monthly Capacity(10k)'] || row['实际月产能'] || 0),
                          commissionDate: String(row['Activation Date'] || row['启用时间'] || ''),
                          depreciationYears: Number(row['Depreciation Years'] || row['折旧年数'] || 0),
                          status: (statusMap[statusStr] || 'active') as Mold['status'],
                          projectNumber: String(row['Project Number'] || row['项目编号'] || ''),
                        };
                      });

                      localStorage.setItem('molds', JSON.stringify(importedMolds));
                      alert(t.importSuccess(importedMolds.length));
                    } catch (err) {
                      alert(t.importFail);
                    }
                  };
                  reader.readAsArrayBuffer(file);
                };
                input.click();
              }}
              className="flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#4a7c59', color: '#4a7c59' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {t.importExcel}
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
  items,
  onChange,
}: {
  lang: Lang;
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
        <h3 className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>{t.supplierList}</h3>
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