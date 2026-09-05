'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Search, 
  Copy, 
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  subject: string;
  resource: string;
  timestamp: string;
  status: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('http://localhost:3001/api/audit/timeline', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const formattedLogs = (data.entries || []).map((entry: any) => ({
          id: entry.id.toString(),
          action: entry.actionType,
          subject: entry.actorWallet || '0x7099...79C8',
          resource: entry.relatedAssetId ? `Asset #${entry.relatedAssetId}` : (entry.relatedUser || 'System Node'),
          timestamp: entry.timestamp,
          status: 'SUCCESS'
        }));
        setLogs(formattedLogs);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.action.toUpperCase().includes(filter);
    const matchesSearch = log.id.includes(searchQuery) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportCSV = () => {
    const header = "ID,Action,Subject,Resource,Timestamp,Status\n";
    const rows = filteredLogs.map(l => `${l.id},${l.action},${l.subject},${l.resource},${l.timestamp},${l.status}`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bel-audit-trail-${Date.now()}.csv`;
    a.click();
    toast.success('Audit logs exported to CSV');
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Transaction ID copied');
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
              Immutable Audit <span className="text-primary text-glow">Trail &amp; Logs</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cryptographically signed event ledger indexed from AuditLog.sol smart contract
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-mono font-bold hover:bg-primary/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-background text-xs font-mono font-bold hover:shadow-glow transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/50 backdrop-blur-xl p-4 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-2 bg-background/60 border border-primary/20 rounded-xl px-3 py-2 w-full md:w-96">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter logs by Tx ID, actor wallet, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['ALL', 'REGISTER', 'MINT', 'ROLE', 'QUARANTINE'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                filter === f ? 'bg-primary text-background shadow-glow' : 'bg-background/40 text-muted-foreground border border-primary/10 hover:border-primary/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Logs Table Card */}
      <AnimatedCard className="overflow-hidden p-0 bg-card/70 backdrop-blur-xl border-primary/20 rounded-2xl shadow-xl">
        <div className="bg-background/80 border-b border-primary/15 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
              AuditLog.sol Live Event Indexer Stream
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {filteredLogs.length} Events Indexed
          </span>
        </div>
        
        <div className="p-6 overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-primary/15 text-[11px] uppercase tracking-wider text-muted-foreground pb-3">
                  <th className="pb-3 pr-4 font-bold">Tx Index / ID</th>
                  <th className="pb-3 pr-4 font-bold">Action Type</th>
                  <th className="pb-3 pr-4 font-bold">Actor (DID / Wallet)</th>
                  <th className="pb-3 pr-4 font-bold">Target Resource</th>
                  <th className="pb-3 pr-4 font-bold">Timestamp</th>
                  <th className="pb-3 font-bold text-right">EVM Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-primary/5 hover:bg-primary/5 transition-colors group"
                  >
                    <td className="py-3.5 pr-4 text-primary font-bold">
                      <div className="flex items-center gap-1.5">
                        <span>#{log.id}</span>
                        <button 
                          onClick={() => copyId(log.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-foreground">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        log.action.includes('MINT') ? 'bg-primary/15 text-primary border-primary/30' :
                        log.action.includes('QUARANTINE') || log.action.includes('REVOKE') ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                        log.action.includes('ROLE') ? 'bg-accent/15 text-accent border-accent/30' :
                        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-muted-foreground font-mono truncate max-w-[200px]" title={log.subject}>
                      {log.subject.length > 14 ? `${log.subject.substring(0, 14)}...` : log.subject}
                    </td>
                    <td className="py-3.5 pr-4 text-foreground font-semibold truncate max-w-[200px]" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="py-3.5 pr-4 text-muted-foreground text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> ANCHORED
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!isLoading && filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 mb-3 opacity-40 text-primary" />
              <p className="font-mono text-xs">No audit records matching the specified criteria.</p>
            </div>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}
