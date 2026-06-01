import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils.ts'

export interface QuickAction {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
}

interface QuickActionsProps {
  actions: QuickAction[]
  className?: string
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn(
      'flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none',
      'lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible',
      className,
    )}>
      {actions.map((a, i) => (
        <motion.button
          key={a.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 + i * 0.05, type: 'spring', stiffness: 200, damping: 22 }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          onClick={a.onClick}
          className={cn(
            'group inline-flex items-center gap-2 whitespace-nowrap rounded-full',
            'border border-border bg-background/80 backdrop-blur',
            'px-3.5 py-2 text-[13px] font-medium text-foreground',
            'shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-brand/30 hover:shadow-[0_4px_12px_-4px_rgba(15,70,40,0.12)]',
            'transition-[border,box-shadow]',
          )}
        >
          {a.icon && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand">
              {a.icon}
            </span>
          )}
          {a.label}
        </motion.button>
      ))}
    </div>
  )
}
