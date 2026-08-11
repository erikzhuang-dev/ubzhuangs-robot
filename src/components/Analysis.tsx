'use client';

import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, LineChart, Line, ScatterChart, Scatter, ZAxis, ResponsiveContainer,
  ComposedChart, Area,
} from 'recharts';
import type { Mold, Product, BU } from '@/lib/types';

// ========== Color Palette ==========
const GREEN = '#4a7c59';
const GREEN_LIGHT = '#a8d5a2';
const RED = '#e74c3c';
const YELLOW = '#f39c12';
const BLUE = '#5b9bd5';
const GRAY = '#95a5a6';
const BU_COLORS = ['#4a7c59', '#5b9bd5', '#f39c12', '#e74c3c'];
const FACTORY_COLORS = ['#4a7c59', '#a8d5a2', '#6b9b7c', '#3d6b4f', '#8fbc8f'];

// ========== Translations ==========
const AT = {
  zh: {
    title: '模具数据分析',
    navMoldList: '模具列表',
    navAnalysis: '数据分析',
    navAdmin: '后台管理',
    // Filters
    allBU: '全部BU',
    allFactories: '全部工厂',
    allProducts: '全部产品',
    timeRange: '时间范围',
    allTime: '全部时间',
    query: '查询',
    // Module 1: 投资概览
    m1Title: '模具总投资概览',
    totalMolds: '模具总数量',
    totalInvestment: '投资总额(万元)',
    avgUnitPrice: '平均单价(万元)',
    yoyChange: '同比变化',
    buInvestment: '各BU投资占比',
    factoryInvestment: '各工厂投资金额',
    // Module 2: 产能分布
    m2Title: '产能分布分析',
    totalHourlyCapacity: '全厂每小时产能',
    capacityUtilization: '产能利用率',
    buCapacity: '各BU产品线产能分布',
    factoryCapacity: '各工厂实际可用产能',
    // Module 3: OEE
    m3Title: 'OEE设备效率分析',
    avgOEE: '全厂平均OEE',
    buOEE: '各BU平均OEE对比',
    factoryOEEDist: '各工厂OEE分布',
    // Module 4: 损耗
    m4Title: '模具损耗分析',
    avgLoss: '平均损耗系数',
    deviatedCount: '偏离默认值模具数',
    lossDist: '损耗系数分布',
    defaultMark: '默认值5%',
    abnormalTable: '损耗系数异常模具明细',
    deviation: '偏差',
    reason: '原因',
    // Module 5: 供应商
    m5Title: '供应商对比分析',
    supplierBubble: '供应商气泡图',
    supplierRank: '供应商排名',
    moldCount: '模具数量',
    totalInvestment2: '总投资额',
    avgOEE2: '平均OEE',
    avgLoss2: '平均损耗系数',
    // Module 6: 矩阵
    m6Title: '产品-工厂矩阵分析',
    fullCoverage: '全覆盖产品',
    emptyCoverage: '空白覆盖',
    maxRedundancy: '冗余最高',
    // Module 7: 预警
    m7Title: '异常预警总览',
    severe: '严重预警',
    moderate: '中等预警',
    normal: '正常',
    warningLevel: '等级',
    warningMold: '模具名称',
    warningMetric: '异常指标',
    warningValue: '异常值',
    warningThreshold: '阈值',
    warningTrend: '近30天预警趋势',
    // Misc
    pcsHr: '件/小时',
    wanYuan: '万元',
    count: '个',
  },
  en: {
    title: 'Mold Data Analysis',
    navMoldList: 'Mold List',
    navAnalysis: 'Analysis',
    navAdmin: 'Admin',
    allBU: 'All BU',
    allFactories: 'All Factories',
    allProducts: 'All Products',
    timeRange: 'Time Range',
    allTime: 'All Time',
    query: 'Query',
    m1Title: 'Total Investment Overview',
    totalMolds: 'Total Molds',
    totalInvestment: 'Total Investment (10k ¥)',
    avgUnitPrice: 'Avg Unit Price (10k ¥)',
    yoyChange: 'YoY Change',
    buInvestment: 'Investment by BU',
    factoryInvestment: 'Investment by Factory',
    m2Title: 'Capacity Distribution',
    totalHourlyCapacity: 'Total Hourly Capacity',
    capacityUtilization: 'Capacity Utilization',
    buCapacity: 'Capacity by BU Product Line',
    factoryCapacity: 'Actual Available Capacity by Factory',
    m3Title: 'OEE Efficiency Analysis',
    avgOEE: 'Average OEE',
    buOEE: 'Average OEE by BU',
    factoryOEEDist: 'OEE Distribution by Factory',
    m4Title: 'Mold Loss Analysis',
    avgLoss: 'Avg Loss Coefficient',
    deviatedCount: 'Deviated Mold Count',
    lossDist: 'Loss Coefficient Distribution',
    defaultMark: 'Default 5%',
    abnormalTable: 'Abnormal Loss Coefficient Details',
    deviation: 'Deviation',
    reason: 'Reason',
    m5Title: 'Supplier Comparison',
    supplierBubble: 'Supplier Bubble Chart',
    supplierRank: 'Supplier Ranking',
    moldCount: 'Mold Count',
    totalInvestment2: 'Total Investment',
    avgOEE2: 'Avg OEE',
    avgLoss2: 'Avg Loss Coeff.',
    m6Title: 'Product-Factory Matrix',
    fullCoverage: 'Full Coverage',
    emptyCoverage: 'Empty Coverage',
    maxRedundancy: 'Max Redundancy',
    m7Title: 'Abnormal Warning Overview',
    severe: 'Severe',
    moderate: 'Moderate',
    normal: 'Normal',
    warningLevel: 'Level',
    warningMold: 'Mold Name',
    warningMetric: 'Metric',
    warningValue: 'Value',
    warningThreshold: 'Threshold',
    warningTrend: 'Warning Trend (30 Days)',
    pcsHr: 'pcs/hr',
    wanYuan: '10k ¥',
    count: 'pcs',
  },
} as const;

