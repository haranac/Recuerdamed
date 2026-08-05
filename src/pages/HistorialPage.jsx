import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  CalendarDays,
  Clock3,
  Download,
  ExternalLink,
  FileClock,
  FileText,
  FlaskConical,
  Info,
  LoaderCircle,
  Pill,
  RefreshCw,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";
import { supabase } from "../lib/supabase";

const BUCKET_ESTUDIOS = "estudios";

const CAMPOS_CITA = `
  id,
  created_at,
  actualizado_en,
  user_id,
  tipo,
  especialista,
  especialidad,
  ubicacion,
  fecha,
  hora,
  motivo
`;

const CAMPOS_MEDICAMENTO = `
  id,
  nombre,
  dosis,
  tomado,
  created_at,
  user_id,
  tipo,
  unidad,
  frecuencia,
  hora,
  fecha_inicio,
  fecha_fin,
  indicaciones,
  activo,
  actualizado_en
`;

const CAMPOS_ESTUDIO = `
  id,
  created_at,
  actualizado_en,
  user_id,
  nombre,
  tipo,
  institucion,
  estado,
  fecha,
  hora,
  resultado,
  descripcion,
  imagen_url
`;

const CAMPOS_ARCHIVO = `
  id,
  estudio_id,
  nombre_archivo,
  archivo_path,
  mime_type,
  tamanio,
  bucket_id
`;

const filtros = [
  { id: "todos", nombre: "Todos" },
  { id: "cita", nombre: "Citas" },
  {
    id: "medicamento",
    nombre: "Medicamentos",
  },
  { id: "estudio", nombre: "Estudios" },
];

