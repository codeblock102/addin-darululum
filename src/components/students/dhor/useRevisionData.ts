import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast.ts";
import { JuzRevisionEntry, RevisionFormValues } from "@/types/dhor-book.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export function useRevisionData(revisionId: string, onSuccess: () => void) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State to hold the revision data
  const [revision, setRevision] = useState<JuzRevisionEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the revision on component mount
  useEffect(() => {
    const fetchRevision = async () => {
      const { data, error } = await supabase
        .from("juz_revisions")
        .select("*")
        .eq("id", revisionId)
        .single();

      if (error) {
        throw error instanceof Error ? error : new Error(error.message);
      }
      return data;
    };

    setIsLoading(true);
    setError(null);
    fetchRevision()
      .then((data) => {
        setRevision(data);
        setIsLoading(false);
      })
      .catch((err) => {
        const normalized = err instanceof Error
          ? err
          : new Error(typeof err === "string" ? err : "Failed to fetch revision");
        console.error("Error fetching revision:", normalized);
        setError(normalized);
        setRevision(null);
        setIsLoading(false);
        toast({
          title: "Error",
          description: normalized.message,
          variant: "destructive",
        });
      });
  }, [revisionId]); // Refetch if revisionId changes

  const handleSave = async (values: Partial<RevisionFormValues>) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("juz_revisions")
        .update({
          revision_date: values.date?.toISOString(),
          memorization_quality: values.memorization_quality,
          time_spent: values.time_spent,
          notes: values.notes,
        })
        .eq("id", revisionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Revision updated successfully.",
      });
      onSuccess();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "An unknown error occurred";
      toast({
        title: "Error",
        description: message,
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
        .from("juz_revisions")
        .delete()
        .eq("id", revisionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Revision deleted successfully.",
      });
      onSuccess();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "An unknown error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    revision,
    isLoading,
    error,
    handleSave,
    handleDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  };
}
