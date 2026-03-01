import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PanelConfig = {
  id: string
  name: string
  enabled: boolean
  priority: number
}

interface PanelState {
  panels: Record<string, PanelConfig>
  selectedRegion: string | null
  activeMapView: 'default' | 'disaster'
  togglePanel: (id: string) => void
  setPanelOrder: (ids: string[]) => void
  setSelectedRegion: (region: string | null) => void
  setActiveMapView: (view: 'default' | 'disaster') => void
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      selectedRegion: null,
      activeMapView: 'default',
      panels: {
        'live-news': { id: 'live-news', name: 'Tin nổi bật', enabled: true, priority: 1 },
        'trending': { id: 'trending', name: 'Từ khóa thịnh hành', enabled: true, priority: 2 },
        'ai-insights': { id: 'ai-insights', name: 'AI Insights', enabled: true, priority: 3 },
        'crypto': { id: 'crypto', name: 'Thị trường Crypto', enabled: false, priority: 5 },
        'exchange-rate': { id: 'exchange-rate', name: 'Tỷ giá ngoại tệ', enabled: false, priority: 6 },
        'gold': { id: 'gold', name: 'Giá vàng SJC', enabled: false, priority: 7 },
        'stock': { id: 'stock', name: 'Chứng khoán VN', enabled: false, priority: 8 },
        'weather': { id: 'weather', name: 'Thời tiết', enabled: false, priority: 9 },
      },
      togglePanel: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: {
              ...state.panels[id],
              enabled: !state.panels[id]?.enabled,
            },
          },
        })),
      setPanelOrder: () =>
        set((state) => {
          // Future implementation for drag and drop
          return state;
        }),
      setSelectedRegion: (region) => set({ selectedRegion: region }),
      setActiveMapView: (view) => set({ activeMapView: view }),
    }),
    {
      name: 'vm-panels-v10', // Đổi tên để flush cache cũ ở trình duyệt ra
    }
  )
)
