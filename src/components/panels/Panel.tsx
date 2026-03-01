import { ReactNode, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface PanelProps {
  id: string;
  title: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

export function Panel({ id, title, children, headerAction }: PanelProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const panelContent = (
    <>
      <div className="flex items-center justify-between p-2 lg:p-3 border-b border-border/50 bg-background/80 backdrop-blur z-10 sticky top-0 group">
        <h3 className="font-semibold text-sm truncate pr-2">{title}</h3>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {headerAction}
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            title={isMaximized ? "Thu nhỏ" : "Phóng to"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {children}
      </div>
    </>
  );

  // Trạng thái thu nhỏ bình thường (trên grid)
  if (!isMaximized) {
    return (
      <div id={id} className="flex flex-col h-full bg-background/50 backdrop-blur border border-border/50 rounded-lg overflow-hidden shadow-sm transition-all">
        {panelContent}
      </div>
    );
  }

  // Trạng thái phóng to (Modal overlay)
  return (
    <>
      {/* 
        Vẫn giữ placeholder của element gốc trong grid để layout grid ko bị vỡ 
        khi component bị nhấc ra ngoài fixed layer
      */}
      <div className="flex flex-col h-full border border-dashed border-border/50 rounded-lg opacity-50 bg-muted/20" />
      
      {/* Fixed Overlay cho Maximize */}
      <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="container mx-auto max-w-7xl h-full p-4 md:p-6 lg:p-8">
          <div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {panelContent}
          </div>
        </div>
      </div>
    </>
  );
}
