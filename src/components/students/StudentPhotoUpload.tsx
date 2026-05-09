import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { getInitials } from "@/utils/stringUtils.ts";
import { cn } from "@/lib/utils.ts";

interface StudentPhotoUploadProps {
  studentId: string;
  studentName?: string;
  currentUrl?: string | null;
  onUploaded?: (url: string) => void;
  size?: "sm" | "md" | "lg";
  /** Optional className applied to the outer wrapper */
  className?: string;
  /** When true, disables click-to-upload (display-only) */
  readOnly?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const SIZE_CLASSES: Record<NonNullable<StudentPhotoUploadProps["size"]>, string> = {
  sm: "w-9 h-9 text-sm",
  md: "w-16 h-16 text-lg",
  lg: "w-24 h-24 text-2xl",
};

const ICON_SIZE: Record<NonNullable<StudentPhotoUploadProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export const StudentPhotoUpload = ({
  studentId,
  studentName,
  currentUrl,
  onUploaded,
  size = "md",
  className,
  readOnly = false,
}: StudentPhotoUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentUrl ?? null);

  const initials = getInitials(studentName);

  const handleClick = () => {
    if (readOnly || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be reselected later
    if (e.target) e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please choose a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: "Photo must be smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${studentId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("student-photos")
        .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("student-photos")
        .getPublicUrl(path);

      const bustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("students")
        .update({ photo_url: bustedUrl })
        .eq("id", studentId);
      if (updateErr) throw updateErr;

      setPhotoUrl(bustedUrl);
      onUploaded?.(bustedUrl);
      toast({
        title: "Photo uploaded",
        description: "Student photo updated successfully.",
      });
    } catch (err) {
      console.error("Photo upload failed:", err);
      const message = err instanceof Error ? err.message : "Failed to upload photo";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const sizeClass = SIZE_CLASSES[size];
  const iconClass = ICON_SIZE[size];

  return (
    <div className={cn("inline-block", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={readOnly || isUploading}
        title={readOnly ? undefined : "Upload photo"}
        className={cn(
          "relative group rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0",
          "bg-gradient-to-br from-emerald-600 to-emerald-800",
          sizeClass,
          readOnly ? "cursor-default" : "cursor-pointer hover:ring-2 hover:ring-emerald-400 transition",
          isUploading && "opacity-70",
        )}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={studentName || "Student photo"}
            className="w-full h-full object-cover"
            onError={() => setPhotoUrl(null)}
          />
        ) : (
          <span>{initials}</span>
        )}

        {!readOnly && !isUploading && (
          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload className={cn("text-white", iconClass)} />
          </span>
        )}

        {isUploading && (
          <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className={cn("text-white animate-spin", iconClass)} />
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default StudentPhotoUpload;
