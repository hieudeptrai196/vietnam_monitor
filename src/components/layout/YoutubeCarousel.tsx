'use client';

import { useEffect, useState, useRef } from 'react';
import { Play, Tv } from 'lucide-react';

interface YoutubeVideo {
  id: string;
  title: string;
  link: string;
  published: string;
  thumbnail: string;
  views: string;
}

interface LiveStreamData {
  isLive: boolean;
  embedUrl?: string;
  title?: string;
  videoId?: string;
}

export function YoutubeCarousel() {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [liveStream, setLiveStream] = useState<LiveStreamData>({ isLive: false });
  const [loading, setLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  const dragged = useRef(false);

  useEffect(() => {
    const fetchVideosAndLive = async () => {
      try {
        const [videosRes, liveRes] = await Promise.all([
          fetch('/api/youtube'),
          fetch('/api/youtube/live')
        ]);
        
        const videosData = await videosRes.json();
        if (Array.isArray(videosData)) {
          setVideos(videosData);
        }

        const liveData = await liveRes.json();
        setLiveStream(liveData);
      } catch (error) {
        console.error('Failed to load YouTube data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideosAndLive();
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // Load thêm video khi kéo gần đến cuối
      if (scrollLeft + clientWidth >= scrollWidth - 100) {
        if (visibleCount < videos.length) {
          setVisibleCount(prev => Math.min(prev + 4, videos.length));
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    dragged.current = false;
    if (scrollRef.current) {
      startX.current = e.pageX - scrollRef.current.offsetLeft;
      scrollLeftPos.current = scrollRef.current.scrollLeft;
      scrollRef.current.classList.remove('snap-x', 'scroll-smooth');
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (scrollRef.current) {
      scrollRef.current.classList.add('snap-x', 'scroll-smooth');
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollRef.current) {
      scrollRef.current.classList.add('snap-x', 'scroll-smooth');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();
    if (scrollRef.current) {
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX.current) * 2;
      
      if (Math.abs(walk) > 5) {
        dragged.current = true;
      }
      
      scrollRef.current.scrollLeft = scrollLeftPos.current - walk;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Đang kết nối hệ thống Truyền hình...</span>
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`w-full mt-2 flex flex-col ${liveStream.isLive ? 'lg:flex-row' : ''} gap-4 h-full`}>
        
        {/* Khung Live Stream (Video chạy thật + Click mở Modal) */}
        {liveStream.isLive && liveStream.videoId && liveStream.embedUrl && (
          <div className="w-full lg:w-96 xl:w-[450px] shrink-0 flex flex-col h-full bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 p-2 border-b bg-muted/30 whitespace-nowrap overflow-hidden">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0"></div>
              <h3 className="font-semibold text-sm flex items-center gap-1 uppercase tracking-wider text-red-600 truncate" title={liveStream.title || 'Phát trực tiếp'}>
                <Tv size={14} className="shrink-0" /> {liveStream.title || 'Phát trực tiếp'}
              </h3>
            </div>
            
            {/* IFrame Live thật + Lớp phủ trong suốt bắt Click */}
            <div className="flex-1 w-full bg-black relative min-h-[220px] group cursor-pointer" onClick={() => setPlayingVideoId(liveStream.videoId!)}>
              <iframe
                width="100%"
                height="100%"
                src={liveStream.embedUrl}
                title="Live Stream"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="absolute inset-0 pointer-events-none"
              ></iframe>
              {/* Lớp phủ trong suốt: Che iframe để bắt sự kiện click */}
              <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-lg backdrop-blur-sm">
                    <Play className="w-7 h-7 ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 tracking-wider uppercase z-20">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div> Trực tiếp
              </div>
            </div>
          </div>
        )}

        {/* Băng chuyền Video List */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-1 mb-1">
            <div className={`w-2 h-2 rounded-full ${!liveStream.isLive ? 'bg-red-600 animate-pulse' : 'hidden'}`}></div>
            <h3 className="font-semibold text-sm uppercase tracking-wider">Tin tức VTV24</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{videos.length} tin</span>
          </div>
          
          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex overflow-x-auto pb-4 pt-1 gap-4 snap-x hide-scrollbar scroll-smooth flex-1 items-start cursor-grab active:cursor-grabbing"
          >
            {videos.slice(0, visibleCount).map((video) => (
              <button
                onClick={(e) => {
                  if (dragged.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  setPlayingVideoId(video.id);
                }}
                key={video.id}
                className="group relative flex-none w-64 bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 snap-center hover:-translate-y-1 text-left flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-32 w-full overflow-hidden bg-muted shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center text-white scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-sm">
                      <Play className="w-6 h-6 ml-1" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-medium text-[15px] line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
                    {video.title}
                  </h4>
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>{new Date(video.published).toLocaleDateString('vi-VN')}</span>
                    <span>{Number(video.views).toLocaleString('vi-VN')} lượt xem</span>
                  </div>
                </div>
              </button>
            ))}
            
            {/* Loading Indicator for Infinite Scroll */}
            {visibleCount < videos.length && (
              <div className="flex-none w-32 flex flex-col items-center justify-center opacity-50 h-32 my-auto">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-xs">Đang tải...</span>
              </div>
            )}
            {visibleCount >= videos.length && (
              <div className="flex-none w-32 flex flex-col items-center justify-center text-muted-foreground h-32 my-auto">
                <span className="text-xs text-center border p-2 rounded-lg bg-muted/50">Hết tin mới<br/>trong ngày</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal Overlay - Bấm ra ngoài (backdrop) để đóng */}
      {playingVideoId && (
        <div 
          onClick={() => setPlayingVideoId(null)}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          {/* Chặn sự kiện click bên trong box video không bị nảy ra ngoài đóng modal */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <button 
              onClick={() => setPlayingVideoId(null)}
              className="absolute top-2 right-2 md:-top-12 md:right-0 text-white bg-black/50 md:bg-transparent rounded-full px-3 py-1 hover:text-red-500 transition-colors font-bold md:text-xl z-50 flex items-center gap-2"
            >
              Đóng ✕
            </button>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}
