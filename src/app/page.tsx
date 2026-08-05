'use client';

import { useState, useMemo, useCallback } from 'react';
import { BUS, FACTORIES, PRODUCTS, INITIAL_MOLDS } from '@/lib/mock-data';
import type { Mold } from '@/lib/types';
import * as XLSX from 'xlsx';

type Lang = 'zh' | 'en';

// Translation dictionaries
const T = {
  zh: {
    title: '模具列表',
    searchPlaceholder: '搜索模具名称/供应商/编号...',
    allFactories: '全部工厂',
    allBU: '全部BU',
    totalRecords: (n: number) => `共 ${n} 条`,
    exportExcel: '导出Excel',
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
    active: '使用中',
    maintenance: '维护中',
    retired: '已报废',
    pending: '待启用',
    // Detail - left
    basicInfo: '基本信息',
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
    modifyReason: '修改原因',
    lossPlaceholder: '请填写修改损耗系数的原因...',
    material: '产品材料',
    materialLossCoeff: '材料损耗系数',
    productWeight: '产品单只克重',
    wasteWeight: '废料克重',
    // Runner types
    hotRunner: '热流道',
    coldRunner: '冷流道',
    semiHotRunner: '半热流道',
    valveHotRunner: '针阀式热流道',
    // Excel sheet name
    sheetName: '模具列表',
  },
  en: {
    title: 'Mold List',
    searchPlaceholder: 'Search name / supplier / code...',
    allFactories: 'All Factories',
    allBU: 'All BU',
    totalRecords: (n: number) => `${n} records`,
    exportExcel: 'Export Excel',
    totalMolds: 'Total Molds',
    activeCount: 'Active',
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
    active: 'Active',
    maintenance: 'Maintenance',
    retired: 'Retired',
    pending: 'Pending',
    basicInfo: 'Basic Info',
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
    modifyReason: 'Modification Reason',
    lossPlaceholder: 'Please enter the reason for modifying loss coefficient...',
    material: 'Material',
    materialLossCoeff: 'Material Loss Coeff.',
    productWeight: 'Product Weight(g)',
    wasteWeight: 'Waste Weight(g)',
    hotRunner: 'Hot Runner',
    coldRunner: 'Cold Runner',
    semiHotRunner: 'Semi-Hot Runner',
    valveHotRunner: 'Valve Hot Runner',
    sheetName: 'Mold List',
  },
} as const;

const STATUS_COLOR: Record<Mold['status'], string> = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  retired: 'bg-gray-100 text-gray-500',
  pending: 'bg-blue-100 text-blue-700',
};

const RUNNER_MAP: Record<string, { zh: string; en: string }> = {
  '热流道': { zh: '热流道', en: 'Hot Runner' },
  '冷流道': { zh: '冷流道', en: 'Cold Runner' },
  '半热流道': { zh: '半热流道', en: 'Semi-Hot Runner' },
  '针阀式热流道': { zh: '针阀式热流道', en: 'Valve Hot Runner' },
};

