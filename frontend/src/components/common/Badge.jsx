import React from 'react';

const BADGE_STYLES = {
  // Lead & Application Statuses
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
  CONTACTED: 'bg-sky-50 text-sky-700 border-sky-200',
  INTERESTED: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  NOT_INTERESTED: 'bg-rose-50 text-rose-700 border-rose-200',
  FOLLOW_UP_REQUIRED: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  DOCUMENTS_PENDING: 'bg-orange-50 text-orange-700 border-orange-200',
  APPLICATION_PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  REJECTED: 'bg-red-100 text-red-800 border-red-300 font-medium',
  DISBURSED: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-300',
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  ADDITIONAL_DOCUMENTS_REQUIRED: 'bg-orange-50 text-orange-700 border-orange-200',
  // Verification Statuses
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  // Follow-up Statuses
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  OVERDUE: 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse',
  // Employee status
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const Badge = ({ status, label, className = '' }) => {
  const normalized = status ? status.toString().toUpperCase() : 'DEFAULT';
  const style = BADGE_STYLES[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  const displayLabel = label || normalized.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {displayLabel}
    </span>
  );
};
