import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeViewerProps {
  filename: string;
  code: string;
}

export default function CodeViewer({ filename, code }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-nightDark/50 border-l border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-gray-800 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal size={14} className="text-electricBlue" />
          <span className="text-xs font-mono font-bold tracking-wide text-gray-300">{filename}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-[10px] text-green-500 font-mono">COPIED</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-gray-500 group-hover:text-white" />
              <span className="text-[10px] text-gray-500 group-hover:text-white font-mono">COPY</span>
            </>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-0">
        <div className="min-h-full p-4 font-mono text-xs md:text-sm text-gray-300 leading-relaxed bg-nightDark/20">
            <pre className="whitespace-pre-wrap break-words">
                {code || "// No content available"}
            </pre>
        </div>
      </div>
    </div>
  );
}