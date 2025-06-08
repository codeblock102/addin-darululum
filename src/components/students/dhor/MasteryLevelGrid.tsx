import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { JuzMastery } from '@/types/dhor-book.ts';

interface MasteryLevelGridProps {
  studentId: string;
  onJuzSelect: (juzNumber: string) => void;
}

export function MasteryLevelGrid({ studentId, onJuzSelect }: MasteryLevelGridProps) {
  const { data: masteryData } = useQuery({
    queryKey: ['juz-mastery', studentId],
    queryFn: async () => {
      // Use the juz_revisions table instead of a non-existent juz_mastery table
      const { data, error } = await supabase
        .from('juz_revisions')
        .select('id, student_id, juz_revised, memorization_quality, revision_date')
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching juz mastery:', error);
        return [];
      }

      // Transform juz_revisions data into the JuzMastery format expected by the component
      const juzRevisions = data || [];
      const juzMasteryMap = new Map<number, JuzMastery>();
      
      // Process each revision to build juz mastery data
      juzRevisions.forEach(revision => {
        const juzNumber = revision.juz_revised;
        
        if (!juzMasteryMap.has(juzNumber)) {
          // Create a new entry for this juz
          juzMasteryMap.set(juzNumber, {
            id: revision.id,
            student_id: revision.student_id,
            juz_number: juzNumber,
            mastery_level: getMasteryLevelFromQuality(revision.memorization_quality),
            last_revision_date: revision.revision_date,
            revision_count: 1,
            consecutive_good_revisions: isGoodRevision(revision.memorization_quality) ? 1 : 0
          });
        } else {
          // Update existing entry
          const existing = juzMasteryMap.get(juzNumber)!;
          existing.revision_count++;
          
          // Update last revision date if this one is more recent
          if (revision.revision_date && (!existing.last_revision_date || 
              new Date(revision.revision_date) > new Date(existing.last_revision_date))) {
            existing.last_revision_date = revision.revision_date;
          }
          
          // Update consecutive good revisions
          if (isGoodRevision(revision.memorization_quality)) {
            existing.consecutive_good_revisions++;
          } else {
            existing.consecutive_good_revisions = 0;
          }
          
          // Update mastery level based on consecutive good revisions
          if (existing.consecutive_good_revisions >= 5) {
            existing.mastery_level = 'mastered';
          } else if (existing.consecutive_good_revisions >= 3) {
            existing.mastery_level = 'memorized';
          } else if (existing.consecutive_good_revisions > 0) {
            existing.mastery_level = 'in_progress';
          } else {
            existing.mastery_level = 'not_started';
          }
        }
      });
      
      return Array.from(juzMasteryMap.values());
    }
  });
  
  // Helper functions for mastery data calculation
  function getMasteryLevelFromQuality(quality: string | null): JuzMastery['mastery_level'] {
    if (!quality) return "not_started";
    
    switch(quality) {
      case "excellent":
        return "mastered";
      case "good":
        return "memorized";
      case "average":
        return "in_progress";
      default:
        return "not_started";
    }
  }
  
  function isGoodRevision(quality: string | null): boolean {
    return quality === "excellent" || quality === "good";
  }

  // Update this function to handle mastery levels properly
  const getMasteryColor = (level: string | null) => {
    if (!level) return "bg-gray-100";
    
    switch(level) {
      case "not_started":
        return "bg-gray-100";
      case "in_progress":
        return "bg-yellow-100";
      case "memorized":
        return "bg-green-100";
      case "mastered":
        return "bg-blue-100";
      case "learning": // Handle legacy value
        return "bg-yellow-100";
      case "reviewing": // Handle legacy value
        return "bg-green-100";
      default:
        return "bg-gray-100";
    }
  };

  // Update the mastery level display text function
  const getMasteryText = (level: string | null) => {
    if (!level) return "Not Started";
    
    switch(level) {
      case "not_started":
        return "Not Started";
      case "in_progress":
        return "In Progress";
      case "memorized":
        return "Memorized";
      case "mastered":
        return "Mastered";
      case "learning": // Handle legacy value
        return "In Progress";
      case "reviewing": // Handle legacy value
        return "Memorized";
      default:
        return "Not Started";
    }
  };

  const juzItems = Array.from({ length: 30 }, (_, i) => {
    const juzNumber = i + 1;
    const juzData = masteryData?.find(j => j.juz_number === juzNumber);
    const masteryLevel = juzData?.mastery_level || "not_started";
    const color = getMasteryColor(masteryLevel);
    const tooltipText = getMasteryText(masteryLevel);
    
    return (
      <div 
        key={`juz-${juzNumber}`}
        className={`cursor-pointer border rounded-md p-4 ${color} hover:opacity-80 transition-opacity flex flex-col items-center justify-center`}
        onClick={() => onJuzSelect(juzNumber.toString())}
      >
        <span className="font-semibold text-xl">{juzNumber}</span>
        <span className="text-xs text-gray-600 mt-1">{tooltipText}</span>
      </div>
    );
  });
  
  return (
    <div className="grid grid-cols-5 gap-4">
      {juzItems}
    </div>
  );
}
