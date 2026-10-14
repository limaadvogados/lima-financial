import { Navigate, Route, Routes } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { MonthProvider } from "./context/MonthContext";
import Layout from "./components/Layout";
import Splash from "./components/Splash";
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Assinaturas from "./pages/Assinaturas";
import Fechamento from "./pages/Fechamento";
import Recebimentos from "./pages/Recebimentos";
import Calendario from "./pages/Calendario";

export default function App() {
  return (
    <>
      <Splash />
      <DataProvider>
        <MonthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lancamentos" element={<Lancamentos />} />
              <Route path="/assinaturas" element={<Assinaturas />} />
              <Route path="/fechamento" element={<Fechamento />} />
              <Route path="/recebimentos" element={<Recebimentos />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </MonthProvider>
      </DataProvider>
    </>
  );
}
