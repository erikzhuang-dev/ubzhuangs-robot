'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BUS, INITIAL_MOLDS } from '@/lib/mock-data';
import {
  getFactories, getProducts, getRunnerTypes, getMaterials, getLocations, getSuppliers, getAssetOwnerships, getMonthlyWorkDays,
  isAdminMode, setAdminMode, getLastApplicant, setLastApplicant, getAdminPin, getPendingNotify, setPendingNotify,
  getRequestRetentionDays,
} from '@/lib/config-store';
import {
  getRequests, addRequest, updateRequest, nextRequestNo, purgeRequestsByRetention, hasPendingRequestForMold, getRequestById,
} from '@/lib/request-store';
import type { Mold, Product, MoldRequest, MoldRequestStatus, FieldChange } from '@/lib/types';
import { translateMoldName } from '@/lib/translator';
import * as XLSX from 'xlsx';
import Analysis from '@/components/Analysis';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Lang = 'zh' | 'en';

/** Field label mapping for request diff display (zh/en) */
const FIELD_LABELS: Record<string, { zh: string; en: string }> = {
  name: { zh: '模具名称', en: 'Mold Name' },
  nameEn: { zh: '英文名称', en: 'Name (EN)' },
  projectNumber: { zh: '项目编号', en: 'Project Number' },
  internalNumber: { zh: '内部编号', en: 'Internal Number' },
  drawingNumber: { zh: '图纸编号', en: 'Drawing Number' },
  supplier: { zh: '供应商', en: 'Supplier' },
  supplierEn: { zh: '供应商(EN)', en: 'Supplier (EN)' },
  factory: { zh: '工厂', en: 'Factory' },
  buId: { zh: 'BU', en: 'BU' },
  productId: { zh: '产品', en: 'Product' },
  location: { zh: '所在地', en: 'Location' },
  status: { zh: '状态', en: 'Status' },
  material: { zh: '关联材料', en: 'Linked Material' },
  assetOwnership: { zh: '资产归属', en: 'Asset Ownership' },
  assetOwnershipEn: { zh: '资产归属(EN)', en: 'Asset Ownership (EN)' },
  runnerType: { zh: '流道类型', en: 'Runner Type' },
  moldType: { zh: '模具类型', en: 'Mold Type' },
  cavities: { zh: '腔数', en: 'Cavities' },
  cycleTime: { zh: '注塑周期(秒)', en: 'Cycle Time (s)' },
  oee: { zh: 'OEE', en: 'OEE' },
  oeeReason: { zh: 'OEE偏低原因', en: 'Reason for Low OEE' },
  oeeReasonEn: { zh: 'OEE偏低原因(EN)', en: 'Reason for Low OEE (EN)' },
  quantity: { zh: '数量', en: 'Quantity' },
  unitPrice: { zh: '单价(元)', en: 'Unit Price' },
  moldLength: { zh: '长(mm)', en: 'Length (mm)' },
  moldWidth: { zh: '宽(mm)', en: 'Width (mm)' },
  moldThickness: { zh: '厚(mm)', en: 'Thickness (mm)' },
  moldWeight: { zh: '模具重量(kg)', en: 'Mold Weight (kg)' },
  depreciationYears: { zh: '寿命(年)', en: 'Lifetime (year)' },
  sprueWeight: { zh: '水口料重量(g)', en: 'Sprue Weight (g)' },
  lossCoefficient: { zh: '损耗系数', en: 'Loss Factor' },
  lossReason: { zh: '损耗原因', en: 'Loss Reason' },
  lossReasonEn: { zh: '损耗原因(EN)', en: 'Loss Reason (EN)' },
  enabledDate: { zh: '启用日期', en: 'Enabled Date' },
  commissionDate: { zh: '启用日期', en: 'Enabled Date' },
  hourlyCapacity: { zh: '实际每小时产能', en: 'Actual Hourly Output' },
  productName: { zh: '产品名称', en: 'Product Name' },
  productNameEn: { zh: '产品名称(EN)', en: 'Product Name (EN)' },
};

// Translation dictionaries
const T = {
  zh: {
    title: '模具列表',
    pageTitle: '模具管理',
    pageSubtitle: '模具台账、资产归属、生命周期、状态、维护与工装记录',
    searchPlaceholder: '搜索模具名称/供应商/编号/项目号...',
    allFactories: '全部工厂',
    totalRecords: (n: number) => `共 ${n} 条`,
    exportExcel: '导出Excel',
    addMold: '添加',
    addMoldTitle: '添加模具',
    cancel: '取消',
    save: '保存',
    totalMolds: '模具总数',
    activeCount: '使用中数量',
    pendingCount: '设计中数量',
    maintenanceCount: '维护中数量',
    retiredCount: '已报废数量',
    // Table headers
    code: '模具编号',
    name: '模具名称',
    supplier: '供应商',
    factory: '工厂',
    cavities: '腔数',
    oee: 'OEE',
    status: '状态',
    unitPrice: '单价(元)',
    noData: '暂无匹配的模具数据',
    // Status
    active: '在用',
    maintenance: '维护中',
    retired: '已报废',
    pending: '设计中',
    // Detail - left
    basicInfo: '基本信息',
    moldCode: '模具编号',
    projectNumber: '项目编号',
    internalNumber: '内部编号',
    detailName: '名称',
    moldNameZh: '模具中文名',
    moldNameEnLabel: '模具英文名',
    detailSupplier: '供应商',
    belongBU: '所属BU',
    belongProduct: '所属产品',
    useFactory: '使用工厂',
    // Detail - right
    prodParams: '生产参数与成本',
    runnerType: '流道类型',
    cycleTime: '注塑周期(秒)',
    hourlyCapacity: '每小时产能',
    capacityUnit: '件/小时',
    oeeLowReason: 'OEE偏低原因',
    oeeLowPlaceholder: '请填写OEE偏低原因...',
    quantity: '数量(台)',
    unitPriceTax: '单价(元)',
    totalPrice: '合计金额',
    lossCoeff: '损耗系数',
    modifyReason: '损耗原因',
    lossPlaceholder: '请填写修改损耗系数的原因...',
    material: '关联材料',
    materialLossCoeff: '材料损耗系数',
    productWeight: '单只克重(g)',
    wasteWeight: '废料克重',
    sprueWeight: '水口料重量(g)',
    monthlyCapacity: '月产能(万)',
    moldSize: '模具尺寸(mm)',
    moldLength: '长',
    moldWidth: '宽',
    moldThickness: '厚',
    location: '所在地',
    moldWeight: '模具重量(kg)',
    drawingNumber: '图纸编号',
    // Runner types
    hotRunner: '热流道',
    coldRunner: '冷流道',
    semiHotRunner: '半热流道',
    valveHotRunner: '针阀式热流道',
    // Excel sheet name
    sheetName: '模具列表',
    // Analysis
    analysis: '分析',
    analysisTitle: '模具数据分析',
    moldByProduct: '各产品模具数量分布',
    moldByFactory: '各工厂模具数量分布',
    moldByStatus: '模具状态分布',
    moldByBU: '各BU模具数量分布',
    // Confirm dialog
    确认修改工厂: '确认修改工厂',
    确认修改工厂信息: '确认将此模具的工厂从',
    确认修改状态: '确认修改状态',
    确认修改状态信息: '确认将此模具的状态从',
    修改为: '修改为',
    确认: '确认',
    oeeValidationTitle: 'OEE校验',
    oeeValidationMsg: 'OEE低于0.9，必须填写原因后才能保存',
    oeeValidationOk: '确定',
    moldType: '模具类型',
    massProduction: '量产模',
    trialMold: '试验模',
    theoreticalOutput: '理论产出',
    actualOutput: '实际产出',
    hourlyOutputTheory: '理论每小时产能',
    hourlyOutputActual: '实际每小时产能',
    dailyOutputActual: '实际24H产能',
    hourlyOutputTheoryHint: '计算公式：腔数 × 3600 ÷ 周期(秒)',
    hourlyOutputActualHint: '计算公式：理论每小时产能 × OEE',
    dailyOutputActualHint: '计算公式：实际每小时产能 × 24',
    monthlyCapacityTheoryHint: '计算公式：理论每小时产能 × 24 × {days} ÷ 10000（{days}为每月工作天数）',
    monthlyCapacityActualHint: '计算公式：实际每小时产能 × 24 × {days} ÷ 10000（{days}为每月工作天数）',
    capacityUnitDay: '件/天',
    monthlyCapacityTheory: '理论月产能(万)',
    monthlyCapacityActual: '实际月产能(万)',
    depreciationYears: '寿命(年)',
    activationDate: '启用时间',
    assetOwnership: '资产归属',
    deleteMold: '删除',
    confirmDeleteTitle: '确认删除',
    confirmDeleteMsg: '确认要删除此模具吗？',
    confirmDelete: '删除',
    // ── Approval workflow ──
    adminPinError: '管理员口令错误',
    noChange: '没有检测到修改内容',
    pendingDupBlocked: '该模具已有待审批的申请，请等待管理员处理后再发起新申请',
    moldNameRequired: '请填写模具名称',
    draftBarTitle: (n: number) => `已暂存 ${n} 项修改（提交申请后生效）`,
    draftDiscard: '放弃修改',
    reqReasonLabel: '修改原因',
    reqReasonLabelP: '购买原因',
    reqReasonPlaceholderP: '请填写购买原因（必填）',
    reqReasonRequiredP: '请填写购买原因',
    reqReasonPlaceholder: '请填写修改原因（必填）',
    reqReasonRequired: '请填写修改原因',
    reqApplicantLabel: '申请人',
    reqApplicantPlaceholder: '请填写申请人（必填）',
    reqApplicantRequired: '请填写申请人',
    reqSubmitModify: '提交修改申请',
    reqSubmitPurchase: '提交购买申请',
    purchaseBtn: '购买申请',
    modReqTitle: '修改申请',
    modReqDesc: '提交后进入审批流程，管理员审批通过后计入修改清单',
    modTargetLabel: '目标模具',
    modTargetPlaceholder: '请选择模具',
    reqTargetRequired: '请选择目标模具',
    modTypeLabel: '修改内容',
    modTypeDimension: '尺寸修改',
    modTypeWear: '磨损维修',
    modTypeOther: '其他修改',
    modDescLabel: '修改说明',
    modDescPlaceholder: '请填写修改说明（选填）',
    modDescRequired: '其他修改请写清修改内容',
    purchaseFormTitle: '模具购买申请',
    requestInfoTitle: '购买申请信息（提交后进入审批流程）',
    pendingBanner: (no: string) => `该模具存在待审批的修改申请（${no}），台账数据未变更`,
    lastRequestLabel: '最近申请单',
    reqSubmitted: '申请已提交，等待管理员审批',
  },
  en: {
    title: 'Mold List',
    pageTitle: 'Mold Management',
    pageSubtitle: 'Mold registry, ownership, lifecycle, condition, maintenance, and tooling records',
    searchPlaceholder: 'Search name / supplier / code / project no...',
    allFactories: 'All Factories',
    totalRecords: (n: number) => `${n} records`,
    exportExcel: 'Export Excel',
    addMold: 'Add',
    addMoldTitle: 'Add Mold',
    cancel: 'Cancel',
    save: 'Save',
    totalMolds: 'Total Molds',
    activeCount: 'In Use',
    pendingCount: 'In Design',
    maintenanceCount: 'Maintenance',
    retiredCount: 'Retired',
    code: 'Mold Code',
    name: 'Mold Name',
    supplier: 'Supplier',
    factory: 'Factory',
    cavities: 'Cavities',
    oee: 'OEE',
    status: 'Status',
    unitPrice: 'Unit Price (¥)',
    noData: 'No matching mold data',
    active: 'In Use',
    maintenance: 'Maintenance',
    retired: 'Retired',
    pending: 'In Design',
    basicInfo: 'Basic Info',
    moldCode: 'Mold Code',
    projectNumber: 'Project Number',
    internalNumber: 'Internal Number',
    detailName: 'Name',
    moldNameZh: 'Mold Name (CN)',
    moldNameEnLabel: 'Mold Name (EN)',
    detailSupplier: 'Supplier',
    belongBU: 'Business Unit',
    belongProduct: 'Product',
    useFactory: 'Factory',
    prodParams: 'Production & Cost',
    runnerType: 'Runner Type',
    cycleTime: 'Cycle Time(s)',
    hourlyCapacity: 'Hourly Output',
    capacityUnit: 'pcs/hr',
    oeeLowReason: 'Reason for Low OEE',
    oeeLowPlaceholder: 'Please enter the reason for low OEE...',
    quantity: 'Quantity',
    unitPriceTax: 'Unit Price (¥)',
    totalPrice: 'Total Amount',
    lossCoeff: 'Loss Coeff.',
    modifyReason: 'Reasons for Loss',
    lossPlaceholder: 'Please enter the reason for modifying loss coefficient...',
    material: 'Linked Material',
    materialLossCoeff: 'Material Loss Coeff.',
    productWeight: 'Product Weight(g)',
    wasteWeight: 'Waste Weight(g)',
    sprueWeight: 'Sprue Weight(g)',
    monthlyCapacity: 'Monthly Capacity(10k)',
    moldSize: 'Mold Size(mm)',
    moldLength: 'Length',
    moldWidth: 'Width',
    moldThickness: 'Thickness',
    location: 'Location',
    moldWeight: 'Mold Weight (kg)',
    drawingNumber: 'Drawing Number',
    hotRunner: 'Hot Runner',
    coldRunner: 'Cold Runner',
    semiHotRunner: 'Semi-Hot Runner',
    valveHotRunner: 'Valve Hot Runner',
    sheetName: 'Mold List',
    analysis: 'Analysis',
    analysisTitle: 'Mold Data Analysis',
    moldByProduct: 'Molds by Product',
    moldByFactory: 'Molds by Factory',
    moldByStatus: 'Molds by Status',
    moldByBU: 'Molds by BU',
    confirmFactoryTitle: 'Confirm Factory Change',
    confirmFactoryMsg: 'Confirm changing factory from',
    confirmStatusTitle: 'Confirm Status Change',
    confirmStatusMsg: 'Confirm changing status from',
    to: 'to',
    oeeValidationTitle: 'OEE Validation',
    oeeValidationMsg: 'OEE is below 0.9, the reason must be filled in before saving',
    oeeValidationOk: 'OK',
    moldType: 'Mold Type',
    massProduction: 'Mass Production',
    trialMold: 'Trial Mold',
    theoreticalOutput: 'Theoretical Output',
    actualOutput: 'Actual Output',
    hourlyOutputTheory: 'Theoretical Hourly Output',
    hourlyOutputActual: 'Actual Hourly Output',
    dailyOutputActual: 'Actual 24H Output',
    hourlyOutputTheoryHint: 'Formula: Cavities × 3600 ÷ Cycle Time (s)',
    hourlyOutputActualHint: 'Formula: Theoretical Hourly Output × OEE',
    dailyOutputActualHint: 'Formula: Actual Hourly Output × 24',
    monthlyCapacityTheoryHint: 'Formula: Theoretical Hourly Output × 24 × {days} ÷ 10000 ({days} working days/month)',
    monthlyCapacityActualHint: 'Formula: Actual Hourly Output × 24 × {days} ÷ 10000 ({days} working days/month)',
    capacityUnitDay: 'pcs/day',
    monthlyCapacityTheory: 'Theoretical Monthly Capacity(10k)',
    monthlyCapacityActual: 'Actual Monthly Capacity(10k)',
    depreciationYears: 'Lifetime (year)',
    activationDate: 'Activation Date',
    assetOwnership: 'Asset Ownership',
    deleteMold: 'Delete',
    confirmDeleteTitle: 'Confirm Delete',
    confirmDeleteMsg: 'Are you sure you want to delete this mold?',
    confirmDelete: 'Delete',
    // ── Approval workflow ──
    adminPinError: 'Incorrect admin PIN',
    noChange: 'No modifications detected',
    pendingDupBlocked: 'This mold already has a pending request. Please wait for it to be reviewed before submitting a new one.',
    moldNameRequired: 'Mold name is required',
    draftBarTitle: (n: number) => `${n} change(s) staged (takes effect after request approval)`,
    draftDiscard: 'Discard',
    reqReasonLabel: 'Reason',
    reqReasonLabelP: 'Purchase Reason',
    reqReasonPlaceholderP: 'Please enter the purchase reason (required)',
    reqReasonRequiredP: 'Purchase reason is required',
    reqReasonPlaceholder: 'Reason for change (required)',
    reqReasonRequired: 'Reason for change is required',
    reqApplicantLabel: 'Applicant',
    reqApplicantPlaceholder: 'Your name (required)',
    reqApplicantRequired: 'Applicant name is required',
    reqSubmitModify: 'Submit Modify Request',
    reqSubmitPurchase: 'Submit Purchase Request',
    purchaseBtn: 'Purchase Request',
    modReqTitle: 'Modify Request',
    modReqDesc: 'Enters approval flow after submit; recorded in the modification log once approved',
    modTargetLabel: 'Target Mold',
    modTargetPlaceholder: 'Select a mold',
    reqTargetRequired: 'Please select a target mold',
    modTypeLabel: 'Modify Type',
    modTypeDimension: 'Dimension Modification',
    modTypeWear: 'Wear & Repair',
    modTypeOther: 'Other Modification',
    modDescLabel: 'Description',
    modDescPlaceholder: 'Description (optional)',
    modDescRequired: 'Please describe the modification for "Other"',
    purchaseFormTitle: 'Mold Purchase Request',
    requestInfoTitle: 'Purchase request info (enters approval flow after submit)',
    pendingBanner: (no: string) => `A pending modify request exists for this mold (${no}); registry data unchanged`,
    lastRequestLabel: 'Last Request',
    reqSubmitted: 'Request submitted, pending review',
  },
} as const;

