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
      const {
        data,
        error
      } = await supabase.from('juz_mastery').select(`
          *,
          students(name)
        `).order('juz_number', {
        ascending: true
      });
      if (error) throw error;
      return data;
    }
  });
  return <Card>
      <CardHeader className="bg-slate-900">
        <CardTitle>Complete Revisions</CardTitle>
      </CardHeader>
      <CardContent className="bg-slate-900">
        {isLoading ? <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div> : <Table>
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
              {revisions?.map(revision => <TableRow key={revision.id}>
                  <TableCell>{revision.students?.name}</TableCell>
                  <TableCell>{revision.juz_number}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${revision.mastery_level === 'mastered' ? 'bg-green-100 text-green-800' : revision.mastery_level === 'memorized' ? 'bg-blue-100 text-blue-800' : revision.mastery_level === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {revision.mastery_level}
                    </span>
                  </TableCell>
                  <TableCell>{revision.last_revision_date ? new Date(revision.last_revision_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{revision.revision_count}</TableCell>
                </TableRow>)}
            </TableBody>
          </Table>}
      </CardContent>
    </Card>;
};