'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RefreshCw, MapPin, ExternalLink, ShieldAlert, Send } from 'lucide-react';

interface IranEvent {
  id: string;
  title: string;
  category: string;
  sourceUrl: string;
  sourceName: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp: number;
  severity: string;
}

export function MiddleEastSection() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MaplibreMap | null>(null);
  const [events, setEvents] = useState<IranEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống khi có tin nhắn chat mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatting]);

  // Khởi tạo map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [43.68, 32.42], // Trung Đông
      zoom: 3.5,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    const handleResize = () => {
      map.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const fetchSummary = async (currentEvents: IranEvent[], forceRefresh: boolean = false) => {
    if (!currentEvents || currentEvents.length === 0) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/conflict/iran-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: currentEvents, forceRefresh })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary || 'Không có tóm tắt.');
      }
    } catch (error) {
      console.error('Error fetching AI summary:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput.trim();
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatting(true);

    try {
      const res = await fetch('/api/conflict/iran-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          events: events,
          currentSummary: aiSummary
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, đã xảy ra lỗi từ server khi phân tích." }]);
      }
    } catch (error) {
      console.error('Lỗi gọi AI Chat:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Mạng có vấn đề hoặc bị gián đoạn, vui lòng thử lại." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Fetch dữ liệu
  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/conflict/iran-events');
      if (!res.ok) throw new Error('Network format error');
      const data = await res.json();
      
      if (data && Array.isArray(data.events)) {
        setEvents(data.events);
        renderMarkers(data.events);
        // Gọi AI summary ngay lần đầu
        fetchSummary(data.events);
      }
    } catch (error) {
      console.error('Error fetching Middle East events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Interval chạy AI summary mỗi vòng 1 phút
  useEffect(() => {
    if (events.length === 0) return;
    const intervalId = setInterval(() => {
      fetchSummary(events);
    }, 600000); // 10 phút auto refresh
    return () => clearInterval(intervalId);
  }, [events]);

  // Vẽ marker lên bản đồ
  const renderMarkers = (eventList: IranEvent[]) => {
    if (!map.current) return;

    // Xoá marker cũ (nếu render lại)
    const existingMarkers = document.querySelectorAll('.me-marker');
    existingMarkers.forEach(el => el.remove());

    // Gom nhóm các sự kiện có cùng toạ độ để marker không bị đè lên nhau hoàn toàn
    const grouped: Record<string, IranEvent[]> = {};
    eventList.forEach(ev => {
      const key = `${ev.latitude},${ev.longitude}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ev);
    });

    Object.values(grouped).forEach(group => {
      const ev = group[0];
      const count = group.length;

      const el = document.createElement('div');
      el.className = 'me-marker relative flex items-center justify-center cursor-pointer';
      
      const ping = document.createElement('div');
      ping.className = 'absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping';
      
      const dot = document.createElement('div');
      dot.className = 'relative inline-flex rounded-full h-4 w-4 bg-red-600 border border-white/50 items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.8)]';
      
      if (count > 1) {
        dot.innerHTML = `<span class="text-[8px] text-white font-bold">${count}</span>`;
        dot.className = 'relative inline-flex rounded-full h-5 w-5 bg-red-600 border border-white/50 items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.8)]';
      }

      el.appendChild(ping);
      el.appendChild(dot);

      const titlesHtml = group.map(i => `<div class="text-[12px] text-gray-800 mb-2 pb-2 border-b border-gray-100 last:border-0 truncate-2-lines"><a href="${i.sourceUrl}" target="_blank" class="hover:text-blue-600">${i.title}</a></div>`).join('');

      const popupHtml = `
        <div class="p-1 max-h-[250px] overflow-y-auto custom-scrollbar">
          <div class="font-bold text-red-600 flex items-center gap-1 mb-2 sticky top-0 bg-white z-10">
            <span>⚠️</span> ${ev.locationName} (${count} tin)
          </div>
          ${titlesHtml}
        </div>
      `;

      new maplibregl.Marker({ element: el })
        .setLngLat([ev.longitude, ev.latitude])
        .setPopup(new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '280px' }).setHTML(popupHtml))
        .addTo(map.current!);
    });
  };

  const focusToLocation = (lat: number, lng: number) => {
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 5, duration: 1500 });
    }
  };

  return (
    <section className="w-full flex flex-col bg-background text-foreground overflow-hidden border rounded-xl shadow-sm mb-4">
      <div className="p-4 border-b flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold">Theo dõi Xung Đột</h2>
          <span className="bg-red-500/10 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium ml-2 animate-pulse">Live Feed</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[800px] lg:min-h-[650px] lg:h-[650px]">
        {/* AI Column */}
        <div className="w-full lg:w-[350px] bg-background flex flex-col border-b lg:border-b-0 lg:border-r">
          {/* AI Summary Block */}
          <div className="p-3 border-b bg-muted/10 flex flex-col gap-2">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-primary">AI Phân Tích</span>
                {aiLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
              </div>
              <button
                onClick={() => fetchSummary(events, true)}
                disabled={aiLoading}
                className="text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                title="Ép AI phân tích lại tin mới nhất"
              >
                <RefreshCw className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="bg-primary/5 rounded-md p-3 border border-primary/20 relative flex flex-col max-h-[250px] shrink-0">
              <div className="overflow-y-auto custom-scrollbar pr-2">
                <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {aiSummary || "Đang chờ dữ liệu AI..."}
                </p>
              </div>
            </div>
          </div>

          {/* AI Chat Block */}
          <div className="p-3 bg-muted/5 flex flex-col gap-2 relative flex-1 min-h-[300px] lg:min-h-0 overflow-hidden">
            {chatMessages.length > 0 ? (
              <div 
                ref={scrollRef}
                className="flex flex-col gap-2 overflow-y-auto mb-2 custom-scrollbar pr-2 flex-1"
              >
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`p-2.5 text-[13px] rounded-lg ${msg.role === 'user' ? 'bg-primary/10 self-end ml-4 text-foreground' : 'bg-muted self-start mr-4 text-muted-foreground'}`}>
                    <span className="font-semibold text-[10px] uppercase block mb-1 opacity-60">
                      {msg.role === 'user' ? 'Bạn' : 'AI Trợ lý'}
                    </span>
                    <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                  </div>
                ))}
                {isChatting && (
                  <div className="p-2.5 text-[13px] rounded-lg bg-muted self-start mr-4 text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang giải đáp...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground pb-4 opacity-60">
                <p className="text-[12px] text-center px-4">Chatbot AI chiến sự.</p>
              </div>
            )}
            
            <form onSubmit={handleSendChat} className="flex gap-2 relative mt-auto shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Hỏi câu hỏi riêng về chiến sự..."
                className="flex-1 text-[13px] px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                disabled={isChatting}
              />
              <button
                type="submit"
                disabled={isChatting || !chatInput.trim()}
                className="bg-primary text-primary-foreground px-3 rounded-md flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                title="Gửi câu hỏi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative border-b lg:border-b-0 lg:border-r min-h-[400px] lg:min-h-0 order-first lg:order-0">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        </div>

        {/* News Column */}
        <div className="w-full lg:w-[320px] bg-background flex flex-col">
          <div className="p-3 border-b bg-muted/20">
            <h3 className="text-sm font-medium">Tin tức chiến sự nổi bật ({events.length})</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-primary/50" />
                <p className="text-sm">Đang quét RSS vệ tinh...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <ShieldAlert className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm">Hiện không có tin biên dịch xung đột nổi bật trong 7 ngày qua.</p>
              </div>
            ) : (
              <div className="divide-y">
                {events.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <a 
                          href={event.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium leading-tight group-hover:text-primary transition-colors flex-1"
                        >
                          {event.title}
                        </a>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-medium bg-secondary px-1.5 py-0.5 rounded-sm">
                            {event.sourceName}
                          </span>
                          <span 
                            className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => focusToLocation(event.latitude, event.longitude)}
                            title="Xác định toạ độ"
                          >
                            <MapPin className="w-3 h-3 text-red-500" />
                            {event.locationName}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          {new Date(event.timestamp).toLocaleDateString('vi-VN')}
                          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3 text-primary" />
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
