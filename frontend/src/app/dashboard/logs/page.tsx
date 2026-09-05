'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  ShieldAlert, 
  CheckCircle2, 
  Download, 
  Search, 
  Copy, 
  RefreshCw
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-muted/60 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-foreground tracking-tight">
              Immutable Audit <span className="text-primary">Logs</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cryptographically signed event ledger indexed from AuditLog.sol smart contract
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-muted bg-card text-foreground hover:border-primary/40 text-xs font-mono font-medium transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-muted/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 bg-muted/40 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Filter logs by Tx ID, actor, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'REGISTER', 'MINT', 'ROLE', 'QUARANTINE'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Logs Table Card */}
      <AnimatedCard className="overflow-hidden p-0 bg-card border-muted/80 dark:border-white/10 rounded-2xl shadow-sm">
        <div className="bg-muted/30 dark:bg-white/5 border-b border-muted/60 dark:border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider font-semibold">
              Live Event Indexer Stream
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {filteredLogs.length} Events
          </span>
        </div>
        
        <div className="p-4 sm:p-6 overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-muted/40 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-muted text-[11px] uppercase tracking-wider text-muted-foreground pb-2">
                  <th className="pb-2.5 pr-4 font-semibold">Tx ID</th>
                  <th className="pb-2.5 pr-4 font-semibold">Action</th>
                  <th className="pb-2.5 pr-4 font-semibold">Actor</th>
                  <th className="pb-2.5 pr-4 font-semibold">Target</th>
                  <th className="pb-2.5 pr-4 font-semibold">Timestamp</th>
                  <th className="pb-2.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-muted/40 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-3 pr-4 text-primary font-bold">
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
                    <td className="py-3 pr-4 font-medium text-foreground">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        log.action.includes('MINT') ? 'bg-primary/10 text-primary border-primary/20' :
                        log.action.includes('QUARANTINE') || log.action.includes('REVOKE') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        log.action.includes('ROLE') ? 'bg-accent/10 text-accent border-accent/20' :
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground font-mono truncate max-w-[180px]" title={log.subject}>
                      {log.subject.length > 12 ? `${log.subject.substring(0, 12)}...` : log.subject}
                    </td>
                    <td className="py-3 pr-4 text-foreground truncate max-w-[180px]" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> ANCHORED
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!isLoading && filteredLogs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
              <ShieldAlert className="w-10 h-10 mb-2 opacity-40 text-primary" />
              <p className="font-mono text-xs">No audit records matching criteria.</p>
            </div>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}
