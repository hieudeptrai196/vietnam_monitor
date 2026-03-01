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
import { Info, X, Map, ShieldAlert } from 'lucide-react';
// Import other panels here in the future

export default function Home() {
  const { panels } = usePanelStore();
  const [showMapGuide, setShowMapGuide] = useState(true);
  const [activeMapView, setActiveMapView] = useState<'default' | 'disaster'>('default');

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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-md border border-border/50 text-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3 text-sm animate-in slide-in-from-top-4 fade-in duration-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                <Info size={14} />
              </span>
              <p>Trỏ chuột hoặc vuốt trên bản đồ để xem chi tiết. Cuộn chuột để phóng to/thu nhỏ.</p>
              <button 
                onClick={() => setShowMapGuide(false)}
                className="p-1 hover:bg-muted rounded-full transition-colors opacity-70 hover:opacity-100 shrink-0"
                aria-label="Đóng hướng dẫn"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Map View Toggle Button */}
          <div className="absolute top-4 right-4 z-20 flex bg-background/90 backdrop-blur-md border border-border/50 rounded-lg shadow-sm p-1 gap-1">
            <button
              onClick={() => setActiveMapView('default')}
              title="Bản đồ Tổng hợp"
              className={`p-2 rounded-md flex items-center justify-center transition-colors ${activeMapView === 'default' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <Map size={18} />
            </button>
            <button
              onClick={() => setActiveMapView('disaster')}
              title="Cảnh báo Thiên tai"
              className={`relative p-2 rounded-md flex items-center justify-center transition-colors ${activeMapView === 'disaster' ? 'bg-red-600 text-white shadow' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <ShieldAlert size={18} />
              {activeMapView === 'disaster' ? (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></span>
              )}
            </button>
          </div>

          <div className="flex-1 relative min-h-0">
            {activeMapView === 'default' ? (
              <VietnamMap />
            ) : (
              <div className="w-full h-full bg-background relative">
                {/* 
                  Sử dụng API Proxy của mình để chèn luồng render dmc.gov.vn 
                  mà không bị chặn X-Frame-Options 
                */}
                <iframe 
                  src="/api/dmc-proxy" 
                  className="w-full h-full border-0 absolute inset-0 z-10"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  title="Hệ thống giám sát Thiên tai Việt Nam"
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
