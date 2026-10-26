import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Present':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Absent':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'On Leave':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Active':
      badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
    case 'Suspended':
    case 'Withdrawn':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'Graduated':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
