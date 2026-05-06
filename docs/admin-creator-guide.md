# Admin & Teacher Account Guide

## Overview

This guide covers how to create and manage admin and teacher accounts in Dār Al-Ulūm Montréal. Understanding the `section` field is critical — it controls which campus's students a staff member can see.

---

## The `section` Field — Campus Scoping

The `section` field on `profiles` determines which students a user can access:

| `section` value | Campus | Students visible |
|---|---|---|
| `null` | Unrestricted | All students in the madrassah |
| `'women'` | Saint-Laurent | Women's campus students only |
| `'Henri-Bourassa'` | Henri-Bourassa | Men's campus students only |

This applies to **both admins and teachers**. A teacher or admin with `section = 'women'` will only see Saint-Laurent students in the student list, attendance form, and progress book. The section dropdown in the attendance form is also hidden for scoped users — their section is locked automatically.

---

## Creating a New Admin Account

### Step 1 — Fill in the form (Admin Panel)

| Field | Notes |
|---|---|
| **Full Name** | Admin's display name |
| **Email Address** | This becomes their login username |
| **Password** | Minimum 6 characters — use the **Generate Password** button for security |
| **Madrassah** | Select from the dropdown (must exist in the `madrassahs` table) |

### Step 2 — Click "Create Admin Account"

The system:
1. Creates an auth user in Supabase (email auto-confirmed, no email verification required)
2. Creates a profile row with `role = "admin"` and links it to the selected madrassah
3. Shows the account in the "Existing Admins" list immediately

### Step 3 — Set section (optional but recommended for campus staff)

After creation, set the section in the Supabase dashboard or via SQL:

```sql
UPDATE public.profiles
SET section = 'women'   -- or 'Henri-Bourassa'
WHERE id = '<user-uuid>';
```

### Step 4 — Share credentials securely

- Share the email and generated password via a secure channel (not plain email)
- Encourage the new admin to change their password after first login (`/profile` → Change Password)

---

## Creating a New Teacher Account

### Via Admin Panel (Teacher Accounts page)

1. Go to **Teacher Accounts** in the sidebar
2. Click **Add Teacher Account**
3. Fill in: name, email, section, subject
4. Check **Create Login Account** and optionally **Generate Password**
5. Click **Create**

The system sets `role = "teacher"` and links the profile to the madrassah.

### Setting section scope

If the teacher should only see one campus, set `section` during creation or update it:

```sql
UPDATE public.profiles
SET section = 'women'        -- Saint-Laurent teacher
WHERE id = '<user-uuid>';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'::jsonb
WHERE id = '<user-uuid>';
```

---

## Demoting / Changing Roles

To change an existing user's role (e.g., admin → teacher):

```sql
-- Update profile role
UPDATE public.profiles
SET role = 'teacher'
WHERE id = '<user-uuid>';

-- Keep auth metadata consistent
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'::jsonb
WHERE id = '<user-uuid>';
```

Always update both `profiles.role` and `auth.users.raw_user_meta_data` for consistency.

---

## Current DUM Staff (as of 2026-05-06)

| Name | Email | Role | Section | Access |
|---|---|---|---|---|
| Mufti Zain | (on file) | admin | null | All students |
| Maimoona Ansari | (on file) | admin | null | All students |
| Sr. Salma | salma@daralulummontreal.com | teacher | women | Saint-Laurent only |
| Ibrahim Toure | (on file) | teacher | Henri-Bourassa | Henri-Bourassa only |

---

## Managing Existing Admins

The Admin Creator page shows all existing admin accounts with:
- Name and email
- Assigned madrassah
- Account creation date
- Delete button (requires confirmation)

Deleting an admin removes their auth user and profile row. This is **irreversible**.

---

## Prerequisites

### Madrassah locations must exist

Before creating accounts, ensure at least one madrassah is in the database:

```sql
INSERT INTO madrassahs (id, name, location, section, created_at) VALUES
  (gen_random_uuid(), 'Dār Al-Ulūm Montréal', 'Montréal', ARRAY['women', 'Henri-Bourassa'], NOW())
ON CONFLICT (id) DO NOTHING;
```

DUM's madrassah ID: `7183e19f-753b-4663-9bb4-6e05287d5afa`

### Required Supabase secrets

The `create-admin` edge function needs:

```
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Security Notes

- Admin and teacher accounts are created server-side via edge functions using the service role key — no client-side auth admin calls
- Each user can only see data where `madrassah_id` matches their profile (enforced by RLS)
- Section scoping is enforced at the query layer — scoped users cannot bypass it by modifying requests
- Passwords must be at least 6 characters; use the generator for production accounts
- Regularly audit the admin list and remove accounts that are no longer needed
- Never share credentials over unencrypted channels

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| "Failed to create user account" | Email already in use, or password too short | Use a different email or longer password |
| "Failed to create profile" | Madrassah ID invalid or DB connectivity issue | Verify madrassahs table has data; check Supabase logs |
| "No madrassah locations available" | `madrassahs` table is empty | Run the INSERT above in the Supabase SQL editor |
| Admin/teacher can't see their data after login | Profile `madrassah_id` mismatch or not set | Check profile row in Supabase; ensure `madrassah_id` is set correctly |
| Teacher sees all students, not just their section | `profiles.section` is null | Set the section field as described above |
| Section dropdown visible when it shouldn't be | `profiles.section` is null | Set the section field — dropdown hides automatically once section is set |
