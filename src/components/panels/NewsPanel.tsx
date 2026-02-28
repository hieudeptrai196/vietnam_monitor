"use client";

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Panel } from './Panel';
import { usePanelStore } from '@/stores/panel-store';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: Date;
  source: string;
}

export function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lấy selectedRegion từ Store
  const selectedRegion = usePanelStore(state => state.selectedRegion);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      let feedUrl = 'https://vnexpress.net/rss/tin-moi-nhat.rss';
      
      // Nếu có chọn vùng, tìm tin tức qua Google News RSS
      if (selectedRegion) {
        feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent('tin tức ' + selectedRegion)}&hl=vi&gl=VN&ceid=VN:vi`;
      }

      const response = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`);
      const text = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const items = Array.from(xmlDoc.querySelectorAll('item'));
      
      const parsedItems = items.map((item, index) => ({
        id: item.querySelector('guid')?.textContent || `news-${index}`,
        title: item.querySelector('title')?.textContent || 'No Title',
        link: item.querySelector('link')?.textContent || '#',
        pubDate: new Date(item.querySelector('pubDate')?.textContent || new Date().toISOString()),
        source: selectedRegion ? 'Local News' : 'VnExpress'
      })).slice(0, 10); // Take top 10

      setNews(parsedItems);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000); // refresh every 5 mins
    return () => clearInterval(interval);
  }, [fetchNews]);

  const headerAction = (
    <div className="flex items-center gap-2">
      {selectedRegion && (
        <span className="text-xs flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <MapPin className="w-3 h-3" />
          {selectedRegion}
        </span>
      )}
      <button 
        onClick={fetchNews}
        disabled={loading}
        className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
        title="Làm mới"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );

  return (
    <Panel id="live-news" title={selectedRegion ? `Tin tức địa phương` : `Tin nổi bật`} headerAction={headerAction}>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-md h-18 p-3" />
          ))
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            Không có tin tức nào.
          </div>
        ) : (
          news.map((item) => (
            <a 
              key={item.id} 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-md bg-card/50 hover:bg-muted/80 border border-transparent hover:border-border/50 transition-all group"
            >
              <h4 className="font-medium text-sm text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded-sm bg-muted whitespace-nowrap">
                  {item.source}
                </span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(item.pubDate, { addSuffix: true, locale: vi })}
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </Panel>
  );
}
