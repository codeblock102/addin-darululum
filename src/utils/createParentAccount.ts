import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client.ts";

export interface CreateParentInput {
  name: string;
  email: string;
  password: string;
  madrassahId?: string | null;
  phone?: string | null;
  address?: string | null;
  studentIds?: string[];
}

export interface CreateParentResult {
  success: boolean;
  message: string;
  parentProfileId?: string;
  userId?: string;
}

export async function createParentWithAccount(
  input: CreateParentInput,
): Promise<CreateParentResult> {
  const { name, email, password, madrassahId, phone, address, studentIds } = input;

  try {
    // Resolve madrassah_id from the currently authenticated admin (fallback to provided value)
    let resolvedMadrassahId: string | null = madrassahId || null;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (currentUserId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("madrassah_id, role")
          .eq("id", currentUserId)
          .maybeSingle();
        if (profile?.madrassah_id) {
          // Always use the admin's madrassah_id when available
          resolvedMadrassahId = profile.madrassah_id as string;
        }
      }
    } catch (e) {
      console.warn("Could not resolve admin madrassah_id; falling back:", e);
    }

    // 1) Primary path: invoke
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    let userId: string | undefined;
    try {
      const { data, error } = await supabase.functions.invoke("create-parent", {
        body: {
          email,
          password,
          name,
          madrassah_id: resolvedMadrassahId,
          phone: phone || null,
          address: address || null,
          student_ids: studentIds || [],
        },
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      if (error) throw error;
      userId = data?.user?.id;
    } catch (invokeErr) {
      console.error("functions.invoke failed, falling back to fetch:", invokeErr);
    } finally {
      clearTimeout(timeoutId);
    }

    // 2) Fallback: direct fetch to Functions URL if invoke failed/aborted
    if (!userId) {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-parent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          name,
          madrassah_id: resolvedMadrassahId,
          phone: phone || null,
          address: address || null,
          student_ids: studentIds || [],
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Edge function HTTP ${resp.status}: ${txt}`);
      }
      const json = await resp.json();
      userId = json?.user?.id;
    }

    return {
      success: true,
      message: "Parent account created.",
      parentProfileId: userId,
      userId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createParentWithAccount error:", message);
    return { success: false, message };
  }
}

export async function linkParentToStudents(
  parentId: string,
  studentIds: string[],
): Promise<{ success: boolean; message: string }> {
  try {
    if (!parentId || studentIds.length === 0) {
      return { success: false, message: "Parent and at least one student required" };
    }

    // Update consolidated parents table
    const { error } = await (supabase as any)
      .from("parents")
      .update({ student_ids: studentIds })
      .eq("id", parentId);
    if (error) throw error;
    return { success: true, message: "Parent linked to students." };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("linkParentToStudents error:", message);
    return { success: false, message };
  }
}


