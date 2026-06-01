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
    <div className={cn('flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible', className)}>
      {actions.map((a, i) => (
        <motion.button
          key={a.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          onClick={a.onClick}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 active:scale-95 transition-transform"
        >
          {a.icon && <span className="text-brand">{a.icon}</span>}
          {a.label}
        </motion.button>
      ))}
    </div>
  )
}
