// 模具名称中英文自动翻译工具
// 内置词汇映射表 + 通用翻译规则，用于输入/导入中文名称时自动生成英文名称

// 词汇映射表（长词优先，避免短词先匹配破坏长词）
const WORD_MAP: [RegExp, string][] = [
  // BU1 注射器 & 针头
  [/一次性使用针头/g, 'Disposable Needle'],
  [/一次性使用/g, 'Disposable'],
  [/一次性/g, 'Disposable'],
  [/注射器/g, 'Syringe'],
  [/针头/g, 'Needle'],
  // BU2 采血针
  [/真空采血针/g, 'Vacuum Blood Collection Needle'],
  [/安全采血针/g, 'Safety Blood Collection Needle'],
  [/蝶翼采血针/g, 'Butterfly Blood Collection Needle'],
  [/微量采血针/g, 'Micro Blood Collection Needle'],
  [/儿童采血针/g, 'Pediatric Blood Collection Needle'],
  [/指尖采血针/g, 'Fingertip Blood Collection Needle'],
  [/采血针/g, 'Blood Collection Needle'],
  [/多针采血器/g, 'Multi-needle Blood Collector'],
  [/采血器/g, 'Blood Collector'],
  // BU3 胰岛素
  [/胰岛素笔针头/g, 'Insulin Pen Needle'],
  [/预填充胰岛素注射器/g, 'Pre-filled Insulin Syringe'],
  [/胰岛素专用注射器/g, 'Insulin Syringe'],
  [/胰岛素注射器/g, 'Insulin Syringe'],
  [/无针注射器配件/g, 'Needle-free Injector Accessories'],
  [/胰岛素泵管路接头/g, 'Insulin Pump Tubing Connector'],
  [/胰岛素注射笔外壳/g, 'Insulin Pen Housing'],
  [/胰岛素/g, 'Insulin'],
  // BU4 分血器
  [/分血器底座/g, 'Blood Divider Base'],
  [/分血器上盖/g, 'Blood Divider Top Cover'],
  [/分血器密封塞/g, 'Blood Divider Seal Plug'],
  [/分血器连接管/g, 'Blood Divider Connector Tube'],
  [/多联分血器/g, 'Multi-unit Blood Divider'],
  [/微量分血器/g, 'Micro Blood Divider'],
  [/分血器/g, 'Blood Divider'],
  // 通用词汇
  [/底座/g, 'Base'],
  [/上盖/g, 'Top Cover'],
  [/密封塞/g, 'Seal Plug'],
  [/连接管/g, 'Connector Tube'],
  [/外壳/g, 'Housing'],
  [/管路/g, 'Tubing'],
  [/配件/g, 'Accessories'],
  [/真空/g, 'Vacuum'],
  [/安全/g, 'Safety'],
  [/微量/g, 'Micro'],
  [/儿童/g, 'Pediatric'],
  [/模具/g, 'Mold'],
];

/**
 * 将中文模具名称翻译为英文
 * 规则：
 * 1. 按映射表替换中文词汇（长词优先）
 * 2. 规格数字+单位（如 5ml、21G、0.5ml）原样保留
 * 3. "-A型" / "A型" → "-Type A" / "Type A"
 * 4. 未识别的中文保留原文，便于人工修正
 */
export function translateMoldName(zhName: string): string {
  if (!zhName || !zhName.trim()) return '';
  let result = zhName.trim();

  // 1. 词汇映射替换（替换词前后补空格，避免与相邻内容粘连）
  for (const [pattern, en] of WORD_MAP) {
    result = result.replace(pattern, ` ${en} `);
  }

  // 2. 型号规则："-A型" → "-Type A"；"A型" → "Type A"
  result = result.replace(/-\s*([A-Za-z])\s*型/g, '-Type $1');
  result = result.replace(/([A-Za-z])\s*型/g, ' Type $1');

  // 3. 规格与单词之间补空格：数字+单位 后紧跟字母时补空格（如 "5mlSyringe" → "5ml Syringe"）
  result = result.replace(/(\d(?:ml|mL|ML|G|g|cc|mm))\s*([A-Za-z])/g, '$1 $2');

  // 4. 清理多余空格、修复连字符
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\s+-\s*/g, '-');
  result = result.replace(/-\s+Type/g, '-Type');

  return result;
}
