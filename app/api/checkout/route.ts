import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { productId, buyerEmail } = await req.json();

    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch LTC/USD price from CoinGecko
    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd');
    const priceData = await priceRes.json();
    const ltcUsd = priceData.litecoin.usd;

    const amountLtc = parseFloat((product.price_usd / ltcUsd).toFixed(6));

    // Create pending order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          product_id: product.id,
          seller_id: product.seller_id,
          buyer_email: buyerEmail,
          amount_usd: product.price_usd,
          amount_ltc: amountLtc,
          deposit_address: product.seller_ltc_address,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=litecoin:${product.seller_ltc_address}?amount=${amountLtc}`;

    return NextResponse.json({
      orderId: order.id,
      depositAddress: product.seller_ltc_address,
      amountLtc,
      qrCodeUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
