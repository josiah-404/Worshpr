import { api } from '@/lib/axios';
import type { PaymentAccount } from '@/types';
import type { CreatePaymentAccountInput, UpdatePaymentAccountInput } from '@/validations/payment-account.schema';

export const getPaymentAccounts = async (params?: { orgId?: string }): Promise<PaymentAccount[]> => {
  const { data } = await api.get<{ data: PaymentAccount[] }>('/payment-accounts', { params });
  return data.data;
};

export const createPaymentAccount = async (input: CreatePaymentAccountInput): Promise<PaymentAccount> => {
  const { data } = await api.post<{ data: PaymentAccount }>('/payment-accounts', input);
  return data.data;
};

export const updatePaymentAccount = async (id: string, input: UpdatePaymentAccountInput): Promise<PaymentAccount> => {
  const { data } = await api.patch<{ data: PaymentAccount }>(`/payment-accounts/${id}`, input);
  return data.data;
};

export const deletePaymentAccount = async (id: string): Promise<void> => {
  await api.delete(`/payment-accounts/${id}`);
};
