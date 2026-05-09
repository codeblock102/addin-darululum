import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TeacherEditDialog } from "./TeacherEditDialog.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import type { TeacherAccount } from "@/types/teacher.ts";

const toastMock = vi.fn();
vi.mock("@/components/ui/use-toast.ts", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const teacher: TeacherAccount = {
  id: "t-1",
  name: "Ali Khan",
  subject: "Quran",
  email: "ali@example.com",
  phone: "",
  bio: "",
  section: "Saint-Laurent",
  userId: "u-1",
  role: "teacher",
  status: "active",
  lastLogin: null,
  classesCount: 0,
  studentsCount: 0,
};

function renderDialog(t: TeacherAccount = teacher) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TeacherEditDialog teacher={t} open={true} onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

describe("TeacherEditDialog", () => {
  beforeEach(() => {
    toastMock.mockClear();
    vi.clearAllMocks();
  });

  it("renders the dialog with teacher data", () => {
    renderDialog();
    expect(screen.getByText("Edit Teacher Account")).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ali Khan");
    expect(screen.getByLabelText(/^subject$/i)).toHaveValue("Quran");
  });

  it("shows 'Name is required' on empty name", async () => {
    const user = userEvent.setup();
    renderDialog({ ...teacher, name: "" });
    // First button matching "Save Changes" is the submit
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Name is required" }),
      );
    });
  });

  it("shows 'Invalid email format' for malformed email", async () => {
    const user = userEvent.setup();
    renderDialog({ ...teacher, email: "" });
    const emailInput = screen.getByLabelText(/^email$/i);
    await user.type(emailInput, "bad-email");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Invalid email format" }),
      );
    });
  });

  it("shows 'Subject is required' when subject is empty", async () => {
    const user = userEvent.setup();
    renderDialog({ ...teacher, subject: "" });
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Subject is required" }),
      );
    });
  });

  it("calls supabase update with valid name + subject + email", async () => {
    const user = userEvent.setup();
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      update,
    });

    renderDialog();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(update).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith("id", "t-1");
    });
  });
});
