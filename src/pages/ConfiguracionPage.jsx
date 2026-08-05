import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Construction,
  Clock3,
  Info,
  Mail,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Sun,
  Volume2,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

const CONFIG_STORAGE_KEY = "recuerdamed_configuracion";

const configuracionInicial = {
  recordatoriosActivos: true,
  notificacionesNavegador: true,
  notificacionesCorreo: false,
  sonidoRecordatorios: true,
  anticipacionCitas: "24",
  anticipacionMedicamentos: "10",
  tema: "sistema",
  formatoHora: "24",
};

function ConfiguracionPage() {
  const { user, modoDemo } = useAuth();

  const [configuracion, setConfiguracion] = useState(
    configuracionInicial
  );

  const [configuracionGuardada, setConfiguracionGuardada] =
    useState(configuracionInicial);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (modoDemo) {
      setConfiguracion(configuracionInicial);
      setConfiguracionGuardada(configuracionInicial);
      return;
    }

    const configuracionLocal =
      localStorage.getItem(CONFIG_STORAGE_KEY);

    if (!configuracionLocal) {
      setConfiguracion(configuracionInicial);
      setConfiguracionGuardada(configuracionInicial);
      return;
    }

    try {
      const datos = JSON.parse(configuracionLocal);

      const configuracionCargada = {
        ...configuracionInicial,
        ...datos,
      };

      setConfiguracion(configuracionCargada);
      setConfiguracionGuardada(configuracionCargada);
    } catch (error) {
      console.error(
        "No se pudo leer la configuración:",
        error
      );

      localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
  }, [modoDemo, user?.id]);

  const hayCambios =
    JSON.stringify(configuracion) !==
    JSON.stringify(configuracionGuardada);

  function handleToggle(nombre) {
    if (modoDemo) {
      mostrarMensajeDemo();
      return;
    }

    setConfiguracion((actual) => ({
      ...actual,
      [nombre]: !actual[nombre],
    }));
  }

  function handleChange(event) {
    if (modoDemo) {
      mostrarMensajeDemo();
      return;
    }

    const { name, value } = event.target;

    setConfiguracion((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function mostrarMensajeDemo() {
    setTipoMensaje("informacion");
    setMensaje(
      "El modo demostración es de solo lectura. Las preferencias no se modificarán."
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (modoDemo) {
      mostrarMensajeDemo();
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      localStorage.setItem(
        CONFIG_STORAGE_KEY,
        JSON.stringify(configuracion)
      );

      setConfiguracionGuardada(configuracion);
      setTipoMensaje("exito");
      setMensaje(
        "La configuración se guardó correctamente en este navegador."
      );
    } catch (error) {
      console.error(
        "No fue posible guardar la configuración:",
        error
      );

      setTipoMensaje("error");
      setMensaje(
        "No fue posible guardar las preferencias."
      );
    } finally {
      setGuardando(false);
    }
  }

  function handleRestablecer() {
    if (modoDemo) {
      mostrarMensajeDemo();
      return;
    }

    setConfiguracion(configuracionInicial);
    setTipoMensaje("informacion");
    setMensaje(
      "Se restauraron los valores predeterminados. Guarda los cambios para confirmarlos."
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header
          titulo="Configuración"
          descripcion="Personaliza las preferencias de RecuerdaMed."
        />

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          <section
            role="note"
            className="mb-6 overflow-hidden rounded-[24px] border border-amber-200 bg-amber-50 shadow-sm"
          >
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Construction size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-amber-900">
                  Funciones de configuración en desarrollo
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  La mayoría de las opciones de esta sección todavía no
                  ejecutan cambios reales en la aplicación. Por ahora las
                  preferencias únicamente se guardan en este navegador.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Disponible: guardado local
                  </span>

                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
                    Pendiente: notificaciones reales
                  </span>

                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
                    Pendiente: correo y sonido
                  </span>

                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
                    Pendiente: tema y formato global
                  </span>
                </div>
              </div>
            </div>
          </section>

          {modoDemo && (
            <section className="mb-6 flex items-start gap-3 rounded-[22px] border border-blue-100 bg-[#eaf6ff] px-5 py-4">
              <Info
                size={21}
                className="mt-0.5 shrink-0 text-[#087ef5]"
              />

              <div>
                <p className="font-bold text-[#10254b]">
                  Configuración de demostración
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Puedes revisar las opciones, pero no
                  modificar ni guardar preferencias.
                </p>
              </div>
            </section>
          )}

          {mensaje && (
            <Mensaje
              mensaje={mensaje}
              tipo={tipoMensaje}
              onCerrar={() => setMensaje("")}
            />
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-6 xl:grid-cols-[1fr_360px]"
          >
            <div className="space-y-6">
              <SeccionConfiguracion
                icono={<Bell size={23} />}
                titulo="Notificaciones"
                descripcion="Configura cómo quieres recibir avisos."
                colorIcono="bg-blue-50 text-blue-600"
              >
                <OpcionToggle
                  icono={<CalendarDays size={20} />}
                  titulo="Recordatorios activos"
                  descripcion="Recibir avisos de citas, medicamentos y estudios."
                  activo={
                    configuracion.recordatoriosActivos
                  }
                  disabled={modoDemo}
                  onChange={() =>
                    handleToggle("recordatoriosActivos")
                  }
                />

                <OpcionToggle
                  icono={<Smartphone size={20} />}
                  titulo="Notificaciones del navegador"
                  descripcion="Mostrar avisos mientras utilizas este dispositivo."
                  activo={
                    configuracion.notificacionesNavegador
                  }
                  disabled={
                    modoDemo ||
                    !configuracion.recordatoriosActivos
                  }
                  onChange={() =>
                    handleToggle(
                      "notificacionesNavegador"
                    )
                  }
                />

                <OpcionToggle
                  icono={<Mail size={20} />}
                  titulo="Notificaciones por correo"
                  descripcion="Recibir un resumen de los próximos recordatorios."
                  activo={
                    configuracion.notificacionesCorreo
                  }
                  disabled={
                    modoDemo ||
                    !configuracion.recordatoriosActivos
                  }
                  onChange={() =>
                    handleToggle("notificacionesCorreo")
                  }
                />

                <OpcionToggle
                  icono={<Volume2 size={20} />}
                  titulo="Sonido de recordatorios"
                  descripcion="Reproducir un sonido cuando aparezca un aviso."
                  activo={
                    configuracion.sonidoRecordatorios
                  }
                  disabled={
                    modoDemo ||
                    !configuracion.recordatoriosActivos
                  }
                  onChange={() =>
                    handleToggle("sonidoRecordatorios")
                  }
                />
              </SeccionConfiguracion>

              <SeccionConfiguracion
                icono={<Clock3 size={23} />}
                titulo="Anticipación de avisos"
                descripcion="Elige con cuánto tiempo recibir recordatorios."
                colorIcono="bg-emerald-50 text-emerald-600"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <CampoSeleccion
                    label="Recordatorio de citas"
                    name="anticipacionCitas"
                    value={
                      configuracion.anticipacionCitas
                    }
                    onChange={handleChange}
                    disabled={
                      modoDemo ||
                      !configuracion.recordatoriosActivos
                    }
                  >
                    <option value="1">
                      1 hora antes
                    </option>
                    <option value="3">
                      3 horas antes
                    </option>
                    <option value="12">
                      12 horas antes
                    </option>
                    <option value="24">
                      1 día antes
                    </option>
                    <option value="48">
                      2 días antes
                    </option>
                  </CampoSeleccion>

                  <CampoSeleccion
                    label="Recordatorio de medicamentos"
                    name="anticipacionMedicamentos"
                    value={
                      configuracion.anticipacionMedicamentos
                    }
                    onChange={handleChange}
                    disabled={
                      modoDemo ||
                      !configuracion.recordatoriosActivos
                    }
                  >
                    <option value="0">
                      A la hora indicada
                    </option>
                    <option value="5">
                      5 minutos antes
                    </option>
                    <option value="10">
                      10 minutos antes
                    </option>
                    <option value="15">
                      15 minutos antes
                    </option>
                    <option value="30">
                      30 minutos antes
                    </option>
                  </CampoSeleccion>
                </div>
              </SeccionConfiguracion>

              <SeccionConfiguracion
                icono={<Monitor size={23} />}
                titulo="Apariencia y formato"
                descripcion="Personaliza cómo se muestra la aplicación."
                colorIcono="bg-violet-50 text-violet-600"
              >
                <div>
                  <p className="mb-3 text-sm font-semibold text-[#10254b]">
                    Tema de la aplicación
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <OpcionTema
                      id="claro"
                      nombre="Claro"
                      icono={<Sun size={20} />}
                      seleccionado={
                        configuracion.tema === "claro"
                      }
                      disabled={modoDemo}
                      onClick={() =>
                        setConfiguracion((actual) => ({
                          ...actual,
                          tema: "claro",
                        }))
                      }
                    />

                    <OpcionTema
                      id="oscuro"
                      nombre="Oscuro"
                      icono={<Moon size={20} />}
                      seleccionado={
                        configuracion.tema === "oscuro"
                      }
                      disabled={modoDemo}
                      onClick={() =>
                        setConfiguracion((actual) => ({
                          ...actual,
                          tema: "oscuro",
                        }))
                      }
                    />

                    <OpcionTema
                      id="sistema"
                      nombre="Sistema"
                      icono={<Monitor size={20} />}
                      seleccionado={
                        configuracion.tema === "sistema"
                      }
                      disabled={modoDemo}
                      onClick={() =>
                        setConfiguracion((actual) => ({
                          ...actual,
                          tema: "sistema",
                        }))
                      }
                    />
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Esta selección todavía no cambia la
                    apariencia general. Queda preparada para
                    implementar los temas claro y oscuro más
                    adelante.
                  </p>
                </div>

                <div className="mt-6">
                  <CampoSeleccion
                    label="Formato de hora"
                    name="formatoHora"
                    value={configuracion.formatoHora}
                    onChange={handleChange}
                    disabled={modoDemo}
                  >
                    <option value="24">
                      24 horas — 18:30
                    </option>
                    <option value="12">
                      12 horas — 6:30 p. m.
                    </option>
                  </CampoSeleccion>
                </div>
              </SeccionConfiguracion>
            </div>

            <aside className="space-y-6">
              <article className="rounded-[28px] bg-[#082b63] p-7 text-white shadow-xl shadow-blue-950/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck size={25} />
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  Privacidad y seguridad
                </h2>

                <p className="mt-3 text-sm leading-6 text-blue-100">
                  Durante esta etapa, las preferencias se
                  almacenan únicamente en este navegador y no
                  se sincronizan con Supabase ni con otros
                  dispositivos.
                </p>

                <div className="mt-6 rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    Cuenta actual
                  </p>

                  <p className="mt-2 truncate text-sm font-semibold">
                    {modoDemo
                      ? "Modo demostración"
                      : user?.email}
                  </p>
                </div>
              </article>

              <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
                <h2 className="font-bold text-[#10254b]">
                  Acciones
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Guarda tus preferencias o restaura la
                  configuración predeterminada.
                </p>

                <button
                  type="submit"
                  disabled={
                    modoDemo ||
                    guardando ||
                    !hayCambios
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={18} />

                  {guardando
                    ? "Guardando..."
                    : modoDemo
                      ? "Solo visualización"
                      : "Guardar preferencias"}
                </button>

                <button
                  type="button"
                  onClick={handleRestablecer}
                  disabled={modoDemo || guardando}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={18} />
                  Restaurar valores
                </button>
              </article>
            </aside>
          </form>
        </div>
      </main>
    </div>
  );
}

function SeccionConfiguracion({
  icono,
  titulo,
  descripcion,
  colorIcono,
  children,
}) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colorIcono}`}
        >
          {icono}
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#10254b]">
            {titulo}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {descripcion}
          </p>
        </div>
      </div>

      <div className="mt-7 divide-y divide-slate-100">
        {children}
      </div>
    </section>
  );
}

function OpcionToggle({
  icono,
  titulo,
  descripcion,
  activo,
  disabled,
  onChange,
}) {
  return (
    <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
        {icono}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#10254b]">
          {titulo}
        </p>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {descripcion}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={titulo}
        disabled={disabled}
        onClick={onChange}
        className={[
          "relative h-7 w-12 shrink-0 rounded-full transition",
          activo ? "bg-[#087ef5]" : "bg-slate-200",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
            activo ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function CampoSeleccion({
  label,
  children,
  ...propiedades
}) {
  return (
    <div>
      <label
        htmlFor={propiedades.name}
        className="mb-2 block text-sm font-semibold text-[#10254b]"
      >
        {label}
      </label>

      <select
        id={propiedades.name}
        {...propiedades}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#10254b] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </div>
  );
}

function OpcionTema({
  id,
  nombre,
  icono,
  seleccionado,
  disabled,
  onClick,
}) {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition",
        seleccionado
          ? "border-[#087ef5] bg-[#eaf6ff] text-[#087ef5]"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "",
      ].join(" ")}
    >
      {icono}
      {nombre}
    </button>
  );
}

function Mensaje({
  mensaje,
  tipo,
  onCerrar,
}) {
  const clases = {
    informacion:
      "border-amber-200 bg-amber-50 text-amber-800",
    exito:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    error:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <section
      role="status"
      className={`mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4 ${clases[tipo]}`}
    >
      <p className="text-sm leading-6">
        {mensaje}
      </p>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar mensaje"
        className="shrink-0"
      >
        <X size={19} />
      </button>
    </section>
  );
}

export default ConfiguracionPage;