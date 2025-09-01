import { motion } from "framer-motion";
import {
  StudentCompletionStatus,
  StudentLeaderboardData,
} from "@/types/leaderboard.ts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Award, CheckCircle, Circle, Clock, Medal, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface StudentRankItemProps {
  student: StudentLeaderboardData;
  isTopRank: boolean;
  completionStatus?: StudentCompletionStatus;
  highlightSubject?: "sabaq" | "sabaqPara" | null;
}

export const StudentRankItem = ({
  student,
  isTopRank,
  completionStatus = { sabaq: false, sabaqPara: false },
  highlightSubject = null,
}: StudentRankItemProps) => {
  const navigate = useNavigate();

  const handleNavigateToStudent = () => {
    navigate(`/students/${student.id}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = () => {
    if (!student.rank) return null;

    switch (student.rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return (
          <span className="font-semibold text-gray-400">#{student.rank}</span>
        );
    }
  };

  const getRankBgColor = () => {
    if (!student.rank) return "bg-card";

    switch (student.rank) {
      case 1:
        return "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-800/10";
      case 3:
        return "bg-gradient-to-r from-amber-800/20 to-amber-700/10 dark:from-amber-800/20 dark:to-amber-700/10";
      default:
        return "bg-card";
    }
  };

  const getCompletionIcon = (
    completed: boolean,
    highlight: boolean = false,
  ) => {
    return completed
      ? (
        <CheckCircle
          className={`h-4 w-4 ${
            highlight ? "text-green-500 animate-pulse" : "text-green-500"
          }`}
        />
      )
      : <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getLastActivityDate = () => {
    if (!student.lastActivity) return "No activity";

    const date = new Date(student.lastActivity);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return "Today";
    }

    return format(date, "MMM d");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center space-x-3 sm:space-x-4 rounded-md border p-2 sm:p-3 ${getRankBgColor()} ${
        isTopRank ? "border-amber-300 dark:border-amber-700" : "border-border"
      } cursor-pointer hover:shadow-md`}
      onClick={handleNavigateToStudent}
    >
      <div className="flex items-center justify-center w-6 sm:w-8">
        {getRankIcon()}
      </div>

      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-amber-100 dark:border-amber-800">
        <AvatarFallback className="bg-primary-foreground text-primary">
          {getInitials(student.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <p className="text-sm sm:text-base font-medium leading-none">{student.name}</p>
        <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {getCompletionIcon(
              completionStatus.sabaq,
              highlightSubject === "sabaq",
            )}
            <span>Sabaq: {student.sabaqs}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            {getCompletionIcon(
              completionStatus.sabaqPara,
              highlightSubject === "sabaqPara",
            )}
            <span>Sabaq Para: {student.sabaqPara}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs sm:text-sm font-medium leading-none">
          {student.totalPoints} pts
        </p>
        {student.lastActivity && (
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
            <Clock className="h-3 w-3" />
            {getLastActivityDate()}
          </p>
        )}
      </div>

      {isTopRank && (
        <div className="absolute -top-1 -right-1">
          <span className="flex h-6 w-6 animate-bounce">
            <span className="relative inline-flex rounded-full h-6 w-6 text-yellow-500">
              <Trophy className="h-6 w-6" />
            </span>
          </span>
        </div>
      )}
    </motion.div>
  );
};