/** Empty mold draft used to reset the add/purchase dialog */
const EMPTY_MOLD_DRAFT: Partial<Mold> = {
  name: '',
  nameEn: '',
  supplier: '',
  supplierEn: '',
  factory: 'LD',
  buId: BUS[0].id,
  productId: '',
  productName: '',
  productNameEn: '',
  cavities: 1,
  runnerType: '热流道',
  cycleTime: 30,
  hourlyCapacity: 120,
  oee: 0.9,
  oeeReason: '',
  oeeReasonEn: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  lossCoefficient: 0.05,
  lossReason: '',
  lossReasonEn: '',
  material: '',
  materialLossCoeff: 0.02,
  productWeight: 0,
  wasteWeight: 0,
  sprueWeight: 0,
  monthlyCapacity: 0,
  moldLength: 0,
  moldWidth: 0,
  moldThickness: 0,
  location: '',
  moldWeight: 0,
  drawingNumber: '',
  moldType: 'mass',
  assetOwnership: '',
  assetOwnershipEn: '',
  theoreticalHourlyCapacity: 0,
  actualHourlyCapacity: 0,
  theoreticalMonthlyCapacity: 0,
  actualMonthlyCapacity: 0,
  commissionDate: '',
  depreciationYears: 0,
  status: 'pending',
  projectNumber: '',
  internalNumber: '',
};

const STATUS_COLOR: Record<Mold['status'], string> = {
  active: 'bg-[#e8f5e9] text-[#4a7c59]',
  maintenance: 'bg-[#fde8e8] text-[#e74c3c]',
  retired: 'bg-[#f0f0f0] text-[#7f8c8d]',
  pending: 'bg-[#fff9e6] text-[#f39c12]',
};

const STATUS_CHART_COLOR: Record<Mold['status'], string> = {
  active: '#4a7c59',
  maintenance: '#e74c3c',
  retired: '#7f8c8d',
  pending: '#f39c12',
};

const RUNNER_NAME_MAP: Record<string, { zh: string; en: string }> = {
  '热流道': { zh: '热流道', en: 'Hot Runner' },
  '冷流道': { zh: '冷流道', en: 'Cold Runner' },
  '半热流道': { zh: '半热流道', en: 'Semi-Hot Runner' },
  '针阀式热流道': { zh: '针阀式热流道', en: 'Valve Hot Runner' },
};

