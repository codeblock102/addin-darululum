
import { ClassFormData } from "./validation/classFormSchema";

interface ClassListProps {
  searchQuery: string;
  onEdit: (classItem?: Partial<ClassFormData> & { id: string }) => void;
}

export const ClassList = ({ searchQuery, onEdit }: ClassListProps) => {
  return (
    <div className="p-4">
      <p>Class list for search: {searchQuery}</p>
      <button onClick={() => onEdit()}>Edit</button>
    </div>
  );
};
