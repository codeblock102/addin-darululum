import { useEffect, useState } from "react";
import { Copy, Edit2, FileText, Plus, Trash2, X, Check } from "lucide-react";
import { AdminPageShell, AdminPrimaryBtn } from "@/components/admin/AdminPageShell.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import {
  useCommunicationTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  type CommunicationTemplate,
  type TemplateCategory,
} from "@/hooks/useCommunicationTemplates.ts";

// ─── Category config ───────────────────────────────────────────────────────────

type CategoryFilter = "all" | TemplateCategory;

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "absence", label: "Absence" },
  { value: "progress", label: "Progress" },
  { value: "general", label: "General" },
  { value: "reminder", label: "Reminder" },
];

const CATEGORY_PILL: Record<TemplateCategory, string> = {
  absence: "bg-red-50 text-red-700 ring-1 ring-red-100",
  progress: "bg-green-50 text-green-700 ring-1 ring-green-100",
  general: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  reminder: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
};

// ─── Blank form state ──────────────────────────────────────────────────────────

interface TemplateForm {
  title: string;
  body: string;
  category: TemplateCategory;
}

const BLANK_FORM: TemplateForm = { title: "", body: "", category: "general" };

// ─── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: CommunicationTemplate;
  onEdit: (t: CommunicationTemplate) => void;
  onDelete: (t: CommunicationTemplate) => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.body);
      setCopied(true);
      toast({ title: "Copied to clipboard", description: `"${template.title}" body copied.` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{template.title}</h3>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 capitalize ${CATEGORY_PILL[template.category]}`}
        >
          {template.category}
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{template.body}</p>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy body"
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => onEdit(template)}
          title="Edit template"
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(template)}
          title="Delete template"
          className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Template dialog ───────────────────────────────────────────────────────────

function TemplateDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: CommunicationTemplate;
}) {
  const { toast } = useToast();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  const [form, setForm] = useState<TemplateForm>(
    initial ? { title: initial.title, body: initial.body, category: initial.category } : BLANK_FORM
  );

  // Sync when dialog re-opens with different template
  useEffect(() => {
    setForm(initial ? { title: initial.title, body: initial.body, category: initial.category } : BLANK_FORM);
  }, [initial?.id]);

  const isEditing = !!initial;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: "Missing fields", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    try {
      if (isEditing && initial) {
        await updateMutation.mutateAsync({ id: initial.id, ...form });
        toast({ title: "Template updated", description: `"${form.title}" saved.` });
      } else {
        await createMutation.mutateAsync(form);
        toast({ title: "Template created", description: `"${form.title}" added.` });
      }
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-title">Title</Label>
            <Input
              id="tpl-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Absence Follow-Up"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-category">Category</Label>
            <select
              id="tpl-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TemplateCategory }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {(["absence", "progress", "general", "reminder"] as TemplateCategory[]).map((c) => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-body">Body</Label>
            <Textarea
              id="tpl-body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Use [Placeholders] for dynamic values like [Student Name], [Parent Name]..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-gray-400">
              Use square brackets for placeholders, e.g. [Student Name], [Date].
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-green-800 hover:bg-green-700 text-white"
            >
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const CommunicationTemplates = () => {
  const { data: templates = [], isLoading } = useCommunicationTemplates();
  const deleteMutation = useDeleteTemplate();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | undefined>(undefined);
  const [deletingTemplate, setDeletingTemplate] = useState<CommunicationTemplate | undefined>(undefined);

  const filtered =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  const openNew = () => {
    setEditingTemplate(undefined);
    setDialogOpen(true);
  };

  const openEdit = (t: CommunicationTemplate) => {
    setEditingTemplate(t);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(undefined);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.id);
      toast({ title: "Template deleted", description: `"${deletingTemplate.title}" removed.` });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setDeletingTemplate(undefined);
    }
  };

  return (
    <>
      <AdminPageShell
        title="Communication Templates"
        subtitle="Manage preset message templates for parent communications"
        icon={<FileText className="h-5 w-5 text-green-700" />}
        iconBg="bg-green-50"
        actions={
          <AdminPrimaryBtn onClick={openNew}>
            <Plus className="h-4 w-4" />
            New Template
          </AdminPrimaryBtn>
        }
      >
        {/* Category filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveCategory(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === value
                  ? "bg-green-800 text-white border-green-800 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {filtered.length} template{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No templates yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeCategory === "all"
                ? "Click \"New Template\" to add your first template."
                : `No ${activeCategory} templates found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={openEdit}
                onDelete={setDeletingTemplate}
              />
            ))}
          </div>
        )}
      </AdminPageShell>

      {/* Create / Edit dialog */}
      <TemplateDialog
        open={dialogOpen}
        onClose={closeDialog}
        initial={editingTemplate}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(v) => { if (!v) setDeletingTemplate(undefined); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingTemplate?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommunicationTemplates;
