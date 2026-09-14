import type { MoldRequest, MoldRequestStatus, MoldRequestType } from './types';

// ── Storage ──
const REQUESTS_KEY = 'mold_requests';

function loadAll(): MoldRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MoldRequest[]) : [];
  } catch {
    return [];
  }
}

function persistAll(list: MoldRequest[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
}

/** 清理终态单：按保留策略（0 = 全部保留） */
export function purgeRequestsByRetention(days: number): number {
  if (days <= 0) return 0;
  const all = loadAll();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const kept = all.filter(
    (r) => r.status === 'pending' || new Date(r.appliedAt).getTime() >= cutoff
  );
  const removed = all.length - kept.length;
  if (removed > 0) persistAll(kept);
  return removed;
}

// ── Read ──
export function getRequests(): MoldRequest[] {
  return loadAll().sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));
}

export function getRequestById(id: string): MoldRequest | undefined {
  return loadAll().find((r) => r.id === id);
}

export function getRequestsByMold(moldId: string): MoldRequest[] {
  return loadAll().filter((r) => r.type === 'modify' && r.moldId === moldId);
}

export function hasPendingRequestForMold(moldId: string): boolean {
  return getRequestsByMold(moldId).some((r) => r.status === 'pending');
}

export function countByStatus(status: MoldRequestStatus): number {
  return loadAll().filter((r) => r.status === status).length;
}

// ── Write ──
/** 输入：不含系统生成字段（id/requestNo/status/appliedAt） */
export type NewRequestInput = Omit<MoldRequest, 'id' | 'requestNo' | 'status' | 'appliedAt'>;

export function addRequest(input: NewRequestInput): MoldRequest {
  // 幂等防重：1.5 秒窗口内同类型 + 同模具 + 同原因 + 同申请人的提交视为重复（防双击）
  const dup = loadAll().find(
    (r) =>
      r.type === input.type &&
      r.reason === input.reason &&
      r.applicant === input.applicant &&
      r.moldId === input.moldId &&
      Date.now() - new Date(r.appliedAt).getTime() < 1500
  );
  if (dup) return dup;
  const req: MoldRequest = {
    ...input,
    id: newRequestId(),
    requestNo: nextRequestNo(input.type),
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };
  const list = loadAll();
  list.push(req);
  persistAll(list);
  return req;
}

export function updateRequest(id: string, patch: Partial<MoldRequest>): MoldRequest | undefined {
  const list = loadAll();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  const next = { ...list[idx], ...patch };
  list[idx] = next;
  persistAll(list);
  return next;
}

/** 删除单据（当前仅用于撤回后的本地清理场景，常规流程不删除） */
export function deleteRequest(id: string) {
  persistAll(loadAll().filter((r) => r.id !== id));
}

// ── Request number: REQ-{M|P}-YYYYMMDD-NNN（流水号按自然日重置） ──
export function nextRequestNo(type: MoldRequestType): string {
  const prefix = type === 'modify' ? 'REQ-M' : 'REQ-P';
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const day = `${y}${m}${d}`;
  const seq =
    loadAll().filter((r) => r.requestNo.startsWith(`${prefix}-${day}`)).length + 1;
  return `${prefix}-${day}-${String(seq).padStart(3, '0')}`;
}

export function newRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
