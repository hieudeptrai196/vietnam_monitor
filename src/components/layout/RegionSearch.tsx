"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { usePanelStore } from '@/stores/panel-store';

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bình Dương", "Bình Phước", "Bình Thuận", "Bình Định", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Cao Bằng", "Cà Mau", "Cần Thơ", "Gia Lai", "Hoà Bình", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hưng Yên", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hồ Chí Minh", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Long An", "Lào Cai", "Lâm Đồng", "Lạng Sơn", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Thanh Hóa", "Thái Bình", "Thái Nguyên", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Tây Ninh", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái", "Điện Biên", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Đồng Nai", "Đồng Tháp"
];

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function RegionSearch() {
  const selectedRegion = usePanelStore(state => state.selectedRegion);
  const setSelectedRegion = usePanelStore(state => state.setSelectedRegion);

  const [query, setQuery] = useState(selectedRegion || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [prevRegion, setPrevRegion] = useState(selectedRegion);

  // Sync ô search khi user click trực tiếp trên MAP theo React recommended pattern (Derived State)
  if (selectedRegion !== prevRegion) {
    setPrevRegion(selectedRegion);
    setQuery(selectedRegion || '');
  }

  // Tắt dropdown nếu user click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProvinces = PROVINCES.filter(p => 
    removeAccents(p).includes(removeAccents(query))
  );

  const handleSelect = (province: string) => {
    setQuery(province);
    setSelectedRegion(province);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const match = PROVINCES.find(p => p.toLowerCase() === query.trim().toLowerCase() || removeAccents(p) === removeAccents(query.trim()));
      
      if (match) {
        handleSelect(match);
      } else {
        // Nếu tỉnh thành nhập chưa đúng, có thể chọn clear
        setQuery('');
        setSelectedRegion(null); // Optional: Xóa region đang chọn và show tin chung
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full md:w-64 max-w-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
        <input 
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm tỉnh/thành phố VN..."
          className="w-full h-9 pl-9 pr-3 text-sm rounded-md border bg-muted/50 focus:bg-background focus:ring-1 focus:ring-ring focus:outline-none transition-all shadow-sm"
        />
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border shadow-md rounded-md overflow-hidden z-60 max-h-60 overflow-y-auto">
          {filteredProvinces.length > 0 ? (
            <div className="p-1">
              {filteredProvinces.map(p => (
                <button
                  key={p}
                  onClick={() => handleSelect(p)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Sai tên tỉnh/thành.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
