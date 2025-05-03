
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StudentSearchProps {
  onStudentSelect: (studentId: string, studentName: string) => void;
}

export function StudentSearch({ onStudentSelect }: StudentSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  
  const { data: students, isLoading } = useQuery({
    queryKey: ["students-search"],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("id, name")
        .order("name", { ascending: true });
        
      // Apply search if provided
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
  
  const handleSelect = (studentId: string, studentName: string) => {
    setValue(studentId);
    setOpen(false);
    onStudentSelect(studentId, studentName);
  };
  
  return (
    <Card className="p-4 bg-white dark:bg-gray-900 border">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="text-sm font-medium flex-shrink-0 md:min-w-[120px]">
          Select Student:
        </div>
        
        <div className="flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading students...</span>
                  </div>
                ) : value ? (
                  students?.find((student) => student.id === value)?.name || "Select student"
                ) : (
                  <span className="text-muted-foreground">Select student</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search student by name..." 
                  onValueChange={setSearch}
                  startIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
                {isLoading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading students...</p>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup heading="Students" className="max-h-[300px] overflow-y-auto">
                      {students?.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={student.id}
                          onSelect={() => handleSelect(student.id, student.name)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === student.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {student.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
}
