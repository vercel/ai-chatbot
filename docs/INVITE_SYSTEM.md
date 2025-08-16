# Invite-Only System Documentation

## Overview
This application now requires an invitation to register. Only administrators can send invitations, and each invitation is single-use with an expiration date.

## Initial Setup

### 1. Run Database Migration
First, apply the database changes to add the invitation system:

```bash
# If using migrations
npx drizzle-kit push

# Or run the SQL directly
psql $DATABASE_URL < lib/db/migrations/add-invitations.sql
```

### 2. Make Yourself an Admin
Connect to your database and update your user record:

```sql
UPDATE "User" 
SET "isAdmin" = true 
WHERE email = 'your-email@example.com';
```

### 3. Access Admin Dashboard
Navigate to `/admin` to access the invitation management interface.

## How It Works

### For Administrators
1. **Send Invitations**: Go to `/admin` and click "Send Invitation"
2. **Manage Invitations**: View all sent invitations and their status
3. **Revoke Access**: Cancel pending invitations if needed

### For New Users
1. **Receive Invitation**: Get an invitation link from an administrator
2. **Click Registration Link**: The link includes a unique token
3. **Create Account**: Fill in the registration form (email must match invitation)
4. **Access Granted**: Once registered, full access to the application

### Invitation States
- **Pending**: Invitation sent but not yet used
- **Accepted**: User successfully registered
- **Expired**: Past the expiration date
- **Revoked**: Manually cancelled by an admin

## Security Features
- Invitations are single-use only
- Tokens are unique and cryptographically secure
- Expired invitations cannot be used
- Email must match the invitation
- Registration page requires valid token

## Environment Variables
No additional environment variables are required. The system uses your existing database connection.

For production email sending, you'll need to add:
```env
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=resend # or sendgrid, etc.
EMAIL_API_KEY=your-api-key
```

## API Endpoints

### `POST /api/invitations`
Create a new invitation (admin only)

### `GET /api/invitations`
List all invitations created by the current user

### `DELETE /api/invitations?token={token}`
Revoke a specific invitation (admin only)

### `POST /api/invitations/validate`
Validate an invitation token

## Customization

### Invitation Expiry
Default is 7 days. Modify in the invitation dialog or API:
```javascript
createInvitation({
  email: "user@example.com",
  invitedBy: userId,
  expiresInDays: 14 // Custom expiry
})
```

### Email Templates
Currently shows the invite URL directly. For production, implement email sending in `/api/invitations/route.ts`:
```javascript
// TODO: Send invitation email here
await sendEmail({
  to: email,
  subject: "You're invited!",
  template: "invitation",
  data: { inviteUrl, expiresAt }
});
```

## Troubleshooting

### "Invalid invitation token"
- Token doesn't exist or has been used
- Check if invitation was revoked

### "Invitation has expired"
- The invitation link is past its expiration date
- Request a new invitation from an admin

### "Email must match the invitation"
- The email entered doesn't match the invited email
- Use the exact email address that received the invitation

## Model Management (New!)

Administrators can now control which AI models are available to users:

### Features
- **Enable/Disable Models**: Turn models on/off for all users
- **Custom Names**: Override default model names
- **Custom Descriptions**: Provide custom descriptions
- **Tier Restrictions**: Limit models to specific user tiers
- **Hidden Models**: Hide models from prominent display

### Usage
1. Go to `/admin`
2. Scroll to "Model Management" section
3. Toggle models on/off with the switch
4. Click "Edit" to customize names, descriptions, and tiers
5. Use "Hidden" to make models less prominent

### Database Migration
```bash
# Run the model settings migration
psql $DATABASE_URL < lib/db/migrations/add-model-settings.sql
```

## Future Enhancements
- [ ] Email sending integration
- [ ] Bulk invitation sending
- [ ] User invitation limits
- [ ] Invitation analytics
- [ ] Customizable expiration periods
- [ ] Allow regular users to invite (with limits)
- [x] Model enable/disable controls
- [ ] Model usage analytics
- [ ] Custom model pricing display