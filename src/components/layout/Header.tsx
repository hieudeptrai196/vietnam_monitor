"use client";

import Link from "next/link"
import Image from "next/image"
import { Menu, Map, ShieldAlert, User } from "lucide-react"
import { RegionSearch } from "./RegionSearch"
import { usePanelStore } from "@/stores/panel-store"

export function Header() {
  const { activeMapView, setActiveMapView } = usePanelStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="w-full mx-auto flex h-14 items-center px-4 md:px-6">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <Image src="/icon.png" alt="Logo" width={24} height={24} className="rounded-full overflow-hidden" />
              Vietnam Monitor
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Map View Toggle Button */}
            <div className="hidden md:flex bg-muted/50 rounded-lg p-1 gap-1 border">
              <button
                onClick={() => setActiveMapView('default')}
                title="Bản đồ Tổng hợp"
                className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${activeMapView === 'default' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <Map size={16} />
              </button>
              <button
                onClick={() => setActiveMapView('disaster')}
                title="Cảnh báo Thiên tai"
                className={`relative p-1.5 rounded-md flex items-center justify-center transition-colors ${activeMapView === 'disaster' ? 'bg-red-600 text-white shadow' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <ShieldAlert size={16} />
                {activeMapView === 'disaster' ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                ) : (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"></span>
                )}
              </button>
            </div>

            <RegionSearch />

            {/* Author Link */}
            <a 
              href="https://hieunt-vogue.online/" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Thông tin Tác giả"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors border px-3 py-1.5 rounded-md hover:bg-muted"
            >
              <User size={16} />
              <span>Tác giả</span>
            </a>

            <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-transparent hover:bg-muted md:hidden transition-colors">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
