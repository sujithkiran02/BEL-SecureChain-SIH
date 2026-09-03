'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Terminal, ShieldAlert, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

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

  React.useEffect(() => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch logs", err);
        setIsLoading(false);
      });
  }, []);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(log => log.status === filter);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-8 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            Immutable Audit Trail
          </h1>
          <p className="text-muted-foreground">Real-time cryptographic event indexing from BEL SecureChain.</p>
        </div>
        
        <div className="flex gap-2 bg-background/50 p-1 rounded-lg border border-primary/20">
          {['ALL', 'SUCCESS', 'FAILED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                filter === f ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <AnimatedCard className="overflow-hidden p-0 bg-background/80 border-primary/20">
        <div className="bg-muted/30 border-b border-primary/10 px-6 py-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Live Indexer Stream</span>
        </div>
        
        <div className="p-6 overflow-x-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted/50 rounded-md animate-pulse"></div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-mono">
                  <th className="pb-4 pr-6 font-medium">Tx Hash</th>
                  <th className="pb-4 pr-6 font-medium">Action</th>
                  <th className="pb-4 pr-6 font-medium">Subject / Actor</th>
                  <th className="pb-4 pr-6 font-medium">Resource / URI</th>
                  <th className="pb-4 pr-6 font-medium">Timestamp</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {filteredLogs.map((log, i) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-b border-muted/20 hover:bg-muted/10 transition-colors group"
                  >
                    <td className="py-4 pr-6 text-primary">{log.id}</td>
                    <td className="py-4 pr-6 font-bold text-foreground">
                      <span className="bg-muted/50 px-2 py-1 rounded text-xs">{log.action}</span>
                    </td>
                    <td className="py-4 pr-6 text-muted-foreground truncate max-w-[200px]" title={log.subject}>
                      {log.subject.substring(0, 12)}...
                    </td>
                    <td className="py-4 pr-6 text-muted-foreground truncate max-w-[200px]" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="py-4 pr-6 text-muted-foreground text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4">
                      {log.status === 'SUCCESS' ? (
                        <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-destructive bg-destructive/10 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
                          <XCircle className="w-3.5 h-3.5" /> FAILED
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!isLoading && filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
              <p>No audit logs found for this filter.</p>
            </div>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}
