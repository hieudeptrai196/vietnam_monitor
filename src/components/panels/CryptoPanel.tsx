"use client";

import { useEffect, useState } from 'react';
import { Bitcoin, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Panel } from './Panel';

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  usd: number;
  usd_24h_change: number;
  vnd: number;
}

export function CryptoPanel() {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCrypto = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/crypto');
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrypto();
    // Auto refresh every 2 mins
    const interval = setInterval(fetchCrypto, 120000);
    return () => clearInterval(interval);
  }, []);

  const headerAction = (
    <button 
      onClick={fetchCrypto}
      disabled={loading}
      className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
      title="Cập nhật giá"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price < 1 ? 4 : 2,
      maximumFractionDigits: price < 1 ? 4 : 2,
    }).format(price);
  };

  return (
    <Panel id="crypto" title="Thị trường Crypto" headerAction={headerAction}>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && data.length === 0 ? (
          <div className="p-2 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between h-10 w-full" >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-muted rounded"></div>
                    <div className="h-2 w-10 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {data.map((coin) => (
              <div key={coin.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary">
                    <Bitcoin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{coin.name}</div>
                    <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono text-sm font-medium">{formatPrice(coin.usd)}</div>
                  <div className={`text-xs flex items-center justify-end gap-1 font-medium ${coin.usd_24h_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {coin.usd_24h_change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(coin.usd_24h_change).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
