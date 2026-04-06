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

### Steps to Configure:

1. Go to your Supabase Dashboard
2. Select your project
3. Go to Settings > Edge Functions
4. Click on the `generate-analysis` function
5. Add the above secrets in the "Secrets" section
6. Deploy

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

