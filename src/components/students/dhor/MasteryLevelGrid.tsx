
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { JuzMastery } from '@/types/progress';

interface MasteryLevelGridProps {
  masteryData: JuzMastery[];
  onJuzClick: (juzNumber: number) => void;
}

export const MasteryLevelGrid = ({ masteryData, onJuzClick }: MasteryLevelGridProps) => {
  // Create an array for all 30 juz
  const allJuz = Array.from({ length: 30 }, (_, i) => i + 1);
  
  // Get mastery level for a specific juz
  const getMasteryLevel = (juzNum: number) => {
    const juzData = masteryData.find(item => item.juz_number === juzNum);
    return juzData?.mastery_level || 'not_started';
  };
  
  // Get last revision date for a specific juz
  const getLastRevisionDate = (juzNum: number) => {
    const juzData = masteryData.find(item => item.juz_number === juzNum);
    return juzData?.last_revision_date;
  };
  
  // Helper function to get appropriate background color based on mastery level
  const getBgColor = (level: string) => {
    switch (level) {
      case 'mastered':
        return 'bg-green-100 border-green-500';
      case 'reviewing':
        return 'bg-blue-100 border-blue-500';
      case 'learning':
        return 'bg-yellow-100 border-yellow-500';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Helper function to get appropriate text color based on mastery level
  const getTextColor = (level: string) => {
    switch (level) {
      case 'mastered':
        return 'text-green-700';
      case 'reviewing':
        return 'text-blue-700';
      case 'learning':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {allJuz.map(juzNum => {
        const masteryLevel = getMasteryLevel(juzNum);
        const lastRevision = getLastRevisionDate(juzNum);
        
        return (
          <Card 
            key={juzNum}
            className={`p-3 border-2 hover:shadow-md cursor-pointer transition-all ${getBgColor(masteryLevel)}`}
            onClick={() => onJuzClick(juzNum)}
          >
            <div className="flex flex-col items-center">
              <h3 className="font-bold text-lg">Juz {juzNum}</h3>
              <p className={`text-sm font-medium capitalize ${getTextColor(masteryLevel)}`}>
                {masteryLevel === 'not_started' ? 'Not Started' :
                 masteryLevel === 'learning' ? 'Learning' :
                 masteryLevel === 'reviewing' ? 'Reviewing' :
                 'Mastered'}
              </p>
              {lastRevision && (
                <p className="text-xs mt-1 text-gray-500">Last: {formatDate(lastRevision)}</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
