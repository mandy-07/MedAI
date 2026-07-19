import { Bell, Search, Moon, Sun, Loader2, Info, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchHealth, fetchHistory } from "@/lib/api";

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "info" | "success";
}

export function TopNav() {
  const [dark, setDark] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Sync the top nav search bar value if there's a q parameter in the URL on mount
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      setSearchVal(query);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    window.dispatchEvent(new CustomEvent("medai-search", { detail: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.location.pathname !== "/history") {
      window.location.href = `/history?q=${encodeURIComponent(searchVal)}`;
    }
  };

  // Load real logs from prediction history as notifications
  const loadNotifications = async () => {
    const defaultSysLog: NotificationItem = {
      id: "sys-1",
      title: "Model Loaded Successfully",
      desc: "EfficientNet-B0 classifier initialized on CPU host.",
      time: "Startup",
      read: true,
      type: "info",
    };

    try {
      const history = await fetchHistory(5);
      const logs: NotificationItem[] = history.map((item) => ({
        id: item._id,
        title: `Analysis: ${item.prediction.diagnosis}`,
        desc: `Patient ${item.patient.patient_name} processed successfully (${item.prediction.confidence.toFixed(1)}% confidence).`,
        time: new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
        type: "success",
      }));
      setNotifications([defaultSysLog, ...logs]);
    } catch {
      setNotifications([defaultSysLog]);
    }
  };

  useEffect(() => {
    if (online) {
      loadNotifications();
    } else {
      setNotifications([
        {
          id: "sys-offline",
          title: "System Offline",
          desc: "Backend server is currently unreachable. Connect locally to sync predictions.",
          time: "Now",
          read: false,
          type: "info",
        }
      ]);
    }
  }, [online]);

  useEffect(() => {
    const saved = localStorage.getItem("medai_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const h = await fetchHealth();
        setOnline(h.status === "healthy");
      } catch {
        setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".notifications-menu-container")) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showNotifications]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("medai_theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger />
      <form onSubmit={handleSubmit} className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patients, reports, diseases..."
          className="pl-9 bg-muted/40 border-transparent focus-visible:bg-background"
          value={searchVal}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        {online === null ? (
          <Badge variant="outline" className="hidden gap-1.5 text-muted-foreground sm:flex">
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting Backend
          </Badge>
        ) : online ? (
          <Badge variant="outline" className="hidden gap-1.5 border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)] sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--success)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--success)]" />
            </span>
            Backend Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="hidden gap-1.5 border-destructive/30 bg-destructive/10 text-destructive sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            Backend Offline
          </Badge>
        )}

        <div className="relative notifications-menu-container">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (online) loadNotifications();
            }}
          >
            <Bell className="h-4 w-4" />
            {notifications.some((n) => !n.read) && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border bg-popover text-popover-foreground p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in-50 slide-in-from-top-1 duration-150 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                {notifications.some((n) => !n.read) && (
                  <button 
                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))} 
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto py-1 divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`flex gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition text-left relative ${
                        !n.read ? "bg-muted/20" : ""
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" />
                        ) : (
                          <Info className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-xs text-foreground truncate">{n.title}</span>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-0.5">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{n.desc}</p>
                      </div>
                      {!n.read && (
                        <span className="absolute left-1.5 top-4 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Avatar className="h-9 w-9 ring-2 ring-primary/20">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
            MP
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

