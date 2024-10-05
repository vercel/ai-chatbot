import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const getProjectReference = () => {
  if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not set");
  }

  return process.env.SUPABASE_URL.split(".")[0].split("//")[1];
};

async function executeSQLCommands(commands: Array<string>) {
  for (const command of commands) {
    await fetch(
      `https://api.supabase.com/v1/projects/${getProjectReference()}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          query: command,
        }),
      },
    );
  }
}

async function updateAuthConfig() {
  await fetch(
    `https://api.supabase.com/v1/projects/${getProjectReference()}/config/auth`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        mailer_autoconfirm: true,
      }),
    },
  );
}

async function main() {
  executeSQLCommands([
    // Create the chat table
    'CREATE TABLE IF NOT EXISTS chat (id UUID PRIMARY KEY, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, messages JSONB, "userId" UUID REFERENCES auth.users(id));',

    // Enable row level security
    "ALTER TABLE chat enable row level security;",

    // Create table policies
    'CREATE POLICY "Users can view their own chat rows" ON public.chat FOR SELECT TO authenticated USING ((SELECT auth.uid ()) = "userId");',
    'CREATE POLICY "Users can insert their own chat rows" ON public.chat FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid ()) = "userId");',
    'CREATE POLICY "Users can update their own chat rows" ON public.chat FOR UPDATE TO authenticated USING ((SELECT auth.uid ()) = "userId") WITH CHECK ((SELECT auth.uid ()) = "userId");',
    'CREATE POLICY "Users can delete their own chat rows" ON public.chat FOR DELETE TO authenticated USING ((SELECT auth.uid ()) = "userId");',

    // Create storage bucket
    "INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);",

    // Create bucket policies
    "CREATE POLICY \"Users can select their own files\" ON storage.objects FOR SELECT TO public USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');",
    "CREATE POLICY \"Users can update their own files\" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');",
    "CREATE POLICY \"Users can insert their own files\" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');",
  ]);

  updateAuthConfig();
}

main();
