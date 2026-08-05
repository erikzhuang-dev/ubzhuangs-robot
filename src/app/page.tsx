'use client';

import { useState, useMemo, useCallback } from 'react';
import { BUS, FACTORIES, PRODUCTS, INITIAL_MOLDS } from '@/lib/mock-data';
import type { Mold } from '@/lib/types';
import * as XLSX from 'xlsx';

// Status display mapping
const STATUS_MAP: Record<Mold['status'], { label: string; color: string }> = {
  active: { label: '使用中', color: 'bg-green-100 text-green-700' },
  maintenance: { label: '维护中', color: 'bg-yellow-100 text-yellow-700' },
  retired: { label: '已报废', color: 'bg-gray-100 text-gray-500' },
  pending: { label: '待启用', color: 'bg-blue-100 text-blue-700' },
};

export default function Home() {
  const [molds, setMolds] = useState<Mold[]>(INITIAL_MOLDS);
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [factoryFilter, setFactoryFilter] = useState<string>('');
  const [buFilter, setBuFilter] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
      const avgOEE = totalMolds > 0
        ? buMolds.reduce((sum, m) => sum + m.oee, 0) / totalMolds
        : 0;
      const avgLossRate = totalMolds > 0
        ? buMolds.reduce((sum, m) => sum + m.lossCoefficient, 0) / totalMolds
        : 0;
      return { buId: bu.id, totalMolds, avgOEE, avgLossRate };
    });
  }, [molds]);

  // Update mold field
  const updateMold = useCallback((id: string, field: keyof Mold, value: unknown) => {
    setMolds((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };
        // Auto-calculate totalPrice
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  }, []);

  // Export Excel
  const handleExport = useCallback(() => {
    const exportData = filteredMolds.map((m) => ({
      '模具编号': m.code,
      '模具名称': m.name,
      '供应商': m.supplier,
      '工厂': m.factory,
      '所属BU': BUS.find((b) => b.id === m.buId)?.name || '',
      '所属产品': PRODUCTS.find((p) => p.id === m.productId)?.name || '',
      '腔数': m.cavities,
      '流道类型': m.runnerType,
      '注塑周期(s)': m.cycleTime,
      '每小时产能': Math.round(m.cavities * (3600 / m.cycleTime)),
      'OEE': m.oee,
      '状态': STATUS_MAP[m.status].label,
      '数量': m.quantity,
      '单价': m.unitPrice,
      '合计价格': m.totalPrice,
      '模具损耗系数': m.lossCoefficient,
      '产品材料': m.material,
      '材料损耗系数': m.materialLossCoefficient,
      '产品单只克重': m.productWeight,
      '废料克重': m.wasteWeight,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '模具列表');
    XLSX.writeFile(wb, '模具列表.xlsx');
  }, [filteredMolds]);

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
                <div className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6b7c6b' }}>
                      模具总数
                    </span>
                    <span className="text-xl font-bold" style={{ color: '#2d3b2d' }}>
                      {stats.totalMolds}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6b7c6b' }}>
                      平均OEE
                    </span>
                    <span
                      className="text-lg font-semibold"
                      style={{ color: stats.avgOEE < 0.9 ? '#e74c3c' : '#4a7c59' }}
                    >
                      {(stats.avgOEE * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6b7c6b' }}>
                      平均损耗率
                    </span>
                    <span className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>
                      {(stats.avgLossRate * 100).toFixed(1)}%
                    </span>
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
            模具列表
          </h2>
          <div className="flex flex-1 items-center justify-end gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索模具名称/供应商/编号..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-9 w-64 rounded-lg border px-3 py-1 text-sm outline-none transition-colors focus:border-[#4a7c59]"
                style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
              />
            </div>
            {/* Factory filter */}
            <select
              value={factoryFilter}
              onChange={(e) => setFactoryFilter(e.target.value)}
              className="h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}
            >
              <option value="">全部工厂</option>
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
              <option value="">全部BU</option>
              {BUS.map((bu) => (
                <option key={bu.id} value={bu.id}>
                  {bu.shortName}
                </option>
              ))}
            </select>
            {/* Record count */}
            <span className="text-sm" style={{ color: '#6b7c6b' }}>
              共 {filteredMolds.length} 条
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
              导出Excel
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
                <th className="w-10 px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  模具编号
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  模具名称
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  供应商
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  工厂
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  腔数
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  OEE
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  状态
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#6b7c6b' }}>
                  单价
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMolds.map((mold) => {
                const isExpanded = expandedRow === mold.id;
                const statusInfo = STATUS_MAP[mold.status];
                return (
                  <MoldRow
                    key={mold.id}
                    mold={mold}
                    isExpanded={isExpanded}
                    statusInfo={statusInfo}
                    onToggle={() => setExpandedRow(isExpanded ? null : mold.id)}
                    onUpdate={updateMold}
                  />
                );
              })}
            </tbody>
          </table>
          {filteredMolds.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: '#6b7c6b' }}>
              暂无匹配的模具数据
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
  statusInfo,
  onToggle,
  onUpdate,
}: {
  mold: Mold;
  isExpanded: boolean;
  statusInfo: { label: string; color: string };
  onToggle: () => void;
  onUpdate: (id: string, field: keyof Mold, value: unknown) => void;
}) {
  const hourlyCapacity = Math.round(mold.cavities * (3600 / mold.cycleTime));
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
          {mold.name}
        </td>
        <td className="px-3 py-3 text-sm" style={{ color: '#6b7c6b' }}>
          {mold.supplier}
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
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusInfo.color}`}>
            {statusInfo.label}
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
            <div
              className="px-6 py-5"
              style={{ backgroundColor: '#f0f7ec' }}
            >
              <div className="grid grid-cols-2 gap-8">
                {/* Left column - Basic Info */}
                <div>
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#2d3b2d' }}>
                    基本信息
                  </h4>
                  <div className="space-y-3">
                    <DetailField label="名称">
                      <input
                        type="text"
                        value={mold.name}
                        onChange={(e) => onUpdate(mold.id, 'name', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label="供应商">
                      <input
                        type="text"
                        value={mold.supplier}
                        onChange={(e) => onUpdate(mold.id, 'supplier', e.target.value)}
                        className="detail-input"
                      />
                    </DetailField>
                    <DetailField label="所属BU">
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
                    <DetailField label="所属产品">
                      <select
                        value={mold.productId}
                        onChange={(e) => onUpdate(mold.id, 'productId', e.target.value)}
                        className="detail-input"
                      >
                        {PRODUCTS.filter((p) => p.buId === mold.buId).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </DetailField>
                    <DetailField label="使用工厂">
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
                    生产参数与成本
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <DetailField label="腔数">
                        <input
                          type="number"
                          value={mold.cavities}
                          onChange={(e) => onUpdate(mold.id, 'cavities', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label="流道类型">
                        <select
                          value={mold.runnerType}
                          onChange={(e) => onUpdate(mold.id, 'runnerType', e.target.value)}
                          className="detail-input"
                        >
                          <option value="热流道">热流道</option>
                          <option value="冷流道">冷流道</option>
                          <option value="半热流道">半热流道</option>
                          <option value="针阀式热流道">针阀式热流道</option>
                        </select>
                      </DetailField>
                      <DetailField label="注塑周期(s)">
                        <input
                          type="number"
                          value={mold.cycleTime}
                          onChange={(e) => onUpdate(mold.id, 'cycleTime', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                    </div>
                    <DetailField label="每小时产能">
                      <div
                        className="rounded-lg px-3 py-1.5 text-sm"
                        style={{ backgroundColor: '#e8ede5', color: '#6b7c6b' }}
                      >
                        {hourlyCapacity} 件/小时
                      </div>
                    </DetailField>
                    <DetailField label="OEE">
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
                      <DetailField label="OEE低于0.9的原因">
                        <textarea
                          value={mold.oeeReason || ''}
                          onChange={(e) => onUpdate(mold.id, 'oeeReason', e.target.value)}
                          placeholder="请填写OEE低于0.9的原因..."
                          className="detail-input min-h-[60px] resize-none"
                          style={{ borderColor: '#e74c3c' }}
                        />
                      </DetailField>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <DetailField label="数量">
                        <input
                          type="number"
                          value={mold.quantity}
                          onChange={(e) => onUpdate(mold.id, 'quantity', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label="单价(含税)">
                        <input
                          type="number"
                          step="0.01"
                          value={mold.unitPrice}
                          onChange={(e) => onUpdate(mold.id, 'unitPrice', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label="合计价格">
                        <div
                          className="rounded-lg px-3 py-1.5 text-sm"
                          style={{ backgroundColor: '#e8ede5', color: '#6b7c6b' }}
                        >
                          ¥{totalPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                        </div>
                      </DetailField>
                    </div>
                    <DetailField label="模具损耗系数">
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
                      <DetailField label="修改原因">
                        <textarea
                          value={mold.lossReason || ''}
                          onChange={(e) => onUpdate(mold.id, 'lossReason', e.target.value)}
                          placeholder="请填写修改损耗系数的原因..."
                          className="detail-input min-h-[60px] resize-none"
                          style={{ borderColor: '#f39c12' }}
                        />
                      </DetailField>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label="产品材料">
                        <input
                          type="text"
                          value={mold.material}
                          onChange={(e) => onUpdate(mold.id, 'material', e.target.value)}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label="材料损耗系数">
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
                      <DetailField label="产品单只克重">
                        <input
                          type="number"
                          step="0.01"
                          value={mold.productWeight}
                          onChange={(e) => onUpdate(mold.id, 'productWeight', Number(e.target.value))}
                          className="detail-input"
                        />
                      </DetailField>
                      <DetailField label="废料克重">
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
