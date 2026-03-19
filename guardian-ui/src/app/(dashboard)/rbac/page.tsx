'use client';

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "@/hooks/use-anchor-program";
import { useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { PROGRAM_IDS } from "@/lib/anchor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  PlusCircle,
  MagnifyingGlass,
  UserPlus,
  Key,
  IdentificationBadge,
  ListMagnifyingGlass,
  CheckCircle,
  ArrowsCounterClockwise,
  ArrowElbowDownRight,
  Calendar,
  Check,
  X,
  Shield,
  CaretUp,
  WarningCircle
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn, decodeString } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRbac, PermissionInput } from "@/hooks/use-rbac";

const AVAILABLE_PERMISSIONS = [
  { id: 'TreasuryWithdraw', label: 'Treasury Withdraw' },
  { id: 'TreasuryDeposit', label: 'Treasury Deposit' },
  { id: 'RoleManagement', label: 'Role Management' },
  { id: 'EmergencyStop', label: 'Emergency Stop' },
  { id: 'ViewAudit', label: 'View Audit' },
  { id: 'AcquireLock', label: 'Acquire Lock' },
];

export default function RbacPage() {
  const { rbacProgram, provider } = useAnchorProgram();
  const { connection } = useConnection();
  const { createRole, grantRole } = useRbac();
  const [roles, setRoles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create Role Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleExpiry, setNewRoleExpiry] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Assign User Form State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignUserPubkey, setAssignUserPubkey] = useState("");
  const [assignRoleName, setAssignRoleName] = useState("");
  const [assignUserExpiry, setAssignUserExpiry] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  // Update current time periodically for expiry checks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now() / 1000), 10000);
    return () => clearInterval(timer);
  }, []);

  const isExpired = (expiresAt: any) => {
    if (!expiresAt) return false;
    return expiresAt.toNumber() < currentTime;
  };

  const fetchData = async () => {
    if (!rbacProgram) return;
    try {
      setLoading(true);

      const [allAssignments, allLogs, rawAccounts] = await Promise.all([
        (rbacProgram as any).account.roleAssignment.all(),
        (rbacProgram as any).account.auditLog.all(),
        connection.getProgramAccounts(PROGRAM_IDS.rbac)
      ]);

      const ROLE_DISC = Buffer.from([46, 219, 197, 24, 233, 249, 253, 154]);
      
      const decodeRoleAccount = (pubkey: PublicKey, data: Buffer) => {
        try {
          let offset = 8; // skip discriminator
          
          // name: String (4-byte length prefix + utf8 data)
          const nameLen = data.readUInt32LE(offset);
          offset += 4;
          const name = data.slice(offset, offset + nameLen).toString('utf8');
          offset += nameLen;

          // permissions: Vec<Permission>
          const permissionsLen = data.readUInt32LE(offset);
          offset += 4;
          const permissions: any[] = [];
          for (let i = 0; i < permissionsLen; i++) {
            const variant = data.readUInt8(offset);
            offset += 1;
            if (variant === 0) { // TreasuryWithdraw
              const maxAmount = new anchor.BN(data.slice(offset, offset + 8), 'le');
              offset += 8;
              permissions.push({ treasuryWithdraw: { maxAmount } });
            } else if (variant === 1) { permissions.push({ treasuryDeposit: {} }); }
            else if (variant === 2) { permissions.push({ roleManagement: {} }); }
            else if (variant === 3) { permissions.push({ emergencyStop: {} }); }
            else if (variant === 4) { permissions.push({ viewAudit: {} }); }
            else if (variant === 5) { permissions.push({ acquireLock: {} }); }
          }

          // parent_role: Option<Pubkey>
          let parentRole = null;
          if (data.readUInt8(offset) === 1) {
            parentRole = new PublicKey(data.slice(offset + 1, offset + 33));
          }
          offset += 33;

          // created_by: Pubkey
          const createdBy = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          // created_at: i64
          const createdAt = new anchor.BN(data.slice(offset, offset + 8), 'le');
          offset += 8;

          // expires_at: Option<i64>
          let expiresAt = null;
          if (data.readUInt8(offset) === 1) {
            expiresAt = new anchor.BN(data.slice(offset + 1, offset + 9), 'le');
          }
          offset += 9;

          return {
            publicKey: pubkey,
            account: { name, permissions, parentRole, createdBy, createdAt, expiresAt }
          };
        } catch { return null; }
      };

      const allRoles = rawAccounts
        .filter(a => (a.account.data as Buffer).slice(0, 8).equals(ROLE_DISC))
        .map(a => decodeRoleAccount(a.pubkey, a.account.data as Buffer))
        .filter(Boolean);

      // Real admin check
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgram.programId
      );
      const authority: any = await (rbacProgram as any).account.authority.fetch(authorityPda);
      setIsAdmin(authority.admin.toString() === provider?.publicKey?.toString());

      setRoles(allRoles);
      setAssignments(allAssignments.filter((as: any) => !isExpired(as.account.expiresAt)));
      setAuditLogs(allLogs.sort((a: any, b: any) => b.account.timestamp.toNumber() - a.account.timestamp.toNumber()));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data from blockchain");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAccess = async () => {
    if (!rbacProgram || !provider?.publicKey) return;
    try {
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgram.programId
      );

      const authority: any = await (rbacProgram as any).account.authority.fetch(authorityPda);
      setIsAdmin(authority.admin.toString() === provider.publicKey.toString());

      // Fetch assignments specifically for this user
      const userAssignments = await (rbacProgram as any).account.roleAssignment.all([
        {
          memcmp: {
            offset: 8, // Discriminator (8 bytes)
            bytes: provider.publicKey.toBase58(),
          },
        },
      ]);
      setMyAssignments(userAssignments.filter((as: any) => !isExpired(as.account.expiresAt)));
    } catch (error) {
      console.error("Failed to fetch my access:", error);
    }
  };

  const fetchRoles = fetchData; // Keep compatibility

  useEffect(() => {
    fetchData();
    fetchMyAccess();
  }, [rbacProgram, provider?.publicKey?.toString()]);

  const handleCreateRole = async () => {
    try {
      setIsSubmitting(true);
      const permissions: PermissionInput[] = selectedPermissions.map(p => ({
        type: p,
        maxAmount: p === 'TreasuryWithdraw' ? 1000 : 0 // Default for demo
      }));

      const expiryDays = newRoleExpiry ? parseInt(newRoleExpiry) : undefined;
      await createRole(newRoleName, permissions, undefined, expiryDays);
      setIsCreateOpen(false);
      setNewRoleName("");
      setNewRoleExpiry("");
      setSelectedPermissions([]);
      fetchData(); // Refresh the list
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignUser = async () => {
    try {
      setIsSubmitting(true);
      const expiryDays = assignUserExpiry ? parseInt(assignUserExpiry) : undefined;
      await grantRole(assignUserPubkey, assignRoleName, expiryDays);
      setIsAssignOpen(false);
      setAssignUserPubkey("");
      setAssignRoleName("");
      setAssignUserExpiry("");
      fetchData();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 px-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <ShieldCheck size={20} weight="bold" className="text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Identity & Governance</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase italic tracking-tighter">RBAC Management</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md font-medium leading-relaxed">
            The bedrock of Guardian security. Define roles, grant temporal access, and monitor the chain of command.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border/50 shadow-sm w-full sm:w-auto justify-center">
            <div className={`h-2.5 w-2.5 rounded-full ${isAdmin ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              {isAdmin ? 'System Admin' : 'Restricted'}
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger
                render={
                  <Button disabled={!isAdmin} className="flex-1 sm:flex-none rounded-xl h-11 px-6 shadow-xl shadow-primary/10 transition-transform active:scale-95">
                    <PlusCircle size={18} weight="bold" className="mr-2" />Role
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Forge New Role</DialogTitle>
                  <DialogDescription className="text-xs">
                    Create a permanent or temporal permission set on-chain.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Role Designation</Label>
                    <Input
                      id="name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. TREASURER"
                      className="h-12 rounded-xl bg-secondary/30 border-transparent focus:border-primary/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Lease Expiry (Days)</Label>
                    <Input
                      id="role-expiry"
                      type="number"
                      value={newRoleExpiry}
                      onChange={(e) => setNewRoleExpiry(e.target.value)}
                      placeholder="None (Permanent)"
                      className="h-12 rounded-xl bg-secondary/30 border-transparent focus:border-primary/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1">Entitlements</Label>
                    <div className="grid grid-cols-2 gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/30">
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-3 group">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPermissions([...selectedPermissions, permission.id]);
                              } else {
                                setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                              }
                            }}
                            className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={permission.id}
                            className="text-[13px] font-semibold leading-none cursor-pointer group-hover:text-primary transition-colors"
                          >
                            {permission.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-3 sm:justify-center">
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl">Discard</Button>
                  <Button onClick={handleCreateRole} disabled={isSubmitting} className="rounded-xl h-12 px-8">
                    {isSubmitting ? "Broadcasting..." : "Initialize Role"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" disabled={!isAdmin} className="flex-1 sm:flex-none rounded-xl border-2 h-11 px-6 hover:bg-secondary">
                    <UserPlus size={18} weight="bold" className="mr-2" />Grant
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Grant Deployment Access</DialogTitle>
                  <DialogDescription className="text-xs">
                    Authorize a wallet address to assume an on-chain role.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject Address</Label>
                    <Input
                      id="user"
                      placeholder="Solana Public Key"
                      value={assignUserPubkey}
                      onChange={(e) => setAssignUserPubkey(e.target.value)}
                      className="h-12 rounded-xl bg-secondary/30 border-transparent font-mono text-xs"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Designation</Label>
                    <select
                      id="role"
                      className="flex h-12 w-full rounded-xl border-transparent bg-secondary/30 px-3 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus:border-primary/20"
                      value={assignRoleName}
                      onChange={(e) => setAssignRoleName(e.target.value)}
                    >
                      <option value="">Choose a designation...</option>
                      {roles.map(r => (
                        <option key={r.publicKey.toString()} value={decodeString(r.account.name)}>
                          {decodeString(r.account.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Temporal Duration (Days)</Label>
                    <Input
                      id="assign-expiry"
                      type="number"
                      value={assignUserExpiry}
                      onChange={(e) => setAssignUserExpiry(e.target.value)}
                      placeholder="Default (Role Policy)"
                      className="h-12 rounded-xl bg-secondary/30 border-transparent focus:border-primary/20"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3 sm:justify-center">
                  <Button variant="ghost" onClick={() => setIsAssignOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={handleAssignUser} disabled={isSubmitting || !assignUserPubkey || !assignRoleName} className="rounded-xl h-12 px-8">
                    {isSubmitting ? "Signing..." : "Commit Assignment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
        {/* Formation Status Inspired Card */}
        <Card className="bg-zinc-950 dark:bg-white text-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-zinc-200 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.07] dark:group-hover:opacity-[0.1] transition-opacity pointer-events-none">
            <Shield size={160} weight="fill" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <CardHeader className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mb-1">Identity Passport</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-zinc-900 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-primary transition-colors">
                <Key size={22} weight="duotone" />
              </div>
            </div>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] break-all mt-4 selection:bg-primary/30">
              {provider?.publicKey?.toString() || "No Subject Identified"}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="space-y-6">
              <div className="flex gap-2.5 min-h-8 items-center flex-wrap">
                {provider?.publicKey && (
                  isAdmin ? (
                    <div className="px-3.5 py-1.5 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white rounded-lg text-[10px] font-black uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(255,255,255,0.2)] dark:shadow-xl border border-white/50 dark:border-zinc-800">
                      Super Admin
                    </div>
                  ) : myAssignments.length > 0 ? (
                    myAssignments.map((ma, i) => {
                      const role = roles.find(r => r.publicKey.toString() === ma.account.role.toString());
                      return (
                        <div key={i} className="px-3.5 py-1.5 bg-zinc-900/60 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border border-zinc-700/50 dark:border-zinc-200 backdrop-blur-md shadow-inner">
                          {role?.account.name || "Unknown Role"}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3.5 py-1.5 bg-zinc-900/40 dark:bg-zinc-50 text-zinc-500 dark:text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] border border-zinc-800/30 dark:border-zinc-200 italic">
                      Unauthorized
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Protocol Load</p>
              <IdentificationBadge size={20} weight="duotone" className="text-primary" />
            </div>
            <CardTitle className="text-4xl font-black mt-2 tracking-tighter">{roles.length}</CardTitle>
            <p className="text-xs text-muted-foreground font-medium">Verified Active Roles</p>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Audit Record</p>
              <ListMagnifyingGlass size={20} weight="duotone" className="text-primary" />
            </div>
            <CardTitle className="text-4xl font-black mt-2 tracking-tighter">{auditLogs.length}</CardTitle>
            <p className="text-xs text-muted-foreground font-medium">Immutable Trace Entries</p>
          </CardHeader>
          <CardContent className="pt-4 mt-auto">
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
              <CheckCircle weight="bold" />
              <span>Audit Engine Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 border border-border/50 shadow-sm grow bg-card">
        <Tabs defaultValue="roles" className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border/30 pb-0">
            <div className="overflow-x-auto pb-0 -mb-[2px]">
              <TabsList className="bg-transparent p-0 rounded-none h-12 gap-6 md:gap-8 flex min-w-max">
                <TabsTrigger
                  value="roles"
                  className="rounded-none border-b-2 border-transparent px-2 pb-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Registry
                </TabsTrigger>
                <TabsTrigger
                  value="assignments"
                  className="rounded-none border-b-2 border-transparent px-2 pb-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Access Grants
                </TabsTrigger>
                <TabsTrigger
                  value="audit"
                  className="rounded-none border-b-2 border-transparent px-2 pb-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Trace Flow
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-3 pb-4">
              <div className="relative group flex-1 md:flex-none">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                <Input
                  placeholder="Search ledger..."
                  className="pl-10 h-10 w-full md:w-[260px] bg-secondary/30 border-transparent rounded-xl focus:border-primary/20 transition-all font-bold text-[10px] uppercase tracking-wider"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchRoles} className="rounded-xl h-10 w-10 border-2 hover:bg-secondary transition-transform active:scale-95 flex-shrink-0">
                <ArrowsCounterClockwise size={18} weight="bold" className={`${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <TabsContent value="roles" className="mt-0 outline-none">
            <div className="overflow-x-auto">
              <div className="min-w-[800px] border border-border/30 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 pl-8">Designation</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Capability Matrix</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 hidden md:table-cell">Inheritance</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Lifecycle</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest h-12 pr-8">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16">
                          <div className="flex flex-col items-center gap-4">
                            <ArrowsCounterClockwise size={32} weight="bold" className="animate-spin text-primary/30" />
                            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Querying Solana Ledger...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16">
                          <div className="flex flex-col items-center gap-2">
                            <WarningCircle size={40} className="text-muted-foreground" />
                            <p className="text-sm font-bold text-muted-foreground">No Designations Found</p>
                            <p className="text-xs text-muted-foreground/60 max-w-[200px]">Create your first security role to initialize the protocol.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.publicKey.toString()} className="group hover:bg-secondary/10 transition-colors">
                          <TableCell className="font-extrabold text-foreground group-hover:text-primary transition-colors pl-8">
                            {decodeString(role.account.name)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 flex-wrap">
                              {role.account.permissions.map((p: any, i: number) => (
                                <div key={i} className="px-2 py-0.5 bg-secondary text-[9px] font-bold rounded-md border border-border/30">
                                  {Object.keys(p)[0]}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground hidden md:table-cell">
                            {role.account.parentRole ? (
                              <div className="flex items-center gap-1.5">
                                <ArrowElbowDownRight size={12} weight="bold" />
                                <span>{role.account.parentRole.toString().slice(0, 8)}</span>
                              </div>
                            ) : "Root"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg w-fit border border-emerald-100">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Synchronized</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3 font-bold text-[10px] uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="mt-0 outline-none">
            <div className="overflow-x-auto">
              <div className="min-w-[800px] border border-border/30 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 pl-8">Subject Key</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Designation</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 hidden md:table-cell">Authority</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 pr-8">Temporal Lease</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16">
                          <p className="text-sm font-bold text-muted-foreground italic">No access grants actively deployed.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map((as) => (
                        <TableRow key={as.publicKey.toString()} className="hover:bg-secondary/10 transition-colors">
                          <TableCell className="font-mono text-xs text-foreground font-semibold pl-8">
                            {as.account.user.toString().slice(0, 24)}...
                          </TableCell>
                          <TableCell>
                            <div className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-wider w-fit">
                              {decodeString(roles.find(r => r.publicKey.toString() === as.account.role.toString())?.account.name || "Ukn_Role")}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground italic hidden md:table-cell">
                            {as.account.grantedBy.toString().slice(0, 8)}...
                          </TableCell>
                          <TableCell className="pr-8">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                              <Calendar size={14} weight="bold" className="text-muted-foreground" />
                              {as.account.expiresAt ? new Date(as.account.expiresAt.toNumber() * 1000).toLocaleDateString() : "Permanent"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-0 outline-none">
            <div className="overflow-x-auto">
              <div className="min-w-[800px] border border-border/30 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 pl-8">Sequence Time</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Acting Subject</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 hidden md:table-cell">Operation</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 pr-8">Security State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-muted-foreground italic">
                          The secure ledger is empty.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.publicKey.toString()} className="hover:bg-secondary/10 transition-colors">
                          <TableCell className="text-[11px] font-bold text-muted-foreground pl-8">
                            {new Date(log.account.timestamp.toNumber() * 1000).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-foreground font-semibold">
                            {log.account.actor.toString().slice(0, 16)}...
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="text-xs font-bold uppercase tracking-tight">PROTECTED_OP_INVOKE</span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-8">
                            <div className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit border flex items-center gap-2",
                              log.account.success
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                              {log.account.success ? <Check weight="bold" size={10} /> : <X weight="bold" size={10} />}
                              {log.account.success ? "Passed" : "Breach"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
