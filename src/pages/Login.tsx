import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Scale, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabaseConfigured } from "../lib/supabase";

export default function Login() {
  const { session, entrar, criarConta } = useAuth();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      if (modo === "entrar") await entrar(email, senha);
      else await criarConta(email, senha);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca */}
      <div className="relative hidden flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-gold/20 ring-1 ring-gold/30">
            <Scale size={22} className="text-gold" />
          </span>
          <span className="display text-lg font-semibold">Lima Advogados</span>
        </div>
        <div>
          <h1 className="display text-4xl leading-tight">Controle Financeiro</h1>
          <p className="mt-4 max-w-sm text-white/70">
            Pagamentos, assinaturas recorrentes e reembolsos do escritório — com o
            fechamento de cada mês conferido num só lugar.
          </p>
        </div>
        <p className="text-xs text-white/40">Uso interno da equipe administrativa.</p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-paper p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-900">
              <Scale size={18} className="text-gold" />
            </span>
            <span className="display text-base font-semibold text-ink-900">Lima Advogados</span>
          </div>

          <h2 className="display text-2xl text-ink-900">
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {modo === "entrar"
              ? "Use seu e-mail do escritório."
              : "Primeiro acesso — defina seu e-mail e senha."}
          </p>

          {!supabaseConfigured && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-status-warn/30 bg-status-warn/10 px-3 py-2 text-xs text-[#8a5d00]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Conexão com o Supabase não configurada. Preencha o arquivo <b>.env</b> com a URL
                e a chave anon do projeto.
              </span>
            </div>
          )}

          <form onSubmit={enviar} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                required
                minLength={6}
                className="field"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            {erro && <p className="text-sm text-status-alert">{erro}</p>}

            <button type="submit" className="btn-primary w-full" disabled={carregando}>
              {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            className="mt-4 text-sm text-brand-700 hover:underline"
            onClick={() => {
              setErro(null);
              setModo(modo === "entrar" ? "criar" : "entrar");
            }}
          >
            {modo === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta — entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
