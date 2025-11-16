import { PSPAdapter, CreatePaymentInput, CreatePaymentResult, PaymentStatusResult } from './index';

const mem: Record<string, { status: CreatePaymentResult['status']; amountCents: number }> = {};

export const mockAdapter: PSPAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const id = 'mock_' + Math.random().toString(36).slice(2);
    mem[id] = { status: 'processing', amountCents: input.amountCents };
    return { providerPaymentId: id, status: 'processing', nextAction: { type: 'tap_to_pay' } };
  },
  async getStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    const item = mem[providerPaymentId] || { status: 'failed', amountCents: 0 };
    return { providerPaymentId, status: item.status };
  },
  verifyWebhookSignature() { return true; },
  parseWebhook(body: any) {
    const id = body?.providerPaymentId as string;
    if (id && mem[id]) mem[id].status = 'paid';
    return { providerPaymentId: id, status: 'paid', raw: body, amountCents: mem[id]?.amountCents };
  }
};