export default function Home() {
  const [molds, setMolds] = useState<Mold[]>(INITIAL_MOLDS);
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [factoryFilter, setFactoryFilter] = useState<string>('');
  const [buFilter, setBuFilter] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('zh');

  const t = T[lang];

  const statusLabel = useCallback(
    (s: Mold['status']) => T[lang][s],
    [lang],
  );

  // Filtered molds
  const filteredMolds = useMemo(() => {
    return molds.filter((m) => {
      if (selectedBU && m.buId !== selectedBU) return false;
      if (buFilter && m.buId !== buFilter) return false;
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
  }, [molds, selectedBU, buFilter, factoryFilter, searchText]);

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
      [L === 'zh' ? '模具名称' : 'Mold Name']: L === 'zh' ? m.name : (m.nameEn || m.name),
      [L === 'zh' ? '供应商' : 'Supplier']: L === 'zh' ? m.supplier : (m.supplierEn || m.supplier),
      [L === 'zh' ? '工厂' : 'Factory']: m.factory,
      [L === 'zh' ? '所属BU' : 'Business Unit']: BUS.find((b) => b.id === m.buId)?.name || '',
      [L === 'zh' ? '所属产品' : 'Product']: (() => {
        const p = PRODUCTS.find((pp) => pp.id === m.productId);
        return L === 'zh' ? (p?.name || '') : (p?.nameEn || p?.name || '');
      })(),
      [L === 'zh' ? '腔数' : 'Cavities']: m.cavities,
      [L === 'zh' ? '流道类型' : 'Runner Type']: RUNNER_MAP[m.runnerType]?.[L] || m.runnerType,
      [L === 'zh' ? '注塑周期(s)' : 'Cycle Time(s)']: m.cycleTime,
      [L === 'zh' ? '每小时产能' : 'Hourly Output']: m.hourlyCapacity,
      'OEE': m.oee,
      [L === 'zh' ? '状态' : 'Status']: T[L][m.status],
      [L === 'zh' ? '数量' : 'Quantity']: m.quantity,
      [L === 'zh' ? '单价' : 'Unit Price']: m.unitPrice,
      [L === 'zh' ? '合计价格' : 'Total Price']: m.totalPrice,
      [L === 'zh' ? '模具损耗系数' : 'Mold Loss Coeff.']: m.lossCoefficient,
      [L === 'zh' ? '产品材料' : 'Material']: m.material,
      [L === 'zh' ? '材料损耗系数' : 'Material Loss Coeff.']: m.materialLossCoefficient,
      [L === 'zh' ? '产品单只克重' : 'Product Weight(g)']: m.productWeight,
      [L === 'zh' ? '废料克重' : 'Waste Weight(g)']: m.wasteWeight,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.sheetName);
    XLSX.writeFile(wb, `${t.sheetName}.xlsx`);
  }, [filteredMolds, lang, t.sheetName]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#dce8d0' }}>
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
                  className="px-5 py-3 text-center text-sm font-semibold text-white"
                  style={{ backgroundColor: '#a8d5a2' }}
                >
                  {bu.name}
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
          <h2 className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>
            {t.title}
          </h2>
          <div className="flex flex-1 items-center justify-end gap-3">
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
              {FACTORIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {/* BU filter */}
            <select
              value={buFilter}
              onChange={(e) => setBuFilter(e.target.value)}
              className="h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            >
              <option value="">{t.allBU}</option>
              {BUS.map((bu) => (
                <option key={bu.id} value={bu.id}>
                  {bu.shortName}
                </option>
              ))}
            </select>
            {/* Record count */}
            <span className="text-sm whitespace-nowrap" style={{ color: '#6b7c6b' }}>
              {t.totalRecords(filteredMolds.length)}
            </span>
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
            {/* Language toggle */}
            <button
              onClick={() => setLang((prev) => (prev === 'zh' ? 'en' : 'zh'))}
              className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e0e8dc', color: '#4a7c59' }}
              title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
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
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {lang === 'zh' ? 'EN' : '中'}
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
              {filteredMolds.map((mold) => {
                const isExpanded = expandedRow === mold.id;
                return (
                  <MoldRow
                    key={mold.id}
                    mold={mold}
                    isExpanded={isExpanded}
                    statusLabel={statusLabel(mold.status)}
                    statusColor={STATUS_COLOR[mold.status]}
                    onToggle={() => setExpandedRow(isExpanded ? null : mold.id)}
                    onUpdate={updateMold}
                    lang={lang}
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
  lang,
}: {
  mold: Mold;
  isExpanded: boolean;
  statusLabel: string;
  statusColor: string;
  onToggle: () => void;
  onUpdate: (id: string, field: keyof Mold, value: unknown) => void;
  lang: Lang;
}) {
  const t = T[lang];
  const totalPrice = mold.quantity * mold.unitPrice;

  return (
    <>
      {/* Main row */}
      <tr
        className="border-t transition-colors hover:bg-gray-50/50"
        style={{ borderColor: '#e0e8dc' }}
      >
        <td className="px-3 py-3">
          <button
            onClick={onToggle}
            className="flex h-5 w-5 items-center justify-center rounded transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="#6b7c6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
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
                    <DetailField label={t.detailName}>
                      <input
                        type="text"
                        value={lang === 'en' ? (mold.nameEn || mold.name) : mold.name}
                        onChange={(e) => onUpdate(mold.id, lang === 'en' ? 'nameEn' : 'name', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.detailSupplier}>
                      <input
                        type="text"
                        value={lang === 'en' ? (mold.supplierEn || mold.supplier) : mold.supplier}
                        onChange={(e) => onUpdate(mold.id, lang === 'en' ? 'supplierEn' : 'supplier', e.target.value)}
                        className="detail-input"
                      />
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
                        {PRODUCTS.filter((p) => p.buId === mold.buId).map((p) => (
                          <option key={p.id} value={p.id}>
                            {lang === 'en' ? (p.nameEn || p.name) : p.name}
                          </option>
                        ))}
                      </select>
                    </DetailField>
                    <DetailField label={t.useFactory}>
                      <select
                        value={mold.factory}
                        onChange={(e) => onUpdate(mold.id, 'factory', e.target.value)}
                        className="detail-input"
                      >
                        {FACTORIES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
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
                    <DetailField label={t.hourlyCapacity}>
                      <input
                        type="number"
                        value={mold.hourlyCapacity}
                        onChange={(e) => onUpdate(mold.id, 'hourlyCapacity', Number(e.target.value))}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label={t.oee}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={mold.oee}
                        onChange={(e) => onUpdate(mold.id, 'oee', Number(e.target.value))}
                        className="detail-input"
                        style={{
                          borderColor: mold.oee < 0.9 ? '#e74c3c' : '#e0e8dc',
                          borderWidth: mold.oee < 0.9 ? '2px' : '1px',
                        }}
                      />
                    </DetailField>
                    {mold.oee < 0.9 && (
                      <DetailField label={t.oeeLowReason}>
                        <textarea
                          value={lang === 'en' ? (mold.oeeReasonEn || mold.oeeReason || '') : (mold.oeeReason || '')}
                          onChange={(e) => onUpdate(mold.id, lang === 'en' ? 'oeeReasonEn' : 'oeeReason', e.target.value)}
                          placeholder={t.oeeLowPlaceholder}
                          className="detail-input min-h-[60px] resize-none"
                          style={{ borderColor: '#e74c3c' }}
                        />
                      </DetailField>
                    )}
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
                    {mold.lossCoefficient !== 0.05 && (
                      <DetailField label={t.modifyReason}>
                        <textarea
                          value={lang === 'en' ? (mold.lossReasonEn || mold.lossReason || '') : (mold.lossReason || '')}
                          onChange={(e) => onUpdate(mold.id, lang === 'en' ? 'lossReasonEn' : 'lossReason', e.target.value)}
                          placeholder={t.lossPlaceholder}
                          className="detail-input min-h-[60px] resize-none"
                          style={{ borderColor: '#f39c12' }}
                        />
                      </DetailField>
                    )}
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
                          value={mold.materialLossCoefficient}
                          onChange={(e) => onUpdate(mold.id, 'materialLossCoefficient', Number(e.target.value))}
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
