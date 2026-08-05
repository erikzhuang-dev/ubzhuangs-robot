// 模具信息管理系统 - 类型定义

export interface Mold {
  id: string;
  code: string;
  name: string;
  supplier: string;
  factory: string;
  buId: string;
  productId: string;
  cavities: number;
  runnerType: string;
  cycleTime: number; // 注塑周期s
  hourlyCapacity: number; // 每小时产能
  oee: number;
  oeeReason?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  lossCoefficient: number;
  lossReason?: string;
  material: string;
  materialLossCoefficient: number;
  productWeight: number; // 产品单只克重
  wasteWeight: number; // 废料克重
  status: 'active' | 'maintenance' | 'retired' | 'pending';
}

export interface Product {
  id: string;
  name: string;
  buId: string;
}

export interface BU {
  id: string;
  name: string;
  shortName: string;
}

export interface BUStats {
  buId: string;
  totalMolds: number;
  avgOEE: number;
  avgLossRate: number;
}

export type Factory = 'LD' | 'PMM' | 'Winner' | 'KDL' | 'ZJKDL';
