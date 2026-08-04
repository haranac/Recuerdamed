import { Navigate, Route, Routes } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MedicamentosPage from "./pages/MedicamentosPage";
import CitasPage from "./pages/CitasPage";
import EstudiosPage from "./pages/EstudiosPage";
import HistorialPage from "./pages/HistorialPage";
import PerfilPage from "./pages/PerfilPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";

function App() {
  return (
    <Routes>
      {/* Página pública principal */}
      <Route path="/" element={<LandingPage />} />

      {/* Autenticación */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Rutas protegidas de la aplicación */}
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
            <ConfiguracionPage />
          </ProtectedRoute>
        }
      />

      {/* Cualquier dirección inexistente vuelve a la landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;