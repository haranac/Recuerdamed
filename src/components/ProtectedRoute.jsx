import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loadingSession } = useAuth();
  const location = useLocation();

  if (loadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f9ff]">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-200 border-t-[#087ef5]" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Cargando RecuerdaMed...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;