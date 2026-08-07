// 模具信息管理系统 - 类型定义

export interface Mold {
  id: string;
  code: string;
  projectNumber?: string;
  name: string;
  nameEn?: string;
  supplier: string;
  supplierEn?: string;
  factory: string;
  buId: string;
  productId: string;
  productName?: string;
  productNameEn?: string;
  cavities: number;
  runnerType: string;
  cycleTime: number; // 注塑周期s
  hourlyCapacity: number; // 每小时产能
  oee: number;
  oeeReason?: string;
  oeeReasonEn?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  lossCoefficient: number;
  lossReason?: string;
  lossReasonEn?: string;
  material: string;
  materialLossCoeff?: number; // 材料损耗系数
  productWeight: number; // 产品单只克重
  wasteWeight: number; // 废料克重
  sprueWeight: number; // 水口料重量(g)
  monthlyCapacity: number; // 月产能(万)
  moldLength: number; // 模具尺寸-长(mm)
  moldWidth: number; // 模具尺寸-宽(mm)
  moldThickness: number; // 模具尺寸-厚(mm)
  location: string; // 所在地
  status: 'active' | 'maintenance' | 'retired' | 'pending';
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  buId: string;
}

export interface BU {
  id: string;
  name: string;
  nameEn?: string;
  shortName: string;
}

export interface BUStats {
  buId: string;
  totalMolds: number;
  avgOEE: number;
  avgLossRate: number;
}

export type Factory = 'LD' | 'PMM' | 'Winner' | 'KDL' | 'ZJKDL';
