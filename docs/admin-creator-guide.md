# Admin Creator Guide

## Overview

The Admin Creator lets developers and super-admins create new admin accounts and assign them to a Dār Al-Ulūm Montréal location. Admins created this way can immediately log in with full access to their assigned madrassah's data.

## Access

- **URL:** The Admin Creator is inside the Admin Panel — accessible to existing admins only
- **Route:** Requires admin privileges (`requireAdmin` guard)

---

## Creating a New Admin

### Step 1 — Fill in the form

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

### Step 3 — Share credentials securely

- Share the email and generated password via a secure channel (not plain email)
- Encourage the new admin to change their password after first login (`/profile` → Change Password)

---

## Prerequisites

### Madrassah locations must exist

Before creating admin accounts, ensure at least one madrassah is in the database. If running from scratch:

```sql
INSERT INTO madrassahs (id, name, location, section, created_at) VALUES
  (gen_random_uuid(), 'Dār Al-Ulūm Montréal', 'Montréal', ARRAY['Boys', 'Girls'], NOW())
ON CONFLICT (id) DO NOTHING;
```

### Required Supabase secrets

The `create-admin` edge function needs these in your Supabase project secrets:

```
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Managing Existing Admins

The Admin Creator page shows all existing admin accounts with:
- Name and email
- Assigned madrassah
- Account creation date
- Delete button (requires confirmation)

Deleting an admin removes their auth user and profile row. This is irreversible.

---

## Security Notes

- Admin accounts are created server-side via the `create-admin` edge function using the service role key — no client-side auth admin calls
- Each admin can only see data where `madrassah_id` matches their profile (enforced by RLS)
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
| Admin can't see their data after login | Profile `madrassah_id` mismatch | Check profile row in Supabase; ensure madrassah_id is set correctly |
