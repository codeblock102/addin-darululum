import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { usePageHelp } from "@/hooks/usePageHelp.ts";

export interface HelpTip {
  icon?: string;
  title: string;
  body: string;
}

interface PageHelpBannerProps {
  tips: HelpTip[];
  className?: string;
}

/**
 * Contextual help banner — shown on each page when page help is enabled in settings.
 * Collapsible, dismissible per-session.
 */
export const PageHelpBanner = ({ tips, className }: PageHelpBannerProps) => {
  const { enabled } = usePageHelp();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!enabled || dismissed || tips.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-green-100 bg-green-50/60 overflow-hidden transition-all duration-200",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="h-4 w-4 text-green-700" />
        </div>
        <p className="text-sm font-semibold text-green-900 flex-1">
          Page Guide
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-green-700 hover:text-green-900 transition-colors p-1 rounded-lg hover:bg-green-100"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-green-500 hover:text-green-700 transition-colors p-1 rounded-lg hover:bg-green-100"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tips — shown when expanded */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-green-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tips.map((tip, i) => (
              <div key={i} className="bg-white rounded-xl p-3.5 border border-green-100">
                {tip.icon && <span className="text-base mb-1 block">{tip.icon}</span>}
                <p className="text-xs font-semibold text-gray-800 mb-0.5">{tip.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
