import { useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FlaskConical,
  Info,
  MapPin,
  Plus,
  Search,
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
    id: "programados",
    nombre: "Programados",
  },
  {
    id: "completados",
    nombre: "Completados",
  },
];

function EstudiosPage() {
  const { modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState("todos");
  const [mensaje, setMensaje] = useState("");

  const estudios = modoDemo
    ? datosDemo.estudios ?? []
    : [];

  const estudiosProgramados = useMemo(
    () =>
      estudios
        .filter((estudio) =>
          esEstado(estudio, "programado")
        )
        .sort(ordenarEstudiosAscendente),
    [estudios]
  );

  const estudiosCompletados = useMemo(
    () =>
      estudios
        .filter((estudio) =>
          esEstado(estudio, "completado")
        )
        .sort(ordenarEstudiosDescendente),
    [estudios]
  );

  const estudiosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return estudios
      .filter((estudio) => {
        const contenido = [
          estudio.nombre,
          estudio.tipo,
          estudio.institucion,
          estudio.estado,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (texto && !contenido.includes(texto)) {
          return false;
        }

        if (filtroActivo === "programados") {
          return esEstado(estudio, "programado");
        }

        if (filtroActivo === "completados") {
          return esEstado(estudio, "completado");
        }

        return true;
      })
      .sort((a, b) => {
        const aProgramado = esEstado(a, "programado");
        const bProgramado = esEstado(b, "programado");

        if (aProgramado && !bProgramado) {
          return -1;
        }

        if (!aProgramado && bProgramado) {
          return 1;
        }

        return obtenerFechaEstudio(a) -
          obtenerFechaEstudio(b);
      });
  }, [busqueda, estudios, filtroActivo]);

  const proximoEstudio = estudiosProgramados[0];

  function handleAgregarEstudio() {
    if (modoDemo) {
      setMensaje(
        "El modo demostración es de solo lectura. No se guardará ningún estudio."
      );

      return;
    }

    setMensaje(
      "El formulario para registrar estudios se agregará posteriormente."
    );
  }

  function handleAccionEstudio(estudio) {
    if (modoDemo) {
      const completado = esEstado(
        estudio,
        "completado"
      );

      setMensaje(
        completado
          ? "Los resultados de demostración son únicamente ilustrativos."
          : "Los estudios de demostración no pueden editarse ni eliminarse."
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header
          titulo="Estudios"
          descripcion="Organiza tus análisis, resultados y estudios médicos."
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
                  Datos de demostración
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Puedes consultar los estudios de ejemplo,
                  pero no guardar archivos ni modificaciones.
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
                Control de estudios
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#10254b]">
                Mis estudios
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Consulta tus estudios programados y
                resultados anteriores.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAgregarEstudio}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6]"
            >
              <Plus size={19} />
              Agregar estudio
            </button>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-3">
            <TarjetaResumen
              titulo="Total"
              cantidad={estudios.length}
              icono={<FlaskConical size={22} />}
              clases="bg-violet-50 text-violet-600"
            />

            <TarjetaResumen
              titulo="Programados"
              cantidad={estudiosProgramados.length}
              icono={<CalendarCheck size={22} />}
              clases="bg-blue-50 text-blue-600"
            />

            <TarjetaResumen
              titulo="Completados"
              cantidad={estudiosCompletados.length}
              icono={<CheckCircle2 size={22} />}
              clases="bg-emerald-50 text-emerald-600"
            />
          </section>

          {proximoEstudio && (
            <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#082b63] p-7 text-white shadow-xl shadow-blue-950/10">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                  Próximo estudio
                </p>

                <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {proximoEstudio.nombre}
                    </h3>

                    <p className="mt-2 text-blue-100">
                      {proximoEstudio.tipo ||
                        "Estudio médico"}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                        <CalendarDays size={17} />
                        {formatearFechaCompleta(
                          proximoEstudio.fecha
                        )}
                      </span>

                      {proximoEstudio.hora && (
                        <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                          <Clock3 size={17} />
                          {normalizarHora(
                            proximoEstudio.hora
                          )}
                        </span>
                      )}

                      {proximoEstudio.institucion && (
                        <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                          <MapPin size={17} />
                          {proximoEstudio.institucion}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleAccionEstudio(proximoEstudio)
                    }
                    className="shrink-0 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#082b63] transition hover:bg-blue-50"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </section>
          )}

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
                  placeholder="Buscar estudio o institución..."
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

          {estudiosFiltrados.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {estudiosFiltrados.map((estudio) => (
                <EstudioCard
                  key={estudio.id}
                  estudio={estudio}
                  modoDemo={modoDemo}
                  onAccion={() =>
                    handleAccionEstudio(estudio)
                  }
                />
              ))}
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

function EstudioCard({
  estudio,
  modoDemo,
  onAccion,
}) {
  const completado = esEstado(
    estudio,
    "completado"
  );

  return (
    <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            completado
              ? "bg-emerald-50 text-emerald-600"
              : "bg-violet-50 text-violet-600",
          ].join(" ")}
        >
          <FlaskConical size={24} />
        </div>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
            completado
              ? "bg-emerald-50 text-emerald-600"
              : "bg-blue-50 text-blue-600",
          ].join(" ")}
        >
          {completado ? (
            <CheckCircle2 size={14} />
          ) : (
            <CalendarCheck size={14} />
          )}

          {estudio.estado}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold text-[#10254b]">
          {estudio.nombre}
        </h3>

        <p className="mt-1 text-sm font-medium text-[#087ef5]">
          {estudio.tipo || "Estudio médico"}
        </p>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
        <DetalleEstudio
          icono={<CalendarDays size={18} />}
          etiqueta="Fecha"
          valor={formatearFechaCompleta(
            estudio.fecha
          )}
        />

        {estudio.hora && (
          <DetalleEstudio
            icono={<Clock3 size={18} />}
            etiqueta="Hora"
            valor={normalizarHora(estudio.hora)}
          />
        )}

        <DetalleEstudio
          icono={<Building2 size={18} />}
          etiqueta="Institución"
          valor={
            estudio.institucion ||
            "Sin especificar"
          }
        />
      </div>

      {completado && estudio.resultado && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
          <FileText
            size={19}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="text-sm font-bold text-emerald-700">
              Resultado disponible
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-600">
              {estudio.resultado}
            </p>
          </div>
        </div>
      )}

      {modoDemo && (
        <p className="mt-4 text-center text-xs font-semibold text-[#087ef5]">
          Estudio de demostración
        </p>
      )}

      <button
        type="button"
        onClick={onAccion}
        className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#087ef5]"
      >
        {completado
          ? "Ver resultados"
          : "Ver detalles"}
      </button>
    </article>
  );
}