// ========== Helpers ==========
function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString();
}

// ========== Sub-components ==========

function KPICard({ label, value, unit = '', color = GREEN }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div className="text-xs mb-2" style={{ color: '#6b7c6b' }}>{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-sm" style={{ color: '#6b7c6b' }}>{unit}</span>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: '#2d3b2d' }}>{title}</h3>
      {children}
    </div>
  );
}

// ========== Module 1: Investment Overview ==========
function Module1({ molds }: { molds: Mold[] }) {
  const t = AT.zh; // will be overridden by props
  const totalInvestment = molds.reduce((s, m) => s + m.unitPrice * m.quantity, 0);
  const totalMolds = molds.length;
  const avgPrice = totalMolds > 0 ? totalInvestment / totalMolds : 0;
  const yoyChange = 8.5; // simulated

  const buData = useMemo(() => {
    const map: Record<string, number> = {};
    molds.forEach((m) => {
      map[m.buId] = (map[m.buId] || 0) + m.unitPrice * m.quantity;
    });
    return Object.entries(map).map(([buId, val]) => ({
      name: buId,
      value: Math.round(val),
    }));
  }, [molds]);

  const factoryData = useMemo(() => {
    const map: Record<string, number> = {};
    molds.forEach((m) => {
      map[m.factory] = (map[m.factory] || 0) + m.unitPrice * m.quantity;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([f, v]) => ({
      name: f,
      investment: Math.round(v),
    }));
  }, [molds]);

  return (
    <SectionCard title="模具总投资概览">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPICard label="模具总数量" value={fmtInt(totalMolds)} unit="个" color={GREEN} />
        <KPICard label="投资总额(万元)" value={fmt(totalInvestment / 10000)} unit="万元" color={GREEN} />
        <KPICard label="平均单价(万元)" value={fmt(avgPrice / 10000)} unit="万元" color={GREEN} />
        <KPICard label="同比变化" value={`+${yoyChange}%`} color={yoyChange >= 0 ? RED : GREEN} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>各BU投资占比</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={buData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {buData.map((_, i) => <Cell key={i} fill={BU_COLORS[i % BU_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>各工厂投资金额</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={factoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7c6b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7c6b' }} />
              <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
              <Bar dataKey="investment" radius={[4, 4, 0, 0]}>
                {factoryData.map((_, i) => <Cell key={i} fill={FACTORY_COLORS[i % FACTORY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}

// ========== Module 2: Capacity Distribution ==========
function Module2({ molds, products }: { molds: Mold[]; products: Product[] }) {
  const totalHC = useMemo(() => molds.reduce((s, m) => s + m.hourlyCapacity, 0), [molds]);
  const activeHC = useMemo(() => molds.filter(m => m.status === 'active').reduce((s, m) => s + m.hourlyCapacity, 0), [molds]);
  const utilization = totalHC > 0 ? (activeHC / totalHC * 100) : 0;

  const buCapacityData = useMemo(() => {
    const buIds = [...new Set(molds.map(m => m.buId))];
    const productIds = [...new Set(molds.map(m => m.productId))].slice(0, 6);
    return buIds.map(buId => {
      const row: Record<string, number | string> = { bu: buId };
      productIds.forEach(pid => {
        const cap = molds.filter(m => m.buId === buId && m.productId === pid).reduce((s, m) => s + m.hourlyCapacity, 0);
        row[pid] = cap;
      });
      return row;
    });
  }, [molds]);

  const factoryCapacityData = useMemo(() => {
    const map: Record<string, number> = {};
    molds.forEach((m) => {
      const actual = m.hourlyCapacity * m.oee * m.quantity;
      map[m.factory] = (map[m.factory] || 0) + actual;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([f, v]) => ({
      name: f,
      capacity: Math.round(v),
    }));
  }, [molds]);

  return (
    <SectionCard title="产能分布分析">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <KPICard label="全厂每小时产能" value={fmtInt(totalHC)} unit="件/小时" color={GREEN} />
        <KPICard label="产能利用率" value={`${fmt(utilization)}%`} color={utilization < 60 ? RED : GREEN} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>各BU产品线产能分布</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={buCapacityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc" />
              <XAxis dataKey="bu" tick={{ fontSize: 11, fill: '#6b7c6b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7c6b' }} />
              <Tooltip />
              <Bar dataKey={Object.keys(buCapacityData[0] || {}).find(k => k !== 'bu') || ''} stackId="a" fill={GREEN} />
              {buCapacityData[0] && Object.keys(buCapacityData[0]).filter(k => k !== 'bu').slice(1).map((key, i) => (
                <Bar key={key} dataKey={key} stackId="a" fill={BU_COLORS[(i + 1) % BU_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>各工厂实际可用产能排名</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={factoryCapacityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7c6b' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7c6b' }} width={50} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} pcs/hr`} />
              <Bar dataKey="capacity" radius={[0, 4, 4, 0]} fill={GREEN_LIGHT} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}

// ========== Module 3: OEE Analysis ==========
function Module3({ molds }: { molds: Mold[] }) {
  const avgOEE = useMemo(() => {
    if (molds.length === 0) return 0;
    return molds.reduce((s, m) => s + m.oee, 0) / molds.length;
  }, [molds]);

  const buOeeData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    molds.forEach((m) => {
      if (!map[m.buId]) map[m.buId] = { total: 0, count: 0 };
      map[m.buId].total += m.oee;
      map[m.buId].count += 1;
    });
    return Object.entries(map).map(([bu, v]) => ({
      name: bu,
      oee: Math.round(v.total / v.count * 1000) / 1000,
    }));
  }, [molds]);

  const factoryOeeData = useMemo(() => {
    const map: Record<string, number[]> = {};
    molds.forEach((m) => {
      if (!map[m.factory]) map[m.factory] = [];
      map[m.factory].push(m.oee);
    });
    return Object.entries(map).flatMap(([factory, oees]) =>
      oees.map((oee, i) => ({
        factory,
        oee,
        x: i,
        alert: oee < 0.9,
      }))
    );
  }, [molds]);

  const gaugeAngle = -90 + (avgOEE * 180);
  const gaugeColor = avgOEE < 0.7 ? RED : avgOEE < 0.9 ? YELLOW : GREEN;

  return (
    <SectionCard title="OEE设备效率分析">
      <div className="grid grid-cols-3 gap-4">
        {/* Gauge */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-xs mb-2" style={{ color: '#6b7c6b' }}>全厂平均OEE</div>
          <svg width="140" height="90" viewBox="0 0 140 90">
            <path d="M 10 80 A 60 60 0 0 1 130 80" fill="none" stroke="#e0e8dc" strokeWidth="12" />
            <path d="M 10 80 A 60 60 0 0 1 130 80" fill="none" stroke={gaugeColor} strokeWidth="12"
              strokeDasharray={`${(avgOEE * 180 / 360) * Math.PI * 60} ${Math.PI * 60}`}
              strokeLinecap="round" />
            <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#2d3b2d">
              {(avgOEE * 100).toFixed(1)}%
            </text>
            <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#6b7c6b">OEE</text>
          </svg>
          <div className="flex gap-2 text-xs mt-1">
            <span style={{ color: RED }}>◀ &lt;0.7</span>
            <span style={{ color: YELLOW }}>0.7-0.9</span>
            <span style={{ color: GREEN }}>≥0.9 ▶</span>
          </div>
        </div>
        {/* BU OEE Bar */}
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>各BU平均OEE</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={buOeeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7c6b' }} />
              <YAxis domain={[0.5, 1]} tick={{ fontSize: 11, fill: '#6b7c6b' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
              <Bar dataKey="oee" radius={[4, 4, 0, 0]}>
                {buOeeData.map((d, i) => (
                  <Cell key={i} fill={d.oee < 0.9 ? YELLOW : GREEN} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Factory OEE Scatter */}
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>各工厂OEE分布</div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc" />
              <XAxis dataKey="factory" tick={{ fontSize: 10, fill: '#6b7c6b' }} />
              <YAxis domain={[0.5, 1.1]} tick={{ fontSize: 11, fill: '#6b7c6b' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
              <Scatter data={factoryOeeData.filter(d => !d.alert)} fill={GREEN} />
              <Scatter data={factoryOeeData.filter(d => d.alert)} fill={RED} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}

// ========== Module 4: Loss Analysis ==========
function Module4({ molds }: { molds: Mold[] }) {
  const avgLoss = useMemo(() => {
    if (molds.length === 0) return 0;
    return molds.reduce((s, m) => s + m.lossCoefficient, 0) / molds.length;
  }, [molds]);

  const deviatedMolds = useMemo(() => molds.filter(m => Math.abs(m.lossCoefficient - 0.05) > 0.001), [molds]);

  const lossDistData = useMemo(() => {
    const buckets: { range: string; count: number; deviated: boolean }[] = [];
    const ranges = [
      { min: 0, max: 0.02, label: '0-2%' },
      { min: 0.02, max: 0.04, label: '2-4%' },
      { min: 0.04, max: 0.05, label: '4-5%' },
      { min: 0.05, max: 0.06, label: '5-6%' },
      { min: 0.06, max: 0.08, label: '6-8%' },
      { min: 0.08, max: 0.12, label: '8-12%' },
    ];
    ranges.forEach(r => {
      const count = molds.filter(m => m.lossCoefficient >= r.min && m.lossCoefficient < r.max).length;
      buckets.push({ range: r.label, count, deviated: r.min !== 0.04 && r.max !== 0.06 });
    });
    return buckets;
  }, [molds]);

  return (
    <SectionCard title="模具损耗分析">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <KPICard label="平均损耗系数" value={`${(avgLoss * 100).toFixed(2)}%`} color={Math.abs(avgLoss - 0.05) > 0.01 ? YELLOW : GREEN} />
        <KPICard label="偏离默认值模具数" value={fmtInt(deviatedMolds.length)} unit="个" color={deviatedMolds.length > 0 ? YELLOW : GREEN} />
      </div>
      <div className="mb-4">
        <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>损耗系数分布</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={lossDistData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc" />
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7c6b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7c6b' }} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {lossDistData.map((d, i) => (
                <Cell key={i} fill={d.deviated ? '#fde8e8' : '#e8f5e9'} stroke={d.deviated ? RED : GREEN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs mt-1 text-center" style={{ color: '#6b7c6b' }}>虚线: 默认值5% | 红色底: 偏离区域</div>
      </div>
      {deviatedMolds.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>损耗系数异常模具明细</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: '#2d3b2d' }}>
              <thead>
                <tr className="border-b" style={{ borderColor: '#e0e8dc' }}>
                  <th className="text-left py-2 font-medium">名称</th>
                  <th className="text-left py-2 font-medium">系数</th>
                  <th className="text-left py-2 font-medium">偏差</th>
                  <th className="text-left py-2 font-medium">原因</th>
                  <th className="text-left py-2 font-medium">BU</th>
                  <th className="text-left py-2 font-medium">工厂</th>
                </tr>
              </thead>
              <tbody>
                {deviatedMolds.slice(0, 8).map((m) => (
                  <tr key={m.id} className="border-b" style={{ borderColor: '#e0e8dc' }}>
                    <td className="py-1.5">{m.name}</td>
                    <td className="py-1.5">{(m.lossCoefficient * 100).toFixed(2)}%</td>
                    <td className="py-1.5" style={{ color: RED }}>{(Math.abs(m.lossCoefficient - 0.05) * 100).toFixed(2)}%</td>
                    <td className="py-1.5 max-w-32 truncate">{m.lossReason || '-'}</td>
                    <td className="py-1.5">{m.buId}</td>
                    <td className="py-1.5">{m.factory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ========== Module 5: Supplier Comparison ==========
function Module5({ molds }: { molds: Mold[] }) {
  const supplierData = useMemo(() => {
    const map: Record<string, { total: number; oeeTotal: number; lossTotal: number; investment: number }> = {};
    molds.forEach((m) => {
      const key = m.supplier;
      if (!map[key]) map[key] = { total: 0, oeeTotal: 0, lossTotal: 0, investment: 0 };
      map[key].total += 1;
      map[key].oeeTotal += m.oee;
      map[key].lossTotal += m.lossCoefficient;
      map[key].investment += m.unitPrice * m.quantity;
    });
    return Object.entries(map).map(([name, v]) => ({
      name,
      count: v.total,
      avgOEE: v.oeeTotal / v.total,
      avgLoss: v.lossTotal / v.total,
      investment: v.investment,
    }));
  }, [molds]);

  const sorted = useMemo(() => [...supplierData].sort((a, b) => b.count - a.count), [supplierData]);

  return (
    <SectionCard title="供应商对比分析">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>供应商气泡图</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc" />
              <XAxis dataKey="count" name="模具数量" tick={{ fontSize: 11, fill: '#6b7c6b' }} />
              <YAxis dataKey="avgOEE" name="平均OEE" tick={{ fontSize: 11, fill: '#6b7c6b' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0.5, 1]} />
              <ZAxis dataKey="investment" range={[40, 400]} />
              <Tooltip formatter={(v: number, name: string) => name === 'avgOEE' ? `${(v * 100).toFixed(1)}%` : v} />
              <Scatter data={supplierData} fill={GREEN} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>供应商排名</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: '#2d3b2d' }}>
              <thead>
                <tr className="border-b" style={{ borderColor: '#e0e8dc' }}>
                  <th className="text-left py-1.5 font-medium">名称</th>
                  <th className="text-right py-1.5 font-medium">数量</th>
                  <th className="text-right py-1.5 font-medium">投资额</th>
                  <th className="text-right py-1.5 font-medium">OEE</th>
                  <th className="text-right py-1.5 font-medium">损耗</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 8).map((s, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: '#e0e8dc' }}>
                    <td className="py-1">{s.name}</td>
                    <td className="py-1 text-right">{s.count}</td>
                    <td className="py-1 text-right">¥{fmtInt(s.investment)}</td>
                    <td className="py-1 text-right" style={{ color: s.avgOEE < 0.9 ? YELLOW : GREEN }}>{(s.avgOEE * 100).toFixed(1)}%</td>
                    <td className="py-1 text-right">{(s.avgLoss * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ========== Module 6: Product-Factory Matrix ==========
function Module6({ molds }: { molds: Mold[] }) {
  const { matrix, products, factories } = useMemo(() => {
    const prodSet = [...new Set(molds.map(m => m.productId))].slice(0, 12);
    const factSet = [...new Set(molds.map(m => m.factory))];
    const m: Record<string, Record<string, number>> = {};
    prodSet.forEach(p => { m[p] = {}; factSet.forEach(f => { m[p][f] = 0; }); });
    molds.forEach(mold => {
      if (m[mold.productId] && m[mold.productId][mold.factory] !== undefined) {
        m[mold.productId][mold.factory] += 1;
      }
    });
    return { matrix: m, products: prodSet, factories: factSet };
  }, [molds]);

  const fullCoverage = useMemo(() => {
    return Object.entries(matrix).filter(([_, fmap]) => Object.values(fmap).every(v => v > 0)).length;
  }, [matrix]);

  const emptyCoverage = useMemo(() => {
    return Object.entries(matrix).filter(([_, fmap]) => Object.values(fmap).every(v => v === 0)).length;
  }, [matrix]);

  const maxCount = useMemo(() => {
    let max = 0;
    Object.values(matrix).forEach(fmap => Object.values(fmap).forEach(v => { if (v > max) max = v; }));
    return max;
  }, [matrix]);

  return (
    <SectionCard title="产品-工厂矩阵分析">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPICard label="全覆盖产品" value={fmtInt(fullCoverage)} unit="个" color={GREEN} />
        <KPICard label="空白覆盖" value={fmtInt(emptyCoverage)} unit="个" color={emptyCoverage > 0 ? RED : GREEN} />
        <KPICard label="冗余最高" value={`${maxCount} 模具`} color={maxCount > 5 ? YELLOW : GREEN} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ color: '#2d3b2d' }}>
          <thead>
            <tr>
              <th className="text-left py-1.5 font-medium w-20">产品</th>
              {factories.map(f => (
                <th key={f} className="text-center py-1.5 font-medium">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(pid => (
              <tr key={pid} className="border-t" style={{ borderColor: '#e0e8dc' }}>
                <td className="py-1 text-left truncate max-w-20">{pid}</td>
                {factories.map(f => {
                  const v = matrix[pid]?.[f] || 0;
                  const intensity = maxCount > 0 ? v / maxCount : 0;
                  return (
                    <td key={f} className="py-1 text-center font-medium" style={{
                      backgroundColor: v > 0 ? `rgba(74, 124, 89, ${0.15 + intensity * 0.8})` : 'transparent',
                      color: v > 0 ? '#2d3b2d' : '#ccc',
                    }}>
                      {v || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========== Module 7: Warning Overview ==========
function Module7({ molds }: { molds: Mold[] }) {
  const warnings = useMemo(() => {
    const list: { level: 'severe' | 'moderate'; mold: Mold; metric: string; value: string; threshold: string }[] = [];
    molds.forEach(m => {
      if (m.oee < 0.7) {
        list.push({ level: 'severe', mold: m, metric: 'OEE', value: `${(m.oee * 100).toFixed(1)}%`, threshold: '< 70%' });
      } else if (m.oee < 0.9) {
        list.push({ level: 'moderate', mold: m, metric: 'OEE', value: `${(m.oee * 100).toFixed(1)}%`, threshold: '< 90%' });
      }
      const dev = Math.abs(m.lossCoefficient - 0.05);
      if (dev > 0.02) {
        list.push({ level: 'moderate', mold: m, metric: '损耗系数', value: `${(m.lossCoefficient * 100).toFixed(2)}%`, threshold: '偏离 > 2%' });
      }
    });
    return list.sort((a, b) => a.level === 'severe' ? -1 : 1);
  }, [molds]);

  const severeCount = warnings.filter(w => w.level === 'severe').length;
  const moderateCount = warnings.filter(w => w.level === 'moderate').length;
  const normalCount = molds.length - severeCount - moderateCount;

  const trendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      warnings: Math.max(0, Math.round(severeCount + moderateCount - i * 0.3 + Math.sin(i * 0.5) * 3)),
    }));
  }, [severeCount, moderateCount]);

  return (
    <SectionCard title="异常预警总览">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPICard label="严重预警" value={fmtInt(severeCount)} unit="条" color={RED} />
        <KPICard label="中等预警" value={fmtInt(moderateCount)} unit="条" color={YELLOW} />
        <KPICard label="正常" value={fmtInt(normalCount)} unit="条" color={GREEN} />
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: '#6b7c6b' }}>近30天预警趋势</div>
          <ResponsiveContainer width="100%" height={60}>
            <ComposedChart data={trendData}>
              <Area dataKey="warnings" fill="#fde8e8" stroke={RED} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ color: '#2d3b2d' }}>
          <thead>
            <tr className="border-b" style={{ borderColor: '#e0e8dc' }}>
              <th className="text-left py-1.5 font-medium">等级</th>
              <th className="text-left py-1.5 font-medium">模具名称</th>
              <th className="text-left py-1.5 font-medium">异常指标</th>
              <th className="text-left py-1.5 font-medium">异常值</th>
              <th className="text-left py-1.5 font-medium">阈值</th>
              <th className="text-left py-1.5 font-medium">BU</th>
              <th className="text-left py-1.5 font-medium">工厂</th>
            </tr>
          </thead>
          <tbody>
            {warnings.slice(0, 10).map((w, i) => (
              <tr key={i} className="border-b" style={{ borderColor: '#e0e8dc' }}>
                <td className="py-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                    backgroundColor: w.level === 'severe' ? '#fde8e8' : '#fef3cd',
                    color: w.level === 'severe' ? RED : YELLOW,
                  }}>
                    {w.level === 'severe' ? '严重' : '中等'}
                  </span>
                </td>
                <td className="py-1">{w.mold.name}</td>
                <td className="py-1">{w.metric}</td>
                <td className="py-1" style={{ color: w.level === 'severe' ? RED : YELLOW }}>{w.value}</td>
                <td className="py-1">{w.threshold}</td>
                <td className="py-1">{w.mold.buId}</td>
                <td className="py-1">{w.mold.factory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========== Main Analysis Component ==========
interface AnalysisProps {
  molds: Mold[];
  products: Product[];
  factories: string[];
  lang: 'zh' | 'en';
  onBack: () => void;
}

export default function Analysis({ molds, products, factories, lang, onBack }: AnalysisProps) {
  const [buFilter, setBuFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const t = AT[lang];

  const bus = useMemo(() => [...new Set(molds.map(m => m.buId))], [molds]);

  const filteredMolds = useMemo(() => {
    return molds.filter(m => {
      if (buFilter && m.buId !== buFilter) return false;
      if (factoryFilter && m.factory !== factoryFilter) return false;
      return true;
    });
  }, [molds, buFilter, factoryFilter]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#dce8d0' }}>
      {/* Top Navigation */}
      <div className="bg-white border-b" style={{ borderColor: '#e0e8dc', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="mx-auto max-w-[1400px] px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#6b7c6b' }}
            >
              {t.navMoldList}
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#e8f5e9', color: GREEN }}
            >
              {t.navAnalysis}
            </button>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: '#2d3b2d' }}>{t.title}</h1>
          <div className="w-32" />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-4">
        {/* Filters */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <select value={buFilter} onChange={e => setBuFilter(e.target.value)}
            className="h-9 rounded-lg border px-3 text-sm outline-none" style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}>
            <option value="">{t.allBU}</option>
            {bus.map(bu => <option key={bu} value={bu}>{bu}</option>)}
          </select>
          <select value={factoryFilter} onChange={e => setFactoryFilter(e.target.value)}
            className="h-9 rounded-lg border px-3 text-sm outline-none" style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}>
            <option value="">{t.allFactories}</option>
            {factories.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="h-9 rounded-lg border px-3 text-sm outline-none" style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}>
            <option value="">{t.allProducts}</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="h-9 rounded-lg border px-3 text-sm outline-none" style={{ borderColor: '#e0e8dc', color: '#2d3b2d' }}>
            <option value="">{t.allTime}</option>
          </select>
          <button className="h-9 px-5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: GREEN }}>
            {t.query}
          </button>
        </div>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Module1 molds={filteredMolds} />
          <Module2 molds={filteredMolds} products={products} />
          <Module3 molds={filteredMolds} />
          <Module4 molds={filteredMolds} />
          <Module5 molds={filteredMolds} />
          <Module6 molds={filteredMolds} />
        </div>

        {/* Full-width Module 7 */}
        <Module7 molds={filteredMolds} />
      </div>
    </div>
  );
}