function HistorialPage() {
  const { user, modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState("todos");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");

  const [actividad, setActividad] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [versionCarga, setVersionCarga] =
    useState(0);
  const [registroSeleccionado, setRegistroSeleccionado] =
    useState(null);
  const [archivoProcesando, setArchivoProcesando] =
    useState(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarHistorial() {
      setCargando(true);
      setErrorCarga("");

      if (modoDemo) {
        if (componenteActivo) {
          setActividad(
            (datosDemo.actividad ?? []).map(
              normalizarRegistroDemo
            )
          );
          setCargando(false);
        }

        return;
      }

      if (!user?.id) {
        if (componenteActivo) {
          setActividad([]);
          setCargando(false);
        }

        return;
      }

      try {
        const [
          respuestaCitas,
          respuestaMedicamentos,
          respuestaEstudios,
          respuestaArchivos,
        ] = await Promise.all([
          supabase
            .from("citas")
            .select(CAMPOS_CITA)
            .eq("user_id", user.id),
          supabase
            .from("medicamentos")
            .select(CAMPOS_MEDICAMENTO)
            .eq("user_id", user.id),
          supabase
            .from("estudios")
            .select(CAMPOS_ESTUDIO)
            .eq("user_id", user.id),
          supabase
            .from("estudios_medicos")
            .select(CAMPOS_ARCHIVO)
            .eq("user_id", user.id),
        ]);

        const respuestas = [
          respuestaCitas,
          respuestaMedicamentos,
          respuestaEstudios,
          respuestaArchivos,
        ];

        const respuestaConError = respuestas.find(
          (respuesta) => respuesta.error
        );

        if (respuestaConError?.error) {
          throw respuestaConError.error;
        }

        const archivosPorEstudio = new Map();

        for (const archivo of
          respuestaArchivos.data ?? []) {
          if (!archivo.estudio_id) {
            continue;
          }

          const archivos =
            archivosPorEstudio.get(
              archivo.estudio_id
            ) ?? [];

          archivos.push(normalizarArchivo(archivo));
          archivosPorEstudio.set(
            archivo.estudio_id,
            archivos
          );
        }

        const registros = [
          ...(respuestaCitas.data ?? []).map(
            convertirCitaARegistro
          ),
          ...(respuestaMedicamentos.data ?? []).map(
            convertirMedicamentoARegistro
          ),
          ...(respuestaEstudios.data ?? []).map(
            (estudio) =>
              convertirEstudioARegistro({
                ...estudio,
                archivos:
                  archivosPorEstudio.get(estudio.id) ??
                  [],
              })
          ),
        ];

        if (componenteActivo) {
          setActividad(
            registros.sort(
              (a, b) =>
                obtenerFechaRegistro(b) -
                obtenerFechaRegistro(a)
            )
          );
        }
      } catch (error) {
        console.error(
          "No fue posible cargar el historial:",
          error
        );

        if (componenteActivo) {
          setActividad([]);
          setErrorCarga(
            "No fue posible cargar tu historial. Verifica la conexión, las tablas y las políticas RLS de Supabase."
          );
        }
      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    }

    cargarHistorial();

    return () => {
      componenteActivo = false;
    };
  }, [modoDemo, user?.id, versionCarga]);

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
            ...Object.values(registro.detalles ?? {}),
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

  function mostrarMensaje(
    texto,
    tipo = "informacion"
  ) {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  function handleExportar() {
    if (modoDemo) {
      mostrarMensaje(
        "La exportación no está disponible en el modo demostración."
      );
      return;
    }

    if (registrosFiltrados.length === 0) {
      mostrarMensaje(
        "No hay registros disponibles para exportar.",
        "error"
      );
      return;
    }

    const encabezados = [
      "Tipo",
      "Título",
      "Descripción",
      "Fecha",
      "Hora",
      "Estado",
    ];

    const filas = registrosFiltrados.map(
      (registro) => [
        obtenerConfiguracionTipo(registro.tipo).nombre,
        registro.titulo,
        registro.descripcion,
        registro.fecha,
        normalizarHora(registro.hora),
        registro.estado || "",
      ]
    );

    const csv = [encabezados, ...filas]
      .map((fila) =>
        fila.map(escaparValorCsv).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `historial-medico-${obtenerFechaActual()}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);

    mostrarMensaje(
      "El historial se exportó correctamente.",
      "exito"
    );
  }

  async function abrirArchivo(archivo) {
    if (!archivo?.archivoPath) {
      mostrarMensaje(
        "Este archivo no tiene una ruta válida.",
        "error"
      );
      return;
    }

    if (modoDemo) {
      mostrarMensaje(
        "Los archivos del modo demostración son únicamente ilustrativos."
      );
      return;
    }

    setArchivoProcesando(archivo.id);

    try {
      const { data, error } = await supabase.storage
        .from(archivo.bucketId || BUCKET_ESTUDIOS)
        .createSignedUrl(archivo.archivoPath, 300);

      if (error) {
        throw error;
      }

      const ventana = window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!ventana) {
        mostrarMensaje(
          "El navegador bloqueó la pestaña. Habilita las ventanas emergentes para abrir el archivo.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "No fue posible abrir el archivo:",
        error
      );
      mostrarMensaje(
        "No fue posible abrir el archivo del estudio.",
        "error"
      );
    } finally {
      setArchivoProcesando(null);
    }
  }

  const clasesMensaje = obtenerClasesMensaje(
    tipoMensaje
  );

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
              className={`mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4 ${clasesMensaje}`}
            >
              <p className="text-sm leading-6">
                {mensaje}
              </p>

              <button
                type="button"
                onClick={() => setMensaje("")}
                aria-label="Cerrar mensaje"
                className="shrink-0 opacity-70 transition hover:opacity-100"
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
              disabled={cargando}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#087ef5] bg-white px-5 py-3 text-sm font-bold text-[#087ef5] transition hover:bg-[#eaf6ff] disabled:cursor-not-allowed disabled:opacity-50"
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

          {cargando ? (
            <EstadoCargando />
          ) : errorCarga ? (
            <EstadoError
              mensaje={errorCarga}
              onReintentar={() =>
                setVersionCarga(
                  (versionActual) =>
                    versionActual + 1
                )
              }
            />
          ) : registrosFiltrados.length > 0 ? (
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
                      onDetalles={() =>
                        setRegistroSeleccionado(registro)
                      }
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

      {registroSeleccionado && (
        <ModalDetalles
          registro={registroSeleccionado}
          archivoProcesando={archivoProcesando}
          onAbrirArchivo={abrirArchivo}
          onCerrar={() =>
            setRegistroSeleccionado(null)
          }
        />
      )}
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

function ModalDetalles({
  registro,
  archivoProcesando,
  onAbrirArchivo,
  onCerrar,
}) {
  const configuracion =
    obtenerConfiguracionTipo(registro.tipo);
  const Icono = configuracion.icono;
  const detalles = Object.entries(
    registro.detalles ?? {}
  ).filter(([, valor]) =>
    valor !== null &&
    valor !== undefined &&
    String(valor).trim() !== ""
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Detalles del registro"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCerrar();
        }
      }}
    >
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${configuracion.clases}`}
            >
              <Icono size={23} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087ef5]">
                {configuracion.nombre}
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#10254b]">
                {registro.titulo}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {registro.descripcion}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalles"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={21} />
          </button>
        </header>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3">
            <DetalleModal
              etiqueta="Fecha"
              valor={formatearFechaCompleta(
                registro.fecha
              )}
            />
            <DetalleModal
              etiqueta="Hora"
              valor={
                registro.hora
                  ? normalizarHora(registro.hora)
                  : "Sin horario"
              }
            />
            <DetalleModal
              etiqueta="Estado"
              valor={registro.estado || "Sin estado"}
            />
          </div>

          {detalles.length > 0 && (
            <div>
              <h4 className="font-bold text-[#10254b]">
                Información registrada
              </h4>

              <dl className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {detalles.map(([etiqueta, valor]) => (
                  <div
                    key={etiqueta}
                    className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr] sm:gap-4"
                  >
                    <dt className="text-sm font-semibold text-slate-400">
                      {etiqueta}
                    </dt>
                    <dd className="text-sm leading-6 text-[#10254b]">
                      {formatearValorDetalle(valor)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {(registro.archivos ?? []).length > 0 && (
            <div>
              <h4 className="font-bold text-[#10254b]">
                Archivos del estudio
              </h4>

              <div className="mt-3 space-y-3">
                {registro.archivos.map((archivo) => {
                  const procesando =
                    archivoProcesando === archivo.id;

                  return (
                    <div
                      key={archivo.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4"
                    >
                      <FileText
                        size={21}
                        className="shrink-0 text-violet-600"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#10254b]">
                          {archivo.nombreArchivo}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatearTamanioArchivo(
                            archivo.tamanio
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onAbrirArchivo(archivo)
                        }
                        disabled={procesando}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-600 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {procesando ? (
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <ExternalLink size={16} />
                        )}
                        Abrir
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DetalleModal({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {etiqueta}
      </p>
      <p className="mt-1 text-sm font-bold text-[#10254b]">
        {valor}
      </p>
    </div>
  );
}

function EstadoCargando() {
  return (
    <section className="mt-7 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-slate-100 bg-white px-6 text-center shadow-lg shadow-slate-200/30">
      <LoaderCircle
        size={34}
        className="animate-spin text-[#087ef5]"
      />
      <p className="mt-4 font-bold text-[#10254b]">
        Cargando historial
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Estamos consultando tus registros médicos.
      </p>
    </section>
  );
}

function EstadoError({ mensaje, onReintentar }) {
  return (
    <section className="mt-7 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-red-100 bg-white px-6 text-center shadow-lg shadow-slate-200/30">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-600">
        <FileClock size={30} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#10254b]">
        No pudimos cargar el historial
      </h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {mensaje}
      </p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#075dd6]"
      >
        <RefreshCw size={17} />
        Reintentar
      </button>
    </section>
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

function convertirCitaARegistro(cita) {
  const proxima =
    obtenerFechaDesdeCampos(cita.fecha, cita.hora) >=
    new Date();

  return {
    id: `cita-${cita.id}`,
    registroId: cita.id,
    tipo: "cita",
    titulo: cita.especialista
      ? `Cita con ${cita.especialista}`
      : "Cita médica",
    descripcion: [
      cita.especialidad,
      cita.ubicacion,
    ]
      .filter(Boolean)
      .join(" · ") || "Consulta médica registrada",
    fecha: cita.fecha,
    hora: normalizarHora(cita.hora),
    estado: proxima ? "Próxima" : "Finalizada",
    createdAt: cita.created_at,
    detalles: {
      Tipo: capitalizar(cita.tipo || "consulta"),
      Especialista:
        cita.especialista || "Sin especificar",
      Especialidad:
        cita.especialidad || "Sin especificar",
      Ubicación: cita.ubicacion || "Sin especificar",
      Motivo: cita.motivo || "Sin especificar",
    },
    archivos: [],
  };
}

function convertirMedicamentoARegistro(medicamento) {
  const dosis = combinarDosis(
    medicamento.dosis,
    medicamento.unidad
  );

  return {
    id: `medicamento-${medicamento.id}`,
    registroId: medicamento.id,
    tipo: "medicamento",
    titulo: medicamento.nombre || "Medicamento",
    descripcion: [dosis, medicamento.frecuencia]
      .filter(Boolean)
      .join(" · ") || "Tratamiento registrado",
    fecha:
      medicamento.fecha_inicio ||
      obtenerSoloFecha(medicamento.created_at),
    hora: normalizarHora(medicamento.hora),
    estado: medicamento.activo
      ? medicamento.tomado
        ? "Activo · tomado"
        : "Activo · pendiente"
      : "Inactivo",
    createdAt: medicamento.created_at,
    detalles: {
      Tipo: capitalizar(
        medicamento.tipo || "Sin especificar"
      ),
      Dosis: dosis || "Sin especificar",
      Frecuencia:
        medicamento.frecuencia || "Sin especificar",
      "Fecha de inicio": formatearFechaCompleta(
        medicamento.fecha_inicio
      ),
      "Fecha de finalización": medicamento.fecha_fin
        ? formatearFechaCompleta(
            medicamento.fecha_fin
          )
        : "Sin fecha final",
      Indicaciones:
        medicamento.indicaciones || "Sin especificar",
    },
    archivos: [],
  };
}

function convertirEstudioARegistro(estudio) {
  return {
    id: `estudio-${estudio.id}`,
    registroId: estudio.id,
    tipo: "estudio",
    titulo: estudio.nombre || "Estudio médico",
    descripcion: [
      estudio.tipo,
      estudio.institucion,
    ]
      .filter(Boolean)
      .join(" · ") || "Estudio médico registrado",
    fecha:
      estudio.fecha ||
      obtenerSoloFecha(estudio.created_at),
    hora: normalizarHora(estudio.hora),
    estado: capitalizar(
      estudio.estado || "programado"
    ),
    createdAt: estudio.created_at,
    detalles: {
      Tipo: estudio.tipo || "Estudio médico",
      Institución:
        estudio.institucion || "Sin especificar",
      Descripción:
        estudio.descripcion || "Sin especificar",
      Resultado:
        estudio.resultado || "Sin resultado registrado",
      "Archivos adjuntos": String(
        (estudio.archivos ?? []).length
      ),
    },
    archivos: estudio.archivos ?? [],
  };
}

function normalizarRegistroDemo(registro) {
  return {
    ...registro,
    id: `demo-${registro.id}`,
    detalles: registro.detalles ?? {},
    archivos: registro.archivos ?? [],
  };
}

function normalizarArchivo(archivo) {
  return {
    id: archivo.id,
    estudioId: archivo.estudio_id,
    nombreArchivo:
      archivo.nombre_archivo || "Archivo médico",
    archivoPath: archivo.archivo_path,
    mimeType: archivo.mime_type,
    tamanio: Number(archivo.tamanio || 0),
    bucketId: archivo.bucket_id || BUCKET_ESTUDIOS,
  };
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
      etiqueta:
        "bg-emerald-50 text-emerald-600",
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
  if (registro?.fecha) {
    return obtenerFechaDesdeCampos(
      registro.fecha,
      registro.hora || "00:00"
    );
  }

  return registro?.createdAt
    ? new Date(registro.createdAt)
    : new Date("1970-01-01T00:00:00");
}

function obtenerFechaDesdeCampos(fecha, hora = "00:00") {
  if (!fecha) {
    return new Date("1970-01-01T00:00:00");
  }

  return new Date(
    `${fecha}T${normalizarHora(hora) || "00:00"}:00`
  );
}

function combinarDosis(dosis, unidad) {
  const dosisLimpia = String(dosis || "").trim();
  const unidadLimpia = String(unidad || "").trim();

  if (!dosisLimpia) {
    return unidadLimpia;
  }

  if (
    unidadLimpia &&
    !normalizarTexto(dosisLimpia).includes(
      normalizarTexto(unidadLimpia)
    )
  ) {
    return `${dosisLimpia} ${unidadLimpia}`;
  }

  return dosisLimpia;
}

function escaparValorCsv(valor) {
  const texto = String(valor ?? "").replace(
    /"/g,
    '""'
  );
  return `"${texto}"`;
}

function obtenerClasesMensaje(tipo) {
  const clases = {
    exito:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    informacion:
      "border-amber-200 bg-amber-50 text-amber-800",
  };

  return clases[tipo] ?? clases.informacion;
}

function formatearValorDetalle(valor) {
  if (typeof valor === "boolean") {
    return valor ? "Sí" : "No";
  }

  return String(valor);
}

function formatearTamanioArchivo(bytes) {
  const tamanio = Number(bytes || 0);

  if (tamanio < 1024) {
    return `${tamanio} B`;
  }

  if (tamanio < 1024 * 1024) {
    return `${(tamanio / 1024).toFixed(1)} KB`;
  }

  return `${(tamanio / (1024 * 1024)).toFixed(
    1
  )} MB`;
}

function obtenerSoloFecha(fechaHora) {
  if (!fechaHora) {
    return obtenerFechaActual();
  }

  return String(fechaHora).slice(0, 10);
}

function obtenerFechaActual() {
  const fecha = new Date();
  const desplazamiento = fecha.getTimezoneOffset();
  const fechaLocal = new Date(
    fecha.getTime() - desplazamiento * 60 * 1000
  );

  return fechaLocal.toISOString().slice(0, 10);
}

function normalizarHora(hora = "") {
  return String(hora || "").slice(0, 5);
}

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function capitalizar(texto = "") {
  const valor = String(texto).trim();

  if (!valor) {
    return "";
  }

  return valor.charAt(0).toUpperCase() + valor.slice(1);
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