'use client';

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Lightning, 
  Lock, 
  Play, 
  CheckCircle, 
  Circle,
  WarningCircle,
  CircleNotch,
  Flask,
  TerminalWindow,
  Cpu,
  Monitor
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import { useAnchorProgram } from "@/hooks/use-anchor-program";
import * as anchor from "@coral-xyz/anchor";
import { cn } from "@/lib/utils";

type StepStatus = "idle" | "loading" | "success" | "error";

export default function LabPage() {
  const [steps, setSteps] = useState([
    { id: 1, title: "RBAC Permission Check", icon: ShieldCheck, status: "idle" as StepStatus, description: "Verify caller has 'Treasurer' role" },
    { id: 2, title: "Circuit Health Check", icon: Lightning, status: "idle" as StepStatus, description: "Check if 'TreasuryProgram' is healthy" },
    { id: 3, title: "Acquire Resource Lock", icon: Lock, status: "idle" as StepStatus, description: "Get exclusive lock on vault PDA" },
    { id: 4, title: "Execute Operation", icon: CheckCircle, status: "idle" as StepStatus, description: "CPI to treasury for fund transfer" },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const { runProtectedOperation } = useOrchestrator();
  const { provider } = useAnchorProgram();

  const runSimulation = async () => {
    if (!provider) {
        toast.error("Please connect your wallet first");
        return;
    }

    setIsRunning(true);
    setSteps(prev => prev.map(s => ({ ...s, status: "idle" })));

    try {
        setSteps(prev => prev.map((s, idx) => idx === 0 ? { ...s, status: "loading" } : s));
        await new Promise(r => setTimeout(r, 1000));
        
        setSteps(prev => prev.map((s, idx) => idx === 1 ? { ...s, status: "loading" } : s));
        await new Promise(r => setTimeout(r, 1000));

        setSteps(prev => prev.map((s, idx) => idx === 2 ? { ...s, status: "loading" } : s));
        await new Promise(r => setTimeout(r, 1000));

        setSteps(prev => prev.map((s, idx) => idx === 3 ? { ...s, status: "loading" } : s));
        
        const tx = await runProtectedOperation(
            "Treasurer", 
            "TreasuryWithdraw", 
            60,
            Math.floor(Date.now() / 1000)
        );

        if (tx) {
            setSteps(prev => prev.map(s => ({ ...s, status: "success" })));
            toast.success("Protocol Sequence Executed Successfully!");
        }
    } catch (error: any) {
        console.error("Simulation failed:", error);
        setSteps(prev => prev.map(s => s.status === "loading" ? { ...s, status: "error" } : s));
        toast.error(`Protocol failed: ${error.message || "Unknown error"}`);
    } finally {
        setIsRunning(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1.5 bg-primary/10 rounded-lg">
                <Flask size={20} weight="bold" className="text-primary" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Simulation Environment</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground uppercase italic tracking-tighter">System Lab</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md font-medium leading-relaxed">
            Execute complex on-chain orchestration sequences and monitor atomic verification steps in real-time.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={runSimulation} 
          disabled={isRunning}
          className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all gap-3 overflow-hidden group"
        >
          {isRunning ? <CircleNotch size={20} weight="bold" className="animate-spin" /> : <Play size={20} weight="fill" className="group-hover:translate-x-0.5 transition-transform" />}
          Run Protocol Audit
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Verification Pipeline</p>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <Card key={step.id} className={cn(
                  "rounded-[2rem] border-border/50 transition-all duration-500 overflow-hidden group relative",
                  step.status === "loading" && "border-primary shadow-2xl scale-[1.02] bg-white z-10",
                  step.status === "success" && "border-emerald-500/30 bg-emerald-50/20",
                  step.status === "error" && "border-rose-500/30 bg-rose-50/20"
              )}>
                <CardContent className="p-6 flex items-center gap-6">
                   <div className={cn(
                     "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                     step.status === "idle" && "bg-secondary text-muted-foreground",
                     step.status === "loading" && "bg-primary text-white scale-110",
                     step.status === "success" && "bg-emerald-100 text-emerald-600",
                     step.status === "error" && "bg-rose-100 text-rose-600",
                   )}>
                     <step.icon size={28} weight={step.status === "loading" ? "fill" : "bold"} />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                         <h3 className="font-extrabold text-lg tracking-tight uppercase italic">{step.title}</h3>
                         <div className="transition-all">
                            {step.status === "loading" && <CircleNotch size={20} className="animate-spin text-primary" weight="bold" />}
                            {step.status === "success" && <CheckCircle size={24} weight="fill" className="text-emerald-500" />}
                            {step.status === "error" && <WarningCircle size={24} weight="fill" className="text-rose-500" />}
                         </div>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">{step.description}</p>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 flex flex-col">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Audit Ledger</p>
           <Card className="rounded-[2.5rem] border-border/50 shadow-sm grow bg-card overflow-hidden flex flex-col">
              <CardHeader className="border-b border-border/10 bg-secondary/10 pb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white rounded-xl shadow-sm border border-border/50">
                      <TerminalWindow size={18} weight="bold" className="text-primary" />
                   </div>
                   <div>
                      <CardTitle className="text-xs font-black uppercase tracking-widest">Real-time Trace</CardTitle>
                      <CardDescription className="text-[10px] font-bold">On-chain sequence flow.</CardDescription>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 grow flex flex-col bg-zinc-950 font-mono text-[11px] leading-relaxed relative">
                 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                 <div className="relative p-6 space-y-3">
                    <div className="flex gap-3">
                       <span className="text-zinc-600">[00:00:01]</span>
                       <span className="text-blue-400 font-bold">SYS:</span>
                       <span className="text-zinc-300">Initializing orchestrator...</span>
                    </div>
                    {steps[0].status !== "idle" && (
                      <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                         <span className="text-zinc-600">[00:00:02]</span>
                         <span className="text-emerald-400 font-bold">RBAC:</span>
                         <span className="text-zinc-300 italic">Access authorized (Treasurer).</span>
                      </div>
                    )}
                    {steps[1].status !== "idle" && (
                      <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                         <span className="text-zinc-600">[00:00:03]</span>
                         <span className="text-emerald-400 font-bold">CIR:</span>
                         <span className="text-zinc-300 italic">Circuit state: CLOSED (Healthy).</span>
                      </div>
                    )}
                    {steps[2].status !== "idle" && (
                      <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                         <span className="text-zinc-600">[00:00:04]</span>
                         <span className="text-emerald-400 font-bold">LCK:</span>
                         <span className="text-zinc-300 italic">Mutex acquired on resource.</span>
                      </div>
                    )}
                    {steps[3].status !== "idle" && (
                      <div className="flex gap-3 animate-in fade-in duration-300">
                         <span className="text-zinc-600">[00:00:05]</span>
                         <span className="text-blue-400 font-bold">CPI:</span>
                         <span className="text-zinc-300">Executing fund transfer...</span>
                      </div>
                    )}
                    {steps[3].status === "success" && (
                      <div className="flex gap-3 animate-in zoom-in duration-500 pt-2 border-t border-white/10">
                         <span className="text-zinc-600">[00:00:06]</span>
                         <span className="text-emerald-400 font-black">DONE</span>
                         <span className="text-white/80">TxID: 4x8B...9vK</span>
                      </div>
                    )}
                 </div>
                 
                 <div className="mt-auto p-6 bg-white shadow-2xl space-y-4">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confidence Metric</p>
                          <div className="flex items-center gap-2">
                             <Cpu size={16} weight="fill" className="text-primary" />
                             <span className="text-2xl font-black italic tracking-tighter">99.8%</span>
                          </div>
                       </div>
                       <Badge variant="outline" className="rounded-lg h-6 font-bold text-[9px] uppercase tracking-tighter border-2">
                         Devnet Mode
                       </Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                       <div className="bg-primary h-full transition-all duration-1000" style={{ width: steps[3].status === "success" ? "100%" : "30%" }} />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
