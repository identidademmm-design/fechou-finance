import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/payments';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adapter = getAdapter();

    // ✅ Corrigido — aguarda o Supabase ser criado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 🔹 Cria pagamento no provedor (Stone, PagSeguro, Mock etc)
    const paymentResult = await adapter.createPayment({
      amountCents: body.amountCents,
      description: body.description,
    });

    // 🔹 Registra no banco
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        provider_payment_id: paymentResult.providerPaymentId,
        status: paymentResult.status,
        raw: paymentResult.raw || null,
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    return NextResponse.json(paymentResult);
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}