function DetalleEstudio({
  icono,
  etiqueta,
  valor,
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 shrink-0 text-[#087ef5]">
        {icono}
      </span>

      <span className="text-slate-500">
        {etiqueta}
      </span>

      <span className="ml-auto max-w-[55%] text-right font-semibold text-[#10254b]">
        {valor}
      </span>
    </div>
  );
}

function EstadoVacio({
  existeBusqueda,
  onLimpiar,
}) {
  return (
    <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-violet-50 text-violet-600">
        <FlaskConical size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#10254b]">
        {existeBusqueda
          ? "No encontramos estudios"
          : "No tienes estudios registrados"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {existeBusqueda
          ? "Prueba otra búsqueda o elimina los filtros seleccionados."
          : "Cuando registres un estudio médico, aparecerá en esta sección."}
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

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function esEstado(estudio, estado) {
  return (
    normalizarTexto(estudio?.estado) ===
    normalizarTexto(estado)
  );
}

function obtenerFechaEstudio(estudio) {
  const fecha =
    estudio?.fecha || "1970-01-01";

  const hora = normalizarHora(
    estudio?.hora || "12:00"
  );

  return new Date(`${fecha}T${hora}:00`);
}

function ordenarEstudiosAscendente(a, b) {
  return obtenerFechaEstudio(a) -
    obtenerFechaEstudio(b);
}

function ordenarEstudiosDescendente(a, b) {
  return obtenerFechaEstudio(b) -
    obtenerFechaEstudio(a);
}

function normalizarHora(hora = "") {
  return String(hora).slice(0, 5);
}

function formatearFechaCompleta(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

export default EstudiosPage;