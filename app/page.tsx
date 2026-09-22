'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('status', 'active');
    if (data) setProducts(data);
  };

  const handleBuy = async () => {
    if (!buyerEmail) return alert('Please enter your email to receive the download link');
    setLoading(true);

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: selectedProduct.id, buyerEmail }),
    });

    const data = await res.json();
    if (data.qrCodeUrl) {
      setPaymentData(data);
    } else {
      alert(data.error || 'Failed to process purchase');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center py-6 border-b border-slate-800 mb-10">
        <div>
          <h1 className="text-3xl font-black text-blue-500 tracking-tight">LiteCode Marketplace ⚡</h1>
          <p className="text-xs text-slate-400 mt-1">Automated P2P code marketplace powered by direct Litecoin payments</p>
        </div>
        <a
          href="/sell"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-sm rounded-xl transition"
        >
          + List Your Script
        </a>
      </header>

      {/* Product Catalog */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-white">{item.title}</h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black px-2.5 py-1 rounded-full">
                  ${item.price_usd} USD
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-3">{item.description}</p>
            </div>

            <div className="space-y-2">
              <a
                href={item.demo_url}
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                🌐 Test Live Demo
              </a>
              <button
                onClick={() => { setSelectedProduct(item); setPaymentData(null); }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
              >
                Buy with LTC
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Checkout Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full relative">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

            <h3 className="text-xl font-bold mb-1">Buy {selectedProduct.title}</h3>
            <p className="text-xs text-slate-400 mb-6">Total Amount: <span className="text-white font-bold">${selectedProduct.price_usd} USD</span></p>

            {!paymentData ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Email Address (for code download link)</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-sm transition"
                >
                  {loading ? 'Generating order...' : 'Pay with Litecoin'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <img src={paymentData.qrCodeUrl} alt="LTC QR" className="mx-auto rounded-xl border border-slate-700" />
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs break-all">
                  <p className="text-slate-400 mb-1">Send exactly:</p>
                  <p className="text-emerald-400 font-mono font-bold text-sm mb-2">{paymentData.amountLtc} LTC</p>
                  <p className="text-slate-400 mb-1">To this address:</p>
                  <p className="font-mono text-slate-200">{paymentData.depositAddress}</p>
                </div>
                <p className="text-xs text-amber-400 animate-pulse">Awaiting blockchain confirmation...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
