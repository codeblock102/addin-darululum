import { memo } from 'react'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu.tsx'
import { cn } from '@/lib/utils.ts'

export interface StudentRowData {
  id: string
  name: string
  guardian_name?: string | null
  guardian_contact?: string | null
  section?: string | null
  status: 'active' | 'inactive' | 'vacation' | 'hospitalized' | 'suspended' | 'graduated'
  photo_url?: string | null
  enrollment_date?: string | null
}

interface StudentRowProps {
  student: StudentRowData
  onClick?: (s: StudentRowData) => void
  onEdit?: (s: StudentRowData) => void
  onDelete?: (s: StudentRowData) => void
  onView?: (s: StudentRowData) => void
}

const STATUS_DOT: Record<StudentRowData['status'], string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-rose-500',
  vacation: 'bg-blue-500',
  hospitalized: 'bg-orange-500',
  suspended: 'bg-rose-500',
  graduated: 'bg-purple-500',
}

const STATUS_LABEL: Record<StudentRowData['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  vacation: 'Vacation',
  hospitalized: 'Hospitalized',
  suspended: 'Suspended',
  graduated: 'Graduated',
}

const getAvatarBgClass = (name: string): string => {
  const ch = (name.charAt(0) || 'A').toUpperCase()
  if ('ABC'.includes(ch)) return 'bg-emerald-700'
  if ('DEF'.includes(ch)) return 'bg-blue-700'
  if ('GHI'.includes(ch)) return 'bg-purple-700'
  if ('JKL'.includes(ch)) return 'bg-amber-700'
  if ('MNO'.includes(ch)) return 'bg-rose-700'
  if ('PQR'.includes(ch)) return 'bg-cyan-700'
  if ('STU'.includes(ch)) return 'bg-indigo-700'
  return 'bg-teal-700'
}

export const StudentRow = memo(function StudentRow({ student, onClick, onEdit, onDelete, onView }: StudentRowProps) {
  const meta = [
    student.guardian_name ? `Guardian: ${student.guardian_name}` : null,
    student.section || null,
    STATUS_LABEL[student.status],
  ].filter(Boolean)

  return (
    <div
      onClick={() => onClick?.(student)}
      className={cn(
        'group relative flex items-center gap-4 py-3 px-2 lg:px-3',
        'border-b border-border/40 last:border-b-0',
        'cursor-pointer transition-colors hover:bg-foreground/[0.025]',
      )}
    >
      <div className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-full overflow-hidden text-base font-semibold text-white',
        !student.photo_url && getAvatarBgClass(student.name),
        student.photo_url && 'bg-muted',
      )}>
        {student.photo_url ? (
          <img src={student.photo_url} alt={student.name} className="h-full w-full object-cover" />
        ) : (
          student.name.charAt(0).toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[student.status])} aria-hidden />
          <p className="truncate font-display text-[15px] font-semibold text-foreground leading-tight">
            {student.name}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {meta.join(' · ')}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label="Row actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => onEdit?.(student)}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </DropdownMenuItem>
          {onView && (
            <DropdownMenuItem onClick={() => onView(student)}>
              <Eye className="h-4 w-4 mr-2" /> View detail
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(student)} className="text-rose-600 focus:text-rose-600">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})
