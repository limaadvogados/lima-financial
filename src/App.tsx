import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { MonthProvider } from "./context/MonthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Assinaturas from "./pages/Assinaturas";
import Fechamento from "./pages/Fechamento";

function Protegido() {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-ink-500">
        Carregando…
      </div>
    );
  if (!session) return <Navigate to="/entrar" replace />;
  return (
    <DataProvider>
      <MonthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/assinaturas" element={<Assinaturas />} />
            <Route path="/fechamento" element={<Fechamento />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </MonthProvider>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/*" element={<Protegido />} />
      </Routes>
    </AuthProvider>
  );
}
