// src/lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;

export const supabaseServer = () =>
  createClient(supabaseUrl, supabaseServiceKey);
