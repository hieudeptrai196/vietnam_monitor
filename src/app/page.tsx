"use client";

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
// Import other panels here in the future

export default function Home() {
  const { panels } = usePanelStore();

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
          <div className="w-full md:w-[400px] lg:w-[420px] shrink-0 border-r bg-muted/10 flex flex-col relative z-10 shadow-xl overflow-y-auto p-4 gap-4">
            {activePanels.map(panel => {
              if (panel.id === 'live-news') return <div key={panel.id} className="h-96 shrink-0"><NewsPanel /></div>;
              if (panel.id === 'trending') return <div key={panel.id} className="h-72 shrink-0"><TrendingPanel /></div>;
              if (panel.id === 'ai-insights') return <div key={panel.id} className="h-72 shrink-0"><AIInsightsPanel /></div>;
              if (panel.id === 'crypto') return <div key={panel.id} className="h-80 shrink-0"><CryptoPanel /></div>;
              if (panel.id === 'exchange-rate') return <div key={panel.id} className="h-80 shrink-0"><ExchangeRatePanel /></div>;
              if (panel.id === 'gold') return <div key={panel.id} className="h-64 shrink-0"><GoldPanel /></div>;
              if (panel.id === 'stocks') return <div key={panel.id} className="h-64 shrink-0"><StockPanel /></div>;
              if (panel.id === 'weather') return <div key={panel.id} className="h-80 shrink-0"><WeatherPanel /></div>;
              return null;
            })}
          </div>
        )}

        {/* Cột phải: Map */}
        <div className="flex-1 relative bg-muted/30">
          <VietnamMap />
        </div>
      </div>
      
      {/* VTV24 Videos Container (100% width) */}
      <div className="h-64 shrink-0 w-full border-t bg-background px-4 py-2 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <YoutubeCarousel />
      </div>
    </div>
  );
}
