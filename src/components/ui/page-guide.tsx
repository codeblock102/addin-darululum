import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDown } from 'lucide-react'
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
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className={cn('relative rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 pr-10 text-sm text-foreground/90 lg:max-w-2xl', className)}
        role="note"
      >
        <p className="font-display font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground mt-0.5">{body}</p>
        {arrow === 'down' && (
          <motion.div
            className="absolute -bottom-2 left-8 text-brand"
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        )}
        <button
          onClick={() => dismiss(id)}
          aria-label="Dismiss guide"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-foreground/5"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </motion.aside>
    </AnimatePresence>
  )
}
