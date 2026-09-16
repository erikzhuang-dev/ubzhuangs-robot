'use client';

import type { Product } from './types';
import { BUS, PRODUCTS as DEFAULT_PRODUCTS } from './mock-data';

// ── Defaults ──
export const DEFAULT_FACTORIES = ['LD', 'PMM', 'Winner', 'KDL', 'ZJKDL'];
export const DEFAULT_RUNNER_TYPES = ['热流道', '冷流道'];
export const DEFAULT_MATERIALS = ['PP', 'PE', 'PC', 'ABS', 'PS', 'PVC', 'PMMA', 'POM', 'PA66', 'PBT'];
export const DEFAULT_LOCATIONS = ['苏州', '昆山', '东莞', '深圳', '宁波', '常州', '上海', '无锡', '台州', '厦门'];
export const DEFAULT_SUPPLIERS = [
  { cn: '精密模具科技', en: 'Precision Mold Tech' },
  { cn: '华创精密', en: 'Huachuang Precision' },
  { cn: '鑫达模具', en: 'Xinda Mold' },
  { cn: '恒信模具', en: 'Hengxin Mold' },
  { cn: '博瑞精工', en: 'Borui Precision' },
  { cn: '锐锋模具', en: 'Ruifeng Mold' },
  { cn: '金诚精密', en: 'Jincheng Precision' },
  { cn: '联合模具', en: 'United Mold' },
  { cn: '宏达精工', en: 'Hongda Precision' },
  { cn: '新纪元模具', en: 'New Era Mold' },
  { cn: '瑞丰精密', en: 'Ruifeng Precision' },
  { cn: '中模科技', en: 'Zhongmo Tech' },
  { cn: '东方精工', en: 'Dongfang Precision' },
  { cn: '永泰模具', en: 'Yongtai Mold' },
  { cn: '国盛精密', en: 'Guosheng Precision' },
];

export const DEFAULT_ASSET_OWNERSHIPS = [
  { cn: '千禧光', en: 'Qianxiguang' },
  { cn: '龙德', en: 'Longde' },
  { cn: '普昂', en: 'Puang' },
  { cn: '稳健', en: 'Wenjian' },
  { cn: '凯乐', en: 'Kaile' },
];

// ── Storage keys ──
const KEYS = {
  factories: 'config_factories',
  products: 'config_products',
  runnerTypes: 'config_runnerTypes',
  materials: 'config_materials',
  locations: 'config_locations',
  suppliers: 'config_suppliers',
  assetOwnerships: 'config_assetOwnerships',
  monthlyWorkDays: 'config_monthlyWorkDays',
  adminPin: 'config_admin',
  adminSession: 'config_admin_session',
  lastApplicant: 'config_last_applicant',
  pendingNotify: 'config_pending_notify',
  requestRetentionDays: 'config_request_retention',
};

// ── Formula settings defaults ──
export const DEFAULT_MONTHLY_WORK_DAYS = 25;

// ── Generic helpers ──
function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Public API ──

export function getFactories(): string[] {
  return load<string[]>(KEYS.factories, DEFAULT_FACTORIES);
}
export function setFactories(v: string[]) { save(KEYS.factories, v); }

export function getProducts(): Product[] {
  return load<Product[]>(KEYS.products, DEFAULT_PRODUCTS);
}
export function setProducts(v: Product[]) { save(KEYS.products, v); }

export function getRunnerTypes(): string[] {
  return load<string[]>(KEYS.runnerTypes, DEFAULT_RUNNER_TYPES);
}
export function setRunnerTypes(v: string[]) { save(KEYS.runnerTypes, v); }

export function getMaterials(): string[] {
  return load<string[]>(KEYS.materials, DEFAULT_MATERIALS);
}
export function setMaterials(v: string[]) { save(KEYS.materials, v); }

export function getLocations(): string[] {
  return load<string[]>(KEYS.locations, DEFAULT_LOCATIONS);
}
export function setLocations(v: string[]) { save(KEYS.locations, v); }

export function getSuppliers() {
  return load<{ cn: string; en: string }[]>(KEYS.suppliers, DEFAULT_SUPPLIERS);
}
export function setSuppliers(v: { cn: string; en: string }[]) { save(KEYS.suppliers, v); }

export function getAssetOwnerships() {
  return load<{ cn: string; en: string }[]>(KEYS.assetOwnerships, DEFAULT_ASSET_OWNERSHIPS);
}
export function setAssetOwnerships(v: { cn: string; en: string }[]) { save(KEYS.assetOwnerships, v); }

// ── Formula settings (monthly capacity parameters) ──
export function getMonthlyWorkDays(): number {
  const v = load<number>(KEYS.monthlyWorkDays, DEFAULT_MONTHLY_WORK_DAYS);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MONTHLY_WORK_DAYS;
}
export function setMonthlyWorkDays(v: number) { save(KEYS.monthlyWorkDays, v); }

// ── Approval / admin mode settings ──
export const DEFAULT_ADMIN_PIN = 'admin';

export function getAdminPin(): string {
  const v = load<string>(KEYS.adminPin, DEFAULT_ADMIN_PIN);
  return typeof v === 'string' && v.length > 0 ? v : DEFAULT_ADMIN_PIN;
}
export function setAdminPin(pin: string) { save(KEYS.adminPin, pin); }

export function isAdminMode(): boolean {
  const v = load<{ active?: boolean }>(KEYS.adminSession, { active: false });
  return v.active === true;
}
export function setAdminMode(active: boolean) { save(KEYS.adminSession, { active }); }

export function getLastApplicant(): string {
  const v = load<{ name?: string }>(KEYS.lastApplicant, {});
  return typeof v.name === 'string' ? v.name : '';
}
export function setLastApplicant(name: string) { save(KEYS.lastApplicant, { name }); }

/** 待审批提醒开关（普通模式下顶部也显示角标） */
export function getPendingNotify(): boolean {
  return load<boolean>(KEYS.pendingNotify, true);
}
export function setPendingNotify(v: boolean) { save(KEYS.pendingNotify, v); }

/** 申请单保留策略：0 = 全部保留；>0 = 终态单仅保留最近 N 天 */
export function getRequestRetentionDays(): number {
  const n = Number(load<number>(KEYS.requestRetentionDays, 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
export function setRequestRetentionDays(days: number) { save(KEYS.requestRetentionDays, days); }

// ── Re-export helpers ──
export { BUS };