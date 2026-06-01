import { motion } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { useDismissedGuides } from '@/hooks/use-dismissed-guides.ts'
import { cn } from '@/lib/utils.ts'

interface PageGuideProps {
  id: string
  title: string
  body?: string
  className?: string
}

export function PageGuide({ id, title, body, className }: PageGuideProps) {
  const { isDismissed, dismiss } = useDismissedGuides()
  if (isDismissed(id)) return null
  return (
    <motion.aside
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      role="note"
      className={cn(
        'relative flex items-start gap-3 rounded-xl border border-border bg-brand/[0.03] py-2.5 pl-3.5 pr-2.5',
        'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-brand/40',
        'lg:py-3 lg:pr-3 lg:max-w-2xl',
        className,
      )}
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-foreground leading-snug">{title}</p>
        {body && (
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground line-clamp-2">
            {body}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(id)}
        aria-label="Dismiss guide"
        className="-mr-0.5 -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.aside>
  )
}
