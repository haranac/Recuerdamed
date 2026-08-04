import {
  Bell,
  CalendarDays,
  Eye,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function Header({
  titulo = "Inicio",
  descripcion = "Consulta el resumen de tus actividades de salud.",
}) {
  const { user, modoDemo } = useAuth();

  const nombre =
    user?.user_metadata?.nombre_completo ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const iniciales = obtenerIniciales(nombre);

  const fecha = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const fechaFormateada =
    fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <header className="border-b border-slate-200 bg-white/90 px-5 py-5 backdrop-blur sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight text-[#10254b] sm:text-3xl">
              {titulo}
            </h1>

            {modoDemo && (
              <span className="hidden items-center gap-1.5 rounded-full bg-[#eaf6ff] px-3 py-1 text-xs font-bold text-[#087ef5] sm:inline-flex">
                <Eye size={14} />
                Solo visualización
              </span>
            )}
          </div>

          <p className="mt-1 hidden text-sm text-slate-500 sm:block">
            {descripcion}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-2xl bg-[#f5f9ff] px-4 py-2.5 text-sm text-slate-500 xl:flex">
            <CalendarDays
              size={18}
              className="text-[#087ef5]"
            />

            <span>{fechaFormateada}</span>
          </div>

          <button
            type="button"
            aria-label="Buscar"
            title="Buscar"
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#087ef5] sm:flex"
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            aria-label="Notificaciones"
            title="Notificaciones"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#087ef5]"
          >
            <Bell size={19} />

            {!modoDemo && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#087ef5] ring-2 ring-white" />
            )}
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2 sm:pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#082b63] text-xs font-bold text-white">
              {iniciales}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="max-w-32 truncate text-sm font-bold text-[#10254b]">
                {nombre}
              </p>

              {modoDemo ? (
                <p className="text-xs font-semibold text-[#087ef5]">
                  Modo demostración
                </p>
              ) : (
                <p className="max-w-32 truncate text-xs text-slate-400">
                  {user?.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function obtenerIniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) =>
      palabra.charAt(0).toUpperCase()
    )
    .join("");
}

export default Header;