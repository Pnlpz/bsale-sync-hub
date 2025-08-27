# Testing Store Setup and Invitation Fix

## Issue Fixed
The "No se pudo identificar la tienda" error occurred because locatario users didn't automatically get a store created when they registered. This has been fixed with automatic store creation.

## What Was Added

### 1. StoreSetupService (`src/services/store-setup-service.ts`)
- **`createStoreForUser()`**: Creates a new store for a locatario
- **`ensureUserHasStore()`**: Gets existing store or creates one if needed
- **`getUserStore()`**: Retrieves user's store information

### 2. useStoreSetup Hook (`src/hooks/useStoreSetup.ts`)
- React hook wrapper for the StoreSetupService
- Provides loading states and error handling
- Integrates with React Query for caching

### 3. Enhanced InviteProviderDialog
- Automatically creates store if user doesn't have one
- Better error handling and user feedback
- Shows store information in the dialog

## Testing Steps

### Step 1: Test with New Locatario User
1. **Register a new locatario account** or use an existing one without a store
2. **Navigate to the Dashboard**
3. **Click "Invitar Proveedor"**

Expected behavior:
- If no store exists, the system automatically creates one
- You should see a toast: "Tienda configurada: Tienda de [Your Name]"
- The invitation dialog should show the store name
- The invitation should be sent successfully

### Step 2: Test with Existing Store
1. **Use a locatario account that already has a store**
2. **Click "Invitar Proveedor"**

Expected behavior:
- Should use the existing store
- No "store configured" toast (since store already exists)
- Invitation should be sent successfully

### Step 3: Test Store Information Display
1. **Open the invitation dialog**
2. **Check the blue info box at the bottom**

Expected behavior:
- Should show "Tienda: [Store Name]"
- Should explain that the provider will have access to this store

## Console Logs to Watch

When testing, watch the browser console for:
```
Invitation Debug: {
  currentStoreId: "...",
  currentStore: {...},
  profile: {...},
  profileStoreId: "..."
}
```

If no store initially:
```
No store ID found, attempting to ensure user has a store...
Store created/found: { id: "...", name: "...", ... }
```

## Database Changes

The system will create:
1. **New store record** in `stores` table with:
   - `name`: "Tienda de [User Name]"
   - `address`: "Dirección por definir"
   - `locatario_id`: User's profile ID

2. **Updated profile** with `store_id` pointing to the new store

## Error Scenarios Handled

### 1. User Not Authenticated
- Error: "User not authenticated"
- Solution: Redirect to login

### 2. Profile Not Found
- Error: "User profile not found"
- Solution: Check user registration process

### 3. Non-Locatario User
- Error: "Only locatarios can create stores"
- Solution: Verify user role

### 4. Database Errors
- Various database-related errors
- Solution: Check database permissions and schema

## Fallback Mechanisms

1. **Store Context**: Uses `currentStoreId` if available
2. **Profile Store ID**: Falls back to `profile.store_id`
3. **Automatic Creation**: Creates store if none exists
4. **Store Lookup**: Finds existing store by `locatario_id`

## Success Indicators

✅ **No more "No se pudo identificar la tienda" error**
✅ **Automatic store creation for new locatarios**
✅ **Proper store information display in dialog**
✅ **Successful invitation sending**
✅ **Toast notifications for user feedback**

## Next Steps After Testing

1. **Test invitation acceptance workflow**
2. **Verify provider can access the store**
3. **Test with multiple stores (future feature)**
4. **Configure real email service**
5. **Apply multi-tenant migration for full functionality**

## Troubleshooting

If issues persist:

1. **Check browser console** for error messages
2. **Verify database schema** matches migration files
3. **Check user role** in profiles table
4. **Verify RLS policies** allow store creation
5. **Test with fresh user account**

The store setup should now work automatically, and locatarios should be able to send invitations without the "store not found" error.
