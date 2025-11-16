import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/payments';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do pagamento é obrigatório' }, { status: 400 });
    }

    const adapter = getAdapter();

    // ✅ Corrigido — aguarda o Supabase client
    const supabase = await createClient();

    const status = await adapter.getStatus(id);

    await supabase
      .from('payments')
      .update({ status: status.status, raw: status })
      .eq('provider_payment_id', id);

    return NextResponse.json({ status });
  } catch (error: any) {
    console.error('Erro ao consultar status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar status do pagamento' },
      { status: 500 }
    );
  }
}
