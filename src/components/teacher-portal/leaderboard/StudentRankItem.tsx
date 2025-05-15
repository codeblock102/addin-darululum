
import { motion } from 'framer-motion';
import { StudentLeaderboardData } from '@/types/leaderboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Award, Medal } from 'lucide-react';
import { format } from 'date-fns';

interface StudentRankItemProps {
  student: StudentLeaderboardData;
  isTopRank: boolean;
}

export const StudentRankItem = ({ student, isTopRank }: StudentRankItemProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
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
        return <span className="font-semibold text-gray-400">#{student.rank}</span>;
    }
  };

  const getRankBgColor = () => {
    if (!student.rank) return 'bg-card';

    switch (student.rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-800/10';
      case 3:
        return 'bg-gradient-to-r from-amber-800/20 to-amber-700/10 dark:from-amber-800/20 dark:to-amber-700/10';
      default:
        return 'bg-card';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center space-x-4 rounded-md border p-3 ${getRankBgColor()} ${isTopRank ? 'border-amber-300 dark:border-amber-700' : 'border-border'}`}
    >
      <div className="flex items-center justify-center w-8">
        {getRankIcon()}
      </div>
      
      <Avatar className="h-10 w-10 border-2 border-amber-100 dark:border-amber-800">
        <AvatarFallback className="bg-primary-foreground text-primary">
          {getInitials(student.name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{student.name}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Sabaq: {student.sabaqs}</span>
          <span>•</span>
          <span>Sabaq Para: {student.sabaqPara}</span>
          <span>•</span>
          <span>Dhor: {student.dhor}</span>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium leading-none">{student.totalPoints} pts</p>
        {student.lastActivity && (
          <p className="text-xs text-muted-foreground">
            Last: {format(new Date(student.lastActivity), 'MMM d')}
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
