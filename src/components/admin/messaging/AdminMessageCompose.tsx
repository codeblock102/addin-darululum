
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

export const AdminMessageCompose = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">New Message</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-8 text-muted-foreground">
          <p>Message composition is currently unavailable.</p>
          <p className="text-sm mt-2">The communications table has been removed.</p>
        </div>
      </CardContent>
    </Card>
  );
};
