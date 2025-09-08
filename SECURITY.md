# Security Guide for Pre-wedding Look AI

## 🔐 Authentication & Database Security

### 1. Environment Variables Security

**IMPORTANT**: Your `.env` file contains sensitive credentials and should NEVER be committed to version control.

#### Current Setup:
```
GEMINI_API_KEY=your_actual_key_here
VITE_SUPABASE_URL=your_supabase_url_here  
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Security Measures Implemented:

✅ **Environment variables are secured:**
- `.env` files are added to `.gitignore`
- No hardcoded credentials in source code
- Proper error handling for missing environment variables

✅ **Client-side safety:**
- Only anon key is exposed to client (this is safe by design)
- Service role key is never used client-side
- RLS (Row Level Security) protects all database operations

✅ **Database security:**
- Row Level Security enabled on all tables
- Users can only access their own data
- Proper authentication checks on all operations

### 2. Supabase Security Best Practices

#### What's Safe to Expose:
- ✅ `VITE_SUPABASE_URL` - Your project URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Anon/public key (limited permissions)

#### What's NEVER Safe to Expose:
- ❌ Service role key
- ❌ Database direct access credentials
- ❌ JWT secrets

#### Database Permissions:
- **Anon role**: Can only read public data
- **Authenticated role**: Can access user's own data only
- **RLS policies**: Enforce data isolation between users

### 3. Current Security Features

#### Authentication:
- Email/password authentication via Supabase Auth
- Automatic session management
- Secure password requirements (min 6 characters)
- Email verification on signup

#### Data Protection:
- All user data is isolated by user ID
- Images and projects are private to each user
- No cross-user data access possible

#### Error Handling:
- Graceful error boundaries
- No sensitive information in error messages
- Proper loading states to prevent UI crashes

### 4. Production Deployment Security

When deploying to production:

1. **Environment Variables:**
   - Use your hosting platform's environment variable system
   - Never commit production credentials
   - Rotate keys periodically

2. **Domain Security:**
   - Configure allowed domains in Supabase dashboard
   - Set up proper CORS policies
   - Use HTTPS only

3. **Monitoring:**
   - Monitor authentication logs
   - Set up alerts for suspicious activity
   - Regular security audits

### 5. Common Security Mistakes to Avoid

❌ **Don't do this:**
- Commit `.env` files to Git
- Use service role key in client-side code
- Hardcode credentials in source code
- Disable RLS on production tables

✅ **Do this:**
- Use environment variables properly
- Keep service keys on server only  
- Enable RLS on all user tables
- Regularly rotate API keys

### 6. Emergency Procedures

If credentials are accidentally exposed:

1. **Immediately rotate the exposed keys:**
   - Go to Supabase Dashboard → Settings → API
   - Generate new keys
   - Update your environment variables

2. **Check for unauthorized access:**
   - Review authentication logs
   - Check for suspicious user registrations
   - Monitor database activity

3. **Update your application:**
   - Deploy with new credentials
   - Force re-authentication if needed

## 📞 Support

If you suspect a security issue:
1. Change your credentials immediately
2. Check Supabase audit logs
3. Contact Supabase support if needed

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update your security practices.