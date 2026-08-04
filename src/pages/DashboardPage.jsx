import {
  HeartPulse,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function DashboardPage() {
  const { user, cerrarSesion } = useAuth();

  const nombre =
    user?.user_metadata?.nombre_completo ||
    user?.email?.split("@")[0] ||
    "Usuario";

  async function handleLogout() {
    try {
      await cerrarSesion();
    } catch (error) {
      console.error(
        "No se pudo cerrar sesión:",
        error.message
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff] p-6">
      <section className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between rounded-[24px] bg-white p-5 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#087ef5] text-white">
              <HeartPulse size={24} />
            </div>

            <div>
              <p className="font-bold text-[#082b63]">
                RecuerdaMed
              </p>

              <p className="text-xs text-slate-500">
                Panel de salud
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </header>

        <section className="mt-6 rounded-[28px] bg-[#082b63] p-8 text-white shadow-xl shadow-blue-950/10">
          <p className="text-sm font-medium text-blue-200">
            Sesión iniciada correctamente
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Hola, {nombre}
          </h1>

          <p className="mt-4 text-blue-100">
            El sistema de autenticación y las rutas
            protegidas están funcionando.
          </p>

          <p className="mt-6 text-sm text-blue-200">
            Cuenta: {user?.email}
          </p>
        </section>
      </section>
    </main>
  );
}

export default DashboardPage;