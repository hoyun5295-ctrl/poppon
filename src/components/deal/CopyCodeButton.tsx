'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyCodeButtonProps {
  code: string;
}

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
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
