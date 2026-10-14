import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthValue {
  session: Session | null;
  loading: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  criarConta: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const Ctx = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function entrar(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw traduzErro(error.message);
  }

  async function criarConta(email: string, senha: string) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) throw traduzErro(error.message);
    // Se a confirmação de e-mail estiver desligada, já vem sessão; senão tenta logar.
    if (!data.session) {
      const { error: e2 } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (e2)
        throw new Error(
          "Conta criada. Se o login não entrar sozinho, confirme que a opção “Confirm email” está desligada no Supabase."
        );
    }
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{ session, loading, entrar, criarConta, sair }}>
      {children}
    </Ctx.Provider>
  );
}

function traduzErro(msg: string): Error {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return new Error("E-mail ou senha incorretos.");
  if (m.includes("already registered")) return new Error("Esse e-mail já tem conta. Use “Entrar”.");
  if (m.includes("password")) return new Error("A senha precisa ter pelo menos 6 caracteres.");
  return new Error(msg);
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth fora do AuthProvider");
  return v;
}
