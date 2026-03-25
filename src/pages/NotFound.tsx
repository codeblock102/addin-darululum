import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-md glass-card rounded-xl">
        <p className="text-8xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          The page{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
            {location.pathname}
          </code>{" "}
          doesn't exist.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
