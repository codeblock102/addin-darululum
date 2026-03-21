import { Badge } from "@/components/ui/badge.tsx";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function getQualityBadge(quality?: string) {
  if (!quality) return null;

  let variant: BadgeVariant = "outline";
  switch (quality) {
    case "excellent":
      variant = "default";
      break;
    case "good":
      variant = "secondary";
      break;
    case "average":
      variant = "outline";
      break;
    case "poor":
      variant = "destructive";
      break;
    case "unsatisfactory":
      variant = "destructive";
      break;
  }

  return <Badge variant={variant}>{quality}</Badge>;
}
