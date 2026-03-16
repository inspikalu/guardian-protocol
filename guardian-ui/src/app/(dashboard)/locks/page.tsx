'use client';

import { useState, useEffect } from "react";
import { useAnchorProgram } from "@/hooks/use-anchor-program";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  LockOpen, 
  Clock, 
  ArrowsCounterClockwise, 
  PlusCircle,
  Key,
  Shield,
  Timer,
  IdentificationBadge,
  Monitor,
  BoundingBox
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useLocks } from "@/hooks/use-locks";

export default function LocksPage() {
  const { locksProgram } = useAnchorProgram();
  const { forceUnlock } = useLocks();
  const [locks, setLocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  async function fetchLocks() {
    if (!locksProgram) return;
    try {
      setLoading(true);
      const allLocks = await (locksProgram as any).account.distributedLock.all();
      setLocks(allLocks);
    } catch (error) {
      console.error("Failed to fetch locks:", error);
      toast.error("Failed to load locks from blockchain");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLocks();
  }, [locksProgram]);

  // Real-time updates via WebSockets
  useEffect(() => {
    if (!locksProgram || !locksProgram.provider.connection) return;

    const connection = locksProgram.provider.connection;
    const programId = locksProgram.programId;

    // Listen for any account changes in this program
    const subscriptionId = connection.onProgramAccountChange(
      programId,
      (updatedAccountInfo) => {
        // When any lock changes, we trigger a re-fetch
        // In a more complex app, we could update the specific lock in state
        fetchLocks();
      },
      'confirmed'
    );

    return () => {
      connection.removeProgramAccountChangeListener(subscriptionId);
    };
  }, [locksProgram]);

  const handleForceUnlock = async (publicKey: string) => {
    try {
      setIsActionLoading(publicKey);
      await forceUnlock(publicKey);
      await fetchLocks();
    } catch (error) {
    } finally {
      setIsActionLoading(null);
    }
  };

  const getLockStateBadge = (state: any) => {
    const stateKey = Object.keys(state)[0];
    switch (stateKey) {
      case "available":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Available</span>
          </div>
        );
      case "locked":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-lg shadow-sm shadow-primary/20">
             <Lock size={10} weight="fill" />
             <span className="text-[10px] font-black uppercase tracking-widest">Occupied</span>
          </div>
        );
      case "expired":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
             <span className="text-[10px] font-black uppercase tracking-widest">Expired</span>
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
                <Shield size={20} weight="bold" className="text-primary" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Concurrency Control</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase italic tracking-tighter">Lock Manager</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md font-medium leading-relaxed">
            Manage distributed exclusion locks for high-value on-chain resources.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={fetchLocks} className="flex-1 md:flex-none rounded-xl h-11 px-6 border-2 hover:bg-secondary active:scale-95 transition-all">
              <ArrowsCounterClockwise size={18} weight="bold" className={`${loading ? 'animate-spin' : ''} mr-2`} />
              Refresh
            </Button>
            <Button className="flex-1 md:flex-none rounded-xl h-11 px-6 shadow-xl shadow-primary/10 active:scale-95 transition-all">
              <PlusCircle size={18} weight="bold" className="mr-2" />
              Define
            </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[2rem] border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Locks</CardTitle>
            <Lock size={20} weight="duotone" className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-black italic tracking-tighter">
              {locks.filter(l => Object.keys(l.account.state)[0] === 'locked').length}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Occupied Resources</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Resources</CardTitle>
            <BoundingBox size={20} weight="duotone" className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-black italic tracking-tighter">{locks.length}</div>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Tracked Entities</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] md:rounded-[2.5rem] border-border/50 shadow-sm grow bg-card overflow-hidden">
        <CardHeader className="pb-6 border-b border-border/10 bg-secondary/10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-xl shadow-sm border border-border/50">
                <Monitor size={18} weight="bold" className="text-primary" />
             </div>
             <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest">Resource Status</CardTitle>
                <CardDescription className="text-[10px] font-bold">Synchronized block-space state.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 pl-8">Resource Designation</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">State</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Current Owner</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center hidden md:table-cell">Contention</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Time Remaining</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest h-12 pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <ArrowsCounterClockwise size={32} weight="bold" className="animate-spin text-primary/30" />
                        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Fetching Cluster Data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : locks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <LockOpen size={40} className="text-muted-foreground/30" />
                        <p className="text-sm font-bold">No Resources Defined</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  locks.map((lock) => (
                    <TableRow key={lock.publicKey.toString()} className="group hover:bg-secondary/10 transition-colors">
                      <TableCell className="font-extrabold text-foreground tracking-tight pl-8 whitespace-nowrap">
                        {lock.account.resourceId}
                      </TableCell>
                      <TableCell>
                        {getLockStateBadge(lock.account.state)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {lock.account.owner ? (
                            <div className="flex items-center gap-2">
                              <IdentificationBadge size={14} className="text-primary" />
                              <span className="font-mono text-[10px] font-bold">
                                  {lock.account.owner.toString().slice(0, 8)}...{lock.account.owner.toString().slice(-4)}
                              </span>
                            </div>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Available</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <div className="px-2 py-0.5 bg-secondary rounded text-[10px] font-black w-fit mx-auto border border-border/30">
                            {lock.account.totalContentions.toString()}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {lock.account.expiresAt ? (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-primary">
                            <Timer size={14} weight="bold" />
                            <span className="tabular-nums">
                              {Math.max(0, (lock.account.expiresAt.toNumber() - Date.now()/1000)).toFixed(0)}s
                            </span>
                          </div>
                        ) : <span className="text-muted-foreground opacity-30">—</span>}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-lg h-8 px-3 font-bold text-[10px] uppercase tracking-wide md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={() => handleForceUnlock(lock.publicKey.toString())}
                          disabled={isActionLoading === lock.publicKey.toString()}
                        >
                            {isActionLoading === lock.publicKey.toString() ? (
                              <ArrowsCounterClockwise size={14} weight="bold" className="animate-spin" />
                            ) : (
                              "Force Unlock"
                            )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
