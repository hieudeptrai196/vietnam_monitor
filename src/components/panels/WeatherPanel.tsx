"use client";

import { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Wind, Droplets, RefreshCw } from 'lucide-react';
import { Panel } from './Panel';

interface WeatherData {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  weather_code: number;
}

export function WeatherPanel() {
  const [data, setData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/weather');
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // 30 mins
    return () => clearInterval(interval);
  }, []);

  const headerAction = (
    <button 
      onClick={fetchWeather}
      disabled={loading}
      className={`p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors ${loading ? 'opacity-50' : ''}`}
      title="Cập nhật thời tiết"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun className="w-5 h-5 text-yellow-500" />;
    if (code <= 3) return <Cloud className="w-5 h-5 text-gray-400" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code >= 95 && code <= 99) return <CloudLightning className="w-5 h-5 text-purple-500" />;
    return <Cloud className="w-5 h-5 text-gray-400" />;
  };

  const getWeatherText = (code: number) => {
    if (code === 0) return 'Trời quang';
    if (code === 1 || code === 2) return 'Ít mây';
    if (code === 3) return 'Nhiều mây';
    if (code >= 51 && code <= 67) return 'CÓ MƯA NHỎ';
    if (code >= 80 && code <= 82) return 'Mưa rào';
    if (code >= 95) return 'MƯA DÔNG';
    return 'Nhiều mây';
  };

  return (
    <Panel id="weather" title="Thời tiết" headerAction={headerAction}>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && data.length === 0 ? (
          <div className="p-2 space-y-3">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="animate-pulse bg-muted rounded-md h-18 w-full" />
             ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((city) => (
              <div key={city.id} className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm mb-1">{city.name}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1" title="Độ ẩm">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      {city.humidity}%
                    </span>
                    <span className="flex items-center gap-1" title="Gió">
                      <Wind className="w-3 h-3 text-gray-400" />
                      {city.wind_speed} km/h
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-lg">{Math.round(city.temperature)}°C</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{getWeatherText(city.weather_code)}</span>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-full">
                    {getWeatherIcon(city.weather_code)}
                  </div>
                </div>
              </div>
            ))}
            <div className="px-2 pt-1 text-center text-[10px] text-muted-foreground">
              Dữ liệu từ Open-Meteo
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
