import {
  PSPAdapter,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
} from './index';

// 🧩 Função auxiliar para tratar respostas HTTP
async function handleResponse(res: Response) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(`Erro API Stone: ${res.status} - ${data?.message || text}`);
  }

  return data;
}

export const stoneAdapter: PSPAdapter = {
  /**
   * Cria um pagamento na API Stone (SoftPOS / Tap to Pay)
   */
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { amountCents, description } = input;

    const response = await fetch('https://sandbox.api.stone.com.br/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STONE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: 'BRL',
        description: description || 'Pagamento via Fechou Finance',
        payment_method: 'card_present', // NFC (Tap to Pay)
      }),
    });

    const data = await handleResponse(response);

    return {
      providerPaymentId: data.id,
      status: data.status || 'pending',
      raw: data,
      amountCents, // ✅ agora permitido
    };
  },

  /**
   * Consulta status de um pagamento existente
   */
  async getStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    const response = await fetch(
      `https://sandbox.api.stone.com.br/v1/payments/${providerPaymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.STONE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await handleResponse(response);

    return {
      providerPaymentId: data.id,
      status: data.status,
      raw: data,
    };
  },

  /**
   * Verifica assinatura do Webhook (opcional no sandbox)
   */
  verifyWebhookSignature(_headers, _bodyRaw) {
    // ⚠️ TODO: Implementar verificação real em produção
    // No sandbox, a Stone não exige assinatura
    return true;
  },

  /**
   * Converte o payload do webhook para o formato interno
   */
  parseWebhook(body: any) {
    return {
      providerPaymentId: body?.id,
      status: body?.status || 'paid',
      raw: body,
      amountCents: body?.amount,
    };
  },
};
