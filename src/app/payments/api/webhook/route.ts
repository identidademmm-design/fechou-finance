import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/payments";
import { supabaseServer } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const adapter = getAdapter();
  const bodyRaw = await req.text();

  // 🔒 Verifica assinatura do webhook
  const ok = adapter.verifyWebhookSignature(req.headers as any, bodyRaw);
  if (!ok) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const body = JSON.parse(bodyRaw || "{}");
  const evt = adapter.parseWebhook(body);

  // 🔥 Supabase server-side (cookies não importam aqui)
  const supabase = supabaseServer();

  // 🧾 Atualiza status do pagamento
  const { error: updateError } = await supabase
    .from("payments")
    .update({ status: evt.status, raw: evt.raw })
    .eq("provider_payment_id", evt.providerPaymentId);

  if (updateError) {
    console.error("Erro ao atualizar pagamento:", updateError);
  }

  // 💰 Se estiver pago → cria transação automática
  if (evt.status === "paid" && evt.amountCents) {
    const amountNumeric = Number((evt.amountCents / 100).toFixed(2));

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        amount: amountNumeric,
        type: "income",
        description: "Pagamento via PSP",
        source: "payments",
      })
      .select("id")
      .single();

    if (txError) {
      console.error("Erro ao criar transação:", txError);
    }

    if (tx?.id) {
      const { data: pay } = await supabase
        .from("payments")
        .select("id")
        .eq("provider_payment_id", evt.providerPaymentId)
        .single();

      if (pay?.id) {
        await supabase.from("payment_transaction_links").insert({
          payment_id: pay.id,
          transaction_id: tx.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
