import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Loader2 } from "lucide-react";
import { JuzRevisionEntry } from "@/types/dhor-book.ts";

export const RecentRevisions = () => {
  const {
    data: revisions,
    isLoading
  } = useQuery<JuzRevisionEntry[], Error>({
    queryKey: ['recent-revisions'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('juz_revisions').select(`
          *,
          students(name)
        `).order('revision_date', {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data as JuzRevisionEntry[];
    }
  });
  return <Card className="bg-slate-900">
      <CardHeader>
        <CardTitle>Recent Revisions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div> : <div className="space-y-4">
            {revisions?.map(revision => <div key={revision.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{revision.students?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Juz {revision.juz_revised}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {revision.revision_date ? new Date(revision.revision_date).toLocaleDateString() : "N/A"}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${revision.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' : revision.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {revision.memorization_quality}
                  </span>
                </div>
              </div>)}
          </div>}
      </CardContent>
    </Card>;
};