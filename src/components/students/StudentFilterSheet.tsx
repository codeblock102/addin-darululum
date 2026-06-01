import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet.tsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'hospitalized', label: 'Hospitalized' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'graduated', label: 'Graduated' },
]

interface StudentFilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: string
  section: string
  sections: string[]
  showSection?: boolean
  onStatusChange: (value: string) => void
  onSectionChange: (value: string) => void
  onClear: () => void
}

export function StudentFilterSheet({
  open,
  onOpenChange,
  status,
  section,
  sections,
  showSection = true,
  onStatusChange,
  onSectionChange,
  onClear,
}: StudentFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display">Filters</SheetTitle>
          <SheetDescription>Narrow the student list by status and section.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Status
              </h3>
              <RadioGroup value={status} onValueChange={onStatusChange} className="gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`status-${opt.value}`}
                    className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 cursor-pointer hover:bg-foreground/[0.03] data-[state=checked]:bg-brand/5"
                  >
                    <RadioGroupItem id={`status-${opt.value}`} value={opt.value} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            {showSection && sections.length > 0 && (
              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Section
                </h3>
                <RadioGroup value={section} onValueChange={onSectionChange} className="gap-1">
                  <Label
                    htmlFor="section-all"
                    className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 cursor-pointer hover:bg-foreground/[0.03]"
                  >
                    <RadioGroupItem id="section-all" value="all" />
                    <span className="text-sm font-medium">All sections</span>
                  </Label>
                  <Label
                    htmlFor="section-unassigned"
                    className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 cursor-pointer hover:bg-foreground/[0.03]"
                  >
                    <RadioGroupItem id="section-unassigned" value="unassigned" />
                    <span className="text-sm font-medium">No section</span>
                  </Label>
                  {sections.map((s) => (
                    <Label
                      key={s}
                      htmlFor={`section-${s}`}
                      className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 cursor-pointer hover:bg-foreground/[0.03]"
                    >
                      <RadioGroupItem id={`section-${s}`} value={s} />
                      <span className="text-sm font-medium">{s}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </section>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClear} className="flex-1">
            Clear
          </Button>
          <SheetClose asChild>
            <Button className="flex-1">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
