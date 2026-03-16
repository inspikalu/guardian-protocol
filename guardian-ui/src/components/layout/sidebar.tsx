'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Shield, 
  Lightning, 
  LockKey, 
  Flask, 
  House,
  ArrowSquareOut
} from "@phosphor-icons/react";

const routes = [
  {
    label: "RBAC Portal",
    icon: Shield,
    href: "/rbac",
  },
  {
    label: "Circuit Breakers",
    icon: Lightning,
    href: "/circuits",
  },
  {
    label: "Lock Manager",
    icon: LockKey,
    href: "/locks",
  },
  {
    label: "System Lab",
    icon: Flask,
    href: "/lab",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-colors duration-300">
      <div className="px-6 py-8 flex flex-col h-full">
        <Link href="/rbac" className="flex items-center gap-3 mb-12 px-2">
          <div className="p-2 bg-primary rounded-xl">
             <Shield weight="fill" className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Guardian
          </span>
        </Link>
        <div className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "group flex items-center gap-x-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200",
                pathname === route.href 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <route.icon 
                weight={pathname === route.href ? "bold" : "regular"} 
                className="h-5 w-5" 
              />
              {route.label}
            </Link>
          ))}
        </div>
        
        <div className="mt-auto px-2">
          <div className="p-4 bg-secondary rounded-2xl border border-border/50">
             <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3">Network</p>
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">Solana Devnet</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
