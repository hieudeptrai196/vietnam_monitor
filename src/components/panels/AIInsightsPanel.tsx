"use client";

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Panel } from './Panel';

interface NewsArticle {
  title: string;
  source: string;
  pubDate: string;
}

export function AIInsightsPanel() {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // Đầu tiên, lấy tin mới nhất (giả lập 5 tin gọn)
      const feedUrl = encodeURIComponent('https://vnexpress.net/rss/tin-moi-nhat.rss');
      const rssRes = await fetch(`/api/rss?url=${feedUrl}`);
      const text = await rssRes.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 5);
      
      const articles: NewsArticle[] = items.map(item => ({
        title: item.querySelector('title')?.textContent || '',
        source: 'VnExpress',
        pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString()
      }));

      // Sau đó gửi đi tóm tắt AI
      const aiRes = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles })
      });
      
      const data = await aiRes.json();
      setSummary(data.summary || 'Không có tóm tắt.');
      
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      setSummary('Đã xảy ra lỗi khi tạo tóm tắt thông minh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const headerAction = (
    <button 
      onClick={fetchInsights}
      disabled={loading}
      className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
      title="Tạo lại tóm tắt"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  return (
    <Panel id="ai-insights" title="Thông tin AI hôm nay" headerAction={headerAction}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary/80 font-medium">
              <Sparkles className="w-4 h-4 animate-pulse" />
              AI đang phân tích luồng tin tức...
            </div>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        ) : summary ? (
          <div className="prose prose-sm dark:prose-invert">
            <div className="flex items-center gap-2 text-primary font-medium mb-3">
              <Sparkles className="w-4 h-4" />
              Tóm tắt thực trạng
            </div>
            <div className="whitespace-pre-wrap leading-relaxed border-l-2 border-primary/50 pl-3">
              {summary}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            Không có dữ liệu
          </div>
        )}
      </div>
    </Panel>
  );
}
