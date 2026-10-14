import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anon);

// Cliente único. Se faltar configuração, criamos mesmo assim com placeholders
// para não quebrar o import — a tela de login avisa o que configurar.
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anon ?? "placeholder-anon-key"
);

export const RECIBOS_BUCKET = "recibos";
