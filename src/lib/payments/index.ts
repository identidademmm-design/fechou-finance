// Tipos base para criação e atualização de pagamentos
export type CreatePaymentInput = {
  amountCents: number;
  description?: string;
  metadata?: Record<string, any>;
};

export type CreatePaymentResult = {
  providerPaymentId: string;
  status: 'created' | 'processing' | 'authorized' | 'paid' | 'failed' | 'canceled';
  nextAction?: {
    type: 'tap_to_pay' | 'redirect' | 'none';
    url?: string;
  };
  raw?: any; // ✅ permite incluir dados brutos retornados pelo PSP
  amountCents?: number; // ✅ adicionado para resolver o erro no stone.ts
};

export type PaymentStatusResult = {
  providerPaymentId: string;
  status: CreatePaymentResult['status'];
  raw?: any;
};

// Interface para provedores (PSP Adapters)
export interface PSPAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getStatus(providerPaymentId: string): Promise<PaymentStatusResult>;
  verifyWebhookSignature(headers: Headers, bodyRaw: string): boolean;
  parseWebhook(body: any): {
    providerPaymentId: string;
    status: CreatePaymentResult['status'];
    raw: any;
    amountCents?: number;
  };
}

// Detecta qual provedor de pagamento usar
export function getProvider(): 'stone' | 'pagseguro' | 'mock' {
  const p = process.env.PAYMENT_PROVIDER?.toLowerCase();
  if (p === 'stone' || p === 'pagseguro') return p as any;
  return 'mock';
}

// Importa os adaptadores
import { mockAdapter } from './mock';
import { stoneAdapter } from './stone';
import { pagseguroAdapter } from './pagseguro';

// Retorna o adaptador ativo
export function getAdapter() {
  const p = getProvider();
  if (p === 'stone') return stoneAdapter;
  if (p === 'pagseguro') return pagseguroAdapter;
  return mockAdapter;
}
