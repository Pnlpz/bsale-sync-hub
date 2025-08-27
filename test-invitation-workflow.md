# Testing the Invitation Workflow

## Overview
The locatario dashboard now includes functionality to invite proveedores (suppliers) directly from the dashboard. Here's how to test the complete workflow:

## Step 1: Access the Dashboard as Locatario

1. **Navigate to the application**: http://localhost:8080
2. **Login or register as a locatario user**
3. **Go to the Dashboard**

You should see:
- A prominent "Invitar Proveedor" button in the top-right corner of the dashboard header
- A "Gestión de Proveedores" card with invitation options

## Step 2: Send an Invitation

1. **Click the "Invitar Proveedor" button** (either in the header or in the provider management card)
2. **Enter the proveedor's email address** in the dialog that opens
3. **Click "Enviar Invitación"**

Expected behavior:
- The system creates an invitation record in the database
- A mock email is "sent" (logged to console since we're using a mock email service)
- You'll see a success toast notification
- The invitation URL will be logged to the browser console for testing

## Step 3: Test the Invitation Acceptance

1. **Open the browser console** and look for the invitation URL
2. **Copy the invitation URL** (it will look like: `http://localhost:8080/invitation/accept?token=...`)
3. **Open the invitation URL in a new browser tab/window**
4. **Fill out the provider registration form**:
   - Enter the provider's full name
   - Create a password (minimum 6 characters)
   - Confirm the password
5. **Click "Crear cuenta y aceptar invitación"**

Expected behavior:
- The provider account is created
- The invitation is marked as accepted
- The provider is automatically logged in
- The provider gains access to the store

## Step 4: Verify Provider Access

After the provider accepts the invitation:

1. **The provider should be redirected to their dashboard**
2. **The provider should see store-specific information**
3. **The locatario can see the provider in their store management**

## Features Included

### For Locatarios:
- ✅ **Dashboard Integration**: Invite button prominently displayed
- ✅ **Quick Actions Card**: Provider management section with invite options
- ✅ **Email Validation**: Ensures valid email addresses
- ✅ **Error Handling**: Handles duplicate invitations and other errors
- ✅ **Success Feedback**: Clear confirmation when invitation is sent

### For Proveedores:
- ✅ **Invitation-Only Registration**: Cannot self-register, must be invited
- ✅ **Secure Token System**: Invitations expire after 72 hours
- ✅ **Account Creation**: Guided process to create account from invitation
- ✅ **Automatic Store Access**: Immediate access to the store upon acceptance

### System Features:
- ✅ **Database Integration**: Proper invitation tracking and management
- ✅ **Multi-Store Support**: Works with the multi-tenant architecture
- ✅ **Email Notifications**: Mock email system (ready for real email service)
- ✅ **Security**: Secure token generation and validation

## Testing Scenarios

### Happy Path:
1. Locatario sends invitation → Success
2. Proveedor receives invitation → Success
3. Proveedor accepts invitation → Success
4. Proveedor gains store access → Success

### Error Scenarios:
1. **Invalid Email**: Try entering an invalid email address
2. **Duplicate Invitation**: Try inviting the same email twice
3. **Expired Token**: Test with an expired invitation token
4. **Missing Store Context**: Test without proper store setup

## Console Logs to Watch For

When testing, watch the browser console for:
- `🔗 Invitation URL: http://localhost:8080/invitation/accept?token=...`
- `📧 Sending invitation email:` (from EmailService)
- `Sales sync initiated:` (if testing other features)
- Any error messages or debugging information

## Database Records

The invitation system creates records in:
- `invitations` table: Tracks invitation status and details
- `store_providers` table: Links providers to stores after acceptance
- `profiles` table: Creates provider user profiles

## Next Steps

After testing the basic workflow, you can:
1. **Configure Real Email Service**: Replace the mock EmailService with a real email provider
2. **Apply Database Migration**: Run the multi-tenant migration for full functionality
3. **Test Multi-Store Scenarios**: Test providers with access to multiple stores
4. **Customize Email Templates**: Modify the invitation email template
5. **Add Provider Management**: Extend the locatario interface for managing existing providers

## Troubleshooting

If something doesn't work:
1. **Check Browser Console**: Look for error messages or logs
2. **Verify Database**: Ensure tables exist and have proper permissions
3. **Check Network Tab**: Look for failed API requests
4. **Verify User Role**: Ensure you're logged in as a locatario
5. **Check Store Context**: Ensure the user has a valid store association
