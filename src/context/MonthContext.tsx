import { createContext, useContext, useState, type ReactNode } from "react";
import { mesAtual } from "../lib/format";

interface MonthValue {
  mes: string;
  setMes: (m: string) => void;
}

const Ctx = createContext<MonthValue | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [mes, setMesState] = useState<string>(() => {
    try {
      return localStorage.getItem("mesRef") || mesAtual();
    } catch {
      return mesAtual();
    }
  });
  function setMes(m: string) {
    setMesState(m);
    try {
      localStorage.setItem("mesRef", m);
    } catch {
      /* ignore */
    }
  }
  return <Ctx.Provider value={{ mes, setMes }}>{children}</Ctx.Provider>;
}

export function useMonth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMonth fora do MonthProvider");
  return v;
}
