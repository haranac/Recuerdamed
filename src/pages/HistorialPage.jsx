import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Clock3,
  Download,
  FileClock,
  FlaskConical,
  Info,
  Pill,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";

const filtros = [
  {
    id: "todos",
    nombre: "Todos",
  },
  {
    id: "cita",
    nombre: "Citas",
  },
  {
    id: "medicamento",
    nombre: "Medicamentos",
  },
  {
    id: "estudio",
    nombre: "Estudios",
  },
];

function HistorialPage() {
  const { modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState("todos");
  const [mensaje, setMensaje] = useState("");

  const actividad = modoDemo
    ? datosDemo.actividad ?? []
    : [];

  const registrosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return actividad
      .filter((registro) => {
        const contenido = normalizarTexto(
          [
            registro.titulo,
            registro.descripcion,
            registro.tipo,
            registro.estado,
          ]
            .filter(Boolean)
            .join(" ")
        );

        const coincideBusqueda =
          !texto || contenido.includes(texto);

        const coincideFiltro =
          filtroActivo === "todos" ||
          registro.tipo === filtroActivo;

        return coincideBusqueda && coincideFiltro;
      })
      .sort(
        (a, b) =>
          obtenerFechaRegistro(b) -
          obtenerFechaRegistro(a)
      );
  }, [actividad, busqueda, filtroActivo]);

  const resumen = useMemo(() => {
    return {
      total: actividad.length,

      citas: actividad.filter(
        (registro) => registro.tipo === "cita"
      ).length,

      medicamentos: actividad.filter(
        (registro) =>
          registro.tipo === "medicamento"
      ).length,

      estudios: actividad.filter(
        (registro) => registro.tipo === "estudio"
      ).length,
    };
  }, [actividad]);

  function handleExportar() {
    if (modoDemo) {
      setMensaje(
        "La exportación no está disponible en el modo demostración."
      );

      return;
    }

    setMensaje(
      "La exportación del historial se agregará posteriormente."
    );
  }

  function handleDetalles() {
    if (modoDemo) {
      setMensaje(
        "Este registro pertenece al modo demostración y es únicamente informativo."
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header
          titulo="Historial"
          descripcion="Consulta la actividad registrada en tu cuenta."
        />

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          {modoDemo && (
            <section className="mb-6 flex items-start gap-3 rounded-[22px] border border-blue-100 bg-[#eaf6ff] px-5 py-4">
              <Info
                size={21}
                className="mt-0.5 shrink-0 text-[#087ef5]"
              />

              <div>
                <p className="font-bold text-[#10254b]">
                  Historial de demostración
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Los registros son ficticios y no contienen
                  información médica real.
                </p>
              </div>
            </section>
          )}

          {mensaje && (
            <section
              role="status"
              className="mb-6 flex items-start justify-between gap-4 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4"
            >
              <p className="text-sm leading-6 text-amber-800">
                {mensaje}
              </p>

              <button
                type="button"
                onClick={() => setMensaje("")}
                aria-label="Cerrar mensaje"
                className="shrink-0 text-amber-600 transition hover:text-amber-800"
              >
                <X size={19} />
              </button>
            </section>
          )}

          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-[#087ef5]">
                Actividad de la cuenta
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#10254b]">
                Mi historial
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Revisa los movimientos relacionados con tus
                citas, medicamentos y estudios.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportar}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#087ef5] bg-white px-5 py-3 text-sm font-bold text-[#087ef5] transition hover:bg-[#eaf6ff]"
            >
              <Download size={19} />
              Exportar historial
            </button>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TarjetaResumen
              titulo="Total"
              cantidad={resumen.total}
              icono={<Activity size={21} />}
              clases="bg-blue-50 text-blue-600"
            />

            <TarjetaResumen
              titulo="Citas"
              cantidad={resumen.citas}
              icono={<Stethoscope size={21} />}
              clases="bg-cyan-50 text-cyan-600"
            />

            <TarjetaResumen
              titulo="Medicamentos"
              cantidad={resumen.medicamentos}
              icono={<Pill size={21} />}
              clases="bg-emerald-50 text-emerald-600"
            />

            <TarjetaResumen
              titulo="Estudios"
              cantidad={resumen.estudios}
              icono={<FlaskConical size={21} />}
              clases="bg-violet-50 text-violet-600"
            />
          </section>

          <section className="mt-7 rounded-[26px] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-sm">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(event.target.value)
                  }
                  placeholder="Buscar en el historial..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {filtros.map((filtro) => {
                  const seleccionado =
                    filtroActivo === filtro.id;

                  return (
                    <button
                      key={filtro.id}
                      type="button"
                      onClick={() =>
                        setFiltroActivo(filtro.id)
                      }
                      className={[
                        "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                        seleccionado
                          ? "bg-[#082b63] text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-[#eaf6ff] hover:text-[#087ef5]",
                      ].join(" ")}
                    >
                      {filtro.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {registrosFiltrados.length > 0 ? (
            <section className="mt-7 rounded-[28px] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#10254b]">
                  Línea de tiempo
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Actividad ordenada desde la más reciente.
                </p>
              </div>

              <div className="space-y-4">
                {registrosFiltrados.map(
                  (registro, indice) => (
                    <RegistroHistorial
                      key={registro.id}
                      registro={registro}
                      ultimo={
                        indice ===
                        registrosFiltrados.length - 1
                      }
                      onDetalles={handleDetalles}
                    />
                  )
                )}
              </div>
            </section>
          ) : (
            <EstadoVacio
              existeBusqueda={
                busqueda.trim() !== "" ||
                filtroActivo !== "todos"
              }
              onLimpiar={() => {
                setBusqueda("");
                setFiltroActivo("todos");
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function TarjetaResumen({
  titulo,
  cantidad,
  icono,
  clases,
}) {
  return (
    <article className="flex items-center gap-4 rounded-[22px] border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/30">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${clases}`}
      >
        {icono}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {titulo}
        </p>

        <p className="mt-1 text-2xl font-bold text-[#10254b]">
          {cantidad}
        </p>
      </div>
    </article>
  );
}

function RegistroHistorial({
  registro,
  ultimo,
  onDetalles,
}) {
  const configuracion =
    obtenerConfiguracionTipo(registro.tipo);

  const Icono = configuracion.icono;

  return (
    <article className="relative flex gap-4 sm:gap-5">
      {!ultimo && (
        <div className="absolute left-[23px] top-12 h-[calc(100%+4px)] w-px bg-slate-200" />
      )}

      <div
        className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${configuracion.clases}`}
      >
        <Icono size={22} />
      </div>

      <div className="min-w-0 flex-1 rounded-[22px] border border-slate-100 bg-slate-50/70 p-5 transition hover:border-blue-100 hover:bg-white hover:shadow-md">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-[#10254b]">
                {registro.titulo}
              </h4>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${configuracion.etiqueta}`}
              >
                {configuracion.nombre}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {registro.descripcion}
            </p>
          </div>

          <button
            type="button"
            onClick={onDetalles}
            className="shrink-0 text-left text-sm font-bold text-[#087ef5] hover:underline"
          >
            Ver detalles
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={15} />
            {formatearFechaCompleta(registro.fecha)}
          </span>

          {registro.hora && (
            <span className="flex items-center gap-1.5">
              <Clock3 size={15} />
              {normalizarHora(registro.hora)}
            </span>
          )}

          {registro.estado && (
            <span className="flex items-center gap-1.5">
              <FileClock size={15} />
              {registro.estado}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function EstadoVacio({
  existeBusqueda,
  onLimpiar,
}) {
  return (
    <section className="mt-7 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#eaf6ff] text-[#087ef5]">
        <FileClock size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#10254b]">
        {existeBusqueda
          ? "No encontramos registros"
          : "No hay actividad registrada"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {existeBusqueda
          ? "Prueba otra búsqueda o elimina los filtros seleccionados."
          : "Las actividades relacionadas con tu salud aparecerán aquí."}
      </p>

      {existeBusqueda && (
        <button
          type="button"
          onClick={onLimpiar}
          className="mt-5 rounded-xl bg-[#087ef5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#075dd6]"
        >
          Limpiar filtros
        </button>
      )}
    </section>
  );
}

function obtenerConfiguracionTipo(tipo) {
  const configuraciones = {
    cita: {
      nombre: "Cita",
      icono: Stethoscope,
      clases: "bg-blue-50 text-blue-600",
      etiqueta: "bg-blue-50 text-blue-600",
    },

    medicamento: {
      nombre: "Medicamento",
      icono: Pill,
      clases: "bg-emerald-50 text-emerald-600",
      etiqueta: "bg-emerald-50 text-emerald-600",
    },

    estudio: {
      nombre: "Estudio",
      icono: FlaskConical,
      clases: "bg-violet-50 text-violet-600",
      etiqueta: "bg-violet-50 text-violet-600",
    },
  };

  return (
    configuraciones[tipo] ?? {
      nombre: "Actividad",
      icono: Activity,
      clases: "bg-slate-100 text-slate-600",
      etiqueta: "bg-slate-100 text-slate-600",
    }
  );
}

function obtenerFechaRegistro(registro) {
  const fecha = registro?.fecha || "1970-01-01";
  const hora = normalizarHora(
    registro?.hora || "00:00"
  );

  return new Date(`${fecha}T${hora}:00`);
}

function normalizarHora(hora = "") {
  return String(hora).slice(0, 5);
}

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatearFechaCompleta(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

export default HistorialPage;