import Link from "next/link"
import { Globe, Menu, Settings } from "lucide-react"
import { RegionSearch } from "./RegionSearch"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <Globe className="h-5 w-5 text-primary" />
              Vietnam Monitor
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <RegionSearch />
            {/* <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-transparent hover:bg-muted transition-colors">
              <Settings className="h-4 w-4" />
            </button> */}
            <button  className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-transparent hover:bg-muted md:hidden transition-colors">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
