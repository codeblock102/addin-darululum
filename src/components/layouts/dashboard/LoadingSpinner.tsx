export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen animate-fadeIn gap-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl">
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-primary relative z-10">
        </div>
      </div>
      <p className="text-muted-foreground animate-pulse">Loading settings...</p>
    </div>
  );
};
