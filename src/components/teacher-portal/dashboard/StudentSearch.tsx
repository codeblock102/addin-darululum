
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User } from "lucide-react";

interface StudentSearchProps {
  teacherId: string;
}

export const StudentSearch = ({ teacherId }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    console.log("Searching for:", searchQuery);
    // Implement search functionality
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Student Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2 p-2 border rounded">
              <User className="h-4 w-4" />
              <span>No students found for "{searchQuery}"</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
