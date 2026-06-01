import { Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { StudentRow, type StudentRowData } from './StudentRow.tsx'

export type SortKey = 'name' | 'section' | 'status' | 'enrollment_date'
export type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = {
  active: 0, vacation: 1, hospitalized: 2, suspended: 3, graduated: 4, inactive: 5,
}

interface StudentListProps {
  students?: StudentRowData[]
  isLoading?: boolean
  sortKey?: SortKey
  sortDir?: SortDir
  onEditStudent?: (s: StudentRowData) => void
  onDeleteStudent?: (s: StudentRowData) => void
  onViewStudent?: (s: StudentRowData) => void
}

export const StudentList = ({
  students,
  isLoading,
  sortKey = 'name',
  sortDir = 'asc',
  onEditStudent,
  onDeleteStudent,
  onViewStudent,
}: StudentListProps) => {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-2 lg:px-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 text-muted-foreground">
        <Users className="h-12 w-12 mb-3 opacity-50" />
        <h3 className="font-display text-lg font-semibold text-foreground">No students yet</h3>
        <p className="mt-1 text-sm">Add a student to get started.</p>
      </div>
    )
  }

  const sorted = [...students].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break
      case 'section': cmp = (a.section || '').localeCompare(b.section || ''); break
      case 'status': cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99); break
      case 'enrollment_date': {
        const da = a.enrollment_date ? new Date(a.enrollment_date).getTime() : 0
        const db = b.enrollment_date ? new Date(b.enrollment_date).getTime() : 0
        cmp = da - db
        break
      }
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="flex flex-col">
      {sorted.map((student) => (
        <StudentRow
          key={student.id}
          student={student}
          onClick={onEditStudent}
          onEdit={onEditStudent}
          onDelete={onDeleteStudent}
          onView={onViewStudent}
        />
      ))}
    </div>
  )
}
