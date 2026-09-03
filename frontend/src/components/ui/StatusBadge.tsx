import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'VERIFIED' | 'PENDING' | 'REVOKED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'VERIFIED':
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/30 shadow-glow">
          <CheckCircle2 className="w-4 h-4" />
          VERIFIED IDENTITY
        </div>
      );
    case 'REVOKED':
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium border border-destructive/30 shadow-glow-destructive">
          <XCircle className="w-4 h-4" />
          ACCESS REVOKED
        </div>
      );
    case 'PENDING':
    default:
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium border border-amber-500/30">
          <Clock className="w-4 h-4" />
          PENDING VERIFICATION
        </div>
      );
  }
}
