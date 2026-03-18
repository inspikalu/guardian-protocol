'use client';

import { useState, useEffect } from "react";
import { useAnchorProgram } from "@/hooks/use-anchor-program";
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
  Lightning, 
  ShieldWarning, 
  ShieldCheck, 
  ArrowsCounterClockwise, 
  Warning, 
  ArrowClockwise, 
  Power,
  Pulse,
  Waveform,
  CheckCircle,
  XCircle,
  Info,
  PencilSimple
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCircuits } from "@/hooks/use-circuits";
import { cn, decodeString } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CircuitsPage() {
  const { circuitsProgram } = useAnchorProgram();
  const { forceOpen, resetCircuit, updateLabel } = useCircuits();
  const [circuits, setCircuits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ pubkey: string; label: string } | null>(null);
  const [newLabel, setNewLabel] = useState("");

  async function fetchCircuits() {
    if (!circuitsProgram) return;
    try {
      setLoading(true);
      // Filter for the new account size (178 bytes) to avoid deserialization errors from old accounts
      const allCircuits = await (circuitsProgram as any).account.circuit.all([
        {
          dataSize: 178, 
        },
      ]);
      setCircuits(allCircuits);
    } catch (error) {
      console.error("Failed to fetch circuits:", error);
      toast.error("Failed to load circuits from blockchain");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCircuits();
  }, [circuitsProgram]);

  const handleForceOpen = async (publicKey: string) => {
    try {
      setIsActionLoading(publicKey);
      await forceOpen(publicKey);
      await fetchCircuits();
    } catch (error) {
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleReset = async (publicKey: string) => {
    try {
      setIsActionLoading(publicKey);
      await resetCircuit(publicKey);
      await fetchCircuits();
    } catch (error) {
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel) return;
    try {
      setIsActionLoading(editingLabel.pubkey);
      await updateLabel(editingLabel.pubkey, newLabel);
      setEditingLabel(null);
      await fetchCircuits();
    } catch (error) {
    } finally {
      setIsActionLoading(null);
    }
  };

  const getStatusBadge = (state: any) => {
    const stateKey = Object.keys(state)[0];
    switch (stateKey) {
      case "closed":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Operational</span>
          </div>
        );
      case "open":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             <span className="text-[10px] font-black uppercase tracking-widest">Tripped</span>
          </div>
        );
      case "halfOpen":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg">
             <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" />
             <span className="text-[10px] font-black uppercase tracking-widest">Testing</span>
          </div>
        );
      default:
        return <Badge variant="secondary">{stateKey}</Badge>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1.5 bg-primary/10 rounded-lg">
                <Lightning size={20} weight="bold" className="text-primary" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Reactive Defense</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase italic tracking-tighter">Circuit Breakers</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md font-medium leading-relaxed">
            Real-time health monitoring and automated failover for protocol resources.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={fetchCircuits} variant="outline" className="flex-1 md:flex-none rounded-xl h-11 px-6 border-2 active:scale-95 transition-all">
            <ArrowsCounterClockwise size={18} weight="bold" className={`${loading ? 'animate-spin' : ''} mr-2`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
             [1, 2, 3].map((i) => (
                <Card key={i} className="rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden animate-pulse">
                  <div className="h-48 bg-secondary/50" />
                  <div className="p-6 space-y-4">
                     <div className="h-4 w-1/2 bg-secondary/50 rounded" />
                     <div className="h-8 w-full bg-secondary/50 rounded" />
                  </div>
                </Card>
             ))
        ) : circuits.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card border-border/50 border rounded-[2.5rem] shadow-sm">
             <div className="h-20 w-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
                <ShieldCheck size={40} weight="duotone" className="text-muted-foreground" />
             </div>
             <h3 className="font-extrabold text-xl">No Active Monitors</h3>
             <p className="text-muted-foreground text-sm mt-2">The sentinel network is waiting for deployment.</p>
          </div>
        ) : (
          circuits.map((circuit) => (
            <Card key={circuit.publicKey.toString()} className="rounded-[2.5rem] border-border/50 shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-card">
              <CardHeader className="pb-4 relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Protected Resource</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const name = decodeString(circuit.account.name);
                          const label = decodeString(circuit.account.label) || name;
                          setEditingLabel({ pubkey: circuit.publicKey.toString(), label });
                          setNewLabel(label);
                        }}
                      >
                        <PencilSimple size={16} weight="bold" className="text-muted-foreground" />
                      </Button>
                    </div>
                    <CardTitle className="text-2xl font-black italic tracking-tighter uppercase truncate pr-4" title={decodeString(circuit.account.label) || decodeString(circuit.account.name)}>
                        {decodeString(circuit.account.label) || decodeString(circuit.account.name)}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-mono font-medium opacity-50 truncate max-w-[180px]">
                      {circuit.publicKey.toString()}
                    </CardDescription>
                  </div>
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner flex-shrink-0",
                    Object.keys(circuit.account.state)[0] === 'closed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  )}>
                    <Pulse size={24} weight="bold" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="p-4 bg-secondary/30 rounded-[1.5rem] border border-border/20 mb-6">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current State</span>
                      {getStatusBadge(circuit.account.state)}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-secondary/10 border border-border/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                         <XCircle size={12} weight="fill" className="text-rose-500" /> Failures
                      </p>
                      <div className="flex items-end gap-1">
                         <p className="text-2xl font-black leading-none">{circuit.account.consecutiveFailures}</p>
                         <p className="text-[10px] font-bold text-muted-foreground pb-0.5">/ {circuit.account.failureThreshold}</p>
                      </div>
                      <div className="mt-3 h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                         <div 
                            className="h-full bg-rose-500 transition-all duration-500" 
                            style={{ width: `${(circuit.account.consecutiveFailures / circuit.account.failureThreshold) * 100}%` }} 
                         />
                      </div>
                   </div>

                   <div className="p-4 rounded-2xl bg-secondary/10 border border-border/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                         <CheckCircle size={12} weight="fill" className="text-emerald-500" /> Successes
                      </p>
                      <div className="flex items-end gap-1">
                         <p className="text-2xl font-black leading-none">{circuit.account.consecutiveSuccesses}</p>
                         <p className="text-[10px] font-bold text-muted-foreground pb-0.5">/ {circuit.account.successThreshold}</p>
                      </div>
                      <div className="mt-3 h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                         <div 
                            className="h-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${(circuit.account.consecutiveSuccesses / circuit.account.successThreshold) * 100}%` }} 
                         />
                      </div>
                   </div>
                </div>

                <div className="mt-6 flex items-center justify-between px-2">
                   <div className="flex items-center gap-2">
                      <Warning size={14} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Disruptions</span>
                   </div>
                   <span className="text-sm font-black">{circuit.account.lifetimeFailures.toString()}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 pb-6 px-6 gap-3">
                 <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-10 font-bold text-[10px] uppercase tracking-widest border-2 hover:bg-secondary active:scale-95 transition-all" 
                    onClick={() => handleReset(circuit.publicKey.toString())}
                    disabled={isActionLoading === circuit.publicKey.toString()}
                 >
                   <ArrowClockwise size={14} weight="bold" className="mr-2" />
                   Reset
                 </Button>
                 <Button 
                    variant="destructive" 
                    className="flex-1 rounded-xl h-10 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                    onClick={() => handleForceOpen(circuit.publicKey.toString())}
                    disabled={isActionLoading === circuit.publicKey.toString() || Object.keys(circuit.account.state)[0] !== 'closed'}
                 >
                   <Power size={14} weight="bold" className="mr-2" />
                   Trip
                 </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!editingLabel} onOpenChange={(open) => !open && setEditingLabel(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Update Label</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Provide a human-readable name for this circuit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                New Label
              </Label>
              <Input
                id="label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="col-span-3 rounded-xl border-2 focus-visible:ring-primary h-12 font-bold"
                placeholder="e.g. Primary RPC Sentinel"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleUpdateLabel} 
              className="w-full rounded-xl h-12 font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              disabled={isActionLoading === editingLabel?.pubkey}
            >
              {isActionLoading === editingLabel?.pubkey ? (
                <ArrowClockwise size={20} weight="bold" className="animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
