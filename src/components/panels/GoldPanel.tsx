"use client";

import { useEffect, useState } from 'react';
import { Coins, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Panel } from './Panel';

interface GoldPrice {
  id: string;
  name: string;
  buy: number;
  sell: number;
  change: number;
}

export function GoldPanel() {
  const [data, setData] = useState<GoldPrice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGold = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/gold');
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch gold prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGold();
  }, []);

  const headerAction = (
    <button 
      onClick={fetchGold}
      disabled={loading}
      className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
      title="Cập nhật giá vàng"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(price / 1000)) + 'K';
  };

  return (
    <Panel id="gold" title="Thị trường Vàng (SJC)" headerAction={headerAction}>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && data.length === 0 ? (
           <div className="p-2 space-y-3">
             {Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="animate-pulse flex items-center justify-between h-10 w-full" >
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-muted rounded-full"></div>
                   <div className="space-y-2">
                     <div className="h-3 w-16 bg-muted rounded"></div>
                   </div>
                 </div>
                 <div className="space-y-2 text-right">
                    <div className="h-3 w-10 bg-muted rounded inline-block"></div>
                    <div className="h-3 w-10 bg-muted rounded inline-block ml-2"></div>
                 </div>
               </div>
             ))}
           </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 font-medium">Loại vàng</th>
                <th className="px-3 py-2 font-medium text-right">Mua vào</th>
                <th className="px-3 py-2 font-medium text-right">Bán ra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                        <Coins className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-xs">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{formatPrice(item.buy)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="font-mono text-xs font-medium">{formatPrice(item.sell)}</div>
                    <div className={`text-[10px] flex items-center justify-end gap-0.5 mt-0.5 ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {formatPrice(Math.abs(item.change))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}
