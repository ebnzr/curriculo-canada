# Deployment Guide for CanadaPath

## Environment Variables Required for Supabase Edge Functions

The `generate-analysis` Edge Function requires the following environment variables to be set in your Supabase project:

### In Supabase Dashboard (Project Settings > Edge Function Secrets):

1. **GROQ_API_KEY** - Your Groq API key
   - Get from: https://console.groq.com/

2. **GEMINI_API_KEY** - Your Google Gemini API key
   - Get from: https://makersuite.google.com/app/apikey

3. **DEEPSEEK_API_KEY** (Optional) - Your DeepSeek API key
   - Get from: https://platform.deepseek.com/

4. **SUPABASE_URL** - Your Supabase project URL
   - Format: `https://<project-ref>.supabase.co`

5. **SUPABASE_SERVICE_ROLE_KEY** - Your service role key
   - Get from: Supabase Dashboard > Settings > API > service_role key

### Steps to Configure:

1. Go to your Supabase Dashboard
2. Select your project
3. Go to Settings > Edge Functions
4. Click on the `generate-analysis` function
5. Add the above secrets in the "Secrets" section
6. Deploy

## Deploying Edge Functions

### ⚠️ IMPORTANT: JWT Verification

For OAuth authentication (Google login) to work correctly, you **MUST** deploy with the `--no-verify-jwt` flag:

```bash
npx supabase functions deploy generate-analysis --no-verify-jwt
```

This disables JWT verification at the Gateway level (Kong) and allows the Edge Function to handle authentication manually. This is required because:

- OAuth tokens from Google may fail Gateway validation due to clock skew
- The Edge Function implements custom JWT verification logic
- Allows fallback to manual JWT decoding if Supabase API fails

### Standard Deploy Command

```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy generate-analysis --no-verify-jwt

# Deploy with project reference
npx supabase functions deploy generate-analysis --no-verify-jwt --project-ref <your-project-ref>
```

## CORS Configuration

The Edge Function is configured to allow all origins in development (`*`):

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
```

**For production**, update the CORS headers to your specific domain:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://canadapath.ai",  // Your production domain
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
```

## Local Development

For local development with `supabase start`:

1. Create a `.env.local` file in the project root with:
```
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cnJpY3Vsb2NhbmFkYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OTQ4NzA4MzIsImV4cCI6MTk5OTA0NjgzMn0.DEd1-b3RqSKeDkrVZlFXx7G7v7z4vxY5yJ9vZ9qZ9qE
```

2. Run:
```bash
supabase start
npm run dev
```

## Troubleshooting

### Error: "Invalid JWT" (401)

**Cause**: Gateway JWT verification failing for OAuth tokens.

**Solution**: 
```bash
npx supabase functions deploy generate-analysis --no-verify-jwt
```

See detailed documentation: [docs/ERRO_401_JWT_RESOLVIDO.md](./docs/ERRO_401_JWT_RESOLVIDO.md)

### Error: "Failed to fetch" / CORS error

**Cause**: CORS headers not matching request origin.

**Solution**: Check that `Access-Control-Allow-Origin` in the Edge Function matches your frontend URL.

### Error: "Edge Function returned a non-2xx status code"

**Cause**: Various - check Edge Function logs.

**Solution**:
```bash
# View logs
npx supabase functions logs generate-analysis

# Tail logs in real-time
npx supabase functions logs generate-analysis --tail
```

### Error: "User profile not found" (404)

**Cause**: User authenticated but profile doesn't exist in database.

**Solution**: Ensure the `profiles` table has a row for the user with `is_premium` field.

### Error: "Premium subscription required" (403)

**Cause**: User doesn't have `is_premium = true` in profiles table.

**Solution**: After successful payment, webhook should update `is_premium` to `true`.

## Database Schema Requirements

### profiles table
```sql
create table profiles (
  id uuid references auth.users primary key,
  email text,
  is_premium boolean default false,
  cpf text,
  phone text,
  current_city text,
  updated_at timestamp with time zone
);
```

### analyses table
```sql
create table analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  original_text text,
  ats_score integer,
  critical_flaws jsonb,
  generated_resume text,
  ats_review text,
  suggested_jobs jsonb,
  created_at timestamp with time zone default now()
);
```

## Environment Variables for Frontend

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173  # Change for production
```

## Production Checklist

- [ ] All Edge Functions deployed with `--no-verify-jwt`
- [ ] Environment variables configured in Supabase Dashboard
- [ ] CORS headers updated to production domain
- [ ] Database tables created with correct schema
- [ ] Row Level Security (RLS) policies configured
- [ ] Payment webhook configured (AbacatePay)
- [ ] Tested OAuth login flow end-to-end
- [ ] Tested payment flow end-to-end
- [ ] Tested resume generation flow end-to-end

## Support

For detailed error documentation, see:
- [docs/ERRO_401_JWT_RESOLVIDO.md](./docs/ERRO_401_JWT_RESOLVIDO.md) - JWT/OAuth authentication errors
- [SPEC.md](./SPEC.md) - Technical specification
- [PRD.md](./PRD.md) - Product requirements
