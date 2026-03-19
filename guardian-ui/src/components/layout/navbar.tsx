'use client';

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ModeToggle } from "@/components/mode-toggle";
import { List, X } from "@phosphor-icons/react";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { useRpcEndpoint } from "@/components/providers/solana-provider";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { rpcOption, setRpcOption, heliusAvailable } = useRpcEndpoint();

  return (
    <div className="flex h-20 items-center px-4 md:px-8 bg-background border-b border-border/50 transition-colors duration-300 relative">
      {/* Mobile Menu Trigger */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden mr-2" 
        onClick={() => setIsOpen(true)}
      >
        <List size={22} weight="bold" />
      </Button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border p-0 animate-in slide-in-from-left duration-300">
            <div className="flex justify-end p-4">
               <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X size={20} weight="bold" />
               </Button>
            </div>
            <div className="h-full -mt-12 overflow-y-auto" onClick={() => setIsOpen(false)}>
               <Sidebar />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center">
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-foreground">Account Overview</h2>
          <p className="text-xs text-muted-foreground font-medium tracking-wide">Guardian Protocol v1.0</p>
        </div>
      </div>

      <div className="flex items-center gap-x-4">
        <div className="hidden md:flex items-center gap-1 rounded-xl border border-border/60 bg-secondary/30 p-1">
          <Button
            size="sm"
            variant={rpcOption === "devnet" ? "default" : "ghost"}
            onClick={() => setRpcOption("devnet")}
            className="h-8 px-3 text-[10px] font-bold uppercase tracking-wide"
          >
            Devnet
          </Button>
          <Button
            size="sm"
            variant={rpcOption === "helius" ? "default" : "ghost"}
            onClick={() => setRpcOption("helius")}
            disabled={!heliusAvailable}
            className="h-8 px-3 text-[10px] font-bold uppercase tracking-wide"
          >
            Helius
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
        
        <div className="h-8 w-px bg-border/50 mx-2" />
        
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">Admin Authority</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase tracking-tighter">Security Manager</p>
           </div>
           <WalletMultiButton className="!bg-primary !text-primary-foreground !rounded-xl !h-10 !px-4 !text-sm !font-bold hover:!opacity-90 !transition-all" />
        </div>
      </div>
    </div>
  );
}
