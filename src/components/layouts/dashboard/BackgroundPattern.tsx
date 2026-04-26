interface BackgroundPatternProps {
  isAdmin: boolean;
  children?: React.ReactNode;
}

// Clean passthrough — background is set by DashboardLayout
export const BackgroundPattern = ({ children }: BackgroundPatternProps) => (
  <div className="min-h-screen h-full">
    {children}
  </div>
);
