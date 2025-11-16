import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/payments'; // ✅ caminho certo
import { createClient as supabaseServer } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const adapter = getAdapter();
  const bodyRaw = await req.text();

  // 🔒 Verifica assinatura do webhook
  const ok = adapter.verifyWebhookSignature(req.headers as any, bodyRaw);
  if (!ok) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
  }

  const body = JSON.parse(bodyRaw || '{}');
  const evt = adapter.parseWebhook(body);

  // ✅ Agora usamos await aqui
  const supabase = await supabaseServer();

  // 🧾 Atualiza o status do pagamento
  await supabase
    .from('payments')
    .update({ status: evt.status, raw: evt.raw })
    .eq('provider_payment_id', evt.providerPaymentId);

  // 💰 Cria transação se o pagamento foi concluído
  if (evt.status === 'paid' && evt.amountCents) {
    const amountNumeric = Number((evt.amountCents / 100).toFixed(2));

    const { data: tx } = await supabase
      .from('transactions')
      .insert({
        amount: amountNumeric,
        type: 'income',
        description: 'Pagamento via PSP',
        source: 'payments',
      })
      .select('id')
      .single();

    if (tx?.id) {
      const { data: pay } = await supabase
        .from('payments')
        .select('id')
        .eq('provider_payment_id', evt.providerPaymentId)
        .single();

      if (pay?.id) {
        await supabase.from('payment_transaction_links').insert({
          payment_id: pay.id,
          transaction_id: tx.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
