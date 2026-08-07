import type { BU, Product, Mold, Factory } from './types';

export const BUS: BU[] = [
  { id: 'bu1', name: 'BU1-Injection and Pharma Delivery', shortName: 'BU1' },
  { id: 'bu2', name: 'BU2-Diagnostics', shortName: 'BU2' },
  { id: 'bu3', name: 'BU3-Diabetes Care', shortName: 'BU3' },
  { id: 'bu4', name: 'BU4-Vascular Access & Infusion Therapy', shortName: 'BU4' },
];

export const FACTORIES: Factory[] = ['LD', 'PMM', 'Winner', 'KDL', 'ZJKDL'];

export const PRODUCTS: Product[] = [
  // BU1 Injection and Pharma Delivery (8 products)
  { id: 'p01', name: '1ml注射器', nameEn: '1ml Syringe', buId: 'bu1' },
  { id: 'p02', name: '2ml注射器', nameEn: '2ml Syringe', buId: 'bu1' },
  { id: 'p03', name: '5ml注射器', nameEn: '5ml Syringe', buId: 'bu1' },
  { id: 'p04', name: '10ml注射器', nameEn: '10ml Syringe', buId: 'bu1' },
  { id: 'p05', name: '20ml注射器', nameEn: '20ml Syringe', buId: 'bu1' },
  { id: 'p06', name: '一次性使用针头21G', nameEn: 'Disposable Needle 21G', buId: 'bu1' },
  { id: 'p07', name: '一次性使用针头23G', nameEn: 'Disposable Needle 23G', buId: 'bu1' },
  { id: 'p08', name: '一次性使用针头25G', nameEn: 'Disposable Needle 25G', buId: 'bu1' },
  // BU2 Diagnostics (7 products)
  { id: 'p09', name: '真空采血针', nameEn: 'Vacuum Blood Collection Needle', buId: 'bu2' },
  { id: 'p10', name: '安全采血针', nameEn: 'Safety Blood Collection Needle', buId: 'bu2' },
  { id: 'p11', name: '蝶翼采血针', nameEn: 'Butterfly Blood Collection Needle', buId: 'bu2' },
  { id: 'p12', name: '微量采血针', nameEn: 'Micro Blood Collection Needle', buId: 'bu2' },
  { id: 'p13', name: '儿童采血针', nameEn: 'Pediatric Blood Collection Needle', buId: 'bu2' },
  { id: 'p14', name: '多针采血器', nameEn: 'Multi-needle Blood Collector', buId: 'bu2' },
  { id: 'p15', name: '指尖采血针', nameEn: 'Fingertip Blood Collection Needle', buId: 'bu2' },
  // BU3 Diabetes Care (8 products)
  { id: 'p16', name: '胰岛素笔针头', nameEn: 'Insulin Pen Needle', buId: 'bu3' },
  { id: 'p17', name: '预填充胰岛素注射器', nameEn: 'Pre-filled Insulin Syringe', buId: 'bu3' },
  { id: 'p18', name: '胰岛素专用注射器0.3ml', nameEn: 'Insulin Syringe 0.3ml', buId: 'bu3' },
  { id: 'p19', name: '胰岛素专用注射器0.5ml', nameEn: 'Insulin Syringe 0.5ml', buId: 'bu3' },
  { id: 'p20', name: '胰岛素专用注射器1ml', nameEn: 'Insulin Syringe 1ml', buId: 'bu3' },
  { id: 'p21', name: '无针注射器配件', nameEn: 'Needle-free Injector Accessories', buId: 'bu3' },
  { id: 'p22', name: '胰岛素泵管路接头', nameEn: 'Insulin Pump Tubing Connector', buId: 'bu3' },
  { id: 'p23', name: '胰岛素注射笔外壳', nameEn: 'Insulin Pen Housing', buId: 'bu3' },
  // BU4 Vascular Access & Infusion Therapy (7 products)
  { id: 'p24', name: '一次性分血器', nameEn: 'Disposable Blood Divider', buId: 'bu4' },
  { id: 'p25', name: '多联分血器', nameEn: 'Multi-unit Blood Divider', buId: 'bu4' },
  { id: 'p26', name: '微量分血器', nameEn: 'Micro Blood Divider', buId: 'bu4' },
  { id: 'p27', name: '分血器底座', nameEn: 'Blood Divider Base', buId: 'bu4' },
  { id: 'p28', name: '分血器上盖', nameEn: 'Blood Divider Top Cover', buId: 'bu4' },
  { id: 'p29', name: '分血器密封塞', nameEn: 'Blood Divider Seal Plug', buId: 'bu4' },
  { id: 'p30', name: '分血器连接管', nameEn: 'Blood Divider Connector Tube', buId: 'bu4' },
];

