# Developer Admin Creator Guide

## Overview

The Developer Admin Creator is a powerful tool that allows developers to create admin accounts and assign them to specific Dār Al-Ulūm Montréal locations. This functionality is designed for developers to set up administrative access for different Dār Al-Ulūm Montréal locations in the system.

## Access

The Admin Creator is accessible through the admin panel at:
- URL: `/admin/admin-creator`
- Navigation: Admin Panel → Admin Creator

**Note:** This page requires admin privileges to access.

## Features

### 1. Create Admin Accounts
- **Instant Access**: Created admin accounts can be used immediately
- **Auto-confirmation**: Email addresses are automatically confirmed
- **Secure Passwords**: Generate secure passwords with the built-in generator
- **Full Profile Setup**: Complete profile is created with proper role assignment

### 2. Dār Al-Ulūm Montréal Assignment
- **Select from Existing**: Choose from available Dār Al-Ulūm Montréal locations in the system
- **Proper Linking**: Admin is properly linked to their assigned Dār Al-Ulūm Montréal location
- **Access Control**: Admin gets access only to their assigned madrassah's data

### 3. Account Management
- **View Existing Admins**: See all currently created admin accounts
- **Dār Al-Ulūm Montréal Information**: View which Dār Al-Ulūm Montréal location each admin is assigned to
- **Account Deletion**: Remove admin accounts when no longer needed
- **Creation Tracking**: See when each admin account was created

## How to Use

### Step 1: Access the Admin Creator
1. Log in with an admin account
2. Go to the Admin Panel
3. Click on "Admin Creator" in the navigation

### Step 2: Create a New Admin
1. Fill in the required information:
   - **Full Name**: The admin's complete name
   - **Email Address**: Must be a valid email (will be the login username)
   - **Password**: Must be at least 6 characters (use the generator for security)
   - **Dār Al-Ulūm Montréal Assignment**: Select from the dropdown list

2. Click "Create Admin Account"

### Step 3: Share Credentials
- The admin account is ready to use immediately
- Share the email and password with the new admin
- They can log in at the main login page

### Step 4: First Login (for the new admin)
- Go to the main application login page
- Enter the provided email and password
- The admin will have full access to their assigned Dār Al-Ulūm Montréal location's data

## Database Setup

### Ensure Dār Al-Ulūm Montréal Locations Exist
Before creating admin accounts, make sure you have madrassahs in your database. You can use the sample data:

```sql
-- Run this in your Supabase SQL editor
INSERT INTO madrassahs (id, name, location, section, created_at) VALUES
  (gen_random_uuid(), 'Jamia Dār Al-Ulūm Montréal', 'Montréal', ARRAY['Boys', 'Girls'], NOW()),
  (gen_random_uuid(), 'Madrassa Al-Noor', 'Chicago', ARRAY['Boys'], NOW()),
  (gen_random_uuid(), 'Darul Hadith Institute', 'Los Angeles', ARRAY['Boys', 'Girls'], NOW()),
  (gen_random_uuid(), 'Al-Fatah Academy', 'Houston', ARRAY['Girls'], NOW()),
  (gen_random_uuid(), 'Baitul Ilm Institute', 'Philadelphia', ARRAY['Boys', 'Girls'], NOW())
ON CONFLICT (id) DO NOTHING;
```

### Required Permissions
The admin creator requires:
- Admin privileges in the application
- Supabase auth admin access (handled automatically through service role)

## Security Considerations

### Password Security
- Use the password generator for secure passwords
- Passwords must be at least 6 characters
- Share credentials securely with new admins
- Encourage admins to change their password after first login

### Access Control
- Created admins only have access to their assigned Dār Al-Ulūm Montréal location
- Admin accounts have full privileges within their Dār Al-Ulūm Montréal location
- Developers should only create accounts for trusted individuals

### Account Management
- Regularly review created admin accounts
- Remove accounts that are no longer needed
- Monitor admin activity through the system logs

## Troubleshooting

### Common Issues

**1. "Failed to create user account"**
- Check if the email is already in use
- Ensure password meets minimum requirements
- Verify admin permissions

**2. "Failed to create profile"**
- Check database connectivity
- Ensure Dār Al-Ulūm Montréal location ID is valid
- Verify profiles table permissions

**3. "No Dār Al-Ulūm Montréal locations available"**
- Run the sample Dār Al-Ulūm Montréal locations SQL script
- Check if Dār Al-Ulūm Montréal locations table exists
- Verify data in the Dār Al-Ulūm Montréal locations table

### Getting Help
- Check the browser console for detailed error messages
- Verify database permissions in Supabase
- Contact the development team for assistance

## Best Practices

1. **Plan Admin Structure**: Determine how many admins each Dār Al-Ulūm Montréal location needs
2. **Use Strong Passwords**: Always use the password generator
3. **Document Access**: Keep a record of created admin accounts
4. **Regular Cleanup**: Remove unused admin accounts periodically
5. **Test Access**: Verify each created admin can log in successfully
6. **Secure Communication**: Share credentials through secure channels only

## Example Workflow

1. **Preparation**
   - Ensure madrassahs exist in database
   - Have admin contact information ready

2. **Account Creation**
   - Access Admin Creator page
   - Fill form with admin details
   - Generate secure password
   - Select appropriate madrassah
   - Create account

3. **Communication**
   - Securely share credentials with new admin
   - Provide brief orientation on system access
   - Encourage password change on first login

4. **Verification**
   - Confirm admin can log in successfully
   - Verify access to correct madrassah data
   - Test basic functionality

This tool streamlines the process of setting up administrative access for different madrassahs while maintaining proper security and access controls. 