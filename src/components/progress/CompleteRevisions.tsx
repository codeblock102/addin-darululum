
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export const CompleteRevisions = () => {
  const {
    data: revisions,
    isLoading
  } = useQuery({
    queryKey: ['complete-revisions'],
    queryFn: async () => {
      // Since juz_mastery table was dropped, we'll use juz_revisions instead
      const {
        data,
        error
      } = await supabase.from('juz_revisions')
        .select(`
          *,
          students(name)
        `)
        .order('juz_revised', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card>
      <CardHeader className="bg-slate-900">
        <CardTitle>Complete Revisions</CardTitle>
      </CardHeader>
      <CardContent className="bg-slate-900">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Juz</TableHead>
                <TableHead>Mastery Level</TableHead>
                <TableHead>Last Revision</TableHead>
                <TableHead>Revisions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisions?.map(revision => (
                <TableRow key={revision.id}>
                  <TableCell>{revision.students?.name || 'Unknown Student'}</TableCell>
                  <TableCell>{revision.juz_revised}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      revision.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' : 
                      revision.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' : 
                      revision.memorization_quality === 'average' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {revision.memorization_quality || 'unknown'}
                    </span>
                  </TableCell>
                  <TableCell>{revision.revision_date ? new Date(revision.revision_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
              ))}
              {!revisions || revisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No revision data available</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
