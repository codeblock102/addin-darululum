
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { RevisionFormValues } from "./RevisionForm";
import { supabase } from "@/integrations/supabase/client";

export function useRevisionData(revisionId: string, studentId: string, onSuccess: () => void) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch the revision data
  const fetchRevision = async () => {
    const { data, error } = await supabase
      .from('juz_revisions')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (error) {
      console.error("Error fetching revision:", error);
      return null;
    }
    return data;
  };

  // State to hold the revision data
  const [revision, setRevision] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the revision on component mount
  useState(() => {
    fetchRevision().then(data => {
      setRevision(data);
      setIsLoading(false);
    });
  });

  const handleSave = async (values: RevisionFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('juz_revisions')
        .update({
          revision_date: values.date.toISOString(),
          memorization_quality: values.memorization_quality,
          time_spent: values.time_spent,
          notes: values.notes,
        })
        .eq('id', revisionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Revision updated successfully.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('juz_revisions')
        .delete()
        .eq('id', revisionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Revision deleted successfully.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    revision,
    isLoading,
    handleSave,
    handleDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  };
}
