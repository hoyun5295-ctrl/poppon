'use client';

import { useEffect, useState } from 'react';
import { DealDetail } from './DealDetail';

// Legacy - modal now uses server-side rendering
// This file is kept for backward compatibility only

interface DealDetailClientProps {
  slug: string;
  isModal?: boolean;
}

export function DealDetailClient({ slug, isModal = false }: DealDetailClientProps) {
  return (
    <div className="py-12 text-center">
      <p className="text-surface-400 text-sm">Loading...</p>
    </div>
  );
}
