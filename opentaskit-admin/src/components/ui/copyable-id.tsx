"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyableIdProps {
  id?: string | null;
  displayValue?: string;
  prefix?: string;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  showIcon?: boolean;
  alwaysShowIcon?: boolean;
  showFull?: boolean;
  breakAll?: boolean;
  tooltipText?: string;
  title?: string;
}

export function CopyableId({
  id,
  displayValue,
  prefix,
  className,
  textClassName,
  iconClassName,
  showIcon = true,
  alwaysShowIcon = false,
  showFull = false,
  breakAll = false,
  tooltipText = "Click to copy",
  title,
}: CopyableIdProps) {
  const [copied, setCopied] = React.useState(false);

  if (!id) {
    return <span className={cn("text-muted-foreground", textClassName)}>—</span>;
  }

  const textToDisplay = displayValue || id;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = id;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title || (copied ? "Copied to clipboard!" : `${tooltipText}: ${id}`)}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono cursor-pointer select-none text-left transition-colors group/copy",
        "rounded px-1 py-0.5 -mx-1 hover:bg-muted/60 active:scale-[0.98]",
        copied
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15"
          : "text-muted-foreground hover:text-foreground",
        showFull && "w-fit max-w-full",
        className,
      )}
    >
      {prefix && <span className="font-sans font-normal opacity-80">{prefix}</span>}
      <span
        className={cn(
          "transition-colors",
          (showFull || breakAll) ? "break-all whitespace-normal" : "truncate",
          textClassName,
        )}
      >
        {textToDisplay}
      </span>

      {showIcon && (
        <span
          className={cn(
            "inline-flex items-center transition-all shrink-0",
            copied
              ? "opacity-100"
              : alwaysShowIcon
              ? "opacity-60 group-hover/copy:opacity-100"
              : "opacity-40 group-hover/copy:opacity-100",
            iconClassName,
          )}
        >
          {copied ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in-75">
              <Check className="h-3 w-3 stroke-[2.5]" />
              <span>Copied</span>
            </span>
          ) : (
            <Copy className="h-3 w-3 transition-transform group-hover/copy:scale-110" />
          )}
        </span>
      )}
    </button>
  );
}
