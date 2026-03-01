"use client";

import { useState } from "react";
import { usePanelStore } from "@/stores/panel-store";
import { VietnamMap } from "@/components/map/VietnamMap";
import { NewsPanel } from "@/components/panels/NewsPanel";
import { AIInsightsPanel } from "@/components/panels/AIInsightsPanel";
import { TrendingPanel } from "@/components/panels/TrendingPanel";
import { CryptoPanel } from "@/components/panels/CryptoPanel";
import { ExchangeRatePanel } from "@/components/panels/ExchangeRatePanel";
import { GoldPanel } from "@/components/panels/GoldPanel";
import { StockPanel } from "@/components/panels/StockPanel";
import { WeatherPanel } from "@/components/panels/WeatherPanel";
import { YoutubeCarousel } from '@/components/layout/YoutubeCarousel';
import { Info, X, Loader2 } from 'lucide-react';
// Import other panels here in the future

export default function Home() {
  const { panels, activeMapView } = usePanelStore();
  const [showMapGuide, setShowMapGuide] = useState(true);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Sort panels by priority
  const activePanels = Object.values(panels)
    .filter((p) => p.enabled)
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative w-full overflow-hidden bg-background">
      {/* Vùng chính: Sidebar + Map */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Cột trái: Left Sidebar */}
        {activePanels.length > 0 && (
          <div className="w-full md:w-[400px] lg:w-[420px] shrink-0 border-r bg-muted/10 flex flex-col shadow-xl overflow-y-auto p-4 gap-4">
            {/* Dropdown điều hướng tĩnh */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-2 border-b rounded-md shadow-sm -mt-2 mb-2 flex items-center gap-2">
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer hover:bg-muted/50"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const el = document.getElementById(`panel-${e.target.value}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  e.target.value = ""; // Reset
                }}
              >
                <option value="">-- Chuyển nhanh đến chuyên mục --</option>
                {activePanels.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Các panels */}
            {activePanels.map(panel => {
              if (panel.id === 'live-news') return <div id={`panel-${panel.id}`} key={panel.id} className="h-96 shrink-0 scroll-mt-20"><NewsPanel /></div>;
              if (panel.id === 'trending') return <div id={`panel-${panel.id}`} key={panel.id} className="h-72 shrink-0 scroll-mt-20"><TrendingPanel /></div>;
              if (panel.id === 'ai-insights') return <div id={`panel-${panel.id}`} key={panel.id} className="h-72 shrink-0 scroll-mt-20"><AIInsightsPanel /></div>;
              if (panel.id === 'crypto') return <div id={`panel-${panel.id}`} key={panel.id} className="h-80 shrink-0 scroll-mt-20"><CryptoPanel /></div>;
              if (panel.id === 'exchange-rate') return <div id={`panel-${panel.id}`} key={panel.id} className="h-80 shrink-0 scroll-mt-20"><ExchangeRatePanel /></div>;
              if (panel.id === 'gold') return <div id={`panel-${panel.id}`} key={panel.id} className="h-64 shrink-0 scroll-mt-20"><GoldPanel /></div>;
              if (panel.id === 'stocks' || panel.id === 'stock') return <div id={`panel-${panel.id}`} key={panel.id} className="h-64 shrink-0 scroll-mt-20"><StockPanel /></div>;
              if (panel.id === 'weather') return <div id={`panel-${panel.id}`} key={panel.id} className="h-80 shrink-0 scroll-mt-20"><WeatherPanel /></div>;
              return null;
            })}
          </div>
        )}

        {/* Cột phải: Map */}
        <div className="flex-1 relative bg-muted/30 flex flex-col">
          {showMapGuide && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[380px] bg-background/95 backdrop-blur-md border border-border/50 text-foreground px-4 py-3 rounded-xl shadow-xl flex flex-col items-center text-center animate-in slide-in-from-top-4 fade-in duration-300">
              <button 
                onClick={() => setShowMapGuide(false)}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
                aria-label="Đóng hướng dẫn"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-1.5 mb-1.5 text-primary font-medium text-sm">
                <Info size={16} />
                <span>Hướng dẫn tương tác Bản đồ</span>
              </div>
              
              <p className="text-[13px] text-foreground/80 leading-relaxed">
                Nhấp vào một tỉnh/thành bất kỳ để lọc và theo dõi <br/> tin tức chi tiết tại <strong>Sidebar</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                (Cuộn chuột trên máy tính hoặc vuốt chụm để thu phóng)
              </p>
            </div>
          )}

          <div className="flex-1 relative min-h-0">
            {activeMapView === 'default' ? (
              <VietnamMap />
            ) : (
              <div className="w-full h-full bg-background relative flex items-center justify-center">
                {isIframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu radar từ DMC...</p>
                  </div>
                )}
                {/* 
                  Sử dụng API Proxy của mình để chèn luồng render dmc.gov.vn 
                  mà không bị chặn X-Frame-Options 
                */}
                <iframe 
                  src="/api/dmc-proxy" 
                  className="w-full h-full border-0 absolute inset-0 z-10"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  title="Hệ thống giám sát Thiên tai Việt Nam"
                  onLoad={() => setIsIframeLoading(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* VTV24 Videos Container (100% width) */}
      <div className="h-64 shrink-0 w-full border-t bg-background px-4 py-2 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <YoutubeCarousel />
      </div>
    </div>
  );
}
