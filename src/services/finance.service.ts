import { api } from '@/lib/axios';
import type {
  OrgFundDetail,
  LedgerEntry,
  LedgerEntryPayload,
  UpdateLedgerEntryPayload,
  UpdateOrgFundPayload,
  FinanceSummary,
  LedgerQueryParams,
} from '@/types/finance.types';

// ─── OrgFund ──────────────────────────────────────────────────────────────────

export const getOrgFund = async (orgId?: string): Promise<OrgFundDetail | null> => {
  const { data } = await api.get('/finance/org-fund', { params: orgId ? { orgId } : undefined });
  return data.data;
};

export const updateOrgFund = async (payload: UpdateOrgFundPayload): Promise<OrgFundDetail> => {
  const { data } = await api.patch('/finance/org-fund', payload);
  return data.data;
};

// ─── Ledger ───────────────────────────────────────────────────────────────────

export const getLedger = async (params?: LedgerQueryParams): Promise<LedgerEntry[]> => {
  const { data } = await api.get('/finance/ledger', { params });
  return data.data;
};

export const createLedgerEntry = async (payload: LedgerEntryPayload): Promise<LedgerEntry> => {
  const { data } = await api.post('/finance/ledger', payload);
  return data.data;
};

export const updateLedgerEntry = async (
  id: string,
  payload: UpdateLedgerEntryPayload,
): Promise<{ id: string; updatedAt: string }> => {
  const { data } = await api.patch(`/finance/ledger/${id}`, payload);
  return data.data;
};

export const deleteLedgerEntry = async (id: string): Promise<void> => {
  await api.delete(`/finance/ledger/${id}`);
};

// ─── Summary ──────────────────────────────────────────────────────────────────

export const getFinanceSummary = async (params?: { orgId?: string }): Promise<FinanceSummary | null> => {
  const { data } = await api.get('/finance/summary', { params });
  return data.data;
};
