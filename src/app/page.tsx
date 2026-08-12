'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BUS, INITIAL_MOLDS } from '@/lib/mock-data';
import {
  getFactories, getProducts, getRunnerTypes, getMaterials, getLocations, getSuppliers,
} from '@/lib/config-store';
import type { Mold, Product } from '@/lib/types';
import * as XLSX from 'xlsx';
import Analysis from '@/components/Analysis';

type Lang = 'zh' | 'en';

// Translation dictionaries
const T = {
  zh: {
    title: '模具列表',
    searchPlaceholder: '搜索模具名称/供应商/编号...',
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
    unitPrice: '单价',
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
    detailName: '名称',
    detailSupplier: '供应商',
    belongBU: '所属BU',
    belongProduct: '所属产品',
    useFactory: '使用工厂',
    // Detail - right
    prodParams: '生产参数与成本',
    runnerType: '流道类型',
    cycleTime: '注塑周期(s)',
    hourlyCapacity: '每小时产能',
    capacityUnit: '件/小时',
    oeeLowReason: 'OEE低于0.9的原因',
    oeeLowPlaceholder: '请填写OEE低于0.9的原因...',
    quantity: '数量',
    unitPriceTax: '单价(含税)',
    totalPrice: '合计价格',
    lossCoeff: '模具损耗系数',
    modifyReason: '损耗原因',
    lossPlaceholder: '请填写修改损耗系数的原因...',
    material: '产品材料',
    materialLossCoeff: '材料损耗系数',
    productWeight: '产品单只克重',
    wasteWeight: '废料克重',
    sprueWeight: '水口料重量(g)',
    monthlyCapacity: '月产能(万)',
    moldSize: '模具尺寸(mm)',
    moldLength: '长',
    moldWidth: '宽',
    moldThickness: '厚',
    location: '所在地',
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
    monthlyCapacityTheory: '理论月产能(万)',
    monthlyCapacityActual: '实际月产能(万)',
    depreciationYears: '折旧年数',
    activationDate: '启用时间',
    deleteMold: '删除',
    confirmDeleteTitle: '确认删除',
    confirmDeleteMsg: '确认要删除此模具吗？',
    confirmDelete: '删除',
  },
  en: {
    title: 'Mold List',
    searchPlaceholder: 'Search name / supplier / code...',
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
    unitPrice: 'Unit Price',
    noData: 'No matching mold data',
    active: 'In Use',
    maintenance: 'Maintenance',
    retired: 'Retired',
    pending: 'In Design',
    basicInfo: 'Basic Info',
    moldCode: 'Mold Code',
    projectNumber: 'Project Number',
    detailName: 'Name',
    detailSupplier: 'Supplier',
    belongBU: 'Business Unit',
    belongProduct: 'Product',
    useFactory: 'Factory',
    prodParams: 'Production & Cost',
    runnerType: 'Runner Type',
    cycleTime: 'Cycle Time(s)',
    hourlyCapacity: 'Hourly Output',
    capacityUnit: 'pcs/hr',
    oeeLowReason: 'Reason for OEE < 0.9',
    oeeLowPlaceholder: 'Please enter the reason for OEE below 0.9...',
    quantity: 'Quantity',
    unitPriceTax: 'Unit Price (incl. tax)',
    totalPrice: 'Total Price',
    lossCoeff: 'Mold Loss Coeff.',
    modifyReason: 'Reasons for Loss',
    lossPlaceholder: 'Please enter the reason for modifying loss coefficient...',
    material: 'Material',
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
    monthlyCapacityTheory: 'Theoretical Monthly Capacity(10k)',
    monthlyCapacityActual: 'Actual Monthly Capacity(10k)',
    depreciationYears: 'Depreciation Years',
    activationDate: 'Activation Date',
    deleteMold: 'Delete',
    confirmDeleteTitle: 'Confirm Delete',
    confirmDeleteMsg: 'Are you sure you want to delete this mold?',
    confirmDelete: 'Delete',
  },
} as const;

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
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [view, setView] = useState<'main' | 'analysis'>('main');
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
  const [newMold, setNewMold] = useState<Partial<Mold>>({
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
    status: 'pending',
    projectNumber: '',
  });

  // Configurable lists from admin panel
  const [factories, setFactories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [runnerTypes, setRunnerTypes] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ cn: string; en: string }[]>([]);

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
          hourlyCapacity: Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee),
          monthlyCapacity: Math.round(Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee) * 24 * 25 / 10000 * 100) / 100,
          theoreticalHourlyCapacity: Math.round(m.cavities * (60 / m.cycleTime) * 60),
          actualHourlyCapacity: Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee),
          theoreticalMonthlyCapacity: Math.round(Math.round(m.cavities * (60 / m.cycleTime) * 60) * 24 * 25 / 10000 * 100) / 100,
          actualMonthlyCapacity: Math.round(Math.round(m.cavities * (60 / m.cycleTime) * 60 * m.oee) * 24 * 25 / 10000 * 100) / 100,
        }));
        setMolds(recalculated);
      } catch {
        // Ignore parse errors
      }
    }
    // Load configurable lists
    setFactories(getFactories());
    setProducts(getProducts());
    setRunnerTypes(getRunnerTypes());
    setMaterials(getMaterials());
    setLocations(getLocations());
    setSuppliers(getSuppliers());
  }, []);

  // Save molds to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('molds', JSON.stringify(molds));
  }, [molds]);

  const t = T[lang];

  const statusLabel = useCallback(
    (s: Mold['status']) => T[lang][s],
    [lang],
  );

  // Filtered molds
  const filteredMolds = useMemo(() => {
    return molds.filter((m) => {
      if (selectedBU && m.buId !== selectedBU) return false;
      if (factoryFilter && m.factory !== factoryFilter) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        return (
          m.name.toLowerCase().includes(s) ||
          m.supplier.toLowerCase().includes(s) ||
          m.code.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [molds, selectedBU, factoryFilter, searchText]);

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
            updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * 25 / 10000 * 100) / 100;
            updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * 25 / 10000 * 100) / 100;
            updated.monthlyCapacity = updated.actualMonthlyCapacity;
          }
        }
        if (field === 'hourlyCapacity') {
          const hc = Number(value);
          updated.monthlyCapacity = Math.round(hc * 24 * 25 / 10000 * 100) / 100;
        }
        if (field === 'oee') {
          const oee = Number(value);
          const theoretical = Math.round(updated.cavities * (60 / updated.cycleTime) * 60);
          updated.theoreticalHourlyCapacity = theoretical;
          updated.actualHourlyCapacity = Math.round(theoretical * oee);
          updated.hourlyCapacity = updated.actualHourlyCapacity;
          updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * 25 / 10000 * 100) / 100;
          updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * 25 / 10000 * 100) / 100;
          updated.monthlyCapacity = updated.actualMonthlyCapacity;
        }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  }, []);

  // Export Excel
  const handleExport = useCallback(() => {
    const L = lang;
    const exportData = filteredMolds.map((m) => ({
      [L === 'zh' ? '模具编号' : 'Mold Code']: m.code,
      [L === 'zh' ? '项目编号' : 'Project Number']: m.projectNumber || '',
      [L === 'zh' ? '模具名称' : 'Mold Name']: L === 'zh' ? m.name : (m.nameEn || m.name),
      [L === 'zh' ? '供应商' : 'Supplier']: L === 'zh' ? m.supplier : (m.supplierEn || m.supplier),
      [L === 'zh' ? '工厂' : 'Factory']: m.factory,
      [L === 'zh' ? '所属BU' : 'Business Unit']: BUS.find((b) => b.id === m.buId)?.name || '',
      [L === 'zh' ? '所属产品' : 'Product']: (() => {
        const p = products.find((pp) => pp.id === m.productId);
        return L === 'zh' ? (p?.name || '') : (p?.nameEn || p?.name || '');
      })(),
      [L === 'zh' ? '腔数' : 'Cavities']: m.cavities,
      [L === 'zh' ? '流道类型' : 'Runner Type']: RUNNER_NAME_MAP[m.runnerType]?.[L] || m.runnerType,
      [L === 'zh' ? '注塑周期(s)' : 'Cycle Time(s)']: m.cycleTime,
      [L === 'zh' ? '每小时产能' : 'Hourly Output']: m.hourlyCapacity,
      [L === 'zh' ? '理论每小时产能' : 'Theoretical Hourly Output']: m.theoreticalHourlyCapacity ?? 0,
      [L === 'zh' ? '实际每小时产能' : 'Actual Hourly Output']: m.actualHourlyCapacity ?? 0,
      'OEE': m.oee,
      [L === 'zh' ? 'OEE原因' : 'OEE Reason']: m.oeeReason || '',
      [L === 'zh' ? '状态' : 'Status']: T[L][m.status],
      [L === 'zh' ? '数量' : 'Quantity']: m.quantity,
      [L === 'zh' ? '单价' : 'Unit Price']: m.unitPrice,
      [L === 'zh' ? '合计价格' : 'Total Price']: m.totalPrice,
      [L === 'zh' ? '模具损耗系数' : 'Mold Loss Coeff.']: m.lossCoefficient,
      [L === 'zh' ? '损耗原因' : 'Loss Reason']: m.lossReason || '',
      [L === 'zh' ? '产品材料' : 'Material']: m.material,
      [L === 'zh' ? '材料损耗系数' : 'Material Loss Coeff.']: m.materialLossCoeff,
      [L === 'zh' ? '产品单只克重' : 'Product Weight(g)']: m.productWeight,
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
      [L === 'zh' ? '启用时间' : 'Activation Date']: m.commissionDate || '',
      [L === 'zh' ? '折旧年数' : 'Depreciation Years']: m.depreciationYears ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.sheetName);
    XLSX.writeFile(wb, `${t.sheetName}.xlsx`);
  }, [filteredMolds, lang, t.sheetName, products]);

  // Add new mold
  const handleAddMold = useCallback(() => {
    const maxCode = molds.reduce((max, m) => {
      const num = parseInt(m.code.replace('M', '').replace('-', ''), 10);
      return num > max ? num : max;
    }, 0);
    const autoCode = `M${String(maxCode + 1).padStart(4, '0')}`;
    const mold: Mold = {
      id: `mold-${Date.now()}`,
      code: newMold.code || autoCode,
      projectNumber: newMold.projectNumber || '',
      name: newMold.name || '',
      nameEn: newMold.nameEn || '',
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
    setNewMold({
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
      moldType: 'mass',
      theoreticalHourlyCapacity: 0,
      actualHourlyCapacity: 0,
      theoreticalMonthlyCapacity: 0,
      actualMonthlyCapacity: 0,
      commissionDate: '',
      depreciationYears: 0,
      status: 'pending',
    });
  }, [molds, newMold]);

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
          updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * 25 / 10000 * 100) / 100;
          updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * 25 / 10000 * 100) / 100;
          updated.monthlyCapacity = updated.actualMonthlyCapacity;
        }
      }
      if (field === 'hourlyCapacity') {
        const hc = Number(value);
        updated.monthlyCapacity = Math.round(hc * 24 * 25 / 10000 * 100) / 100;
      }
      if (field === 'oee') {
        const oee = Number(value);
        const theoretical = Math.round((updated.cavities || 1) * (60 / (updated.cycleTime || 30)) * 60);
        updated.theoreticalHourlyCapacity = theoretical;
        updated.actualHourlyCapacity = Math.round(theoretical * oee);
        updated.hourlyCapacity = updated.actualHourlyCapacity;
        updated.theoreticalMonthlyCapacity = Math.round(theoretical * 24 * 25 / 10000 * 100) / 100;
        updated.actualMonthlyCapacity = Math.round(updated.actualHourlyCapacity * 24 * 25 / 10000 * 100) / 100;
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#dce8d0' }}>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b" style={{ borderColor: '#e0e8dc', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="mx-auto max-w-[1400px] px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#e8f5e9', color: '#4a7c59' }}
            >
              {lang === 'zh' ? '模具列表' : 'Mold List'}
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
              type="text"
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
            {/* Add button */}
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
                        const product = products.find(
                          (p) => p.name === row['Product'] || p.nameEn === row['Product'] || p.name === row['产品'] || p.nameEn === row['产品']
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
                        const unitPriceStr = String(row['Unit Price'] ?? row['单价'] ?? '0').replace(/[¥,]/g, '');
                        return {
                          id: code || `imported_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                          code: String(code),
                          name: String(row['Mold Name'] || row['模具名称'] || ''),
                          nameEn: String(row['Mold Name'] || row['模具名称'] || ''),
                          supplier: String(row['Supplier'] || row['供应商'] || ''),
                          supplierEn: String(row['Supplier'] || row['供应商'] || ''),
                          buId: bu?.id || 'bu1',
                          productId: product?.id || '',
                          productName: product?.name || String(row['Product'] || row['产品'] || ''),
                          productNameEn: product?.nameEn || String(row['Product'] || row['产品'] || ''),
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
                          scrapWeight: Number(row['Scrap Weight(g)'] || row['废料克重'] || 0),
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
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.code}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.name}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.supplier}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.factory}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.cavities}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.oee}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.status}</th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>{t.unitPrice}</th>
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
                    onUpdate={updateMold}
                    onConfirmChange={(moldId, field, oldValue, newValue, oldLabel, newLabel) => {
                      setConfirmDialog({ moldId, field, oldValue, newValue, oldLabel, newLabel });
                    }}
                    onOEEValidationAlert={() => setAlertMessage(lang === 'zh' ? 'OEE低于0.9，必须填写原因后才能保存' : 'OEE is below 0.9, the reason must be filled in before saving')}
                    onDeleteClick={(moldId) => setDeleteDialog(moldId)}
                    lang={lang}
                    products={products}
                    factories={factories}
                    runnerTypes={runnerTypes}
                    materials={materials}
                    locations={locations}
                    suppliers={suppliers}
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
        {showAddModal && (
          <AddMoldModal
            newMold={newMold}
            onUpdate={updateNewMold}
            onSave={handleAddMold}
            onCancel={() => setShowAddModal(false)}
            lang={lang}
            products={products}
            factories={factories}
            runnerTypes={runnerTypes}
            materials={materials}
            locations={locations}
            suppliers={suppliers}
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
              updateMold(confirmDialog.moldId, confirmDialog.field, confirmDialog.newValue);
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
}) {
  const t = T[lang];
  const totalPrice = mold.quantity * mold.unitPrice;

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
        <td className="px-3 py-3 text-sm font-medium" style={{ color: '#2d3b2d' }}>
          {mold.code}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          {lang === 'en' ? (mold.nameEn || mold.name) : mold.name}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#6b7c6b' }}>
          {lang === 'en' ? (mold.supplierEn || mold.supplier) : mold.supplier}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          {mold.factory}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          {mold.cavities}
        </td>
        <td className="px-3 py-3 text-sm">
          <span
            className={mold.oee < 0.9 ? 'font-semibold text-red-600' : ''}
            style={{ color: mold.oee < 0.9 ? undefined : '#2d3b2d' }}
          >
            {(mold.oee * 100).toFixed(1)}%
          </span>
        </td>
        <td className="px-3 py-3 text-sm">
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor}`}>
            {statusLabel}
          </span>
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#2d3b2d' }}>
          ¥{mold.unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="px-6 py-5" style={{ backgroundColor: '#f0f7ec' }}>
              <div className="grid grid-cols-2 gap-8">
                {/* Left column - Basic Info */}
                <div>
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                    {t.basicInfo}
                  </h4>
                  <div className="space-y-3">
                    <DetailField label={t.moldCode}>
                      <input
                        type="text"
                        value={mold.code}
                        onChange={(e) => onUpdate(mold.id, 'code', e.target.value)}
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
                    <DetailField label={t.detailName}>
                      <input
                        type="text"
                        value={lang === 'en' ? (mold.nameEn || mold.name) : mold.name}
                        onChange={(e) => onUpdate(mold.id, lang === 'en' ? 'nameEn' : 'name', e.target.value)}
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
                    <DetailField label={t.belongProduct}>
                      <select
                        value={mold.productId}
                        onChange={(e) => onUpdate(mold.id, 'productId', e.target.value)}
                        className="detail-input"
                      >
                        {products.filter((p) => p.buId === mold.buId).map((p) => (
                          <option key={p.id} value={p.id}>
                            {lang === 'en' ? (p.nameEn || p.name) : p.name}
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
                    <DetailField label={t.location}>
                      <input
                        type="text"
                        value={mold.location ?? ''}
                        onChange={(e) => onUpdate(mold.id, 'location', e.target.value)}
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
                          <option value="热流道">{t.hotRunner}</option>
                          <option value="冷流道">{t.coldRunner}</option>
                          <option value="半热流道">{t.semiHotRunner}</option>
                          <option value="针阀式热流道">{t.valveHotRunner}</option>
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
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label={t.hourlyOutputTheory}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {mold.theoreticalHourlyCapacity ?? 0} <span className="ml-1 text-xs">{t.capacityUnit}</span>
                        </div>
                      </DetailField>
                      <DetailField label={t.hourlyOutputActual}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {mold.actualHourlyCapacity ?? 0} <span className="ml-1 text-xs">{t.capacityUnit}</span>
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
                          value={mold.unitPrice}
                          onChange={(e) => onUpdate(mold.id, 'unitPrice', Number(e.target.value))}
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
                        <input
                          type="text"
                          value={mold.material}
                          onChange={(e) => onUpdate(mold.id, 'material', e.target.value)}
                          className="detail-input"
                        />
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
                      <DetailField label={t.sprueWeight}>
                        <input
                          type="number"
                          step="0.01"
                          value={mold.sprueWeight ?? 0}
                          onChange={(e) => onUpdate(mold.id, 'sprueWeight', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label={t.activationDate}>
                        <input
                          type="date"
                          value={mold.commissionDate ?? ''}
                          onChange={(e) => {
                            const date = e.target.value;
                            const today = new Date();
                            const start = new Date(date);
                            const years = date ? Math.floor((today.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
                            onUpdate(mold.id, 'commissionDate', date);
                            onUpdate(mold.id, 'depreciationYears', years);
                          }}
                          className="detail-input"
                        />
                      </DetailField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label={t.monthlyCapacityTheory}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {(mold.theoreticalMonthlyCapacity ?? 0).toFixed(2)} <span className="ml-1 text-xs">{lang === 'zh' ? '万/月' : '10k/mo'}</span>
                        </div>
                      </DetailField>
                      <DetailField label={t.monthlyCapacityActual}>
                        <div
                          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                          style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                        >
                          {(mold.actualMonthlyCapacity ?? 0).toFixed(2)} <span className="ml-1 text-xs">{lang === 'zh' ? '万/月' : '10k/mo'}</span>
                        </div>
                      </DetailField>
                    </div>
                    <DetailField label={t.depreciationYears}>
                      <div
                        className="flex h-9 items-center rounded-lg px-3 text-sm font-medium"
                        style={{ backgroundColor: '#f0f7ec', color: '#6b7c6b', border: '1px solid #e0e8dc' }}
                      >
                        {mold.depreciationYears ?? 0} {lang === 'zh' ? '年' : 'years'}
                      </div>
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
function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs" style={{ color: '#6b7c6b' }}>
        {label}
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
}) {
  const t = T[lang];
  const totalPrice = (newMold.quantity || 1) * (newMold.unitPrice || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#e0e8dc' }}>
          <h3 className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>
            {t.addMoldTitle}
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
                <DetailField label={t.moldCode}>
                  <input
                    type="text"
                    value={newMold.code || ''}
                    onChange={(e) => onUpdate('code', e.target.value)}
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
                <DetailField label={t.detailName}>
                  <input
                    type="text"
                    value={lang === 'en' ? (newMold.nameEn || '') : (newMold.name || '')}
                    onChange={(e) => onUpdate(lang === 'en' ? 'nameEn' : 'name', e.target.value)}
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
                <DetailField label={t.location}>
                  <input
                    type="text"
                    value={newMold.location ?? ''}
                    onChange={(e) => onUpdate('location', e.target.value)}
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
                <DetailField label={t.activationDate}>
                  <input
                    type="date"
                    value={newMold.commissionDate ?? ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      const today = new Date();
                      const start = new Date(date);
                      const years = date ? Math.floor((today.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
                      onUpdate('commissionDate', date);
                      onUpdate('depreciationYears', years);
                    }}
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
                      <option value="热流道">{t.hotRunner}</option>
                      <option value="冷流道">{t.coldRunner}</option>
                      <option value="半热流道">{t.semiHotRunner}</option>
                      <option value="针阀式热流道">{t.valveHotRunner}</option>
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
                      value={newMold.unitPrice ?? 0}
                      onChange={(e) => onUpdate('unitPrice', Number(e.target.value))}
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
                    <input
                      type="text"
                      value={newMold.material || ''}
                      onChange={(e) => onUpdate('material', e.target.value)}
                      className="detail-input"
                    />
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
                  <DetailField label={t.sprueWeight}>
                    <input
                      type="number"
                      step="0.01"
                      value={newMold.sprueWeight ?? 0}
                      onChange={(e) => onUpdate('sprueWeight', Number(e.target.value))}
                      className="detail-input"
                    />
                  </DetailField>
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

        {/* Modal footer */}
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
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
