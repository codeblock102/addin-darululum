
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/types/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressOverviewProps {
  studentName: string;
  progressData: Progress[];
  dhorData: any[];
}

export function ProgressOverview({ studentName, progressData, dhorData }: ProgressOverviewProps) {
  // Calculate key metrics
  const latestProgress = progressData.length > 0 
    ? progressData[progressData.length - 1] 
    : null;
    
  const totalVersesMemorized = progressData.reduce(
    (sum, entry) => sum + (entry.verses_memorized || 0), 
    0
  );
  
  const completedJuz = latestProgress?.completed_juz || 0;
  
  const currentSurah = latestProgress?.current_surah || 0;
  const currentJuz = latestProgress?.current_juz || 0;
  
  const averageQualityRatings = progressData.reduce((acc, entry) => {
    if (entry.memorization_quality) {
      acc[entry.memorization_quality] = (acc[entry.memorization_quality] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const totalRatings = Object.values(averageQualityRatings).reduce((a, b) => a + b, 0);
  
  const bestPerformingQuality = totalRatings > 0 
    ? Object.entries(averageQualityRatings).sort((a, b) => b[1] - a[1])[0][0] 
    : "N/A";

  // Get count of dhor entries with mistakes ≤ 3 (good performance)
  const goodDhorEntries = dhorData.filter(entry => 
    (entry.dhor_1_mistakes <= 3) && 
    (entry.dhor_2_mistakes <= 3)
  ).length;
  
  const dhorPerformancePercentage = dhorData.length > 0 
    ? Math.round((goodDhorEntries / dhorData.length) * 100) 
    : 0;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">{studentName}</h2>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                Current Juz: {currentJuz || "Not started"}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                Current Surah: {currentSurah || "Not started"}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Memorized</p>
              <p className="text-3xl font-bold">{totalVersesMemorized}</p>
              <p className="text-xs text-muted-foreground">Verses</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold">{completedJuz}</p>
              <p className="text-xs text-muted-foreground">Juz</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Dhor Quality</p>
              <p className="text-3xl font-bold">{dhorPerformancePercentage}%</p>
              <p className="text-xs text-muted-foreground">Good Performance</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Best Rating</p>
              <p className="text-3xl font-bold capitalize">{bestPerformingQuality}</p>
              <p className="text-xs text-muted-foreground">Memorization Quality</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
