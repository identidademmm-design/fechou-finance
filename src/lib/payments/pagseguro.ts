import { PSPAdapter, CreatePaymentInput, CreatePaymentResult, PaymentStatusResult } from './index';

export const pagseguroAdapter: PSPAdapter = {
  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new Error('PAGSEGURO: implementar chamada à API');
  },
  async getStatus(_providerPaymentId: string): Promise<PaymentStatusResult> {
    throw new Error('PAGSEGURO: implementar getStatus');
  },
  verifyWebhookSignature(_headers, _bodyRaw) {
    return true; // TODO: assinatura
  },
  parseWebhook(body: any) {
    return { providerPaymentId: body?.id, status: 'paid', raw: body, amountCents: body?.amount };
  }
};
