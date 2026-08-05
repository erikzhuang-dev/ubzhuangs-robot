import type { BU, Product, Mold, Factory } from './types';

export const BUS: BU[] = [
  { id: 'bu1', name: 'BU1-Injection and Pharma Delivery', shortName: 'BU1' },
  { id: 'bu2', name: 'BU2-Diagnostics', shortName: 'BU2' },
  { id: 'bu3', name: 'BU3-Diabetes Care', shortName: 'BU3' },
  { id: 'bu4', name: 'BU4-Vascular Access & Infusion Therapy', shortName: 'BU4' },
];

export const FACTORIES: Factory[] = ['LD', 'PMM', 'Winner', 'KDL', 'ZJKDL'];

export const PRODUCTS: Product[] = [
  // BU1 注射器&针头 (8 products)
  { id: 'p01', name: '1ml注射器', buId: 'bu1' },
  { id: 'p02', name: '2ml注射器', buId: 'bu1' },
  { id: 'p03', name: '5ml注射器', buId: 'bu1' },
  { id: 'p04', name: '10ml注射器', buId: 'bu1' },
  { id: 'p05', name: '20ml注射器', buId: 'bu1' },
  { id: 'p06', name: '一次性使用针头21G', buId: 'bu1' },
  { id: 'p07', name: '一次性使用针头23G', buId: 'bu1' },
  { id: 'p08', name: '一次性使用针头25G', buId: 'bu1' },
  // BU2 采血针 (7 products)
  { id: 'p09', name: '真空采血针', buId: 'bu2' },
  { id: 'p10', name: '安全采血针', buId: 'bu2' },
  { id: 'p11', name: '蝶翼采血针', buId: 'bu2' },
  { id: 'p12', name: '微量采血针', buId: 'bu2' },
  { id: 'p13', name: '儿童采血针', buId: 'bu2' },
  { id: 'p14', name: '多针采血器', buId: 'bu2' },
  { id: 'p15', name: '指尖采血针', buId: 'bu2' },
  // BU3 胰岛素注射器 (8 products)
  { id: 'p16', name: '胰岛素笔针头', buId: 'bu3' },
  { id: 'p17', name: '预填充胰岛素注射器', buId: 'bu3' },
  { id: 'p18', name: '胰岛素专用注射器0.3ml', buId: 'bu3' },
  { id: 'p19', name: '胰岛素专用注射器0.5ml', buId: 'bu3' },
  { id: 'p20', name: '胰岛素专用注射器1ml', buId: 'bu3' },
  { id: 'p21', name: '无针注射器配件', buId: 'bu3' },
  { id: 'p22', name: '胰岛素泵管路接头', buId: 'bu3' },
  { id: 'p23', name: '胰岛素注射笔外壳', buId: 'bu3' },
  // BU4 分血器 (7 products)
  { id: 'p24', name: '一次性分血器', buId: 'bu4' },
  { id: 'p25', name: '多联分血器', buId: 'bu4' },
  { id: 'p26', name: '微量分血器', buId: 'bu4' },
  { id: 'p27', name: '分血器底座', buId: 'bu4' },
  { id: 'p28', name: '分血器上盖', buId: 'bu4' },
  { id: 'p29', name: '分血器密封塞', buId: 'bu4' },
  { id: 'p30', name: '分血器连接管', buId: 'bu4' },
];

const SUPPLIERS = [
  '精密模具科技', '华创精密', '鑫达模具', '恒信模具', '博瑞精工',
  '锐锋模具', '金诚精密', '联合模具', '宏达精工', '新纪元模具',
  '瑞丰精密', '中模科技', '东方精工', '永泰模具', '国盛精密',
];

const RUNNER_TYPES = ['热流道', '冷流道', '半热流道', '针阀式热流道'];
const MATERIALS = ['PP', 'PE', 'PC', 'ABS', 'PS', 'PVC', 'PMMA', 'POM', 'PA66', 'PBT'];
const STATUSES: Mold['status'][] = ['active', 'active', 'active', 'active', 'maintenance', 'retired', 'pending'];

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

  for (const product of PRODUCTS) {
    const moldCount = Math.floor(rand() * 4) + 5; // 5-8 molds per product
    for (let i = 0; i < moldCount; i++) {
      const cavities = [1, 2, 4, 8, 12, 16, 24, 32][Math.floor(rand() * 8)];
      const cycleTime = Math.floor(rand() * 40) + 10; // 10-50s
      const oee = Math.round((rand() * 0.3 + 0.75) * 100) / 100; // 0.75-1.05
      const quantity = Math.floor(rand() * 5) + 1;
      const unitPrice = Math.round((rand() * 150000 + 50000) * 100) / 100;
      const lossCoeff = rand() < 0.7 ? 0.05 : Math.round((rand() * 0.1 + 0.02) * 100) / 100;

      const mold: Mold = {
        id: `m${String(moldIndex).padStart(3, '0')}`,
        code: `M${product.buId.toUpperCase().replace('BU', '')}-${String(moldIndex).padStart(4, '0')}`,
        name: `${product.name}模具-${String.fromCharCode(65 + i)}型`,
        supplier: SUPPLIERS[Math.floor(rand() * SUPPLIERS.length)],
        factory: FACTORIES[Math.floor(rand() * FACTORIES.length)],
        buId: product.buId,
        productId: product.id,
        cavities,
        runnerType: RUNNER_TYPES[Math.floor(rand() * RUNNER_TYPES.length)],
        cycleTime,
        oee,
        oeeReason: oee < 0.9 ? '设备老化导致效率下降' : undefined,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        lossCoefficient: lossCoeff,
        lossReason: lossCoeff !== 0.05 ? '特殊材料损耗调整' : undefined,
        material: MATERIALS[Math.floor(rand() * MATERIALS.length)],
        materialLossCoefficient: Math.round((rand() * 0.08 + 0.01) * 100) / 100,
        productWeight: Math.round((rand() * 20 + 1) * 100) / 100,
        wasteWeight: Math.round((rand() * 5 + 0.1) * 100) / 100,
        status: STATUSES[Math.floor(rand() * STATUSES.length)],
      };
      molds.push(mold);
      moldIndex++;
    }
  }

  return molds;
}

export const INITIAL_MOLDS: Mold[] = generateMolds();
