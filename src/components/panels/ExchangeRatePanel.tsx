"use client";

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Panel } from './Panel';

interface ExchangeRate {
  id: string;
  name: string;
  symbol: string;
  value: number;
  change: number; // Simulated daily change percentage
}

export function ExchangeRatePanel() {
  const [data, setData] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/exchange-rate');
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const headerAction = (
    <button 
      onClick={fetchRates}
      disabled={loading}
      className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
      title="Cập nhật tỷ giá"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.round(price));
  };

  return (
    <Panel id="exchange-rate" title="Tỷ giá Ngoại tệ" headerAction={headerAction}>
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
            {data.map((rate) => (
              <div key={rate.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary font-bold text-xs">
                    {rate.symbol}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{rate.name}</div>
                    <div className="text-xs text-muted-foreground">1 {rate.symbol}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono text-sm font-medium">{formatPrice(rate.value)}</div>
                  <div className={`text-xs flex items-center justify-end gap-1 font-medium ${rate.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {rate.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(rate.change).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
            <div className="p-3 text-center text-[10px] text-muted-foreground">
              Dữ liệu từ Open Exchange Rates
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
