
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Student } from './types';

interface StudentCardProps {
  student: Student;
  isSelected: boolean;
  onClick: () => void;
}

export function StudentCard({ student, isSelected, onClick }: StudentCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        "bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg",
        "hover:bg-white/10 hover:border-green-500/30",
        isSelected && "bg-green-500/20 border-green-500/50 shadow-green-500/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className={cn(
                "h-14 w-14 ring-2 transition-colors duration-300",
                isSelected 
                  ? "ring-green-400 ring-offset-2 ring-offset-slate-800" 
                  : "ring-white/20 group-hover:ring-green-400/50"
              )}>
                <AvatarFallback className={cn(
                  "text-sm font-semibold transition-colors duration-300",
                  isSelected
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:from-green-500 group-hover:to-green-600"
                )}>
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <h4 className={cn(
                "font-medium transition-colors duration-300",
                isSelected ? "text-green-300" : "text-gray-100 group-hover:text-green-300"
              )}>
                {student.name}
              </h4>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs border transition-colors duration-300",
                    isSelected 
                      ? "bg-green-500/20 text-green-300 border-green-500/50"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/50 group-hover:bg-green-500/20 group-hover:text-green-300 group-hover:border-green-500/50"
                  )}
                >
                  Active Student
                </Badge>
                {student.section && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-white/10 text-gray-300 border-white/20"
                  >
                    {student.section}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className={cn(
            "transition-colors duration-300",
            isSelected ? "text-green-400" : "text-gray-400 group-hover:text-green-400"
          )}>
            {isSelected ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
