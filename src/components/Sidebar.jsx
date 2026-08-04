import {
  CalendarDays,
  ChevronRight,
  ClipboardClock,
  FlaskConical,
  HeartPulse,
  History,
  House,
  LogOut,
  Pill,
  Settings,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router";
import { useAuth } from "../contexts/AuthContext";

const opcionesPrincipales = [
  {
    nombre: "Inicio",
    ruta: "/app/inicio",
    icono: House,
  },
  {
    nombre: "Citas",
    ruta: "/app/citas",
    icono: CalendarDays,
  },
  {
    nombre: "Medicamentos",
    ruta: "/app/medicamentos",
    icono: Pill,
  },
  {
    nombre: "Estudios",
    ruta: "/app/estudios",
    icono: FlaskConical,
  },
  {
    nombre: "Historial",
    ruta: "/app/historial",
    icono: History,
  },
];

const opcionesCuenta = [
  {
    nombre: "Perfil",
    ruta: "/app/perfil",
    icono: UserRound,
  },
  {
    nombre: "Configuración",
    ruta: "/app/configuracion",
    icono: Settings,
  },
];

function Sidebar() {
  const { user, cerrarSesion } = useAuth();

  const nombre =
    user?.user_metadata?.nombre_completo ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const inicial = nombre.charAt(0).toUpperCase();

  async function handleLogout() {
    try {
      await cerrarSesion();
    } catch (error) {
      console.error(
        "No fue posible cerrar la sesión:",
        error.message
      );
    }
  }

  return (
    <aside className="hidden min-h-screen w-[270px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Marca */}
      <div className="flex h-24 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#087ef5] text-white shadow-lg shadow-blue-500/25">
          <HeartPulse size={28} />
        </div>

        <div>
          <p className="text-xl font-bold tracking-tight text-[#082b63]">
            Recuerda
            <span className="text-[#087ef5]">
              Med
            </span>
          </p>

          <p className="text-xs text-slate-400">
            Tu asistente de salud
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Principal
        </p>

        <div className="space-y-1">
          {opcionesPrincipales.map((opcion) => (
            <OpcionMenu
              key={opcion.ruta}
              {...opcion}
            />
          ))}
        </div>

        <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Mi cuenta
        </p>

        <div className="space-y-1">
          {opcionesCuenta.map((opcion) => (
            <OpcionMenu
              key={opcion.ruta}
              {...opcion}
            />
          ))}
        </div>

        <div className="mt-8 rounded-[22px] bg-[#eaf6ff] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#087ef5] shadow-sm">
            <ClipboardClock size={20} />
          </div>

          <p className="mt-4 text-sm font-bold text-[#10254b]">
            Mantén tus datos actualizados
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Registra tus próximas citas y recordatorios de
            medicamentos.
          </p>
        </div>
      </nav>

      {/* Usuario */}
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#082b63] font-bold text-white">
            {inicial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#10254b]">
              {nombre}
            </p>

            <p className="truncate text-xs text-slate-400">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function OpcionMenu({
  nombre,
  ruta,
  icono: Icono,
}) {
  return (
    <NavLink
      to={ruta}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
          isActive
            ? "bg-[#087ef5] text-white shadow-md shadow-blue-500/20"
            : "text-slate-500 hover:bg-[#eaf6ff] hover:text-[#087ef5]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icono
            size={20}
            strokeWidth={isActive ? 2.4 : 2}
          />

          <span className="flex-1">
            {nombre}
          </span>

          <ChevronRight
            size={16}
            className={
              isActive
                ? "opacity-100"
                : "opacity-0 transition group-hover:opacity-100"
            }
          />
        </>
      )}
    </NavLink>
  );
}

export default Sidebar;