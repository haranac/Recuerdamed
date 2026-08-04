import { Navigate, Route, Routes } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MedicamentosPage from "./pages/MedicamentosPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import RegisterPage from "./pages/RegisterPage";
import CitasPage from "./pages/CitasPage";
import EstudiosPage from "./pages/EstudiosPage";
import HistorialPage from "./pages/HistorialPage";
import PerfilPage from "./pages/PerfilPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/inicio" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/registro" element={<RegisterPage />} />

      <Route
        path="/app/inicio"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/medicamentos"
        element={
          <ProtectedRoute>
            <MedicamentosPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/citas"
        element={
          <ProtectedRoute>
            <CitasPage />
          </ProtectedRoute>
        }
      />

      <Route
  path="/app/estudios"
  element={
    <ProtectedRoute>
      <EstudiosPage />
    </ProtectedRoute>
  }
/>

      <Route
  path="/app/historial"
  element={
    <ProtectedRoute>
      <HistorialPage />
    </ProtectedRoute>
  }
/>

      <Route
  path="/app/perfil"
  element={
    <ProtectedRoute>
      <PerfilPage />
    </ProtectedRoute>
  }
/>

      <Route
        path="/app/configuracion"
        element={
          <ProtectedRoute>
            <PlaceholderPage
              titulo="Configuración"
              descripcion="Personaliza las opciones de RecuerdaMed."
            />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/app/inicio" replace />} />
    </Routes>
  );
}

export default App;
