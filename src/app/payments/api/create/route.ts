import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/payments";
import { supabaseServer } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adapter = getAdapter();

    // 🔥 Corrigido — Supabase Server Side
    const supabase = supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Erro getUser:", userError);
      return NextResponse.json(
        { error: "Erro ao validar usuário" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // 🔹 Cria pagamento no provedor (ex: Stone, PagSeguro, Mock)
    const paymentResult = await adapter.createPayment({
      amountCents: body.amountCents,
      description: body.description,
    });

    // 🔹 Registra no banco
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        provider_payment_id: paymentResult.providerPaymentId,
        status: paymentResult.status,
        raw: paymentResult.raw || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Erro ao salvar:", paymentError);
      return NextResponse.json(
        { error: paymentError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(paymentResult);
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}
