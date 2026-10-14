import { useEffect, useRef, useState } from "react";

/**
 * Tela de abertura com portão de senha.
 *  1. "L" e "A" surgem centralizadas.
 *  2. Abrem (devagar) e formam "LIMA ADVOCACIA".
 *  3. Acima aparece "sistema financeiro" e abaixo o campo de senha.
 *  4. Senha correta -> varre para o lado e revela o app.
 * Barreira leve (senha conferida no navegador por hash).
 */

// SHA-256 de "Atendimento2026@"
const SENHA_HASH = "3a15f74f77652c6481560cf65e2116e8b656af7d463c6199575374147bcba5a1";

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Splash() {
  const jaDesbloqueado = (() => {
    try {
      return sessionStorage.getItem("appUnlocked") === "1";
    } catch {
      return false;
    }
  })();

  const [montado, setMontado] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [checando, setChecando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => setAberto(true), reduced ? 100 : jaDesbloqueado ? 550 : 1000)
    );

    if (jaDesbloqueado) {
      // reabertura (já logado nesta sessão): apresentação mais curta
      timers.push(window.setTimeout(() => setPronto(true), reduced ? 250 : 1500));
      timers.push(window.setTimeout(() => setSaindo(true), reduced ? 1000 : 2100));
      timers.push(window.setTimeout(() => setMontado(false), reduced ? 1200 : 2850));
    } else {
      timers.push(
        window.setTimeout(() => {
          setPronto(true);
          inputRef.current?.focus();
        }, reduced ? 350 : 3000)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [jaDesbloqueado]);

  function desbloquear() {
    setSaindo(true);
    try {
      sessionStorage.setItem("appUnlocked", "1");
    } catch {
      /* ignore */
    }
    setTimeout(() => setMontado(false), 850);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checando) return;
    setChecando(true);
    const ok = (await sha256(senha)) === SENHA_HASH;
    setChecando(false);
    if (ok) {
      setErro(false);
      desbloquear();
    } else {
      setErro(true);
      setSenha("");
      inputRef.current?.focus();
    }
  }

  if (!montado) return null;

  const revealStyle = (w: string): React.CSSProperties => ({
    display: "inline-block",
    overflow: "hidden",
    whiteSpace: "nowrap",
    verticalAlign: "bottom",
    maxWidth: aberto ? w : "0",
    opacity: aberto ? 1 : 0,
    transition: "max-width 1.2s cubic-bezier(0.65,0,0.35,1), opacity 0.9s ease",
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-900 px-6"
      style={{
        transform: saindo ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      {/* Nome centralizado na tela inteira */}
      <div
        className="w-full text-center"
        style={{ opacity: saindo ? 0 : 1, transition: "opacity 0.4s ease" }}
      >
        <p
          className="mb-3 text-sm uppercase tracking-[0.3em] text-gold/70"
          style={{ opacity: pronto ? 1 : 0, transition: "opacity 0.7s ease" }}
        >
          sistema financeiro
        </p>

        <h1
          className="display whitespace-nowrap text-gold"
          style={{
            fontSize: "clamp(1.8rem, 6vw, 3.5rem)",
            letterSpacing: "0.1em",
            animation: "nameIn 0.9s ease both",
          }}
        >
          <span>L</span>
          <span style={revealStyle("8ch")}>IMA</span>
          <span
            style={{
              display: "inline-block",
              maxWidth: aberto ? "0.4em" : "0",
              transition: "max-width 1.2s cubic-bezier(0.65,0,0.35,1)",
            }}
          >
            {" "}
          </span>
          <span>A</span>
          <span style={revealStyle("14ch")}>DVOCACIA</span>
        </h1>

        <div
          className="mx-auto mt-4 h-px bg-gold/50"
          style={{
            width: pronto ? "min(320px, 70vw)" : "0",
            transition: "width 0.8s ease",
          }}
        />
      </div>

      {/* Form num bloco próprio, centralizado */}
      {!jaDesbloqueado && (
        <form
          onSubmit={onSubmit}
          className="mt-8 w-full max-w-sm text-center"
          style={{
            opacity: pronto ? 1 : 0,
            transform: pronto ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
            pointerEvents: pronto ? "auto" : "none",
          }}
        >
          <p className="mb-3 text-sm text-white/55">Acesso restrito — digite a senha</p>
          <input
            ref={inputRef}
            type="password"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              setErro(false);
            }}
            placeholder="Senha"
            className="w-full rounded-md border border-gold/30 bg-white/5 px-4 py-2.5 text-center text-white
              placeholder-white/30 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
            style={erro ? { animation: "shake 0.35s" } : undefined}
          />
          {erro && <p className="mt-2 text-sm text-[#E8A0A0]">Senha incorreta.</p>}
          <button
            type="submit"
            disabled={checando || !senha}
            className="mt-4 w-full rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-brand-900
              transition hover:bg-gold-600 disabled:opacity-50"
          >
            {checando ? "Verificando…" : "Entrar"}
          </button>
        </form>
      )}

      <style>{`
        @keyframes nameIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          h1 { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
