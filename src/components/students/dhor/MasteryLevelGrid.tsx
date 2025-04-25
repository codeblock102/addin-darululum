import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MasteryLevelGridProps {
  studentId: string;
  onJuzSelect: (juzNumber: string) => void;
}

interface JuzMastery {
  id: string;
  student_id: string | null;
  juz_number: number;
  mastery_level: 'not_started' | 'in_progress' | 'memorized' | 'mastered' | null;
  last_revision_date: string | null;
  revision_count: number | null;
  consecutive_good_revisions: number | null;
}

// Update the component where mastery level comparison is causing errors
export function MasteryLevelGrid({ studentId, onJuzSelect }: MasteryLevelGridProps) {
  const [selectedJuz, setSelectedJuz] = useState<string | null>(null);

  const { data: masteryData, isLoading, error } = useQuery({
    queryKey: ['juz-mastery', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz_mastery')
        .select('*')
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching juz mastery:', error);
        return [];
      }
      return data as JuzMastery[];
    }
  });

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
    
    // No strict comparison needed here, we're just using the translated values
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
