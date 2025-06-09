
import { useQuery } from "@tanstack/react-query";

export const useTeacherMessages = (teacherId: string) => {
  // Disabled messaging functionality - return empty data
  const emptyQuery = useQuery({
    queryKey: ["teacher-messages-disabled", teacherId],
    queryFn: async () => [],
    enabled: false,
  });

  return {
    inboxMessages: [],
    sentMessages: [],
    recipients: [],
    inboxLoading: false,
    sentLoading: false,
    recipientsLoading: false,
    refetchMessages: () => {},
    unreadCount: 0,
  };
};
