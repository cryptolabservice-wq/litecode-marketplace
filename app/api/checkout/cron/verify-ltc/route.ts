import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLATFORM_FEE_PERCENT = 0.05;
const PLATFORM_LTC_ADDRESS = 'LUdwjiuC3WGzJKcsEnUyWAfZkKy7tEbQ2f';

export async function GET() {
  try {
    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('status', 'pending');

    if (error) throw error;

    for (const order of pendingOrders) {
      const res = await fetch(`https://chain.so/api/v2/get_address_balance/LTC/${order.deposit_address}`);
      const balanceData = await res.json();

      if (balanceData?.data?.confirmed_balance >= order.amount_ltc) {
        const platformFee = order.amount_ltc * PLATFORM_FEE_PERCENT;
        const sellerPayout = order.amount_ltc - platformFee;

        await supabase
          .from('orders')
          .update({
            status: 'completed',
            platform_fee_ltc: platformFee,
            seller_payout_ltc: sellerPayout,
            platform_address: PLATFORM_LTC_ADDRESS,
          })
          .eq('id', order.id);
      }
    }

    return NextResponse.json({ success: true, checked: pendingOrders.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