const SUPPLIERS = [
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

const RUNNER_TYPES = ['热流道', '冷流道', '半热流道', '针阀式热流道'];
const MATERIALS = ['PP', 'PE', 'PC', 'ABS', 'PS', 'PVC', 'PMMA', 'POM', 'PA66', 'PBT'];
const STATUSES: Mold['status'][] = ['active', 'active', 'active', 'active', 'maintenance', 'retired', 'pending'];
const LOCATIONS = ['苏州', '昆山', '东莞', '深圳', '宁波', '常州', '上海', '无锡', '台州', '厦门'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function generateMolds(): Mold[] {
  const molds: Mold[] = [];
  const rand = seededRandom(42);
  let moldIndex = 1;

  // 每个BU生成10个模具
  const moldsPerBu = 10;
  for (const bu of BUS) {
    const buProducts = PRODUCTS.filter(p => p.buId === bu.id);
    for (let i = 0; i < moldsPerBu; i++) {
      const product = buProducts[i % buProducts.length];
      const cavities = [1, 2, 4, 8, 12, 16, 24, 32][Math.floor(rand() * 8)];
      const cycleTime = Math.floor(rand() * 40) + 10; // 10-50s
      const oee = Math.round((rand() * 0.3 + 0.75) * 100) / 100; // 0.75-1.05
      const quantity = Math.floor(rand() * 5) + 1;
      const unitPrice = Math.round((rand() * 150000 + 50000) * 100) / 100;
      const lossCoeff = rand() < 0.7 ? 0.05 : Math.round((rand() * 0.1 + 0.02) * 100) / 100;

      const supplier = SUPPLIERS[Math.floor(rand() * SUPPLIERS.length)];
      const mold: Mold = {
        id: `m${String(moldIndex).padStart(3, '0')}`,
        code: `M${bu.id.toUpperCase().replace('BU', '')}-${String(moldIndex).padStart(4, '0')}`,
        projectNumber: `PRJ-${String(Math.floor(rand() * 9000) + 1000)}`,
        name: `${product.name}模具-${String.fromCharCode(65 + (i % buProducts.length))}型`,
        nameEn: `${product.nameEn} Mold-Type ${String.fromCharCode(65 + (i % buProducts.length))}`,
        supplier: supplier.cn,
        supplierEn: supplier.en,
        factory: FACTORIES[Math.floor(rand() * FACTORIES.length)],
        buId: bu.id,
        productId: product.id,
        productName: product.name,
        productNameEn: product.nameEn,
        cavities,
        runnerType: RUNNER_TYPES[Math.floor(rand() * RUNNER_TYPES.length)],
        cycleTime,
        hourlyCapacity: Math.round(cavities * (3600 / cycleTime) * oee),
        oee,
        oeeReason: oee < 0.9 ? '设备老化导致效率下降' : undefined,
        oeeReasonEn: oee < 0.9 ? 'Equipment aging causes efficiency decline' : undefined,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        lossCoefficient: lossCoeff,
        lossReason: lossCoeff !== 0.05 ? '特殊材料损耗调整' : undefined,
        lossReasonEn: lossCoeff !== 0.05 ? 'Special material loss adjustment' : undefined,
        material: MATERIALS[Math.floor(rand() * MATERIALS.length)],
        materialLossCoeff: Math.round((rand() * 0.08 + 0.01) * 100) / 100,
        productWeight: Math.round((rand() * 20 + 1) * 100) / 100,
        wasteWeight: Math.round((rand() * 5 + 0.1) * 100) / 100,
        sprueWeight: Math.round((rand() * 3 + 0.05) * 100) / 100,
        monthlyCapacity: 0, // 由 hourlyCapacity 自动计算
        moldLength: Math.round(rand() * 500 + 300),
        moldWidth: Math.round(rand() * 400 + 200),
        moldThickness: Math.round(rand() * 200 + 100),
        location: LOCATIONS[Math.floor(rand() * LOCATIONS.length)],
        status: STATUSES[Math.floor(rand() * STATUSES.length)],
      };
      mold.monthlyCapacity = Math.round(mold.hourlyCapacity * 24 * 25 / 10000 * 100) / 100;
      molds.push(mold);
      moldIndex++;
    }
  }

  return molds;
}

export const INITIAL_MOLDS: Mold[] = generateMolds();
