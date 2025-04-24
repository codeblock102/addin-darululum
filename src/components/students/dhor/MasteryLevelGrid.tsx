
import { Card } from "@/components/ui/card";
import { JuzMastery } from "@/types/progress";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MasteryLevelGridProps {
  masteryLevels: JuzMastery[];
  masteryLoading: boolean;
}

export const MasteryLevelGrid = ({ masteryLevels, masteryLoading }: MasteryLevelGridProps) => {
  if (masteryLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
        const juzMastery = masteryLevels?.find(m => m.juz_number === juz);
        
        return (
          <motion.div key={juz} variants={item}>
            <Card className={`p-4 transition-all duration-300 ${
              juzMastery?.mastery_level === 'mastered' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
              juzMastery?.mastery_level === 'memorized' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
              juzMastery?.mastery_level === 'in_progress' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
              'bg-gray-50 border-gray-200'
            } hover:shadow-md`}>
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
          </motion.div>
        );
      })}
    </motion.div>
  );
};
