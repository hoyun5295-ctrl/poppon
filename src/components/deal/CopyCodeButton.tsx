'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { trackCopyCode } from '@/lib/tracking';

interface CopyCodeButtonProps {
  code: string;
  dealId?: string;  // ✅ 추가: 로깅용
}

export function CopyCodeButton({ code, dealId }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      // ✅ 쿠폰 복사 로깅
      if (dealId) {
        trackCopyCode(dealId, code);
      }

      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);

      // ✅ 쿠폰 복사 로깅 (fallback에서도)
      if (dealId) {
        trackCopyCode(dealId, code);
      }

      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed transition-all font-mono text-sm
        ${copied
          ? 'border-green-400 bg-green-50 text-green-600'
          : 'border-primary-300 bg-primary-50 text-primary-600 hover:bg-primary-100'
        }`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          복사됨!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {code}
          <span className="text-primary-400 text-xs ml-1">탭하여 복사</span>
        </>
      )}
    </button>
  );
}
