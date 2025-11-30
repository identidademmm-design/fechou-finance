import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 🔥 Supabase Server Side (cookies automáticos, login funcionando)
    const supabase = supabaseServer();

    const {
      data: { user },
      error: userError
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

    const { amount, description, type, profile_id, due_date } = body;

    // 🔥 Insere a transação
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount,
        description,
        type,
        profile_id,
        due_date
      })
      .select()
      .single();

    if (error) {
      console.error("Erro insert:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro rota transações:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar transação" },
      { status: 500 }
    );
  }
}
