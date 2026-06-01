import { motion } from 'framer-motion'
import { X, ArrowDown, Sparkles } from 'lucide-react'
import { useDismissedGuides } from '@/hooks/use-dismissed-guides.ts'
import { cn } from '@/lib/utils.ts'

interface PageGuideProps {
  id: string
  title: string
  body: string
  arrow?: 'down' | 'none'
  className?: string
}

export function PageGuide({ id, title, body, arrow = 'down', className }: PageGuideProps) {
  const { isDismissed, dismiss } = useDismissedGuides()
  if (isDismissed(id)) return null
  return (
    <motion.aside
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/[0.04] via-background to-background px-4 py-3.5 pr-12 shadow-[0_1px_2px_rgba(15,70,40,0.04),0_8px_24px_-12px_rgba(15,70,40,0.08)] lg:max-w-2xl',
        className,
      )}
      role="note"
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-brand/[0.06] blur-2xl" aria-hidden />
      <div className="relative">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">
          <Sparkles className="h-3 w-3" />
          Tip
        </div>
        <p className="font-display font-semibold text-foreground text-[15px] leading-snug">{title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {arrow === 'down' && (
        <motion.div
          className="absolute -bottom-2.5 left-7 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md"
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <ArrowDown className="h-3 w-3" />
        </motion.div>
      )}
      <button
        onClick={() => dismiss(id)}
        aria-label="Dismiss guide"
        className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.aside>
  )
}
