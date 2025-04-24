
import { Card } from "@/components/ui/card";
import { JuzMastery } from "@/types/progress";

interface MasteryLevelGridProps {
  masteryLevels: JuzMastery[];
  masteryLoading: boolean;
}

export const MasteryLevelGrid = ({ masteryLevels, masteryLoading }: MasteryLevelGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
        const juzMastery = masteryLevels?.find(m => m.juz_number === juz);
        
        return (
          <Card key={juz} className={`p-4 ${
            juzMastery?.mastery_level === 'mastered' ? 'bg-green-50 border-green-200' :
            juzMastery?.mastery_level === 'memorized' ? 'bg-blue-50 border-blue-200' :
            juzMastery?.mastery_level === 'in_progress' ? 'bg-yellow-50 border-yellow-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="font-medium">Juz {juz}</div>
            <div className="text-sm text-gray-500">
              Status: {juzMastery?.mastery_level ? (
                juzMastery.mastery_level === 'mastered' ? 'Mastered' :
                juzMastery.mastery_level === 'memorized' ? 'Memorized' :
                juzMastery.mastery_level === 'in_progress' ? 'In Progress' :
                'Not Started'
              ) : 'Not Started'}
            </div>
            {juzMastery?.last_revision_date && (
              <div className="text-xs text-gray-500 mt-1">
                Last revised: {new Date(juzMastery.last_revision_date).toLocaleDateString()}
              </div>
            )}
            {juzMastery?.revision_count && juzMastery.revision_count > 0 && (
              <div className="text-xs text-gray-500">
                Revisions: {juzMastery.revision_count}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
