import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Award,
  Check,
  Loader2,
  Medal,
  Trophy,
  X,
} from "lucide-react";
import type { StudentRecordSummary } from "./types.ts";

interface LeaderboardProps {
  topStudents: StudentRecordSummary[];
  isLoading: boolean;
  onViewDetails: (studentId: string) => void;
}

const LeaderboardRankIcons = [
  <Trophy key="1st" className="h-8 w-8 text-yellow-500" />,
  <Medal key="2nd" className="h-8 w-8 text-zinc-400" />,
  <Award key="3rd" className="h-8 w-8 text-amber-700" />,
];

export function Leaderboard(
  { topStudents, isLoading, onViewDetails }: LeaderboardProps,
) {
  return (
    <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
      <CardHeader>
        <CardTitle className="flex items-center text-center justify-center">
          <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
          <span>Today's Leaderboard</span>
          <Trophy className="h-6 w-6 ml-2 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading
          ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )
          : topStudents.length > 0
          ? (
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {topStudents.slice(0, 3).map((student, index) => (
                <Card
                  key={student.id}
                  className={`w-full sm:w-[250px] md:w-64 ${
                    index === 0 ? "border-yellow-500/50 shadow-lg" : ""
                  }`}
                >
                  <CardContent className="pt-6 text-center flex flex-col items-center">
                    <div className="mb-4">
                      {LeaderboardRankIcons[index]}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{student.name}</h3>
                    <div className="space-y-1 w-full mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Sabaq:</span>
                        <span>
                          {student.sabaq.done
                            ? (
                              <Check className="h-4 w-4 text-green-500 inline ml-1" />
                            )
                            : (
                              <X className="h-4 w-4 text-red-500 inline ml-1" />
                            )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Sabaq Para:</span>
                        <span>
                          {student.sabaqPara.done
                            ? (
                              <Check className="h-4 w-4 text-green-500 inline ml-1" />
                            )
                            : (
                              <X className="h-4 w-4 text-red-500 inline ml-1" />
                            )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Dhor:</span>
                        <span>
                          {student.dhor.done
                            ? (
                              <Check className="h-4 w-4 text-green-500 inline ml-1" />
                            )
                            : (
                              <X className="h-4 w-4 text-red-500 inline ml-1" />
                            )}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => onViewDetails(student.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
          : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No student records available for today's leaderboard.
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
