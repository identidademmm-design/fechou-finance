import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { amount, description, type, profile_id, due_date } = body;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount,
        description,
        type,
        profile_id,
        due_date,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar transação' },
      { status: 500 }
    );
  }
}
