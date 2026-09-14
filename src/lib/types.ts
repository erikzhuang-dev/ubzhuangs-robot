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
  moldWeight?: number; // 模具重量(kg)
  drawingNumber?: string; // 图纸编号
  location: string; // 所在地
  moldType?: string; // 模具类型：mass(量产模) / trial(试验模)
  theoreticalHourlyCapacity?: number; // 理论每小时产能
  actualHourlyCapacity?: number; // 实际每小时产能
  theoreticalMonthlyCapacity?: number; // 理论月产能(万)
  actualMonthlyCapacity?: number; // 实际月产能(万)
  commissionDate?: string; // 启用时间
  depreciationYears?: number; // 折旧年数
  lastRequestNo?: string; // 最近一次生效的修改申请单号
  assetOwnership?: string; // 资产归属
  assetOwnershipEn?: string; // 资产归属(英文)
  status: 'active' | 'maintenance' | 'retired' | 'pending';
}

/** 字段变更对（修改申请用） */
export interface FieldChange {
  field: string; // Mold 字段名，如 'cavities'
  label: string; // 中文字段名，如 '腔数'
  labelEn: string; // 英文字段名
  oldValue: string | number | null; // 台账原值（提交时快照）
  newValue: string | number | null; // 申请修改值
}

export type MoldRequestType = 'modify' | 'purchase';
export type MoldRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/** 申请单实体（修改申请 / 购买申请共用） */
export interface MoldRequest {
  id: string; // req_{ts}_{rand}
  requestNo: string; // REQ-M-YYYYMMDD-NNN / REQ-P-YYYYMMDD-NNN
  type: MoldRequestType;
  // ── 修改申请 ──
  moldId?: string; // 目标模具 id（修改类必填）
  moldCode?: string; // 冗余模具编号（防模具被删后显示空白）
  changes?: FieldChange[]; // 字段变更对
  // ── 购买申请 ──
  newMold?: Partial<Mold>; // 采购模具全字段草稿（通过时生成 id/编号）
  // ── 公共 ──
  reason: string; // 申请原因（必填）
  status: MoldRequestStatus;
  applicant: string; // 申请人姓名
  appliedAt: string; // 提交时间 ISO
  reviewer?: string; // 审批人（固定 'admin'）
  reviewedAt?: string; // 审批时间
  reviewComment?: string; // 审批意见（驳回时必填）
  resubmitOf?: string; // 重新提交时指向原单 id（追溯链）
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
