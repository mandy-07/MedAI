import { Search, Moon, Sun, Info, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export function TopNav() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-3 px-5 lg:px-8 h-16">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients, reports, predictions..."
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-secondary/60 border border-transparent focus:bg-card focus:border-primary/40 focus:ring-2 focus:ring-primary/15 outline-none text-sm transition-all"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Backend Status */}
          <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-success-soft border border-success/20">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11.5px] font-medium text-success">
              API · DB · Model Connected
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDark((v) => !v)}
            className="size-9 grid place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? (
              <Sun className="size-[17px]" />
            ) : (
              <Moon className="size-[17px]" />
            )}
          </button>

          {/* Notifications */}
          <button className="size-9 grid place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="size-[17px]" />
          </button>

          {/* About */}
          <button className="size-9 grid place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Info className="size-[17px]" />
          </button>

          {/* MedAI Branding */}
          <div className="ml-2 pl-3 border-l border-border">
            <div className="text-sm font-semibold text-foreground">
              MedAI
            </div>
            <div className="text-[11px] text-muted-foreground">
              AI Chest X-ray Analysis
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}