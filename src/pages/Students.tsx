import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client.ts"
import { StudentDialog } from "@/components/students/StudentDialog.tsx"
import { StudentList, type SortKey, type SortDir } from "@/components/students/StudentList.tsx"
import { StudentFilterSheet } from "@/components/students/StudentFilterSheet.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Plus, Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth.ts"
import { useI18n } from "@/contexts/I18nContext.tsx"
import { Button } from "@/components/ui/button.tsx"
import { PageHeader } from "@/components/ui/page-header.tsx"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx"
import { Label } from "@/components/ui/label.tsx"
import { cn } from "@/lib/utils.ts"

interface Student {
  id: string
  name: string
  date_of_birth: string | null
  enrollment_date: string | null
  guardian_name: string | null
  guardian_contact: string | null
  guardian_email?: string | null
  status: "active" | "inactive" | "vacation" | "hospitalized" | "suspended" | "graduated"
  madrassah_id?: string
  section?: string
  medical_condition?: string | null
  gender?: string | null
  grade?: string | null
  health_card?: string | null
  permanent_code?: string | null
  street?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  completed_juz?: number[]
  current_juz?: number | null
  status_start_date?: string | null
  status_end_date?: string | null
  status_notes?: string | null
  photo_url?: string | null
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'status', label: 'Status' },
  { value: 'section', label: 'Section' },
  { value: 'enrollment_date', label: 'Enrollment date' },
]

const Students = () => {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSection, setSelectedSection] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  const { data, isLoading } = useQuery({
    queryKey: ["students", userId],
    queryFn: async () => {
      if (!userId) return { students: [], userData: null }
      const { data: userData } = await supabase
        .from("profiles")
        .select("madrassah_id, role")
        .eq("id", userId)
        .single()
      if (!userData?.madrassah_id) return { students: [], userData }
      if (userData.role === "admin") {
        const { data: students, error } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, guardian_email, status, madrassah_id, section, medical_condition, gender, grade, health_card, permanent_code, street, city, province, postal_code, completed_juz, current_juz, status_start_date, status_end_date, status_notes, photo_url",
          )
          .eq("madrassah_id", userData.madrassah_id)
        if (error) throw error
        return { students: students || [], userData }
      }
      if (userData.role === "teacher") {
        const { data: teacherClasses, error: classesError } = await supabase
          .from("classes")
          .select("current_students")
          .contains("teacher_ids", `{${userId}}`)
        if (classesError) throw classesError
        const studentIds = (teacherClasses || [])
          .flatMap(c => c.current_students || [])
          .filter((id, index, self) => id && self.indexOf(id) === index)
        if (studentIds.length === 0) return { students: [], userData }
        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, guardian_email, status, madrassah_id, section, medical_condition, gender, grade, health_card, permanent_code, street, city, province, postal_code, completed_juz, current_juz, status_start_date, status_end_date, status_notes, photo_url",
          )
          .in("id", studentIds)
        if (studentsError) throw studentsError
        return { students: students || [], userData }
      }
      return { students: [], userData }
    },
    enabled: !!userId,
  })

  const isAdmin = data?.userData?.role === "admin"
  const isTeacher = data?.userData?.role === "teacher"
  const students = data?.students || []
  const totalStudents = students.length
  const activeStudents = students.filter((s) => s.status === "active").length
  const inactiveStudents = totalStudents - activeStudents
  const uniqueSections = Array.from(
    new Set(students.map(s => s.section).filter(Boolean)),
  ).sort() as string[]

  const filteredStudents = students.filter((student) => {
    const sectionMatch =
      selectedSection === "all"
        ? true
        : selectedSection === "unassigned"
        ? !student.section
        : student.section === selectedSection
    const statusMatch =
      selectedStatus === "all" || student.status === selectedStatus
    const searchMatch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.guardian_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    return sectionMatch && statusMatch && searchMatch
  })

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setIsDialogOpen(true)
  }
  const handleAddStudent = () => {
    setSelectedStudent(null)
    setIsDialogOpen(true)
  }
  const handleCloseDialog = () => {
    setSelectedStudent(null)
    setIsDialogOpen(false)
    queryClient.invalidateQueries({ queryKey: ["students", userId] })
  }
  const clearFilters = () => {
    setSelectedSection('all')
    setSelectedStatus('all')
  }

  const activeFilterCount =
    (selectedStatus !== 'all' ? 1 : 0) + (selectedSection !== 'all' ? 1 : 0)
  const filteredCount = filteredStudents.length

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <PageHeader
        title={t("pages.students.title")}
        description={t("pages.students.subtitle")}
        actions={
          (isAdmin || isTeacher) ? (
            <Button onClick={handleAddStudent}>
              <Plus className="h-4 w-4 mr-2" />
              {t("pages.students.add")}
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-5xl px-4 lg:px-8 py-6 lg:py-8 space-y-5">
        {/* Hero search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("pages.students.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 pr-10 rounded-2xl border-border bg-background text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl shrink-0" aria-label="Sort">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Sort by</div>
              <RadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)} className="gap-0.5">
                {SORT_OPTIONS.map(opt => (
                  <Label key={opt.value} htmlFor={`sort-${opt.value}`}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 cursor-pointer hover:bg-foreground/[0.04]">
                    <RadioGroupItem id={`sort-${opt.value}`} value={opt.value} />
                    <span className="text-sm">{opt.label}</span>
                  </Label>
                ))}
              </RadioGroup>
              <div className="mt-2 border-t border-border pt-2 px-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Direction</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSortDir('asc')}
                    className={cn('flex-1 px-2 py-1.5 text-xs rounded-md border', sortDir === 'asc' ? 'border-brand bg-brand/10 text-brand' : 'border-border hover:bg-foreground/[0.04]')}
                  >Ascending</button>
                  <button
                    onClick={() => setSortDir('desc')}
                    className={cn('flex-1 px-2 py-1.5 text-xs rounded-md border', sortDir === 'desc' ? 'border-brand bg-brand/10 text-brand' : 'border-border hover:bg-foreground/[0.04]')}
                  >Descending</button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-2xl shrink-0 relative"
            onClick={() => setIsFilterOpen(true)}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Summary strip */}
        <p className="text-[13px] text-muted-foreground">
          {activeFilterCount > 0 || searchQuery
            ? `Showing ${filteredCount} of ${totalStudents} students`
            : `${totalStudents} students · ${activeStudents} active · ${inactiveStudents} inactive`}
        </p>

        {/* Row list */}
        <div>
          <StudentList
            students={filteredStudents}
            isLoading={isLoading}
            sortKey={sortKey}
            sortDir={sortDir}
            onEditStudent={handleEditStudent}
          />
        </div>
      </div>

      <StudentFilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        status={selectedStatus}
        section={selectedSection}
        sections={uniqueSections}
        showSection={isAdmin && uniqueSections.length > 0}
        onStatusChange={setSelectedStatus}
        onSectionChange={setSelectedSection}
        onClear={clearFilters}
      />

      <StudentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedStudent={selectedStudent}
        onClose={handleCloseDialog}
        madrassahId={data?.userData?.madrassah_id}
      />
    </div>
  )
}

export default Students
