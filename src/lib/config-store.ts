'use client';

import type { Product } from './types';
import { BUS, PRODUCTS as DEFAULT_PRODUCTS } from './mock-data';

// ── Defaults ──
export const DEFAULT_FACTORIES = ['LD', 'PMM', 'Winner', 'KDL', 'ZJKDL'];
export const DEFAULT_RUNNER_TYPES = ['热流道', '冷流道', '半热流道', '针阀式热流道'];
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
};

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

// ── Re-export helpers ──
export { BUS };