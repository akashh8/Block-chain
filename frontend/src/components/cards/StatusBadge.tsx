import type { NodeStatus } from '../../types';
import { getStatusBgClass } from '../../utils/helpers';

interface StatusBadgeProps {
  status: NodeStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <span className={`badge ${getStatusBgClass(status)} ${size === 'md' ? 'px-3 py-1 text-sm' : ''}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'Trusted' ? 'bg-gbrc-trusted' :
        status === 'Warning' ? 'bg-gbrc-warning' :
        status === 'Quarantine' ? 'bg-gbrc-quarantine' :
        'bg-gbrc-slashed'
      }`} />
      {status}
    </span>
  );
}
