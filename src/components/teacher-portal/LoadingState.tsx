import { Loader2 } from "lucide-react";

export const LoadingState = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-lg">Loading your profile...</span>
  </div>
);