export default function Home() {
  // Initialize molds from INITIAL_MOLDS (localStorage loaded in useEffect to avoid hydration mismatch)
  const [molds, setMolds] = useState<Mold[]>(INITIAL_MOLDS);
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [factoryFilter, setFactoryFilter] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modTargetMoldId, setModTargetMoldId] = useState('');
  const [modType, setModType] = useState<'dimensionRepair' | 'wearRepair' | 'other'>('dimensionRepair');
  const [modDesc, setModDesc] = useState('');
  const [modApplicant, setModApplicant] = useState('');
  const [modError, setModError] = useState('');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    moldId: string;
    field: 'factory' | 'status';
    oldValue: string;
    newValue: string;
    oldLabel: string;
    newLabel: string;
  } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [newMold, setNewMold] = useState<Partial<Mold>>(EMPTY_MOLD_DRAFT);

  // Configurable lists from admin panel
  const [factories, setFactories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [runnerTypes, setRunnerTypes] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ cn: string; en: string }[]>([]);
  const [assetOwnerships, setAssetOwnerships] = useState<{ cn: string; en: string }[]>([]);
  const [moldsLoaded, setMoldsLoaded] = useState(false);

  // ── Approval workflow state ──
  const [view, setView] = useState<'main' | 'analysis' | 'requests'>('main');
  const [adminMode, setAdminModeState] = useState(false); // hydrated on mount (avoid SSR mismatch)
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [requests, setRequests] = useState<MoldRequest[]>([]);
  // Detail-page draft edits (normal mode: edits are staged, not applied to registry)
  const [draftEdits, setDraftEdits] = useState<Record<string, Record<string, unknown>>>({});
  const [draftExpanded, setDraftExpanded] = useState(false);
  const [draftReason, setDraftReason] = useState('');
  const [draftApplicant, setDraftApplicant] = useState('');
  const [draftError, setDraftError] = useState('');
  // Purchase request (normal-mode add dialog)
  const [purchaseReason, setPurchaseReason] = useState('');
  const [purchaseApplicant, setPurchaseApplicant] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [notifyPending, setNotifyPending] = useState(false);
  const [showRequestToast, setShowRequestToast] = useState(false); // show pending badge in standard mode

  // Load molds from localStorage on mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('molds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Mold[];
        // Recalculate hourlyCapacity and monthlyCapacity with current formulas
        const recalculated = parsed.map((m: Mold) => ({
          ...m,
          sprueWeight: m.sprueWeight ?? 0,
          moldLength: m.moldLength ?? 0,
          moldWidth: m.moldWidth ?? 0,
          moldThickness: m.moldThickness ?? 0,
          location: m.location ?? '',
          moldWeight: m.moldWeight ?? 0,
          drawingNumber: m.drawingNumber ?? '',
          hourlyCapacity: Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee),
          monthlyCapacity: Math.round(Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee) * 24 * getMonthlyWorkDays() / 10000 * 100) / 100,
          theoreticalHourlyCapacity: Math.round(m.cavities * (60 / m.cycleTime) * 60),
          actualHourlyCapacity: Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee),
          theoreticalMonthlyCapacity: Math.round(Math.round(m.cavities * (60 / m.cycleTime) * 60) * 24 * getMonthlyWorkDays() / 10000 * 100) / 100,
          actualMonthlyCapacity: Math.round(Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee) * 24 * getMonthlyWorkDays() / 10000 * 100) / 100,
        }));
        setMolds(recalculated);
      } catch {
        // Ignore parse errors
      }
    }
    setMoldsLoaded(true);
    // ── Approval workflow hydration ──
    setAdminModeState(isAdminMode());
    purgeRequestsByRetention(getRequestRetentionDays());
    setRequests(getRequests());
    setDraftApplicant(getLastApplicant());
    setNotifyPending(getPendingNotify());
    // Load configurable lists
    setFactories(getFactories());
    setProducts(getProducts());
    setRunnerTypes(getRunnerTypes());
    setMaterials(getMaterials());
    setLocations(getLocations());
    setSuppliers(getSuppliers());
    setAssetOwnerships(getAssetOwnerships());
  }, []);

  // Save molds to localStorage whenever they change (only after initial load completes,
  // otherwise the mount render would overwrite imported data with INITIAL_MOLDS)
  useEffect(() => {
    if (!moldsLoaded) return;
    localStorage.setItem('molds', JSON.stringify(molds));
  }, [molds, moldsLoaded]);

  const t = T[lang];

  const statusLabel = useCallback(
    (s: Mold['status']) => T[lang][s],
    [lang],
  );

  // Display molds: merge staged draft edits in standard mode (approval workflow)
  const displayMolds = useMemo(() => {
    if (adminMode) return molds;
    return molds.map((m) => (draftEdits[m.id] ? { ...m, ...draftEdits[m.id] } : m));
  }, [molds, draftEdits, adminMode]);

  // Filtered molds
  const filteredMolds = useMemo(() => {
    return displayMolds.filter((m) => {
      if (selectedBU && m.buId !== selectedBU) return false;
      if (factoryFilter && m.factory !== factoryFilter) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        return (
          m.name.toLowerCase().includes(s) ||
          (m.nameEn || '').toLowerCase().includes(s) ||
          m.supplier.toLowerCase().includes(s) ||
          (m.supplierEn || '').toLowerCase().includes(s) ||
          m.code.toLowerCase().includes(s) ||
          (m.projectNumber || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [displayMolds, selectedBU, factoryFilter, searchText]);

  // BU stats
  const buStats = useMemo(() => {
    return BUS.map((bu) => {
      const buMolds = molds.filter((m) => m.buId === bu.id);
      const totalMolds = buMolds.length;
      const activeCount = buMolds.filter((m) => m.status === 'active').length;
      const pendingCount = buMolds.filter((m) => m.status === 'pending').length;
      const maintenanceCount = buMolds.filter((m) => m.status === 'maintenance').length;
      const retiredCount = buMolds.filter((m) => m.status === 'retired').length;
      return { buId: bu.id, totalMolds, activeCount, pendingCount, maintenanceCount, retiredCount };
    });
  }, [molds]);

  // Update mold field
  const updateMold = useCallback((id: string, field: keyof Mold, value: unknown) => {
    setMolds((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };
        // Auto-calculate hourly capacity when cavities or cycleTime changes
        if (field === 'cavities' || field === 'cycleTime') {
          const cavities = field === 'cavities' ? Number(value) : updated.cavities;
          const cycleTime = field === 'cycleTime' ? Number(value) : updated.cycleTime;
          if (cycleTime > 0) {
            const theoretical = Math.round(cavities * (60 / cycleTime) * 60);
            updated.theoreticalHourlyCapacity = theoretical;
            updated.actualHourlyCapacity = Math.round(theoretical * updated.oee);
            updated.hourlyCapacity = updated.actualHourlyCapacity;
            updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
            updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
            updated.monthlyCapacity = updated.actualMonthlyCapacity;
          }
        }
        if (field === 'hourlyCapacity') {
          const hc = Number(value);
          updated.monthlyCapacity = Math.round(hc * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
        }
        if (field === 'oee') {
          const oee = Number(value);
          const theoretical = Math.round(updated.cavities * (60 / updated.cycleTime) * 60);
          updated.theoreticalHourlyCapacity = theoretical;
          updated.actualHourlyCapacity = Math.round(theoretical * oee);
          updated.hourlyCapacity = updated.actualHourlyCapacity;
          updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
          updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
          updated.monthlyCapacity = updated.actualMonthlyCapacity;
        }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  }, []);

  // ── Approval workflow helpers ──
  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);

  // Numeric mold fields: coerce diff values back to numbers when applying
  const NUMERIC_MOLD_FIELDS = [
    'cavities', 'cycleTime', 'moldLength', 'moldWidth', 'moldThickness', 'moldWeight',
    'oee', 'depreciationYears', 'quantity', 'unitPrice', 'sprueWeight', 'lossCoefficient',
    'materialLossCoeff', 'productWeight', 'wasteWeight', 'hourlyCapacity',
  ];

  // Recalculate derived fields after applying an approved request patch
  const recalcDerived = useCallback((m: Mold): Mold => {
    const days = getMonthlyWorkDays();
    const updated = { ...m };
    if (updated.cycleTime > 0) {
      const theoretical = Math.round(updated.cavities * (60 / updated.cycleTime) * 60);
      updated.theoreticalHourlyCapacity = theoretical;
      updated.actualHourlyCapacity = Math.round(theoretical * updated.oee);
      updated.hourlyCapacity = updated.actualHourlyCapacity;
      updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * days / 10000 * 100) / 100;
      updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * days / 10000 * 100) / 100;
      updated.monthlyCapacity = updated.actualMonthlyCapacity;
    }
    updated.totalPrice = updated.quantity * updated.unitPrice;
    return updated;
  }, []);

  // MoldRow update wrapper: admin mode writes to registry; standard mode stages a draft
  const handleRowUpdate = useCallback(
    (id: string, field: keyof Mold, value: unknown) => {
      if (adminMode) {
        updateMold(id, field, value);
        return;
      }
      setDraftEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
    },
    [adminMode, updateMold]
  );

  // Pending modify request of a mold (detail panel banner)
  const pendingForMold = useCallback(
    (moldId: string) =>
      requests.find((r) => r.type === 'modify' && r.moldId === moldId && r.status === 'pending'),
    [requests]
  );

  // Submit modify request from detail panel (standard mode)
  const submitDraftRequest = useCallback(
    (moldId: string) => {
      const mold = molds.find((m) => m.id === moldId);
      if (!mold) return;
      const draft = draftEdits[mold.id];
      if (!draft || Object.keys(draft).length === 0) {
        setDraftError(t.noChange);
        return;
      }
      if (!draftReason.trim()) {
        setDraftError(t.reqReasonRequired);
        return;
      }
      if (!draftApplicant.trim()) {
        setDraftError(t.reqApplicantRequired);
        return;
      }
      // 互斥拦截：该模具已有待审批申请时，禁止叠加新的修改申请（避免多个申请基于过期值互相覆盖）
      if (hasPendingRequestForMold(mold.id)) {
        setDraftError(t.pendingDupBlocked);
        return;
      }
      const changes: FieldChange[] = Object.entries(draft).map(([field, value]) => ({
        field,
        label: FIELD_LABELS[field]?.zh ?? field,
        labelEn: FIELD_LABELS[field]?.en ?? field,
        oldValue: (mold[field as keyof Mold] ?? null) as string | number | null,
        newValue: (value ?? null) as string | number | null,
      }));
      addRequest({
        type: 'modify',
        moldId: mold.id,
        moldCode: mold.code,
        changes,
        reason: draftReason.trim(),
        applicant: draftApplicant.trim(),
      });
      setLastApplicant(draftApplicant.trim());
      setRequests(getRequests());
      setDraftEdits((prev) => {
        const next = { ...prev };
        delete next[mold.id];
        return next;
      });
      setDraftReason('');
      setDraftExpanded(false);
      setDraftError('');
      setShowRequestToast(true);
      setTimeout(() => setShowRequestToast(false), 4000);
    },
    [molds, draftEdits, draftReason, draftApplicant, t]
  );

  // Draft diff bar builder (standard mode, expanded detail row)
  const renderDraftBar = useCallback(
    (moldId: string) => {
      const draft = draftEdits[moldId];
      if (!draft || Object.keys(draft).length === 0) return null;
      const mold = molds.find((m) => m.id === moldId);
      if (!mold) return null;
      const entries = Object.entries(draft);
      return (
        <div className="mt-4 rounded-xl border-2 border-dashed p-4" style={{ borderColor: '#a8d5a2', backgroundColor: '#f4faf0' }}>
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setDraftExpanded(!draftExpanded)}
          >
            <span className="text-sm font-semibold" style={{ color: '#4a7c59' }}>
              {(t.draftBarTitle as (n: number) => string)(entries.length)}
            </span>
            <span className="text-xs" style={{ color: '#6b7c6b' }}>{draftExpanded ? '▲' : '▼'}</span>
          </button>
          {draftExpanded && (
            <div className="mt-3">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: '#e0e8dc', backgroundColor: '#ffffff' }}>
                {entries.map(([field, value]) => {
                  const lbl = FIELD_LABELS[field];
                  const oldV = (mold as unknown as Record<string, unknown>)[field];
                  return (
                    <div key={field} className="flex items-center gap-2 border-b py-1.5 text-xs last:border-b-0" style={{ borderColor: '#f0f4ec' }}>
                      <span className="w-40 shrink-0 font-medium" style={{ color: '#2d3b2d' }}>
                        {lang === 'zh' ? lbl?.zh ?? field : lbl?.en ?? field}
                      </span>
                      <span className="truncate" style={{ color: '#6b7c6b' }}>{String(oldV ?? '-')}</span>
                      <span className="shrink-0 font-bold" style={{ color: '#4a7c59' }}>→</span>
                      <span className="truncate font-medium" style={{ color: '#4a7c59' }}>{String(value ?? '-')}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs" style={{ color: '#6b7c6b' }}>
                    {t.reqReasonLabel} <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#4a7c59]"
                    style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                    placeholder={t.reqReasonPlaceholder}
                    value={draftReason}
                    onChange={(e) => { setDraftReason(e.target.value); setDraftError(''); }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs" style={{ color: '#6b7c6b' }}>
                    {t.reqApplicantLabel} <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#4a7c59]"
                    style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                    placeholder={t.reqApplicantPlaceholder}
                    value={draftApplicant}
                    onChange={(e) => { setDraftApplicant(e.target.value); setDraftError(''); }}
                  />
                </div>
              </div>
              {draftError && (
                <p className="mt-2 text-xs font-medium" style={{ color: '#e74c3c' }}>{draftError}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  className="h-9 rounded-lg px-4 text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#4a7c59' }}
                  onClick={() => submitDraftRequest(moldId)}
                >
                  {t.reqSubmitModify}
                </button>
                <button
                  className="h-9 rounded-lg border px-4 text-sm transition-all hover:opacity-80"
                  style={{ borderColor: '#e0e8dc', color: '#6b7c6b' }}
                  onClick={() => {
                    setDraftEdits((prev) => {
                      const next = { ...prev };
                      delete next[moldId];
                      return next;
                    });
                    setDraftReason('');
                    setDraftExpanded(false);
                    setDraftError('');
                  }}
                >
                  {t.draftDiscard}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftEdits, molds, draftExpanded, draftReason, draftApplicant, draftError, lang, t, submitDraftRequest]
  );

  // ── Approval actions ──
  const approveRequest = useCallback(
    (id: string, comment?: string) => {
      // 以存储层最新状态为准，防止过期闭包导致重复审批/重复创建
      const req = getRequestById(id);
      if (!req || req.status !== 'pending') return;
      if (req.type === 'modify' && req.moldId) {
        const patch: Record<string, unknown> = { lastRequestNo: req.requestNo };
        (req.changes || [])
          .filter((c) => c.field in FIELD_LABELS)
          .forEach((c) => {
            patch[c.field] = NUMERIC_MOLD_FIELDS.includes(c.field) ? Number(c.newValue) : (c.newValue ?? '');
          });
        setMolds((prev) =>
          prev.map((m) => (m.id === req.moldId ? recalcDerived({ ...m, ...(patch as Partial<Mold>) }) : m))
        );
      }
      if (req.type === 'purchase' && req.newMold) {
        setMolds((prev) => {
          // 编号在函数式更新内生成，避免连续批准两个购买单时编号重复
          const newId = `mold_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          const code = `M${String(prev.length + 1).padStart(4, '0')}`;
          const newMold: Mold = recalcDerived({
            ...(req.newMold as Mold),
            id: newId,
            code,
            status: 'pending',
            lastRequestNo: req.requestNo,
          });
          return [...prev, newMold];
        });
      }
      updateRequest(id, {
        status: 'approved',
        reviewer: 'admin',
        reviewedAt: new Date().toISOString(),
        reviewComment: comment?.trim() || undefined,
      });
      setRequests(getRequests());
      setShowRequestToast(true);
      setTimeout(() => setShowRequestToast(false), 4000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recalcDerived]
  );

  const rejectRequest = useCallback(
    (id: string, comment: string) => {
      // 仅待审批状态可驳回，防止状态机被破坏
      if (getRequestById(id)?.status !== 'pending') return;
      updateRequest(id, {
        status: 'rejected',
        reviewer: 'admin',
        reviewedAt: new Date().toISOString(),
        reviewComment: comment.trim(),
      });
      setRequests(getRequests());
    },
    []
  );

  const withdrawRequest = useCallback(
    (id: string) => {
      // 仅待审批状态可撤回
      if (getRequestById(id)?.status !== 'pending') return;
      updateRequest(id, { status: 'cancelled', reviewedAt: new Date().toISOString() });
      setRequests(getRequests());
    },
    []
  );

  const resubmitRequest = useCallback(
    (id: string) => {
      // 以存储层最新状态为准；仅已驳回的单可重新提交，防止重复申请
      const src = getRequestById(id);
      if (!src || src.status !== 'rejected') return;
      addRequest({
        type: src.type,
        moldId: src.moldId,
        moldCode: src.moldCode,
        changes: src.changes,
        newMold: src.newMold,
        reason: src.reason,
        applicant: src.applicant,
        resubmitOf: src.id,
      });
      setRequests(getRequests());
    },
    []
  );

  // 申请人查看审批结果 → 标记已读（清除 Tab 黄点）
  const markRequestRead = useCallback((id: string) => {
    updateRequest(id, { applicantRead: true });
    setRequests(getRequests());
  }, []);

  // ── Admin mode switching ──
  const toggleAdminMode = useCallback(() => {
    if (adminMode) {
      setAdminMode(false);
      setAdminModeState(false);
    } else {
      setShowPinDialog(true);
      setPinInput('');
      setPinError('');
    }
  }, [adminMode]);

  const confirmPin = useCallback(() => {
    if (pinInput === getAdminPin()) {
      setAdminMode(true);
      setAdminModeState(true);
      setShowPinDialog(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError(t.adminPinError);
    }
  }, [pinInput, t]);

  // Export Excel
  const handleExport = useCallback(() => {
    const L = lang;
    const exportData = filteredMolds.map((m) => ({
      [L === 'zh' ? '模具编号' : 'Mold Code']: m.code,
      [L === 'zh' ? '项目编号' : 'Project Number']: m.projectNumber || '',
      [L === 'zh' ? '内部编号' : 'Internal Number']: m.internalNumber || '',
      [L === 'zh' ? '模具名称' : 'Mold Name']: m.name,
      [L === 'zh' ? '模具英文名' : 'Mold Name EN']: m.nameEn || '',
      [L === 'zh' ? '供应商' : 'Supplier']: L === 'zh' ? m.supplier : (m.supplierEn || m.supplier),
      [L === 'zh' ? '工厂' : 'Factory']: m.factory,
      [L === 'zh' ? '所属BU' : 'Business Unit']: BUS.find((b) => b.id === m.buId)?.name || '',
      [L === 'zh' ? '所属产品' : 'Product']: (() => {
        const p = products.find((pp) => pp.id === m.productId);
        if (p) return L === 'zh' ? (p.name || '') : (p.nameEn || p.name || '');
        return L === 'zh' ? (m.productName || '') : (m.productNameEn || m.productName || '');
      })(),
      [L === 'zh' ? '腔数' : 'Cavities']: m.cavities,
      [L === 'zh' ? '流道类型' : 'Runner Type']: RUNNER_NAME_MAP[m.runnerType]?.[L] || m.runnerType,
      [L === 'zh' ? '注塑周期(秒)' : 'Cycle Time(s)']: m.cycleTime,
      [L === 'zh' ? '每小时产能' : 'Hourly Output']: m.hourlyCapacity,
      [L === 'zh' ? '理论每小时产能' : 'Theoretical Hourly Output']: m.theoreticalHourlyCapacity ?? 0,
      [L === 'zh' ? '实际每小时产能' : 'Actual Hourly Output']: m.actualHourlyCapacity ?? 0,
      'OEE': m.oee,
      [L === 'zh' ? 'OEE原因' : 'OEE Reason']: m.oeeReason || '',
      [L === 'zh' ? '状态' : 'Status']: T[L][m.status],
      [L === 'zh' ? '数量(台)' : 'Quantity']: m.quantity,
      [L === 'zh' ? '单价(元)' : 'Unit Price(CNY)']: m.unitPrice,
      [L === 'zh' ? '合计金额' : 'Total Amount']: m.totalPrice,
      [L === 'zh' ? '损耗系数' : 'Loss Coeff.']: m.lossCoefficient,
      [L === 'zh' ? '损耗原因' : 'Loss Reason']: m.lossReason || '',
      [L === 'zh' ? '关联材料' : 'Linked Material']: m.material,
      [L === 'zh' ? '材料损耗系数' : 'Material Loss Coeff.']: m.materialLossCoeff,
      [L === 'zh' ? '单只克重(g)' : 'Product Weight(g)']: m.productWeight,
      [L === 'zh' ? '废料克重' : 'Waste Weight(g)']: m.wasteWeight,
      [L === 'zh' ? '水口料重量(g)' : 'Sprue Weight(g)']: m.sprueWeight,
      [L === 'zh' ? '月产能(万)' : 'Monthly Capacity(10k)']: m.monthlyCapacity,
      [L === 'zh' ? '理论月产能(万)' : 'Theoretical Monthly Capacity(10k)']: m.theoreticalMonthlyCapacity ?? 0,
      [L === 'zh' ? '实际月产能(万)' : 'Actual Monthly Capacity(10k)']: m.actualMonthlyCapacity ?? 0,
      [L === 'zh' ? '模具长(mm)' : 'Mold Length(mm)']: m.moldLength,
      [L === 'zh' ? '模具宽(mm)' : 'Mold Width(mm)']: m.moldWidth,
      [L === 'zh' ? '模具厚(mm)' : 'Mold Thickness(mm)']: m.moldThickness,
      [L === 'zh' ? '所在地' : 'Location']: m.location,
      [L === 'zh' ? '模具类型' : 'Mold Type']: m.moldType === 'trial' ? (L === 'zh' ? '试验模' : 'Trial Mold') : (L === 'zh' ? '量产模' : 'Mass Production'),
      [L === 'zh' ? '资产归属' : 'Asset Ownership']: L === 'zh' ? (m.assetOwnership || '') : (m.assetOwnershipEn || m.assetOwnership || ''),
      [L === 'zh' ? '启用时间' : 'Activation Date']: m.commissionDate || '',
      [L === 'zh' ? '寿命' : 'Lifetime']: m.depreciationYears ?? 0,
      [L === 'zh' ? '图纸编号' : 'Drawing Number']: m.drawingNumber || '',
      [L === 'zh' ? '模具重量(kg)' : 'Mold Weight(kg)']: m.moldWeight ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.sheetName);
    XLSX.writeFile(wb, `${t.sheetName}.xlsx`);
  }, [filteredMolds, lang, t.sheetName, products]);

  // Add new mold (admin direct) / submit purchase request (standard mode)
  const handleAddMold = useCallback(() => {
    if (!String(newMold.name || '').trim()) {
      setPurchaseError(T[lang].moldNameRequired);
      return;
    }
    // Standard mode: convert to purchase request, do not write to registry directly
    if (!adminMode) {
      if (!purchaseReason.trim()) {
        setPurchaseError(T[lang].reqReasonRequiredP);
        return;
      }
      if (!purchaseApplicant.trim()) {
        setPurchaseError(T[lang].reqApplicantRequired);
        return;
      }
      addRequest({
        type: 'purchase',
        newMold: { ...newMold },
        reason: purchaseReason.trim(),
        applicant: purchaseApplicant.trim(),
      });
      setLastApplicant(purchaseApplicant.trim());
      setRequests(getRequests());
      setPurchaseReason('');
      setPurchaseApplicant('');
      setPurchaseError('');
      setShowAddModal(false);
      setNewMold(EMPTY_MOLD_DRAFT);
      setShowRequestToast(true);
      setTimeout(() => setShowRequestToast(false), 4000);
      return;
    }
    const maxCode = molds.reduce((max, m) => {
      const num = parseInt(m.code.replace('M', '').replace('-', ''), 10);
      return num > max ? num : max;
    }, 0);
    const autoCode = `M${String(maxCode + 1).padStart(4, '0')}`;
    const mold: Mold = {
      id: `mold-${Date.now()}`,
      code: newMold.code || autoCode,
      projectNumber: newMold.projectNumber || '',
      internalNumber: newMold.internalNumber || '',
      name: newMold.name || '',
      nameEn: newMold.nameEn || translateMoldName(newMold.name || ''),
      supplier: newMold.supplier || '',
      supplierEn: newMold.supplierEn || '',
      factory: newMold.factory || 'LD',
      buId: newMold.buId || BUS[0].id,
      productId: newMold.productId || '',
      productName: newMold.productName || '',
      productNameEn: newMold.productNameEn || '',
      cavities: newMold.cavities || 1,
      runnerType: newMold.runnerType || '热流道',
      cycleTime: newMold.cycleTime || 30,
      hourlyCapacity: newMold.hourlyCapacity || 120,
      oee: newMold.oee || 0.9,
      oeeReason: newMold.oeeReason || '',
      oeeReasonEn: newMold.oeeReasonEn || '',
      quantity: newMold.quantity || 1,
      unitPrice: newMold.unitPrice || 0,
      totalPrice: (newMold.quantity || 1) * (newMold.unitPrice || 0),
      lossCoefficient: newMold.lossCoefficient || 0.05,
      lossReason: newMold.lossReason || '',
      lossReasonEn: newMold.lossReasonEn || '',
      material: newMold.material || '',
      materialLossCoeff: newMold.materialLossCoeff || 0.02,
      productWeight: newMold.productWeight || 0,
      wasteWeight: newMold.wasteWeight || 0,
      sprueWeight: newMold.sprueWeight || 0,
      monthlyCapacity: newMold.monthlyCapacity || 0,
      moldLength: newMold.moldLength || 0,
      moldWidth: newMold.moldWidth || 0,
      moldThickness: newMold.moldThickness || 0,
      location: newMold.location || '',
      moldType: newMold.moldType || 'mass',
      assetOwnership: newMold.assetOwnership || '',
      assetOwnershipEn: newMold.assetOwnershipEn || '',
      theoreticalHourlyCapacity: newMold.theoreticalHourlyCapacity || 0,
      actualHourlyCapacity: newMold.actualHourlyCapacity || 0,
      theoreticalMonthlyCapacity: newMold.theoreticalMonthlyCapacity || 0,
      actualMonthlyCapacity: newMold.actualMonthlyCapacity || 0,
      commissionDate: newMold.commissionDate || '',
      depreciationYears: newMold.depreciationYears || 0,
      status: newMold.status || 'pending',
    };
    setMolds((prev) => [...prev, mold]);
    setShowAddModal(false);
    setExpandedRow(mold.id);
    setNewMold(EMPTY_MOLD_DRAFT);
  }, [molds, newMold, adminMode, lang, purchaseReason, purchaseApplicant]);

  const openModifyModal = useCallback(() => {
    setModTargetMoldId('');
    setModType('dimensionRepair');
    setModDesc('');
    setModError('');
    setModApplicant(getLastApplicant());
    setShowModifyModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitModifyRequest = useCallback(() => {
    if (!modTargetMoldId) {
      setModError(T[lang].reqTargetRequired);
      return;
    }
    const target = molds.find((m) => m.id === modTargetMoldId);
    if (!target) return;
    if (modType === 'other' && !modDesc.trim()) {
      setModError(T[lang].modDescRequired);
      return;
    }
    if (!modApplicant.trim()) {
      setModError(T[lang].reqApplicantRequired);
      return;
    }
    // 互斥拦截：该模具已有待审批申请时，禁止叠加新的修改申请
    if (hasPendingRequestForMold(modTargetMoldId)) {
      setModError(T[lang].pendingDupBlocked);
      return;
    }
    const typeLabels: Record<string, { zh: string; en: string }> = {
      dimensionRepair: { zh: '尺寸修改', en: 'Dimension Modification' },
      wearRepair: { zh: '磨损维修', en: 'Wear & Repair' },
      other: { zh: '其他修改', en: 'Other Modification' },
    };
    const typeLabel = typeLabels[modType][lang];
    const changes: FieldChange[] = [
      {
        field: 'modifyType',
        label: lang === 'zh' ? '修改内容' : 'Modify Type',
        labelEn: 'Modify Type',
        oldValue: '',
        newValue: typeLabel,
      },
    ];
    if (modDesc.trim()) {
      changes.push({
        field: 'modifyDesc',
        label: lang === 'zh' ? '修改说明' : 'Description',
        labelEn: 'Description',
        oldValue: '',
        newValue: modDesc.trim(),
      });
    }
    addRequest({
      type: 'modify',
      moldId: target.id,
      moldCode: target.code,
      changes,
      reason: modDesc.trim() || typeLabel,
      applicant: modApplicant.trim(),
    });
    setLastApplicant(modApplicant.trim());
    setRequests(getRequests());
    setNotifyPending(true);
    setShowModifyModal(false);
    setShowRequestToast(true);
    setTimeout(() => setShowRequestToast(false), 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modTargetMoldId, modType, modDesc, modApplicant, molds, lang]);

  const updateNewMold = useCallback((field: keyof Mold, value: unknown) => {
    setNewMold((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate hourly capacity when cavities or cycleTime changes
      if (field === 'cavities' || field === 'cycleTime') {
        const cavities = field === 'cavities' ? Number(value) : updated.cavities || 1;
        const cycleTime = field === 'cycleTime' ? Number(value) : updated.cycleTime || 30;
        if (cycleTime > 0) {
          const theoretical = Math.round(cavities * (60 / cycleTime) * 60);
          updated.theoreticalHourlyCapacity = theoretical;
          updated.actualHourlyCapacity = Math.round(theoretical * (updated.oee || 0.9));
          updated.hourlyCapacity = updated.actualHourlyCapacity;
          updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
          updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
          updated.monthlyCapacity = updated.actualMonthlyCapacity;
        }
      }
      if (field === 'hourlyCapacity') {
        const hc = Number(value);
        updated.monthlyCapacity = Math.round(hc * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
      }
      if (field === 'oee') {
        const oee = Number(value);
        const theoretical = Math.round((updated.cavities || 1) * (60 / (updated.cycleTime || 30)) * 60);
        updated.theoreticalHourlyCapacity = theoretical;
        updated.actualHourlyCapacity = Math.round(theoretical * oee);
        updated.hourlyCapacity = updated.actualHourlyCapacity;
        updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
        updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * getMonthlyWorkDays() / 10000 * 100) / 100;
        updated.monthlyCapacity = updated.actualMonthlyCapacity;
      }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.totalPrice = (updated.quantity || 1) * (updated.unitPrice || 0);
      }
      return updated;
    });
  }, []);

  if (view === 'analysis') {
    return (
      <Analysis
        molds={molds}
        products={products}
        factories={factories}
        lang={lang}
        onBack={() => setView('main')}
      />
    );
  }

  if (view === 'requests') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#dce8d0' }}>
        {/* Page Header */}
        <div className="mx-auto max-w-[1400px] px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#4a7c59' }}>
            {t.pageTitle}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#6b7c6b' }}>
            {t.pageSubtitle}
          </p>
        </div>
        {/* Top Navigation Bar */}
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="flex items-center justify-between h-14 rounded-2xl bg-white px-6" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView('main')}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-[#f0f7ec]"
                style={{ color: '#5a6b5a' }}
              >
                {lang === 'zh' ? '模具台账' : 'Mold Registry'}
              </button>
              <button
                onClick={() => setView('requests')}
                className="relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200"
                style={{ backgroundColor: '#e4f0dc', color: '#4a7c59' }}
              >
                {lang === 'zh' ? '申请审批' : 'Requests'}
                {pendingCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: '#e74c3c' }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setView('analysis')}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-[#f0f7ec]"
                style={{ color: '#5a6b5a' }}
              >
                {lang === 'zh' ? '数据分析' : 'Analysis'}
              </button>
              <a
                href="/admin"
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-[#f0f7ec]"
                style={{ color: '#5a6b5a' }}
              >
                {lang === 'zh' ? '后台管理' : 'Admin'}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (adminMode) {
                    setAdminMode(false);
                    setAdminModeState(false);
                  } else {
                    setShowPinDialog(true);
                    setPinInput('');
                    setPinError('');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={adminMode
                  ? { backgroundColor: '#4a7c59', borderColor: '#4a7c59', color: '#ffffff' }
                  : { backgroundColor: '#ffffff', borderColor: '#c9d8c0', color: '#6b7c6b' }}
                title={adminMode ? (lang === 'zh' ? '点击退出管理员模式' : 'Click to exit admin mode') : (lang === 'zh' ? '点击进入管理员模式' : 'Click to enter admin mode')}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {adminMode ? (
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  ) : (
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
                {adminMode
                  ? (lang === 'zh' ? '管理员模式' : 'Admin Mode')
                  : (lang === 'zh' ? '普通模式' : 'Standard Mode')}
              </button>
              <button
                onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={{ backgroundColor: '#ffffff', borderColor: '#c9d8c0', color: '#6b7c6b' }}
              >
                {lang === 'zh' ? 'EN' : '中文'}
              </button>
            </div>
          </div>
        </div>
        {/* Requests Board */}
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <RequestBoard
            lang={lang}
            adminMode={adminMode}
            requests={requests}
            onApply={approveRequest}
            onReject={rejectRequest}
            onWithdraw={withdrawRequest}
            onResubmit={resubmitRequest}
            onMarkRead={markRequestRead}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#dce8d0' }}>
      {/* Page Header */}
      <div className="mx-auto max-w-[1400px] px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#4a7c59' }}>
          {t.pageTitle}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: '#6b7c6b' }}>
          {t.pageSubtitle}
        </p>
      </div>

      {/* Top Navigation Bar */}
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between h-14 rounded-2xl bg-white px-6" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView('main')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={view === 'main' ? { backgroundColor: '#e8f5e9', color: '#4a7c59' } : { color: '#6b7c6b' }}
            >
              {lang === 'zh' ? '模具台账' : 'Mold Registry'}
            </button>
            <button
              onClick={() => setView('requests')}
              className="relative px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#6b7c6b' }}
            >
              {lang === 'zh' ? '申请审批' : 'Requests'}
              {(adminMode || notifyPending) && pendingCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: '#e74c3c' }}
                >
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('analysis')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#6b7c6b' }}
            >
              {lang === 'zh' ? '数据分析' : 'Analysis'}
            </button>
            <a
              href="/admin"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#6b7c6b' }}
            >
              {lang === 'zh' ? '后台管理' : 'Admin'}
            </a>
          </div>
          <div className="flex items-center gap-2">
            {/* Request buttons (standard mode only) */}
            {!adminMode && (
              <>
                <button
                  onClick={openModifyModal}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#4a7c59' }}
                  title={lang === 'zh' ? '提交模具修改申请' : 'Submit a mold modify request'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  {t.modReqTitle}
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#4a7c59' }}
                  title={lang === 'zh' ? '提交模具购买申请' : 'Submit a mold purchase request'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t.purchaseBtn}
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (adminMode) {
                  setAdminMode(false);
                  setAdminModeState(false);
                } else {
                  setShowPinDialog(true);
                  setPinInput('');
                  setPinError('');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={adminMode
                ? { backgroundColor: '#4a7c59', borderColor: '#4a7c59', color: '#ffffff' }
                : { backgroundColor: '#ffffff', borderColor: '#c9d8c0', color: '#6b7c6b' }}
              title={adminMode ? (lang === 'zh' ? '点击退出管理员模式' : 'Click to exit admin mode') : (lang === 'zh' ? '点击进入管理员模式' : 'Click to enter admin mode')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {adminMode
                  ? <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>
                  : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
              </svg>
              {adminMode
                ? (lang === 'zh' ? '管理员模式' : 'Admin Mode')
                : (lang === 'zh' ? '普通模式' : 'Standard Mode')}
            </button>
            <button
              onClick={() => setLang('zh')}
              className={`text-xs px-2 py-1 rounded ${lang === 'zh' ? 'font-bold' : ''}`}
              style={{ color: lang === 'zh' ? '#4a7c59' : '#6b7c6b' }}
            >中文</button>
            <span style={{ color: '#e0e8dc' }}>|</span>
            <button
              onClick={() => setLang('en')}
              className={`text-xs px-2 py-1 rounded ${lang === 'en' ? 'font-bold' : ''}`}
              style={{ color: lang === 'en' ? '#4a7c59' : '#6b7c6b' }}
            >EN</button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {/* BU Cards */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          {BUS.map((bu) => {
            const stats = buStats.find((s) => s.buId === bu.id)!;
            const isSelected = selectedBU === bu.id;
            return (
              <div
                key={bu.id}
                onClick={() => setSelectedBU(isSelected ? null : bu.id)}
                className="cursor-pointer overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:shadow-lg"
                style={{
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(74, 124, 89, 0.25)'
                    : '0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: isSelected ? '2px solid #4a7c59' : '2px solid transparent',
                }}
              >
                <div
                  className="px-5 py-3 text-center text-white"
                  style={{ backgroundColor: '#a8d5a2' }}
                >
                  <div className="text-base font-bold" style={{ color: '#4a7c59' }}>{bu.name.split('-')[0]}</div>
                  <div className="text-xs font-medium opacity-90">{bu.name.split('-').slice(1).join('-')}</div>
                </div>
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Donut Chart */}
                  <div className="flex-shrink-0">
                    <DonutChart
                      segments={[
                        { value: stats.activeCount, color: '#4a7c59' },
                        { value: stats.pendingCount, color: '#f39c12' },
                        { value: stats.maintenanceCount, color: '#e74c3c' },
                        { value: stats.retiredCount, color: '#95a5a6' },
                      ]}
                    />
                  </div>
                  {/* Stats */}
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>
                        {t.totalMolds}
                      </span>
                      <span className="text-xl font-bold" style={{ color: '#2d3b2d' }}>
                        {stats.totalMolds}
                      </span>
                    </div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>
                        {t.activeCount}
                      </span>
                      <span className="text-lg font-semibold" style={{ color: '#4a7c59' }}>
                        {stats.activeCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>
                        {t.pendingCount}
                      </span>
                      <span className="text-lg font-semibold" style={{ color: '#f39c12' }}>
                        {stats.pendingCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div
          className="mb-4 flex items-center justify-between rounded-2xl bg-white px-6 py-4"
          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>
              {t.title}
            </h2>
            {/* Search */}
            <input
              type="search"
              autoComplete="off"
              placeholder={t.searchPlaceholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9 w-64 rounded-lg border px-3 py-1 text-sm outline-none transition-colors focus:border-[#4a7c59]"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            />
            {/* Factory filter */}
            <select
              value={factoryFilter}
              onChange={(e) => setFactoryFilter(e.target.value)}
              className="h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            >
              <option value="">{t.allFactories}</option>
              {factories.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {/* Record count */}
            <span className="text-sm whitespace-nowrap" style={{ color: '#6b7c6b' }}>
              {t.totalRecords(filteredMolds.length)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Add button (admin direct-add only; standard users use nav request buttons) */}
            {adminMode && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#4a7c59' }}
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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t.addMold}
              </button>
            )}
            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#4a7c59' }}
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
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t.exportExcel}
            </button>
            {/* Import button */}
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
                        const productCandidates = [row['Product'], row['产品'], row['所属产品']]
                          .map((v) => String(v ?? '').trim())
                          .filter(Boolean);
                        const product = products.find(
                          (p) => productCandidates.some((c) => p.name.trim() === c || (p.nameEn || '').trim() === c)
                        );
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
                        // 单价：优先读元列（新格式），否则读万元列（旧格式兼容）
                        const unitPriceYuanStr = String(row['Unit Price(CNY)'] ?? row['Unit Price'] ?? row['单价(元)'] ?? row['单价'] ?? '').replace(/[¥,]/g, '');
                        const unitPriceWanStr = String(row['Unit Price(10k)'] ?? row['Unit Price (10k)'] ?? row['单价(万元)'] ?? '').replace(/[¥,]/g, '');
                        const unitPriceStr = unitPriceYuanStr !== ''
                          ? unitPriceYuanStr
                          : String(Math.round(Number(unitPriceWanStr) * 10000 * 100) / 100);
                        return {
                          id: code || `imported_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                          code: String(code),
                          name: String(row['Mold Name'] || row['模具名称'] || ''),
                          nameEn: String(row['Mold Name EN'] || row['Mold Name (EN)'] || row['模具英文名'] || row['英文名'] || '') || translateMoldName(String(row['Mold Name'] || row['模具名称'] || '')),
                          supplier: String(row['Supplier'] || row['供应商'] || ''),
                          supplierEn: String(row['Supplier'] || row['供应商'] || ''),
                          buId: bu?.id || 'bu1',
                          productId: product?.id || '',
                          productName: product?.name || String(row['Product'] || row['产品'] || row['所属产品'] || ''),
                          productNameEn: product?.nameEn || String(row['Product'] || row['产品'] || row['所属产品'] || ''),
                          factory: String(row['Factory'] || row['工厂'] || ''),
                          cavities: Number(row['Cavities'] || row['腔数'] || 1),
                          runnerType: String(row['Runner Type'] || row['流道类型'] || 'cold'),
                          cycleTime: Number(row['Cycle Time(s)'] || row['注塑周期(秒)'] || row['注塑周期(s)'] || row['注塑周期'] || 30),
                          hourlyCapacity: Number(row['Hourly Output'] || row['每小时产能'] || 0),
                          oee: Number(row['OEE'] || 0.9),
                          oeeReason: String(row['OEE Reason'] || row['OEE原因'] || ''),
                          oeeReasonEn: String(row['OEE Reason'] || row['OEE原因'] || ''),
                          quantity: Number(row['Quantity'] || row['数量(台)'] || row['数量'] || 0),
                          unitPrice: Number(unitPriceStr) || 0,
                          totalPrice: Number(row['Quantity'] || row['数量(台)'] || row['数量'] || 0) * (Number(unitPriceStr) || 0),
                          lossCoefficient: Number(row['Loss Coeff.'] ?? row['损耗系数'] ?? row['Mold Loss Coeff.'] ?? row['模具损耗系数'] ?? row['Loss Coefficient'] ?? 0.05),
                          lossReason: String(row['Loss Reason'] || row['损耗原因'] || ''),
                          lossReasonEn: String(row['Loss Reason'] || row['损耗原因'] || ''),
                          material: String(row['Linked Material'] ?? row['Material'] ?? row['关联材料'] ?? row['产品材料'] ?? row['材料'] ?? '').trim(),
                          materialLossCoeff: Number(row['Material Loss Coeff.'] ?? row['材料损耗系数'] ?? row['Material Loss Coefficient'] ?? 0),
                          productWeight: Number(row['Product Weight(g)'] || row['单只克重(g)'] || row['产品单只克重'] || row['产品克重'] || 0),
                          scrapWeight: Number(row['Scrap Weight(g)'] || row['废料克重'] || 0),
                          wasteWeight: Number(row['Waste Weight(g)'] || row['废料克重'] || 0),
                          sprueWeight: Number(row['Sprue Weight(g)'] || row['水口料重量(g)'] || row['水口料重量'] || 0),
                          monthlyCapacity: Number(row['Monthly Capacity(10k)'] || row['月产能(万)'] || row['月产能'] || 0),
                          moldLength: Number(row['Mold Length(mm)'] || row['模具长(mm)'] || row['模具长度'] || 0),
                          moldWidth: Number(row['Mold Width(mm)'] || row['模具宽(mm)'] || row['模具宽度'] || 0),
                          moldThickness: Number(row['Mold Thickness(mm)'] || row['模具厚(mm)'] || row['模具厚度'] || 0),
                          location: String(row['Location'] || row['所在地'] || ''),
                          moldType: (() => {
                            const mt = String(row['Mold Type'] || row['模具类型'] || '');
                            if (mt === 'trial' || mt === '试验模' || mt === 'Trial Mold') return 'trial';
                            return 'mass';
                          })(),
                          assetOwnership: (() => {
                            const raw = String(row['Asset Ownership'] || row['资产归属'] || '');
                            const match = getAssetOwnerships().find((a) => a.cn === raw || a.en === raw);
                            return match ? match.cn : raw;
                          })(),
                          assetOwnershipEn: (() => {
                            const raw = String(row['Asset Ownership'] || row['资产归属'] || '');
                            const match = getAssetOwnerships().find((a) => a.cn === raw || a.en === raw);
                            return match ? match.en : raw;
                          })(),
                          theoreticalHourlyCapacity: Number(row['Theoretical Hourly Output'] || row['理论每小时产能'] || 0),
                          actualHourlyCapacity: Number(row['Actual Hourly Output'] || row['实际每小时产能'] || 0),
                          theoreticalMonthlyCapacity: Number(row['Theoretical Monthly Capacity(10k)'] || row['理论月产能(万)'] || row['理论月产能'] || 0),
                          actualMonthlyCapacity: Number(row['Actual Monthly Capacity(10k)'] || row['实际月产能(万)'] || row['实际月产能'] || 0),
                          commissionDate: String(row['Activation Date'] || row['启用时间'] || ''),
                          depreciationYears: Number(row['Lifetime'] || row['寿命'] || row['Depreciation Years'] || row['折旧年数'] || 0),
                          status: (statusMap[statusStr] || 'active') as Mold['status'],
                          projectNumber: String(row['Project Number'] || row['项目编号'] || ''),
                          internalNumber: String(row['Internal Number'] || row['内部编号'] || ''),
                          drawingNumber: String(row['Drawing Number'] || row['图纸编号'] || ''),
                          moldWeight: Number(row['Mold Weight(kg)'] || row['模具重量(kg)'] || row['模具重量'] || 0),
                        };
                      });

                      setMolds(importedMolds);
                      alert(lang === 'zh' ? `成功导入 ${importedMolds.length} 条模具数据` : `Successfully imported ${importedMolds.length} molds`);
                    } catch (err) {
                      alert(lang === 'zh' ? '导入失败，请检查文件格式' : 'Import failed, please check the file format');
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
              {lang === 'zh' ? '导入Excel' : 'Import Excel'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#f0f7ec' }}>
                <th className="w-10 px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}></th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.belongProduct}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.name}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.status}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.factory}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.code}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.projectNumber}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.supplier}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.cavities}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.unitPrice}</th>
                <th className="w-10 px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredMolds.map((mold, index) => {
                const isExpanded = expandedRow === mold.id;
                return (
                  <MoldRow
                    key={mold.id || `mold_${index}`}
                    mold={mold}
                    isExpanded={isExpanded}
                    statusLabel={statusLabel(mold.status)}
                    statusColor={STATUS_COLOR[mold.status]}
                    onToggle={() => setExpandedRow(isExpanded ? null : mold.id)}
                    onUpdate={handleRowUpdate}
                    onConfirmChange={(moldId, field, oldValue, newValue, oldLabel, newLabel) => {
                      setConfirmDialog({ moldId, field, oldValue, newValue, oldLabel, newLabel });
                    }}
                    renderPendingBanner={
                      (pendingForMold(mold.id) || mold.lastRequestNo) ? (
                        <div className="mb-4">
                          {pendingForMold(mold.id) && (
                            <div
                              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"
                              style={{ borderColor: '#f39c12', backgroundColor: '#fef7e6', color: '#8a6d1a' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              {(t.pendingBanner as (no: string) => string)(pendingForMold(mold.id)!.requestNo)}
                            </div>
                          )}
                          {!pendingForMold(mold.id) && mold.lastRequestNo && (
                            <div className="flex items-center gap-1.5 px-1 pb-1 text-xs" style={{ color: '#6b7c6b' }}>
                              <span>{t.lastRequestLabel}:</span>
                              <span className="font-medium" style={{ color: '#4a7c59' }}>{mold.lastRequestNo}</span>
                            </div>
                          )}
                        </div>
                      ) : null
                    }
                    renderDraftBar={
                      !adminMode && draftEdits[mold.id] ? renderDraftBar(mold.id) : null
                    }
                    onOEEValidationAlert={() => setAlertMessage(lang === 'zh' ? 'OEE低于0.9，必须填写原因后才能保存' : 'OEE is below 0.9, the reason must be filled in before saving')}
                    onDeleteClick={(moldId) => setDeleteDialog(moldId)}
                    lang={lang}
                    products={products}
                    factories={factories}
                    runnerTypes={runnerTypes}
                    materials={materials}
                    locations={locations}
                    suppliers={suppliers}
                    assetOwnerships={assetOwnerships}
                  />
                );
              })}
            </tbody>
          </table>
          {filteredMolds.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: '#6b7c6b' }}>
              {t.noData}
            </div>
          )}
        </div>

        {/* Add Mold Modal */}
        {/* Modify request modal */}
        {showModifyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
            onClick={() => setShowModifyModal(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>
                {t.modReqTitle}
              </h3>
              <p className="mt-1 text-xs" style={{ color: '#6b7c6b' }}>
                {t.modReqDesc}
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: '#2d3b2d' }}>
                    {t.modTargetLabel} <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <select
                    value={modTargetMoldId}
                    onChange={(e) => {
                      setModTargetMoldId(e.target.value);
                      setModError('');
                    }}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                  >
                    <option value="">{t.modTargetPlaceholder}</option>
                    {molds.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} · {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: '#2d3b2d' }}>
                    {t.modTypeLabel} <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <select
                    value={modType}
                    onChange={(e) => {
                      setModType(e.target.value as 'dimensionRepair' | 'wearRepair' | 'other');
                      setModError('');
                    }}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                  >
                    <option value="dimensionRepair">{t.modTypeDimension}</option>
                    <option value="wearRepair">{t.modTypeWear}</option>
                    <option value="other">{t.modTypeOther}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: '#2d3b2d' }}>
                    {t.modDescLabel}
                    {modType === 'other' && <span style={{ color: '#e74c3c' }}> *</span>}
                  </label>
                  <textarea
                    value={modDesc}
                    onChange={(e) => {
                      setModDesc(e.target.value);
                      setModError('');
                    }}
                    rows={3}
                    placeholder={modType === 'other' ? t.modDescRequired : t.modDescPlaceholder}
                    className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: '#2d3b2d' }}>
                    {t.reqApplicantLabel} <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={modApplicant}
                    onChange={(e) => {
                      setModApplicant(e.target.value);
                      setModError('');
                    }}
                    placeholder={t.reqApplicantPlaceholder}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                  />
                </div>
                {modError && (
                  <p className="text-sm" style={{ color: '#e74c3c' }}>
                    {modError}
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModifyModal(false)}
                  className="h-10 rounded-lg border px-5 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ borderColor: '#e0e8dc', color: '#6b7c6b' }}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={submitModifyRequest}
                  className="h-10 rounded-lg px-5 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#4a7c59' }}
                >
                  {t.reqSubmitModify}
                </button>
              </div>
            </div>
          </div>
        )}
        {showAddModal && (
          <AddMoldModal
            newMold={newMold}
            onUpdate={updateNewMold}
            onSave={handleAddMold}
            onCancel={() => {
              setShowAddModal(false);
              setPurchaseReason('');
              setPurchaseApplicant('');
              setPurchaseError('');
            }}
            lang={lang}
            adminMode={adminMode}
            renderRequestInfo={
              !adminMode ? (
                <div
                  className="mb-4 rounded-2xl border p-4"
                  style={{ borderColor: '#e0e8dc', backgroundColor: '#f8fbf5' }}
                >
                  <h4 className="mb-3 text-sm font-semibold" style={{ color: '#4a7c59' }}>
                    {t.requestInfoTitle}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: '#6b7c6b' }}>
                        {t.reqReasonLabelP} <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <textarea
                        value={purchaseReason}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPurchaseReason(e.target.value)}
                        placeholder={t.reqReasonPlaceholderP}
                        rows={2}
                        className="w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#4a7c59]"
                        style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: '#6b7c6b' }}>
                        {t.reqApplicantLabel} <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={purchaseApplicant}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPurchaseApplicant(e.target.value)}
                        placeholder={t.reqApplicantPlaceholder}
                        className="h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:border-[#4a7c59]"
                        style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
                      />
                    </div>
                    {purchaseError && (
                      <p className="text-xs" style={{ color: '#e74c3c' }}>{purchaseError}</p>
                    )}
                  </div>
                </div>
              ) : null
            }
            products={products}
            factories={factories}
            runnerTypes={runnerTypes}
            materials={materials}
            locations={locations}
            suppliers={suppliers}
            assetOwnerships={assetOwnerships}
          />
        )}

        {/* Analysis Modal */}
        {showAnalysisModal && (
          <AnalysisModal
            molds={molds}
            onClose={() => setShowAnalysisModal(false)}
            lang={lang}
          />
        )}
      {/* Confirm Dialog */}
        {confirmDialog && (
          <ConfirmDialog
            title={lang === 'zh' ? (confirmDialog.field === 'factory' ? '确认修改工厂' : '确认修改状态') : (confirmDialog.field === 'factory' ? 'Confirm Factory Change' : 'Confirm Status Change')}
            message={
              lang === 'zh'
                ? `${confirmDialog.field === 'factory' ? '确认将此模具的工厂从' : '确认将此模具的状态从'} 「${confirmDialog.oldLabel}」 修改为 「${confirmDialog.newLabel}」？`
                : `${confirmDialog.field === 'factory' ? 'Confirm changing factory from' : 'Confirm changing status from'} "${confirmDialog.oldLabel}" to "${confirmDialog.newLabel}"?`
            }
            onConfirm={() => {
              if (adminMode) {
                updateMold(confirmDialog.moldId, confirmDialog.field, confirmDialog.newValue);
              } else {
                handleRowUpdate(confirmDialog.moldId, confirmDialog.field, confirmDialog.newValue);
              }
              setConfirmDialog(null);
            }}
            onCancel={() => setConfirmDialog(null)}
            lang={lang}
          />
        )}
        {/* OEE Validation Alert Dialog */}
        {alertMessage && (
          <AlertDialog
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
            lang={lang}
          />
        )}
        {/* Delete Confirmation Dialog */}
        {deleteDialog && (
          <ConfirmDialog
            title={T[lang].confirmDeleteTitle}
            message={T[lang].confirmDeleteMsg}
            onConfirm={() => {
              setMolds((prev) => prev.filter((m) => m.id !== deleteDialog));
              setExpandedRow(null);
              setDeleteDialog(null);
            }}
            onCancel={() => setDeleteDialog(null)}
            lang={lang}
            confirmLabel={T[lang].confirmDelete}
            danger
          />
        )}
        {/* Admin PIN Dialog */}
        {showPinDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(45, 59, 45, 0.45)' }}>
            <div className="w-[92%] max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-semibold" style={{ color: '#2d3b2d' }}>
                {lang === 'zh' ? '切换为管理员模式' : 'Switch to Admin Mode'}
              </h3>
              <p className="mt-1 text-xs" style={{ color: '#6b7c6b' }}>
                {lang === 'zh' ? '请输入管理口令以启用直接修改台账、审批申请等能力。' : 'Enter the admin PIN to enable direct registry editing and approvals.'}
              </p>
              <input
                type="password"
                name="admin-pin"
                autoComplete="new-password"
                value={pinInput}
                autoFocus
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmPin();
                }}
                placeholder={lang === 'zh' ? '管理口令' : 'Admin PIN'}
                className="mt-4 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#4a7c59]"
                style={{ borderColor: pinError ? '#e74c3c' : '#e0e8dc', color: '#2d3b2d' }}
              />
              {pinError && (
                <p className="mt-2 text-xs" style={{ color: '#e74c3c' }}>{pinError}</p>
              )}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPinDialog(false);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="rounded-full px-4 py-2 text-sm transition-colors duration-200"
                  style={{ color: '#6b7c6b' }}
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={confirmPin}
                  className="rounded-full px-5 py-2 text-sm font-medium text-white transition-all duration-200"
                  style={{ backgroundColor: '#4a7c59' }}
                >
                  {lang === 'zh' ? '确认' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Submit success toast */}
        {showRequestToast && (
          <div
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg"
            style={{ backgroundColor: '#4a7c59' }}
          >
            {T[lang].reqSubmitted}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirm Dialog Component
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  lang,
  confirmLabel,
  danger,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  lang: Lang;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      onClick={onCancel}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        style={{ borderRadius: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: danger ? '#fde8e8' : '#fdf2d0' }}
          >
            {danger ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <h3 className="text-base font-semibold" style={{ color: '#2d3b2d' }}>{title}</h3>
        </div>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: '#4a5568' }}>{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-9 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e0e8dc', color: '#6b7c6b' }}
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: danger ? '#e74c3c' : '#4a7c59' }}
          >
            {confirmLabel || (lang === 'zh' ? '确认' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Alert Dialog Component (for OEE validation)
function AlertDialog({
  message,
  onClose,
  lang,
}: {
  message: string;
  onClose: () => void;
  lang: Lang;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        style={{ borderRadius: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: '#fde8e8' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-base font-semibold" style={{ color: '#2d3b2d' }}>
            {lang === 'zh' ? 'OEE校验' : 'OEE Validation'}
          </h3>
        </div>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: '#4a5568' }}>{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#4a7c59' }}
          >
            {lang === 'zh' ? '确定' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Analysis Modal Component
function AnalysisModal({
  molds,
  onClose,
  lang,
}: {
  molds: Mold[];
  onClose: () => void;
  lang: Lang;
}) {
  const t = T[lang];

  // Calculate statistics
  const productStats = useMemo(() => {
    const stats: Record<string, number> = {};
    molds.forEach((m) => {
      const name = lang === 'en' ? (m.productNameEn || m.productName || m.name) : (m.productName || m.name);
      stats[name] = (stats[name] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [molds, lang]);

  const factoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    molds.forEach((m) => {
      stats[m.factory] = (stats[m.factory] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [molds]);

  const statusStats = useMemo(() => {
    const stats: Record<string, { count: number; status: Mold['status'] }> = {};
    molds.forEach((m) => {
      const label = T[lang][m.status] || m.status;
      if (!stats[label]) {
        stats[label] = { count: 0, status: m.status };
      }
      stats[label].count += 1;
    });
    return Object.entries(stats).map(([name, { count, status }]) => ({ name, count, status }));
  }, [molds, lang]);

  const buStats = useMemo(() => {
    const stats: Record<string, number> = {};
    molds.forEach((m) => {
      const bu = BUS.find((b) => b.id === m.buId);
      const name = bu ? bu.name.split('-').slice(1).join('-') : m.buId;
      stats[name] = (stats[name] || 0) + 1;
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count }));
  }, [molds]);

  const COLORS = ['#4a7c59', '#f39c12', '#e74c3c', '#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];

  const maxProductCount = Math.max(...productStats.map((s) => s.count), 1);
  const maxFactoryCount = Math.max(...factoryStats.map((s) => s.count), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div
        className="relative mx-4 flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#e0e8dc' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>
            {t.analysisTitle}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: '#6b7c6b' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Top row: Status and BU donut charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Status Distribution - Donut Chart */}
              <div className="rounded-xl border p-5" style={{ borderColor: '#e0e8dc' }}>
                <h3 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                  {t.moldByStatus}
                </h3>
                <div className="flex items-center gap-6">
                <DonutChart
                  segments={statusStats.map((stat) => ({
                    value: stat.count,
                    color: STATUS_CHART_COLOR[stat.status] || '#95a5a6',
                  }))}
                />
                <div className="space-y-2">
                  {statusStats.map((stat) => (
                    <div key={stat.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: STATUS_CHART_COLOR[stat.status] || '#95a5a6' }}
                      />
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>
                        {stat.name}
                      </span>
                      <span className="text-xs font-medium" style={{ color: '#2d3b2d' }}>
                        {stat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BU Distribution - Donut Chart */}
            <div className="rounded-xl border p-5" style={{ borderColor: '#e0e8dc' }}>
              <h3 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                {t.moldByBU}
              </h3>
              <div className="flex items-center gap-6">
                <DonutChart
                  segments={buStats.map((stat, idx) => ({
                    value: stat.count,
                    color: COLORS[idx % COLORS.length],
                  }))}
                />
                <div className="space-y-2">
                  {buStats.map((stat, idx) => (
                    <div key={stat.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-xs" style={{ color: '#6b7c6b' }} title={stat.name}>
                        {stat.name.length > 20 ? stat.name.slice(0, 20) + '...' : stat.name}
                      </span>
                      <span className="text-xs font-medium" style={{ color: '#2d3b2d' }}>
                        {stat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>

            {/* Bottom row: Product and Factory bar charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Product Distribution */}
              <div className="rounded-xl border p-5" style={{ borderColor: '#e0e8dc' }}>
                <h3 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                  {t.moldByProduct}
                </h3>
                <div className="space-y-2.5">
                  {productStats.map((stat, idx) => (
                    <div key={stat.name} className="flex items-center gap-3">
                      <div className="w-24 truncate text-xs" style={{ color: '#6b7c6b' }} title={stat.name}>
                        {stat.name}
                      </div>
                      <div className="flex-1">
                        <div className="h-5 overflow-hidden rounded-full" style={{ backgroundColor: '#f0f7ec' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(stat.count / maxProductCount) * 100}%`,
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-8 text-right text-xs font-medium" style={{ color: '#2d3b2d' }}>
                        {stat.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factory Distribution */}
              <div className="rounded-xl border p-5" style={{ borderColor: '#e0e8dc' }}>
                <h3 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                  {t.moldByFactory}
                </h3>
                <div className="space-y-2.5">
                  {factoryStats.map((stat, idx) => (
                    <div key={stat.name} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium" style={{ color: '#6b7c6b' }}>
                        {stat.name}
                      </div>
                      <div className="flex-1">
                        <div className="h-5 overflow-hidden rounded-full" style={{ backgroundColor: '#f0f7ec' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(stat.count / maxFactoryCount) * 100}%`,
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-8 text-right text-xs font-medium" style={{ color: '#2d3b2d' }}>
                        {stat.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t px-6 py-4" style={{ borderColor: '#e0e8dc' }}>
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#4a7c59' }}
          >
            {lang === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Mold Row Component
function MoldRow({
  mold,
  isExpanded,
  statusLabel,
  statusColor,
  onToggle,
  onUpdate,
  onConfirmChange,
  onOEEValidationAlert,
  onDeleteClick,
  lang,
  products,
  factories,
  runnerTypes,
  materials,
  locations,
  suppliers,
  assetOwnerships,
  renderPendingBanner,
  renderDraftBar,
}: {
  mold: Mold;
  isExpanded: boolean;
  statusLabel: string;
  statusColor: string;
  onToggle: () => void;
  onUpdate: (id: string, field: keyof Mold, value: unknown) => void;
  onConfirmChange: (moldId: string, field: 'factory' | 'status', oldValue: string, newValue: string, oldLabel: string, newLabel: string) => void;
  onOEEValidationAlert: () => void;
  onDeleteClick: (moldId: string) => void;
  lang: Lang;
  products: Product[];
  factories: string[];
  runnerTypes: string[];
  materials: string[];
  locations: string[];
  suppliers: { cn: string; en: string }[];
  assetOwnerships: { cn: string; en: string }[];
  renderPendingBanner?: React.ReactNode;
  renderDraftBar?: React.ReactNode;
}) {
  const t = T[lang];
  const totalPrice = mold.quantity * mold.unitPrice;

  // 漏填字段检查（详情页关键字段）
  const missingFields: string[] = [
    [t.moldNameZh, !mold.name?.trim()],
    [t.moldNameEnLabel, !mold.nameEn?.trim()],
    [t.projectNumber, !mold.projectNumber?.trim()],
    [t.belongProduct, !mold.productId],
    [t.moldCode, !mold.code?.trim()],
    [t.detailSupplier, !mold.supplier?.trim()],
    [t.location, !mold.location?.trim()],
    [t.assetOwnership, !mold.assetOwnership?.trim()],
    [t.material, !mold.material?.trim()],
    [t.runnerType, !mold.runnerType?.trim()],
    [t.activationDate, !mold.commissionDate],
    [t.cavities, !mold.cavities || mold.cavities <= 0],
    [t.cycleTime, !mold.cycleTime || mold.cycleTime <= 0],
    [t.unitPrice, !mold.unitPrice || mold.unitPrice <= 0],
    [t.quantity, !mold.quantity || mold.quantity <= 0],
    [t.moldSize, !mold.moldLength || !mold.moldWidth || !mold.moldThickness],
  ].filter(([, miss]) => miss).map(([label]) => label as string);

  return (
    <>
      {/* Main row */}
      <tr
        className="cursor-pointer border-t transition-colors hover:bg-gray-50/50"
        style={{ borderColor: '#e0e8dc' }}
        onClick={onToggle}
      >
        <td className="px-3 py-3">
          <span
            className="flex h-5 w-5 items-center justify-center rounded transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="#6b7c6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#6b7c6b' }}>
          {(() => {
            const product = products.find((p) => p.id === mold.productId);
            return lang === 'en'
              ? (product?.nameEn || product?.name || mold.productNameEn || mold.productName || '')
              : (product?.name || mold.productName || '');
          })()}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          {lang === 'en' ? (mold.nameEn || mold.name) : mold.name}
        </td>
        <td className="px-3 py-3 text-sm">
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor}`}>
            {statusLabel}
          </span>
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          {mold.factory}
        </td>
        <td className="px-3 py-3 text-sm font-medium" style={{ color: '#2d3b2d' }}>
          {mold.code}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#6b7c6b' }}>
          {mold.projectNumber || '-'}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#6b7c6b' }}>
          {lang === 'en' ? (mold.supplierEn || mold.supplier) : mold.supplier}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          {mold.cavities}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          ¥{mold.unitPrice.toLocaleString('zh-CN')}
        </td>
        <td className="w-10 px-3 py-3 text-sm">
          {missingFields.length > 0 && (
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: '#f39c12' }}
              title={(lang === 'zh' ? '漏填字段：' : 'Missing fields: ') + missingFields.join(lang === 'zh' ? '、' : ', ')}
            />
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={11} className="p-0">
            <div className="px-6 py-5" style={{ backgroundColor: '#f0f7ec' }}>
              {renderPendingBanner}
              <div className="grid grid-cols-2 gap-8">
                {/* Left column - Basic Info */}
                <div>
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                    {t.basicInfo}
                  </h4>
                  <div className="space-y-3">
                    <DetailField label={t.moldNameZh}>
                      <input
                        type="text"
                        value={mold.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const prevAuto = translateMoldName(mold.name);
                          onUpdate(mold.id, 'name', val);
                          // 英文名称为空或仍是上次的自动翻译结果时，同步自动翻译
                          if (!mold.nameEn || mold.nameEn === prevAuto) {
                            onUpdate(mold.id, 'nameEn', translateMoldName(val));
                          }
                        }}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.moldNameEnLabel}>
                      <input
                        type="text"
                        value={mold.nameEn || ''}
                        onChange={(e) => onUpdate(mold.id, 'nameEn', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.projectNumber}>
                      <input
                        type="text"
                        value={mold.projectNumber || ''}
                        onChange={(e) => onUpdate(mold.id, 'projectNumber', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.internalNumber}>
                      <input
                        type="text"
                        value={mold.internalNumber || ''}
                        onChange={(e) => onUpdate(mold.id, 'internalNumber', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.drawingNumber}>
                      <input
                        type="text"
                        value={mold.drawingNumber || ''}
                        onChange={(e) => onUpdate(mold.id, 'drawingNumber', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.belongProduct}>
                      <select
                        value={mold.productId}
                        onChange={(e) => {
                          const productId = e.target.value;
                          const product = products.find((p) => p.id === productId);
                          onUpdate(mold.id, 'productId', productId);
                          onUpdate(mold.id, 'productName', product?.name || '');
                          onUpdate(mold.id, 'productNameEn', product?.nameEn || '');
                        }}
                        className="detail-input"
                      >
                        <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                        {products.filter((p) => p.buId === mold.buId).map((p) => (
                          <option key={p.id} value={p.id}>
                            {lang === 'en' ? (p.nameEn || p.name) : p.name}
                          </option>
                        ))}
                        {mold.productId && !products.some((p) => p.id === mold.productId) && (
                          <option value={mold.productId}>
                            {lang === 'en' ? (mold.productNameEn || mold.productName || mold.productId) : (mold.productName || mold.productId)}
                          </option>
                        )}
                      </select>
                    </DetailField>
                    <DetailField label={t.moldCode}>
                      <input
                        type="text"
                        value={mold.code}
                        onChange={(e) => onUpdate(mold.id, 'code', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.detailSupplier}>
                      <select
                        value={lang === 'en' ? (mold.supplierEn || mold.supplier) : mold.supplier}
                        onChange={(e) => {
                          const val = e.target.value;
                          const supplier = suppliers.find((s) => (lang === 'en' ? s.en : s.cn) === val);
                          onUpdate(mold.id, lang === 'en' ? 'supplierEn' : 'supplier', val);
                          if (supplier) {
                            onUpdate(mold.id, lang === 'en' ? 'supplier' : 'supplierEn', lang === 'en' ? supplier.cn : supplier.en);
                          }
                        }}
                        className="detail-input"
                      >
                        <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                        {suppliers.map((s) => (
                          <option key={s.cn} value={lang === 'en' ? s.en : s.cn}>
                            {lang === 'en' ? s.en : s.cn}
                          </option>
                        ))}
                      </select>
                    </DetailField>
                    <DetailField label={t.belongBU}>
                      <select
                        value={mold.buId}
                        onChange={(e) => onUpdate(mold.id, 'buId', e.target.value)}
                        className="detail-input"
                      >
                        {BUS.map((bu) => (
                          <option key={bu.id} value={bu.id}>
                            {bu.name}
                          </option>
                        ))}
                      </select>
                    </DetailField>
                    <DetailField label={t.useFactory}>
                      <select
                        value={mold.factory}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          if (newVal !== mold.factory) {
                            onConfirmChange(mold.id, 'factory', mold.factory, newVal, mold.factory, newVal);
                          }
                        }}
                        className="detail-input"
                      >
                        {factories.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </DetailField>
                    <DetailField label={t.location}>
                      <select
                        value={mold.location || ''}
                        onChange={(e) => onUpdate(mold.id, 'location', e.target.value)}
                        className="detail-input"
                      >
                        <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                        {mold.location && !locations.includes(mold.location) && (
                          <option value={mold.location}>{mold.location}</option>
                        )}
                      </select>
                    </DetailField>
                    <DetailField label={t.status}>
                      <select
                        value={mold.status}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          if (newVal !== mold.status) {
                            const statusLabels: Record<string, string> = {
                              active: t.active,
                              maintenance: t.maintenance,
                              retired: t.retired,
                              pending: t.pending,
                            };
                            onConfirmChange(mold.id, 'status', mold.status, newVal, statusLabels[mold.status] || mold.status, statusLabels[newVal] || newVal);
                          }
                        }}
                        className="detail-input"
                      >
                        <option value="active">{t.active}</option>
                        <option value="maintenance">{t.maintenance}</option>
                        <option value="retired">{t.retired}</option>
                        <option value="pending">{t.pending}</option>
                      </select>
                    </DetailField>
                    <DetailField label={t.moldSize}>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs" style={{ color: '#6b7c6b' }}>{t.moldLength}</span>
                          <input
                            type="number"
                            value={mold.moldLength ?? 0}
                            onChange={(e) => onUpdate(mold.id, 'moldLength', Number(e.target.value))}
                            className="detail-input"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs" style={{ color: '#6b7c6b' }}>{t.moldWidth}</span>
                          <input
                            type="number"
                            value={mold.moldWidth ?? 0}
                            onChange={(e) => onUpdate(mold.id, 'moldWidth', Number(e.target.value))}
                            className="detail-input"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs" style={{ color: '#6b7c6b' }}>{t.moldThickness}</span>
                          <input
                            type="number"
                            value={mold.moldThickness ?? 0}
                            onChange={(e) => onUpdate(mold.id, 'moldThickness', Number(e.target.value))}
                            className="detail-input"
                          />
                        </div>
                      </div>
                    </DetailField>
                    <DetailField label={t.moldWeight}>
                      <input
                        type="number"
                        min="0"
                        value={mold.moldWeight ?? 0}
                        onChange={(e) => onUpdate(mold.id, 'moldWeight', Number(e.target.value))}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.moldType}>
                      <select
                        value={mold.moldType ?? 'mass'}
                        onChange={(e) => onUpdate(mold.id, 'moldType', e.target.value)}
                        className="detail-input"
                      >
                        <option value="mass">{t.massProduction}</option>
                        <option value="trial">{t.trialMold}</option>
                      </select>
                    </DetailField>
                    <DetailField label={t.assetOwnership}>
                      <select
                        value={lang === 'en' ? (mold.assetOwnershipEn || mold.assetOwnership || '') : (mold.assetOwnership || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const ao = assetOwnerships.find((a) => (lang === 'en' ? a.en : a.cn) === val);
                          onUpdate(mold.id, lang === 'en' ? 'assetOwnershipEn' : 'assetOwnership', val);
                          if (ao) {
                            onUpdate(mold.id, lang === 'en' ? 'assetOwnership' : 'assetOwnershipEn', lang === 'en' ? ao.cn : ao.en);
                          } else {
                            onUpdate(mold.id, lang === 'en' ? 'assetOwnership' : 'assetOwnershipEn', val);
                          }
                        }}
                        className="detail-input"
                      >
                        <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                        {assetOwnerships.map((ao) => (
                          <option key={ao.cn} value={lang === 'en' ? ao.en : ao.cn}>
                            {lang === 'en' ? ao.en : ao.cn}
                          </option>
                        ))}
                        {(() => {
                          const cur = lang === 'en' ? (mold.assetOwnershipEn || mold.assetOwnership || '') : (mold.assetOwnership || '');
                          return cur && !assetOwnerships.some((a) => (lang === 'en' ? a.en : a.cn) === cur) && (
                            <option value={cur}>{cur}</option>
                          );
                        })()}
                      </select>
                    </DetailField>
                    <div className="pt-2">
                      <button
                        onClick={() => onDeleteClick(mold.id)}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#e74c3c' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {t.deleteMold}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right column - Production & Cost */}
                <div>
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                    {t.prodParams}
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <DetailField label={t.cavities}>
                        <input
                          type="number"
                          value={mold.cavities}
                          onChange={(e) => onUpdate(mold.id, 'cavities', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label={t.runnerType}>
                        <select
                          value={mold.runnerType}
                          onChange={(e) => onUpdate(mold.id, 'runnerType', e.target.value)}
                          className="detail-input"
                        >
                          {runnerTypes.map((rt) => (
                            <option key={rt} value={rt}>
                              {RUNNER_NAME_MAP[rt]?.[lang] || rt}
                            </option>
                          ))}
                        </select>
                      </DetailField>
                      <DetailField label={t.cycleTime}>
                        <input
                          type="number"
                          value={mold.cycleTime}
                          onChange={(e) => onUpdate(mold.id, 'cycleTime', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <DetailField label={t.hourlyOutputTheory} hint={t.hourlyOutputTheoryHint}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {mold.theoreticalHourlyCapacity ?? 0} <span className="ml-1 text-xs">{t.capacityUnit}</span>
                        </div>
                      </DetailField>
                      <DetailField label={t.hourlyOutputActual} hint={t.hourlyOutputActualHint}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {mold.actualHourlyCapacity ?? 0} <span className="ml-1 text-xs">{t.capacityUnit}</span>
                        </div>
                      </DetailField>
                      <DetailField label={t.dailyOutputActual} hint={t.dailyOutputActualHint}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {(mold.actualHourlyCapacity ?? 0) * 24} <span className="ml-1 text-xs">{t.capacityUnitDay}</span>
                        </div>
                      </DetailField>
                    </div>
                    <DetailField label={t.oee}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={mold.oee}
                        onChange={(e) => {
                          const newOee = Number(e.target.value);
                          if (newOee < 0.9 && !mold.oeeReason && !mold.oeeReasonEn) {
                            onOEEValidationAlert();
                            return;
                          }
                          onUpdate(mold.id, 'oee', newOee);
                        }}
                        className="detail-input"
                        style={{
                          borderColor: mold.oee < 0.9 ? '#e74c3c' : '#e0e8dc',
                          borderWidth: mold.oee < 0.9 ? '2px' : '1px',
                        }}
                      />
                    </DetailField>
                    <DetailField label={t.oeeLowReason}>
                      <textarea
                        value={lang === 'en' ? (mold.oeeReasonEn || mold.oeeReason || '') : (mold.oeeReason || '')}
                        onChange={(e) => onUpdate(mold.id, lang === 'en' ? 'oeeReasonEn' : 'oeeReason', e.target.value)}
                        placeholder={t.oeeLowPlaceholder}
                        className="detail-input min-h-[60px] resize-none"
                        style={{ borderColor: mold.oee < 0.9 ? '#e74c3c' : '#e0e8dc' }}
                      />
                    </DetailField>
                    <div className="grid grid-cols-3 gap-3">
                      <DetailField label={t.quantity}>
                        <input
                          type="number"
                          value={mold.quantity}
                          onChange={(e) => onUpdate(mold.id, 'quantity', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label={t.unitPriceTax}>
                        <input
                          type="number"
                          step="0.01"
                          key={`unitPrice-${mold.id}-${mold.unitPrice}`}
                          defaultValue={mold.unitPrice ?? 0}
                          onBlur={(e) => onUpdate(mold.id, 'unitPrice', Math.round(Number(e.target.value) * 100) / 100)}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label={t.totalPrice}>
                        <div
                          className="rounded-lg px-3 py-1.5 text-sm"
                          style={{ backgroundColor: '#e8ede5', color: '#6b7c6b' }}
                        >
                          ¥{totalPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                        </div>
                      </DetailField>
                    </div>
                    <DetailField label={t.lossCoeff}>
                      <input
                        type="number"
                        step="0.01"
                        value={mold.lossCoefficient}
                        onChange={(e) => onUpdate(mold.id, 'lossCoefficient', Number(e.target.value))}
                        className="detail-input"
                        style={{
                          borderColor: mold.lossCoefficient !== 0.05 ? '#f39c12' : '#e0e8dc',
                          borderWidth: mold.lossCoefficient !== 0.05 ? '2px' : '1px',
                        }}
                      />
                    </DetailField>
                    <DetailField label={t.modifyReason}>
                      <textarea
                        value={lang === 'en' ? (mold.lossReasonEn || mold.lossReason || '') : (mold.lossReason || '')}
                        onChange={(e) => onUpdate(mold.id, lang === 'en' ? 'lossReasonEn' : 'lossReason', e.target.value)}
                        placeholder={t.lossPlaceholder}
                        className="detail-input min-h-[60px] resize-none"
                        style={{ borderColor: mold.lossCoefficient !== 0.05 ? '#f39c12' : '#e0e8dc' }}
                      />
                    </DetailField>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label={t.material}>
                        <select
                          value={mold.material}
                          onChange={(e) => onUpdate(mold.id, 'material', e.target.value)}
                          className="detail-input"
                        >
                          <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                          {materials.map((mat) => (
                            <option key={mat} value={mat}>
                              {mat}
                            </option>
                          ))}
                          {mold.material && !materials.includes(mold.material) && (
                            <option value={mold.material}>{mold.material}</option>
                          )}
                        </select>
                      </DetailField>
                      <DetailField label={t.materialLossCoeff}>
                        <input
                          type="number"
                          step="0.01"
                          value={mold.materialLossCoeff}
                          onChange={(e) => onUpdate(mold.id, 'materialLossCoeff', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label={t.productWeight}>
                        <input
                          type="number"
                          step="0.01"
                          value={mold.productWeight}
                          onChange={(e) => onUpdate(mold.id, 'productWeight', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label={t.wasteWeight}>
                        <input
                          type="number"
                          step="0.01"
                          value={mold.wasteWeight}
                          onChange={(e) => onUpdate(mold.id, 'wasteWeight', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label={t.activationDate}>
                        <input
                          type="date"
                          value={mold.commissionDate ?? ''}
                          onChange={(e) => onUpdate(mold.id, 'commissionDate', e.target.value)}
                          className="detail-input"
                        />
                      </DetailField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label={t.monthlyCapacityTheory} hint={t.monthlyCapacityTheoryHint.replace('{days}', String(getMonthlyWorkDays()))}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {(mold.theoreticalMonthlyCapacity ?? 0).toFixed(2)} <span className="ml-1 text-xs">{lang === 'zh' ? '万/月' : '10k/mo'}</span>
                        </div>
                      </DetailField>
                      <DetailField label={t.monthlyCapacityActual} hint={t.monthlyCapacityActualHint.replace('{days}', String(getMonthlyWorkDays()))}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {(mold.actualMonthlyCapacity ?? 0).toFixed(2)} <span className="ml-1 text-xs">{lang === 'zh' ? '万/月' : '10k/mo'}</span>
                        </div>
                      </DetailField>
                    </div>
                    <DetailField label={t.depreciationYears}>
                      <input
                        type="number"
                        min="0"
                        value={mold.depreciationYears ?? 0}
                        onChange={(e) => onUpdate(mold.id, 'depreciationYears', Number(e.target.value))}
                        className="detail-input"
                      />
                    </DetailField>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Detail Field wrapper
function DetailField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs" style={{ color: '#6b7c6b' }}>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dotted" style={{ borderColor: '#a8c5a0' }}>
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4} className="rounded-lg bg-[#2d3b2d] px-3 py-1.5 text-xs text-white shadow-md">
              {hint}
            </TooltipContent>
          </Tooltip>
        ) : (
          label
        )}
      </label>
      {children}
    </div>
  );
}

// Donut Chart Component
function DonutChart({
  segments,
  size = 90,
  strokeWidth = 14,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<{ acc: number; result: Array<{ value: number; color: string; dashArray: string; dashOffset: number }> }>(
      (prev, seg) => {
        const dashLength = (seg.value / total) * circumference;
        const dashOffset = -prev.acc;
        return {
          acc: prev.acc + dashLength,
          result: [
            ...prev.result,
            {
              ...seg,
              dashArray: `${dashLength} ${circumference - dashLength}`,
              dashOffset,
            },
          ],
        };
      },
      { acc: 0, result: [] },
    ).result;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={arc.dashArray}
          strokeDashoffset={arc.dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      ))}
    </svg>
  );
}

// Add Mold Modal Component
function AddMoldModal({
  newMold,
  onUpdate,
  onSave,
  onCancel,
  lang,
  products,
  factories,
  runnerTypes,
  materials,
  locations,
  suppliers,
  assetOwnerships,
  adminMode,
  renderRequestInfo,
}: {
  newMold: Partial<Mold>;
  onUpdate: (field: keyof Mold, value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  lang: Lang;
  products: Product[];
  factories: string[];
  runnerTypes: string[];
  materials: string[];
  locations: string[];
  suppliers: { cn: string; en: string }[];
  assetOwnerships: { cn: string; en: string }[];
  adminMode: boolean;
  renderRequestInfo?: React.ReactNode;
}) {
  const t = T[lang];
  const totalPrice = (newMold.quantity || 1) * (newMold.unitPrice || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#e0e8dc' }}>
          <h3 className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>
            {adminMode ? t.addMoldTitle : t.purchaseFormTitle}
          </h3>
          <button onClick={onCancel} className="rounded-lg p-1 transition-colors hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7c6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5" style={{ backgroundColor: '#f0f7ec' }}>
          <div className="grid grid-cols-2 gap-8">
            {/* Left column - Basic Info */}
            <div>
              <h4 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                {t.basicInfo}
              </h4>
              <div className="space-y-3">
                <DetailField label={t.moldNameZh}>
                  <input
                    type="text"
                    value={newMold.name || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const prevAuto = translateMoldName(newMold.name || '');
                      onUpdate('name', val);
                      if (!newMold.nameEn || newMold.nameEn === prevAuto) {
                        onUpdate('nameEn', translateMoldName(val));
                      }
                    }}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.moldNameEnLabel}>
                  <input
                    type="text"
                    value={newMold.nameEn || ''}
                    onChange={(e) => onUpdate('nameEn', e.target.value)}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.projectNumber}>
                  <input
                    type="text"
                    value={newMold.projectNumber || ''}
                    onChange={(e) => onUpdate('projectNumber', e.target.value)}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.internalNumber}>
                  <input
                    type="text"
                    value={newMold.internalNumber || ''}
                    onChange={(e) => onUpdate('internalNumber', e.target.value)}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.drawingNumber}>
                  <input
                    type="text"
                    value={newMold.drawingNumber || ''}
                    onChange={(e) => onUpdate('drawingNumber', e.target.value)}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.moldCode}>
                  <input
                    type="text"
                    value={newMold.code || ''}
                    onChange={(e) => onUpdate('code', e.target.value)}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.detailSupplier}>
                  <select
                    value={lang === 'en' ? (newMold.supplierEn || '') : (newMold.supplier || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const supplier = suppliers.find((s) => (lang === 'en' ? s.en : s.cn) === val);
                      onUpdate(lang === 'en' ? 'supplierEn' : 'supplier', val);
                      if (supplier) {
                        onUpdate(lang === 'en' ? 'supplier' : 'supplierEn', lang === 'en' ? supplier.cn : supplier.en);
                      }
                    }}
                    className="detail-input"
                  >
                    <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                    {suppliers.map((s) => (
                      <option key={s.cn} value={lang === 'en' ? s.en : s.cn}>
                        {lang === 'en' ? s.en : s.cn}
                      </option>
                    ))}
                  </select>
                </DetailField>
                <DetailField label={t.belongBU}>
                  <select
                    value={newMold.buId || BUS[0].id}
                    onChange={(e) => {
                      const buId = e.target.value;
                      onUpdate('buId', buId);
                      // Reset product when BU changes
                      const buProducts = products.filter((p) => p.buId === buId);
                      onUpdate('productId', buProducts[0]?.id || '');
                    }}
                    className="detail-input"
                  >
                    {BUS.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name}
                      </option>
                    ))}
                  </select>
                </DetailField>
                <DetailField label={t.belongProduct}>
                  <select
                    value={newMold.productId || ''}
                    onChange={(e) => {
                      const productId = e.target.value;
                      const product = products.find((p) => p.id === productId);
                      onUpdate('productId', productId);
                      onUpdate('productName', product?.name || '');
                      onUpdate('productNameEn', product?.nameEn || '');
                    }}
                    className="detail-input"
                  >
                    <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                    {products.filter((p) => p.buId === (newMold.buId || BUS[0].id)).map((p) => (
                      <option key={p.id} value={p.id}>
                        {lang === 'en' ? (p.nameEn || p.name) : p.name}
                      </option>
                    ))}
                  </select>
                </DetailField>
                <DetailField label={t.useFactory}>
                  <select
                    value={newMold.factory || 'LD'}
                    onChange={(e) => onUpdate('factory', e.target.value)}
                    className="detail-input"
                  >
                    {factories.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </DetailField>
                <DetailField label={t.location}>
                  <select
                    value={newMold.location || ''}
                    onChange={(e) => onUpdate('location', e.target.value)}
                    className="detail-input"
                  >
                    <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </DetailField>
                <DetailField label={t.status}>
                  <select
                    value={newMold.status || 'pending'}
                    onChange={(e) => onUpdate('status', e.target.value)}
                    className="detail-input"
                  >
                    <option value="active">{t.active}</option>
                    <option value="maintenance">{t.maintenance}</option>
                    <option value="retired">{t.retired}</option>
                    <option value="pending">{t.pending}</option>
                  </select>
                </DetailField>
                <DetailField label={t.moldSize}>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>{t.moldLength}</span>
                      <input
                        type="number"
                        value={newMold.moldLength ?? 0}
                        onChange={(e) => onUpdate('moldLength', Number(e.target.value))}
                        className="detail-input"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>{t.moldWidth}</span>
                      <input
                        type="number"
                        value={newMold.moldWidth ?? 0}
                        onChange={(e) => onUpdate('moldWidth', Number(e.target.value))}
                        className="detail-input"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>{t.moldThickness}</span>
                      <input
                        type="number"
                        value={newMold.moldThickness ?? 0}
                        onChange={(e) => onUpdate('moldThickness', Number(e.target.value))}
                        className="detail-input"
                      />
                    </div>
                  </div>
                </DetailField>
                <DetailField label={t.moldWeight}>
                  <input
                    type="number"
                    min="0"
                    value={newMold.moldWeight ?? 0}
                    onChange={(e) => onUpdate('moldWeight', Number(e.target.value))}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.moldType}>
                  <select
                    value={newMold.moldType ?? 'mass'}
                    onChange={(e) => onUpdate('moldType', e.target.value)}
                    className="detail-input"
                  >
                    <option value="mass">{t.massProduction}</option>
                    <option value="trial">{t.trialMold}</option>
                  </select>
                </DetailField>
                <DetailField label={t.assetOwnership}>
                  <select
                    value={lang === 'en' ? (newMold.assetOwnershipEn || '') : (newMold.assetOwnership || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const ao = assetOwnerships.find((a) => (lang === 'en' ? a.en : a.cn) === val);
                      onUpdate(lang === 'en' ? 'assetOwnershipEn' : 'assetOwnership', val);
                      if (ao) {
                        onUpdate(lang === 'en' ? 'assetOwnership' : 'assetOwnershipEn', lang === 'en' ? ao.cn : ao.en);
                      } else {
                        onUpdate(lang === 'en' ? 'assetOwnership' : 'assetOwnershipEn', val);
                      }
                    }}
                    className="detail-input"
                  >
                    <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                    {assetOwnerships.map((ao) => (
                      <option key={ao.cn} value={lang === 'en' ? ao.en : ao.cn}>
                        {lang === 'en' ? ao.en : ao.cn}
                      </option>
                    ))}
                  </select>
                </DetailField>
                <DetailField label={t.activationDate}>
                  <input
                    type="date"
                    value={newMold.commissionDate ?? ''}
                    onChange={(e) => onUpdate('commissionDate', e.target.value)}
                    className="detail-input"
                  />
                </DetailField>
                <DetailField label={t.depreciationYears}>
                  <input
                    type="number"
                    min="0"
                    value={newMold.depreciationYears ?? 0}
                    onChange={(e) => onUpdate('depreciationYears', Number(e.target.value))}
                    className="detail-input"
                  />
                </DetailField>
              </div>
            </div>

            {/* Right column - Production & Cost */}
            <div>
              <h4 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                {t.prodParams}
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <DetailField label={t.cavities}>
                    <input
                      type="number"
                      value={newMold.cavities ?? 1}
                      onChange={(e) => onUpdate('cavities', Number(e.target.value))}
                      className="detail-input"
                    />
                  </DetailField>
                  <DetailField label={t.runnerType}>
                    <select
                      value={newMold.runnerType || '热流道'}
                      onChange={(e) => onUpdate('runnerType', e.target.value)}
                      className="detail-input"
                    >
                      {runnerTypes.map((rt) => (
                        <option key={rt} value={rt}>
                          {RUNNER_NAME_MAP[rt]?.[lang] || rt}
                        </option>
                      ))}
                    </select>
                  </DetailField>
                  <DetailField label={t.cycleTime}>
                    <input
                      type="number"
                      value={newMold.cycleTime ?? 30}
                      onChange={(e) => onUpdate('cycleTime', Number(e.target.value))}
                      className="detail-input"
                    />
                  </DetailField>
                </div>
                <DetailField label={t.hourlyCapacity}>
                  <div
                    className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                    style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                  >
                    {newMold.hourlyCapacity ?? 120} <span className="ml-1 text-xs">{t.capacityUnit}</span>
                  </div>
                </DetailField>
                <DetailField label={t.oee}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={newMold.oee ?? 0.9}
                    onChange={(e) => onUpdate('oee', Number(e.target.value))}
                    className="detail-input"
                    style={{
                      borderColor: (newMold.oee ?? 0.9) < 0.9 ? '#e74c3c' : '#e0e8dc',
                      borderWidth: (newMold.oee ?? 0.9) < 0.9 ? '2px' : '1px',
                    }}
                  />
                </DetailField>
                <DetailField label={t.oeeLowReason}>
                  <textarea
                    value={lang === 'en' ? (newMold.oeeReasonEn || '') : (newMold.oeeReason || '')}
                    onChange={(e) => onUpdate(lang === 'en' ? 'oeeReasonEn' : 'oeeReason', e.target.value)}
                    placeholder={t.oeeLowPlaceholder}
                    className="detail-input min-h-[60px] resize-none"
                    style={{ borderColor: (newMold.oee ?? 0.9) < 0.9 ? '#e74c3c' : '#e0e8dc' }}
                  />
                </DetailField>
                <div className="grid grid-cols-3 gap-3">
                  <DetailField label={t.quantity}>
                    <input
                      type="number"
                      value={newMold.quantity ?? 1}
                      onChange={(e) => onUpdate('quantity', Number(e.target.value))}
                      className="detail-input"
                    />
                  </DetailField>
                  <DetailField label={t.unitPriceTax}>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={newMold.unitPrice ?? 0}
                      onBlur={(e) => onUpdate('unitPrice', Math.round(Number(e.target.value) * 100) / 100)}
                      className="detail-input"
                    />
                  </DetailField>
                  <DetailField label={t.totalPrice}>
                    <div
                      className="rounded-lg px-3 py-1.5 text-sm"
                      style={{ backgroundColor: '#e8ede5', color: '#6b7c6b' }}
                    >
                      ¥{totalPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </div>
                  </DetailField>
                </div>
                <DetailField label={t.lossCoeff}>
                  <input
                    type="number"
                    step="0.01"
                    value={newMold.lossCoefficient ?? 0.05}
                    onChange={(e) => onUpdate('lossCoefficient', Number(e.target.value))}
                    className="detail-input"
                    style={{
                      borderColor: (newMold.lossCoefficient ?? 0.05) !== 0.05 ? '#f39c12' : '#e0e8dc',
                      borderWidth: (newMold.lossCoefficient ?? 0.05) !== 0.05 ? '2px' : '1px',
                    }}
                  />
                </DetailField>
                <DetailField label={t.modifyReason}>
                  <textarea
                    value={lang === 'en' ? (newMold.lossReasonEn || '') : (newMold.lossReason || '')}
                    onChange={(e) => onUpdate(lang === 'en' ? 'lossReasonEn' : 'lossReason', e.target.value)}
                    placeholder={t.lossPlaceholder}
                    className="detail-input min-h-[60px] resize-none"
                    style={{ borderColor: (newMold.lossCoefficient ?? 0.05) !== 0.05 ? '#f39c12' : '#e0e8dc' }}
                  />
                </DetailField>
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label={t.material}>
                    <select
                      value={newMold.material || ''}
                      onChange={(e) => onUpdate('material', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">{lang === 'zh' ? '请选择' : 'Select'}</option>
                      {materials.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </DetailField>
                  <DetailField label={t.materialLossCoeff}>
                    <input
                      type="number"
                      step="0.01"
                      value={newMold.materialLossCoeff ?? 0.02}
                      onChange={(e) => onUpdate('materialLossCoeff', Number(e.target.value))}
                      className="detail-input"
                    />
                  </DetailField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label={t.productWeight}>
                    <input
                      type="number"
                      step="0.01"
                      value={newMold.productWeight ?? 0}
                      onChange={(e) => onUpdate('productWeight', Number(e.target.value))}
                      className="detail-input"
                    />
                  </DetailField>
                  <DetailField label={t.wasteWeight}>
                    <input
                      type="number"
                      step="0.01"
                      value={newMold.wasteWeight ?? 0}
                      onChange={(e) => onUpdate('wasteWeight', Number(e.target.value))}
                      className="detail-input"
                    />
                  </DetailField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label={t.monthlyCapacity}>
                    <div
                      className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                      style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                    >
                      {newMold.monthlyCapacity ?? 0} <span className="ml-1 text-xs">{lang === 'zh' ? '万/月' : '10k/mo'}</span>
                    </div>
                  </DetailField>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase request info (standard mode only) */}
        {!adminMode && renderRequestInfo}

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4" style={{ borderColor: '#e0e8dc' }}>
          <button
            onClick={onCancel}
            className="h-9 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e0e8dc', color: '#6b7c6b' }}
          >
            {t.cancel}
          </button>
          <button
            onClick={onSave}
            className="h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#4a7c59' }}
          >
            {adminMode ? t.save : t.reqSubmitPurchase}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ Request Board (approval page) ═══
function RequestBoard({
  lang,
  adminMode,
  requests,
  onApply,
  onReject,
  onWithdraw,
  onResubmit,
  onMarkRead,
}: {
  lang: Lang;
  adminMode: boolean;
  requests: MoldRequest[];
  onApply: (id: string, comment?: string) => void;
  onReject: (id: string, comment: string) => void;
  onWithdraw: (id: string) => void;
  onResubmit: (id: string) => void;
  onMarkRead?: (id: string) => void;
}) {
  const zh = lang === 'zh';
  const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'modify' | 'purchase'>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const L = {
    title: zh ? '申请审批' : 'Requests',
    subtitle: zh ? '修改与购买申请的提交、审批与历史记录' : 'Submit, review, and track modify & purchase requests',
    pending: zh ? '待审批' : 'Pending',
    approved: zh ? '已通过' : 'Approved',
    rejected: zh ? '已驳回' : 'Rejected',
    cancelled: zh ? '已撤回' : 'Cancelled',
    all: zh ? '全部' : 'All',
    typeModify: zh ? '修改申请' : 'Modify',
    typePurchase: zh ? '购买申请' : 'Purchase',
    typeAll: zh ? '全部类型' : 'All Types',
    colNo: zh ? '单号' : 'Req. No.',
    colType: zh ? '类型' : 'Type',
    colTarget: zh ? '目标' : 'Target',
    colReason: zh ? '购买原因' : 'Purchase Reason',
    colApplicant: zh ? '申请人' : 'Applicant',
    colStatus: zh ? '状态' : 'Status',
    colTime: zh ? '提交时间' : 'Submitted',
    colActions: zh ? '操作' : 'Actions',
    unreadTip: zh ? '新审批结果' : 'New review result',
    view: zh ? '查看' : 'View',
    withdraw: zh ? '撤回' : 'Withdraw',
    resubmit: zh ? '重新提交' : 'Resubmit',
    empty: zh ? '暂无申请记录' : 'No requests yet',
    detailTitle: zh ? '申请详情' : 'Request Detail',
    reason: zh ? '申请原因' : 'Reason',
    applicant: zh ? '申请人' : 'Applicant',
    appliedAt: zh ? '提交时间' : 'Submitted At',
    reviewer: zh ? '审批人' : 'Reviewer',
    reviewedAt: zh ? '审批时间' : 'Reviewed At',
    reviewComment: zh ? '审批意见' : 'Review Comment',
    resubmitOf: zh ? '重新提交自' : 'Resubmit of',
    changesTitle: zh ? '变更清单' : 'Changes',
    diffNote: zh ? '以下变更将在审批通过后写入台账' : 'Changes below will be applied to the registry after approval',
    field: zh ? '字段' : 'Field',
    oldValue: zh ? '当前值' : 'Current',
    newValue: zh ? '申请值' : 'Requested',
    purchaseDetail: zh ? '购买明细' : 'Purchase Detail',
    totalAmount: zh ? '合计金额' : 'Total Amount',
    willPending: zh ? '通过后模具将进入台账，状态为"设计中"' : 'After approval, the mold enters the registry with status "Pending"',
    commentPlaceholder: zh ? '填写审批意见（驳回时必填）' : 'Review comment (required to reject)',
    approve: zh ? '通过' : 'Approve',
    reject: zh ? '驳回' : 'Reject',
    waiting: zh ? '等待管理员审批' : 'Waiting for admin review',
    items: zh ? '项变更' : 'changes',
    copies: zh ? '套' : 'set(s)',
    fMoldName: zh ? '模具名称' : 'Mold Name',
    fFactory: zh ? '工厂' : 'Factory',
    fBU: zh ? '所属BU' : 'Business Unit',
    fProduct: zh ? '所属产品' : 'Product',
    fSupplier: zh ? '供应商' : 'Supplier',
    fCavities: zh ? '腔数' : 'Cavities',
    fCycleTime: zh ? '周期(s)' : 'Cycle(s)',
    fOEE: zh ? 'OEE' : 'OEE',
    fUnitPrice: zh ? '单价(元)' : 'Unit Price',
    fQuantity: zh ? '数量(套)' : 'Quantity',
  };

  const fmtTime = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const fmtMoney = (v: number | null | undefined) =>
    typeof v === 'number' ? `¥${v.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}` : '-';

  const REQ_STATUS_COLOR: Record<string, string> = {
    pending: '#f39c12',
    approved: '#4a7c59',
    rejected: '#e74c3c',
    cancelled: '#95a5a6',
  };

  const statusLabel = (s: string) => (L as Record<string, string>)[s] ?? s;

  const statusBadge = (s: string) => (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium"
      style={{ backgroundColor: `${REQ_STATUS_COLOR[s] ?? '#95a5a6'}1a`, color: REQ_STATUS_COLOR[s] ?? '#95a5a6' }}
    >
      {statusLabel(s)}
    </span>
  );

  const typeBadge = (tp: string) => (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium"
      style={tp === 'modify' ? { backgroundColor: '#e8f0fe', color: '#5b7fb4' } : { backgroundColor: '#f4faf0', color: '#4a7c59' }}
    >
      {tp === 'modify' ? L.typeModify : L.typePurchase}
    </span>
  );

  const targetText = (r: MoldRequest) => {
    if (r.type === 'modify') return `${r.moldCode} · ${(r.changes || []).length} ${L.items}`;
    const nm = r.newMold as Partial<Mold> | undefined;
    return `${nm?.name ?? '-'} × ${nm?.quantity ?? 0} ${L.copies}`;
  };

  const filtered = useMemo(
    () =>
      requests
        .filter((r) => (statusTab === 'all' ? true : r.status === statusTab))
        .filter((r) => (typeFilter === 'all' ? true : r.type === typeFilter))
        .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1)),
    [requests, statusTab, typeFilter]
  );

  const detail = detailId ? requests.find((r) => r.id === detailId) ?? null : null;

  const pendingCountAll = requests.filter((r) => r.status === 'pending').length;

  // 普通模式：已通过/已驳回 Tab 的未读黄点（申请人尚未查看审批结果）
  const hasUnreadResult = (key: 'approved' | 'rejected') =>
    !adminMode && requests.some((r) => r.status === key && !r.applicantRead);

  const tabDefs: { key: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'all'; label: string }[] = [
    { key: 'pending', label: L.pending },
    { key: 'approved', label: L.approved },
    { key: 'rejected', label: L.rejected },
    { key: 'cancelled', label: L.cancelled },
    { key: 'all', label: L.all },
  ];

  const closeDetail = () => {
    setDetailId(null);
    setComment('');
    setCommentError('');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold" style={{ color: '#4a7c59' }}>
          {L.title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: '#6b7c6b' }}>
          {L.subtitle}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-xl bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {tabDefs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setStatusTab(tb.key)}
              className="relative px-4 py-2 text-sm font-medium transition-colors"
              style={statusTab === tb.key ? { backgroundColor: '#e8f5e9', color: '#4a7c59' } : { color: '#6b7c6b' }}
            >
              <span className="relative inline-block">
                {tb.label}
                {(tb.key === 'approved' || tb.key === 'rejected') && hasUnreadResult(tb.key) && (
                  <span
                    className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#f5b301' }}
                    title={zh ? '有新的审批结果' : 'New review results'}
                  />
                )}
              </span>
              {tb.key === 'pending' && pendingCountAll > 0 && (
                <span
                  className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: '#e74c3c' }}
                >
                  {pendingCountAll > 99 ? '99+' : pendingCountAll}
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'modify' | 'purchase')}
          className="h-9 rounded-xl border bg-white px-3 text-sm outline-none"
          style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
        >
          <option value="all">{L.typeAll}</option>
          <option value="modify">{L.typeModify}</option>
          <option value="purchase">{L.typePurchase}</option>
        </select>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm" style={{ color: '#6b7c6b' }}>
            {L.empty}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#e0e8dc', backgroundColor: '#f7faf5' }}>
                {[L.colNo, L.colType, L.colTarget, L.colReason, L.colApplicant, L.colStatus, L.colTime, L.colActions].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6b7c6b' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-[#f7faf5]" style={{ borderColor: '#f0f4ec' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#2d3b2d' }}>
                    {r.requestNo}
                  </td>
                  <td className="px-4 py-3">{typeBadge(r.type)}</td>
                  <td className="max-w-[260px] truncate px-4 py-3" style={{ color: '#2d3b2d' }}>
                    {targetText(r)}
                  </td>
                  <td
                    className="max-w-[280px] whitespace-normal break-words px-4 py-3 text-sm leading-snug"
                    style={{ color: '#2d3b2d' }}
                  >
                    {r.reason || '-'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#2d3b2d' }}>
                    {r.applicant}
                  </td>
                  <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7c6b' }}>
                    {fmtTime(r.appliedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs font-medium transition-colors hover:underline"
                        style={{ color: '#4a7c59' }}
                        onClick={() => {
                          setDetailId(r.id);
                          setComment('');
                          setCommentError('');
                          if (!adminMode && onMarkRead && !r.applicantRead) onMarkRead(r.id);
                        }}
                      >
                        <span className="relative inline-block">
                          {L.view}
                          {!adminMode && !r.applicantRead && (
                            <span
                              className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full"
                              style={{ backgroundColor: '#f5b301' }}
                              title={L.unreadTip}
                            />
                          )}
                        </span>
                      </button>
                      {r.status === 'pending' && !adminMode && (
                        <button
                          className="text-xs transition-colors hover:underline"
                          style={{ color: '#95a5a6' }}
                          onClick={() => onWithdraw(r.id)}
                        >
                          {L.withdraw}
                        </button>
                      )}
                      {(r.status === 'rejected' || r.status === 'cancelled') && (
                        <button
                          className="text-xs font-medium transition-colors hover:underline"
                          style={{ color: '#5b7fb4' }}
                          onClick={() => onResubmit(r.id)}
                        >
                          {L.resubmit}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail dialog */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#e0e8dc' }}>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold" style={{ color: '#2d3b2d' }}>
                  {L.detailTitle}
                </h3>
                <span className="font-mono text-xs" style={{ color: '#6b7c6b' }}>
                  {detail.requestNo}
                </span>
                {typeBadge(detail.type)}
                {statusBadge(detail.status)}
              </div>
              <button onClick={closeDetail} className="text-lg leading-none" style={{ color: '#6b7c6b' }}>
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Modify: diff table */}
              {detail.type === 'modify' && (
                <div className="mb-5">
                  <p className="mb-2 text-xs" style={{ color: '#6b7c6b' }}>
                    {L.diffNote}
                  </p>
                  <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#e0e8dc' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: '#f7faf5' }}>
                          {[L.field, L.oldValue, L.newValue].map((h, i) => (
                            <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#6b7c6b' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.changes || []).map((c, i) => (
                          <tr key={i} className="border-t" style={{ borderColor: '#f0f4ec' }}>
                            <td className="px-4 py-2.5 font-medium" style={{ color: '#2d3b2d' }}>
                              {zh ? c.label : c.labelEn || c.label}
                            </td>
                            <td className="px-4 py-2.5" style={{ color: '#6b7c6b' }}>
                              {String(c.oldValue ?? '-')}
                            </td>
                            <td className="px-4 py-2.5 font-medium" style={{ color: '#4a7c59' }}>
                              {String(c.newValue ?? '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Purchase: field summary */}
              {detail.type === 'purchase' && detail.newMold && (() => {
                const nm = detail.newMold as Partial<Mold>;
                const buName = BUS.find((b) => b.id === nm.buId)?.name ?? nm.buId ?? '-';
                const prod = products.find((p) => p.id === nm.productId);
                const prodName = prod ? (zh ? prod.name : prod.nameEn || prod.name) : nm.productId ?? '-';
                const total = (nm.unitPrice ?? 0) * (nm.quantity ?? 0);
                const rows: { k: string; v: string }[] = [
                  { k: L.fMoldName, v: nm.name ?? '-' },
                  { k: L.fFactory, v: nm.factory ?? '-' },
                  { k: L.fBU, v: buName },
                  { k: L.fProduct, v: prodName },
                  { k: L.fSupplier, v: nm.supplier ?? '-' },
                  { k: L.fCavities, v: String(nm.cavities ?? '-') },
                  { k: L.fCycleTime, v: String(nm.cycleTime ?? '-') },
                  { k: L.fOEE, v: String(nm.oee ?? '-') },
                  { k: L.fUnitPrice, v: fmtMoney(nm.unitPrice) },
                  { k: L.fQuantity, v: `${nm.quantity ?? 0} ${L.copies}` },
                ];
                return (
                  <div className="mb-5">
                    <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#e0e8dc' }}>
                      <div className="px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: '#f7faf5', color: '#6b7c6b' }}>
                        {L.purchaseDetail}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 px-4 py-3">
                        {rows.map((row) => (
                          <div key={row.k} className="flex items-center justify-between border-b py-2 text-sm last:border-b-0" style={{ borderColor: '#f0f4ec' }}>
                            <span className="text-xs" style={{ color: '#6b7c6b' }}>
                              {row.k}
                            </span>
                            <span className="font-medium" style={{ color: '#2d3b2d' }}>
                              {row.v}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#f7faf5' }}>
                        <span className="text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                          {L.totalAmount}
                        </span>
                        <span className="text-base font-bold" style={{ color: '#4a7c59' }}>
                          {fmtMoney(total)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs" style={{ color: '#6b7c6b' }}>
                      {L.willPending}
                    </p>
                  </div>
                );
              })()}

              {/* Meta info */}
              <div className="rounded-xl border p-4" style={{ borderColor: '#e0e8dc', backgroundColor: '#fafcf8' }}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-xs" style={{ color: '#6b7c6b' }}>{L.applicant}：</span>
                    <span style={{ color: '#2d3b2d' }}>{detail.applicant}</span>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: '#6b7c6b' }}>{L.appliedAt}：</span>
                    <span style={{ color: '#2d3b2d' }}>{fmtTime(detail.appliedAt)}</span>
                  </div>
                  {detail.resubmitOf && (
                    <div className="col-span-2">
                      <span className="text-xs" style={{ color: '#6b7c6b' }}>{L.resubmitOf}：</span>
                      <span className="font-mono text-xs" style={{ color: '#2d3b2d' }}>{detail.resubmitOf}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-xs" style={{ color: '#6b7c6b' }}>{L.reason}：</span>
                  <p className="mt-1 text-sm" style={{ color: '#2d3b2d' }}>{detail.reason || '-'}</p>
                </div>
                {(detail.status === 'approved' || detail.status === 'rejected') && (
                  <div className="mt-3 border-t pt-3" style={{ borderColor: '#f0f4ec' }}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-xs" style={{ color: '#6b7c6b' }}>{L.reviewer}：</span>
                        <span style={{ color: '#2d3b2d' }}>{detail.reviewer ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-xs" style={{ color: '#6b7c6b' }}>{L.reviewedAt}：</span>
                        <span style={{ color: '#2d3b2d' }}>{fmtTime(detail.reviewedAt)}</span>
                      </div>
                    </div>
                    {detail.reviewComment && (
                      <p className="mt-2 text-sm" style={{ color: detail.status === 'rejected' ? '#e74c3c' : '#2d3b2d' }}>
                        {L.reviewComment}：{detail.reviewComment}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Admin review area */}
              {detail.status === 'pending' && adminMode && (
                <div className="mt-4">
                  <textarea
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#4a7c59]"
                    style={{ borderColor: '#e0e8dc', color: '#2d3b2d', minHeight: '72px', resize: 'vertical' }}
                    placeholder={L.commentPlaceholder}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setCommentError('');
                    }}
                  />
                  {commentError && (
                    <p className="mt-1 text-xs font-medium" style={{ color: '#e74c3c' }}>{commentError}</p>
                  )}
                </div>
              )}
              {detail.status === 'pending' && !adminMode && (
                <p className="mt-4 rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: '#fdf6e9', color: '#b07d2b' }}>
                  {L.waiting}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4" style={{ borderColor: '#e0e8dc' }}>
              {detail.status === 'pending' && adminMode ? (
                <>
                  <button
                    className="h-9 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-red-50"
                    style={{ borderColor: '#e74c3c', color: '#e74c3c' }}
                    onClick={() => {
                      if (!comment.trim()) {
                        setCommentError(zh ? '驳回时必须填写审批意见' : 'Review comment is required to reject');
                        return;
                      }
                      onReject(detail.id, comment);
                      closeDetail();
                    }}
                  >
                    {L.reject}
                  </button>
                  <button
                    className="h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#4a7c59' }}
                    onClick={() => {
                      onApply(detail.id, comment);
                      closeDetail();
                    }}
                  >
                    {L.approve}
                  </button>
                </>
              ) : (
                <button
                  className="h-9 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#e0e8dc', color: '#6b7c6b' }}
                  onClick={closeDetail}
                >
                  {zh ? '关闭' : 'Close'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
