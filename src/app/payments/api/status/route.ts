import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/payments";
import { supabaseServer } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do pagamento é obrigatório" },
        { status: 400 }
      );
    }

    const adapter = getAdapter();

    // 🔥 Supabase Server Side (cookies automáticos)
    const supabase = supabaseServer();

    // 🔥 Consulta o provedor de pagamento
    const status = await adapter.getStatus(id);

    // 🔥 Atualiza o pagamento no banco
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: status.status,
        raw: status,
      })
      .eq("provider_payment_id", id);

    if (updateError) {
      console.error("Erro update payment:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ status });
  } catch (error: any) {
    console.error("Erro ao consultar status:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao consultar status do pagamento" },
      { status: 500 }
    );
  }
}
