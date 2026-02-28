"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Panel } from './Panel';

interface NewsArticle {
  title: string;
}

interface TrendingTopic {
  keyword: string;
  context: string;
}

export function TrendingPanel() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Lấy 15 tin mới nhất làm mẫu
      const feedUrl = encodeURIComponent('https://vnexpress.net/rss/tin-moi-nhat.rss');
      const rssRes = await fetch(`/api/rss?url=${feedUrl}`);
      const text = await rssRes.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 15);
      
      const articles: NewsArticle[] = items.map(item => ({
        title: item.querySelector('title')?.textContent || '',
      }));

      // Gọi AI phát hiện keyword
      const aiRes = await fetch('/api/ai/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles })
      });
      
      const data = await aiRes.json();
      setTopics(data.trending || []);
      
    } catch (error) {
      console.error('Failed to fetch AI trending topics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const headerAction = (
    <button 
      onClick={fetchTrending}
      disabled={loading}
      className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
      title="Cập nhật xu hướng"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  return (
    <Panel id="trending" title="Từ khóa Thịnh hành" headerAction={headerAction}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500/80 font-medium text-sm">
              <TrendingUp className="w-4 h-4 animate-bounce" />
              Đang quét dữ liệu...
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : topics.length > 0 ? (
          <ul className="space-y-4">
            {topics.map((topic, index) => (
              <li key={index} className="flex gap-3 items-start group">
                <div className="font-mono text-xs text-muted-foreground w-4 pt-0.5 text-right shrink-0">
                  {index + 1}.
                </div>
                <div>
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {topic.keyword}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {topic.context}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            Chưa có xu hướng nổi bật
          </div>
        )}
      </div>
    </Panel>
  );
}
