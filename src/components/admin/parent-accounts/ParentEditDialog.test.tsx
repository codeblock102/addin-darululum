import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ParentEditDialog, type ParentMinimal } from "./ParentEditDialog.tsx";
import { supabase } from "@/integrations/supabase/client.ts";

const toastMock = vi.fn();
vi.mock("@/components/ui/use-toast.ts", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const parent: ParentMinimal = {
  id: "p-1",
  name: "Jane Doe",
  email: "jane@example.com",
  student_ids: [],
  phone: "",
};

function renderDialog(p: ParentMinimal | null = parent) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ParentEditDialog parent={p} open={true} onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

describe("ParentEditDialog", () => {
  beforeEach(() => {
    toastMock.mockClear();
    vi.clearAllMocks();
  });

  it("renders the dialog with parent data", () => {
    renderDialog();
    expect(screen.getByText("Edit Parent Profile")).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Doe");
  });

  it("shows toast 'Name is required' when submitting empty name", async () => {
    const user = userEvent.setup();
    renderDialog({ ...parent, name: "" });
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Name is required" }),
      );
    });
  });

  it("shows toast 'Invalid email format' for malformed email", async () => {
    const user = userEvent.setup();
    renderDialog({ ...parent, email: "" });
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "not-an-email");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Invalid email format" }),
      );
    });
  });

  it("calls supabase update when valid name + email submitted", async () => {
    const user = userEvent.setup();
    // Stub eq() to resolve with no error
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      update,
    });

    renderDialog();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("parents");
      expect(update).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith("id", "p-1");
    });
  });
});
