import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { usePanelStore } from '@/stores/panel-store';

interface VietnamMapProps {
  className?: string;
}

// Hàm hỗ trợ tính toán Bounding Box từ mảng toạ độ GeoJSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBbox(geometry: any): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processCoord = (coord: any) => {
    if (typeof coord[0] === 'number') {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    } else {
      coord.forEach(processCoord);
    }
  };
  processCoord(geometry.coordinates);
  return [minLng, minLat, maxLng, maxLat];
}

export function VietnamMap({ className = '' }: VietnamMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MaplibreMap | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geojsonFeatures = useRef<any[]>([]); // Lưu trữ dữ liệu geojson để dùng cho tính năng Zoom
  
  const selectedRegion = usePanelStore((state) => state.selectedRegion);
  const setSelectedRegion = usePanelStore((state) => state.setSelectedRegion);
  const [lng] = useState(108.0);
  const [lat] = useState(16.0);
  const [zoom] = useState(5.5); // Phù hợp để xem toàn cảnh Việt Nam

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Đã xoá bỏ giới hạn Bounding box cho Việt Nam theo yêu cầu người dùng
    
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
      center: [lng, lat],
      zoom: zoom,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    const fetchEarthquakes = async () => {
      try {
        const res = await fetch('/api/earthquakes');
        const data = await res.json();
        if (Array.isArray(data) && map.current) {
          data.forEach((quake) => {
            const el = document.createElement('div');
            const size = Math.max(quake.mag * 5, 12); 
            el.className = 'rounded-full bg-red-500/40 border border-red-500 cursor-pointer flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]';
            if (quake.mag >= 4.5) {
              el.classList.add('animate-pulse');
            }
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;

            const inner = document.createElement('div');
            inner.className = 'w-1 h-1 bg-red-500 rounded-full';
            el.appendChild(inner);

            const popupHtml = `
              <div class="p-1">
                <div class="font-bold text-red-600 mb-1">Động đất M${quake.mag.toFixed(1)}</div>
                <div class="text-[11px] text-gray-600 dark:text-gray-300">Độ sâu: ${quake.depth} km</div>
                <div class="text-[10px] text-gray-500 mt-1 mb-1.5">${new Date(quake.time).toLocaleString('vi-VN')}</div>
                ${quake.url ? `<a href="${quake.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block text-[11px] font-medium transition-colors">Xem chi tiết &rarr;</a>` : ''}
              </div>
            `;

            new maplibregl.Marker({ element: el })
              .setLngLat([quake.lng, quake.lat])
              .setPopup(new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '240px' }).setHTML(popupHtml))
              .addTo(map.current!);
          });
        }
      } catch (error) {
        console.error('Failed to load earthquakes overlay:', error);
      }
    };

    const fetchDisasters = async () => {
      try {
        const res = await fetch('/api/disasters');
        const data = await res.json();
        if (Array.isArray(data) && map.current) {
          data.forEach((disaster) => {
            const el = document.createElement('div');
            
            // Màu sắc tùy theo mức độ cảnh báo (Green, Orange, Red)
            let bgColor = 'bg-blue-500/50 border-blue-500';
            let pulseColor = 'bg-blue-500';
            let shadowColor = 'rgba(59,130,246,0.5)';
            const level = (disaster.level || '').toLowerCase();
            
            if (level === 'orange') {
              bgColor = 'bg-orange-500/50 border-orange-500';
              pulseColor = 'bg-orange-500';
              shadowColor = 'rgba(249,115,22,0.5)';
            } else if (level === 'red') {
              bgColor = 'bg-red-600/60 border-red-600';
              pulseColor = 'bg-red-600';
              shadowColor = 'rgba(220,38,38,0.7)';
            }
            
            el.className = `rounded-lg ${bgColor} border-2 cursor-pointer flex items-center justify-center shadow-[0_0_15px_${shadowColor}]`;
            
            // Icon khác nhau theo loại thiên tai
            let iconText = '🌊';
            let typeName = 'Lũ lụt';
            if (disaster.type === 'TC') { iconText = '🌀'; typeName = 'Bão nhiệt đới'; el.classList.add('rounded-full', 'animate-spin-slow'); }
            else if (disaster.type === 'FL') { iconText = '🌊'; typeName = 'Lũ lụt'; }
            else if (disaster.type === 'DR') { iconText = '🔥'; typeName = 'Hạn hán'; }
            else if (disaster.type === 'WF') { iconText = '🔥'; typeName = 'Cháy rừng'; }
            else if (disaster.type === 'VO') { iconText = '🌋'; typeName = 'Núi lửa'; }
            
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.animationDuration = '3s'; // Cho bão xoay chậm

            const inner = document.createElement('div');
            inner.innerHTML = iconText;
            inner.className = 'text-xs';
            el.appendChild(inner);

            // Cảnh báo Đỏ và Cam sẽ nhấp nháy thêm một vòng báo động
            if (level === 'red' || level === 'orange') {
               const ping = document.createElement('div');
               ping.className = `absolute inset-0 rounded-full ${pulseColor} opacity-75 animate-ping`;
               el.appendChild(ping);
            }

            const popupHtml = `
              <div class="p-1">
                <div class="font-bold text-gray-800 flex items-center gap-1 mb-1">
                  <span>${iconText}</span> ${typeName} (${disaster.level})
                </div>
                <div class="text-[12px] text-gray-600 mb-1 leading-snug">${disaster.title}</div>
                <div class="text-[10px] text-gray-500 mt-1 mb-1.5">${new Date(disaster.date).toLocaleString('vi-VN')}</div>
                ${disaster.url ? `<a href="${disaster.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block text-[11px] font-medium transition-colors">Xem chi tiết &rarr;</a>` : ''}
              </div>
            `;

            new maplibregl.Marker({ element: el })
              .setLngLat([disaster.lng, disaster.lat])
              .setPopup(new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '260px' }).setHTML(popupHtml))
              .addTo(map.current!);
          });
        }
      } catch (error) {
        console.error('Failed to load disasters overlay:', error);
      }
    };

    map.current.on('load', async () => {
      // Phải fetch geojson data thủ công để lưu vào bộ nhớ cho việc tính toán Bounding Box
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let geoData: any = null;
      try {
        const res = await fetch('/data/vietnam.geojson');
        geoData = await res.json();
        if (geoData && geoData.features) {
          geojsonFeatures.current = geoData.features;
        }
      } catch (err) {
        console.error("Failed to load map regions data:", err);
      }

      map.current?.addSource('vietnam-provinces', {
        type: 'geojson',
        data: geoData || '/data/vietnam.geojson'
      });

      map.current?.addLayer({
        id: 'provinces-line',
        type: 'line',
        source: 'vietnam-provinces',
        paint: {
          'line-color': '#4f4f4f',
          'line-width': 1,
          'line-opacity': 0.5
        }
      });

      map.current?.addLayer({
        id: 'provinces-fill',
        type: 'fill',
        source: 'vietnam-provinces',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0.15
        }
      });

      map.current?.addLayer({
        id: 'provinces-highlight',
        type: 'fill',
        source: 'vietnam-provinces',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.3,
            0
          ]
        }
      });

      let hoveredStateId: string | number | null = null;

      map.current?.on('mousemove', 'provinces-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.current?.setFeatureState(
              { source: 'vietnam-provinces', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id || e.features[0].properties.Ten;
          if (hoveredStateId) {
            map.current?.setFeatureState(
              { source: 'vietnam-provinces', id: hoveredStateId },
              { hover: true }
            );
          }
        }
      });

      map.current?.on('mouseleave', 'provinces-fill', () => {
        if (hoveredStateId !== null) {
          map.current?.setFeatureState(
            { source: 'vietnam-provinces', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
      });

      map.current?.on('click', 'provinces-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const provinceName = e.features[0].properties.Ten;
          if (provinceName) {
            const cleanName = provinceName.replace(/^(Tỉnh|Thành phố)\s+/, '');
            setSelectedRegion(cleanName);
          }
        }
      });

      map.current?.on('mouseenter', 'provinces-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current?.on('mouseleave', 'provinces-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      
      fetchEarthquakes();
      fetchDisasters();
    });

    const handleResize = () => {
      map.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.current?.remove();
      map.current = null;
    };
  }, [lng, lat, zoom, setSelectedRegion]);

  // Effect để Zoom mượt tới Tỉnh/Thành đang chọn
  useEffect(() => {
    if (!map.current || geojsonFeatures.current.length === 0) return;

    if (!selectedRegion) {
      // Zoom out về toàn cảnh khu vực
      map.current.fitBounds([95.0, 4.0, 120.0, 26.0], { padding: 40, duration: 1500 });
      return;
    }

    const feature = geojsonFeatures.current.find(f => 
      f.properties.Ten && f.properties.Ten.replace(/^(Tỉnh|Thành phố)\s+/, '') === selectedRegion
    );

    if (feature && feature.geometry) {
      const bbox = getBbox(feature.geometry);
      // Thực hiện Smooth Zoom sử dụng fitBounds với duration 1.5s
      map.current.fitBounds(bbox, { padding: 80, duration: 1500, maxZoom: 9 });
    }
  }, [selectedRegion]);

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
