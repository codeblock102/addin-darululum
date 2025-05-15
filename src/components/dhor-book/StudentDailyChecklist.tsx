import type { DailyActivityEntry } from "./DhorBook";
import { CheckCircle2, XCircle } from "lucide-react";

interface StudentDailyChecklistProps {
  activity: DailyActivityEntry | null | undefined;
}

export function StudentDailyChecklist({ activity }: StudentDailyChecklistProps) {
  const hasSabaq = 
    activity &&
    activity.current_juz !== null && activity.current_juz !== undefined &&
    activity.current_surah !== null && activity.current_surah !== undefined &&
    activity.start_ayat !== null && activity.start_ayat !== undefined &&
    activity.end_ayat !== null && activity.end_ayat !== undefined;

  const hasDhor = activity && activity.juz_revisions_data && activity.juz_revisions_data.length > 0;
  
  const hasSabaqPara = 
    activity && 
    activity.sabaq_para_data && 
    activity.sabaq_para_data.juz_number !== null && activity.sabaq_para_data.juz_number !== undefined &&
    activity.sabaq_para_data.quarters_revised !== null && activity.sabaq_para_data.quarters_revised !== undefined &&
    activity.sabaq_para_data.quality_rating !== null && activity.sabaq_para_data.quality_rating !== undefined;

  const renderStatus = (status: boolean | undefined | null, label: string) => {
    return (
      <div className="flex items-center space-x-2 p-2 border-b">
        {status === undefined || status === null ? (
          <XCircle className="h-5 w-5 text-gray-400" /> // Should not happen if activity prop is handled correctly
        ) : status ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
        <span className="text-sm">{label}</span>
      </div>
    );
  };

  if (!activity) {
    return (
      <div className="mt-4 p-3 border rounded-md bg-gray-50">
        {renderStatus(false, "Sabaq (Main Lesson)")}
        {renderStatus(false, "Dhor (Revision)")}
        {renderStatus(false, "Sabaq Para (Reading)")}
        <p className="text-xs text-gray-500 mt-2">No activity recorded for this day.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-4 p-3 border rounded-md bg-gray-50">
      {renderStatus(hasSabaq, "Sabaq (Main Lesson)")}
      {renderStatus(hasDhor, "Dhor (Revision)")}
      {renderStatus(hasSabaqPara, "Sabaq Para (Reading)")}
    </div>
  );
} 