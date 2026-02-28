"use client";

import { useEffect, useState } from 'react';
import { LineChart, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Panel } from './Panel';

interface StockIndex {
  id: string;
  name: string;
  value: number;
  change: number;
  percentChange: number;
  volume: number;
  value_vnd: number;
}

export function StockPanel() {
  const [data, setData] = useState<StockIndex[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/stocks');
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch stock indexes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const headerAction = (
    <button 
      onClick={fetchStocks}
      disabled={loading}
      className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
      title="Cập nhật chỉ báo"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  const formatVolume = (vol: number) => {
    return new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(vol);
  };

  const formatValue = (val: number) => {
    return (val / 1000000000).toFixed(1) + ' tỷ ₫';
  };

  return (
    <Panel id="stock" title="Chứng khoán VN" headerAction={headerAction}>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && data.length === 0 ? (
          <div className="p-2 space-y-3">
             {Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="animate-pulse bg-muted rounded-md h-18 w-full" />
             ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((idx) => {
              const isUp = idx.change >= 0;
              const colorClass = isUp ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20';
              
              return (
                <div key={idx.id} className={`p-3 rounded-lg border ${colorClass} transition-colors`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-4 h-4 opacity-70" />
                      <span className="font-bold text-sm">{idx.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold">{idx.value.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs opacity-90">
                    <div className="flex items-center gap-3">
                      <span title="Khối lượng">KL: {formatVolume(idx.volume)}</span>
                      <span title="Giá trị">GT: {formatValue(idx.value_vnd)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium bg-background/50 px-1.5 py-0.5 rounded backdrop-blur">
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(idx.change).toFixed(2)} ({Math.abs(idx.percentChange).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="px-2 pt-1 text-center text-[10px] text-muted-foreground">
              Dữ liệu mô phỏng, cập nhật mỗi phút
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
