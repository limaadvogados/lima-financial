import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type {
  Assinatura,
  AssinaturaInput,
  Lancamento,
  LancamentoInput,
} from "../lib/types";
import { useAuth } from "./AuthContext";

interface DataValue {
  assinaturas: Assinatura[];
  lancamentos: Lancamento[];
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  salvarLancamento: (input: LancamentoInput, id?: string) => Promise<void>;
  excluirLancamento: (id: string) => Promise<void>;
  marcarReembolsado: (id: string, reembolsado: boolean) => Promise<void>;
  salvarAssinatura: (input: AssinaturaInput, id?: string) => Promise<void>;
  excluirAssinatura: (id: string) => Promise<void>;
}

const Ctx = createContext<DataValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const [a, l] = await Promise.all([
      supabase.from("assinaturas").select("*").order("nome"),
      supabase.from("lancamentos").select("*").order("data", { ascending: false }),
    ]);
    if (a.error || l.error) {
      setErro(a.error?.message || l.error?.message || "Erro ao carregar dados.");
    } else {
      setAssinaturas((a.data ?? []) as Assinatura[]);
      setLancamentos((l.data ?? []) as Lancamento[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) recarregar();
  }, [session, recarregar]);

  async function salvarLancamento(input: LancamentoInput, id?: string) {
    const res = id
      ? await supabase.from("lancamentos").update(input).eq("id", id)
      : await supabase.from("lancamentos").insert(input);
    if (res.error) throw new Error(res.error.message);
    await recarregar();
  }

  async function excluirLancamento(id: string) {
    const res = await supabase.from("lancamentos").delete().eq("id", id);
    if (res.error) throw new Error(res.error.message);
    await recarregar();
  }

  async function marcarReembolsado(id: string, reembolsado: boolean) {
    const res = await supabase
      .from("lancamentos")
      .update({
        reembolsado,
        data_reembolso: reembolsado ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq("id", id);
    if (res.error) throw new Error(res.error.message);
    await recarregar();
  }

  async function salvarAssinatura(input: AssinaturaInput, id?: string) {
    const res = id
      ? await supabase.from("assinaturas").update(input).eq("id", id)
      : await supabase.from("assinaturas").insert(input);
    if (res.error) throw new Error(res.error.message);
    await recarregar();
  }

  async function excluirAssinatura(id: string) {
    const res = await supabase.from("assinaturas").delete().eq("id", id);
    if (res.error) throw new Error(res.error.message);
    await recarregar();
  }

  return (
    <Ctx.Provider
      value={{
        assinaturas,
        lancamentos,
        loading,
        erro,
        recarregar,
        salvarLancamento,
        excluirLancamento,
        marcarReembolsado,
        salvarAssinatura,
        excluirAssinatura,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData fora do DataProvider");
  return v;
}
