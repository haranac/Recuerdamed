import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  Info,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";
import { supabase } from "../lib/supabase";

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

const filtros = [
  {
    id: "todas",
    nombre: "Todas",
  },
  {
    id: "proximas",
    nombre: "Próximas",
  },
  {
    id: "anteriores",
    nombre: "Anteriores",
  },
];

const opcionesTipo = [
  {
    valor: "consulta",
    etiqueta: "Consulta médica",
  },
  {
    valor: "estudio",
    etiqueta: "Estudio médico",
  },
];

function crearFormularioInicial() {
  return {
    tipo: "consulta",
    especialista: "",
    especialidad: "",
    ubicacion: "",
    fecha: obtenerFechaActual(),
    hora: "09:00",
    motivo: "",
  };
}

function CitasPage() {
  const { user, modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState("todas");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [versionCarga, setVersionCarga] =
    useState(0);

  const [formularioAbierto, setFormularioAbierto] =
    useState(false);
  const [citaEditando, setCitaEditando] =
    useState(null);
  const [formulario, setFormulario] = useState(
    crearFormularioInicial
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] =
    useState(null);
  const [citaSeleccionada, setCitaSeleccionada] =
    useState(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarCitas() {
      setCargando(true);
      setErrorCarga("");

      if (modoDemo) {
        const citasDemo = (datosDemo.citas ?? []).map(
          normalizarCita
        );

        if (componenteActivo) {
          setCitas(citasDemo);
          setCargando(false);
        }

        return;
      }

      if (!user?.id) {
        if (componenteActivo) {
          setCitas([]);
          setCargando(false);
        }

        return;
      }

      try {
        const { data, error } = await supabase
          .from("citas")
          .select(CAMPOS_CITA)
          .eq("user_id", user.id)
          .order("fecha", {
            ascending: true,
          })
          .order("hora", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        if (componenteActivo) {
          setCitas((data ?? []).map(normalizarCita));
        }
      } catch (error) {
        console.error(
          "No fue posible cargar las citas:",
          error
        );

        if (componenteActivo) {
          setCitas([]);
          setErrorCarga(
            "No fue posible cargar tus citas. Verifica la conexión y que la migración SQL de citas se haya ejecutado correctamente."
          );
        }
      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    }

    cargarCitas();

    return () => {
      componenteActivo = false;
    };
  }, [modoDemo, user?.id, versionCarga]);

  const citasProximas = useMemo(
    () =>
      citas
        .filter((cita) => esCitaProxima(cita))
        .sort(ordenarCitasAscendente),
    [citas]
  );

  const citasAnteriores = useMemo(
    () =>
      citas
        .filter((cita) => !esCitaProxima(cita))
        .sort(ordenarCitasDescendente),
    [citas]
  );

  const citasFiltradas = useMemo(() => {
    const texto = normalizarTexto(busqueda.trim());

    return citas
      .filter((cita) => {
        const contenido = normalizarTexto(
          [
            cita.especialista,
            cita.especialidad,
            cita.ubicacion,
            cita.tipo,
            cita.motivo,
          ]
            .filter(Boolean)
            .join(" ")
        );

        if (texto && !contenido.includes(texto)) {
          return false;
        }

        if (filtroActivo === "proximas") {
          return esCitaProxima(cita);
        }

        if (filtroActivo === "anteriores") {
          return !esCitaProxima(cita);
        }

        return true;
      })
      .sort((a, b) => {
        const aProxima = esCitaProxima(a);
        const bProxima = esCitaProxima(b);

        if (aProxima && !bProxima) {
          return -1;
        }

        if (!aProxima && bProxima) {
          return 1;
        }

        return aProxima
          ? ordenarCitasAscendente(a, b)
          : ordenarCitasDescendente(a, b);
      });
  }, [busqueda, citas, filtroActivo]);

  const proximaCita = citasProximas[0];

  function mostrarMensaje(
    texto,
    tipo = "informacion"
  ) {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  function abrirNuevaCita() {
    if (modoDemo) {
      mostrarMensaje(
        "El modo demostración es de solo lectura. No se guardará ninguna cita."
      );
      return;
    }

    if (!user?.id) {
      mostrarMensaje(
        "No se encontró una sesión válida.",
        "error"
      );
      return;
    }

    setCitaEditando(null);
    setFormulario(crearFormularioInicial());
    setErrores({});
    setFormularioAbierto(true);
  }

  function abrirEditarCita(cita) {
    if (modoDemo) {
      mostrarMensaje(
        "Las citas de demostración no pueden modificarse."
      );
      return;
    }

    setCitaSeleccionada(null);
    setCitaEditando(cita);
    setFormulario({
      tipo: cita.tipo || "consulta",
      especialista: cita.especialista || "",
      especialidad: cita.especialidad || "",
      ubicacion: cita.ubicacion || "",
      fecha: cita.fecha || obtenerFechaActual(),
      hora: normalizarHora(cita.hora) || "09:00",
      motivo: cita.motivo || "",
    });
    setErrores({});
    setFormularioAbierto(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setFormularioAbierto(false);
    setCitaEditando(null);
    setErrores({});
  }

  function handleCambioFormulario(event) {
    const { name, value } = event.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: value,
    }));

    if (errores[name]) {
      setErrores((erroresActuales) => ({
        ...erroresActuales,
        [name]: "",
      }));
    }
  }

  async function guardarCita(event) {
    event.preventDefault();

    if (modoDemo) {
      mostrarMensaje(
        "El modo demostración es de solo lectura."
      );
      return;
    }

    if (!user?.id) {
      mostrarMensaje(
        "No se encontró una sesión válida.",
        "error"
      );
      return;
    }

    const nuevosErrores = validarFormulario(
      formulario
    );

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const datosCita = {
      user_id: user.id,
      tipo: formulario.tipo,
      especialista: formulario.especialista.trim(),
      especialidad: formulario.especialidad.trim(),
      ubicacion:
        formulario.ubicacion.trim() || null,
      fecha: formulario.fecha,
      hora: normalizarHora(formulario.hora),
      motivo: formulario.motivo.trim() || null,
    };

    setGuardando(true);
    setMensaje("");

    try {
      if (citaEditando) {
        const { data, error } = await supabase
          .from("citas")
          .update(datosCita)
          .eq("id", citaEditando.id)
          .eq("user_id", user.id)
          .select(CAMPOS_CITA)
          .single();

        if (error) {
          throw error;
        }

        const citaActualizada = normalizarCita(data);

        setCitas((actuales) =>
          ordenarCitasParaEstado(
            actuales.map((cita) =>
              cita.id === citaActualizada.id
                ? citaActualizada
                : cita
            )
          )
        );

        mostrarMensaje(
          "La cita se actualizó correctamente.",
          "exito"
        );
      } else {
        const { data, error } = await supabase
          .from("citas")
          .insert(datosCita)
          .select(CAMPOS_CITA)
          .single();

        if (error) {
          throw error;
        }

        const citaCreada = normalizarCita(data);

        setCitas((actuales) =>
          ordenarCitasParaEstado([
            ...actuales,
            citaCreada,
          ])
        );

        mostrarMensaje(
          "La cita se registró correctamente.",
          "exito"
        );
      }

      setFormularioAbierto(false);
      setCitaEditando(null);
      setFormulario(crearFormularioInicial());
      setErrores({});
    } catch (error) {
      console.error(
        "No fue posible guardar la cita:",
        error
      );

      mostrarMensaje(
        error?.message
          ? `No fue posible guardar la cita: ${error.message}`
          : "No fue posible guardar la cita.",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarCita(cita) {
    if (modoDemo) {
      mostrarMensaje(
        "Las citas de demostración no pueden eliminarse."
      );
      return;
    }

    if (!user?.id || procesandoId !== null) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar la cita con ${cita.especialista}? Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    setProcesandoId(cita.id);

    try {
      const { error } = await supabase
        .from("citas")
        .delete()
        .eq("id", cita.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setCitas((actuales) =>
        actuales.filter(
          (elemento) => elemento.id !== cita.id
        )
      );
      setCitaSeleccionada(null);

      mostrarMensaje(
        "La cita se eliminó correctamente.",
        "exito"
      );
    } catch (error) {
      console.error(
        "No fue posible eliminar la cita:",
        error
      );

      mostrarMensaje(
        "No fue posible eliminar la cita.",
        "error"
      );
    } finally {
      setProcesandoId(null);
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
          titulo="Citas"
          descripcion="Consulta y organiza tus consultas médicas."
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
                  Puedes consultar y filtrar las citas, pero
                  no guardar modificaciones.
                </p>
              </div>
            </section>
          )}

          {mensaje && (
            <section
              role="status"
              className={`mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4 ${clasesMensaje.contenedor}`}
            >
              <p className="text-sm leading-6">
                {mensaje}
              </p>

              <button
                type="button"
                onClick={() => setMensaje("")}
                aria-label="Cerrar mensaje"
                className={`shrink-0 transition ${clasesMensaje.boton}`}
              >
                <X size={19} />
              </button>
            </section>
          )}

          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-[#087ef5]">
                Agenda médica
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#10254b]">
                Mis citas
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Consulta tus próximas visitas y citas
                anteriores.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirNuevaCita}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6]"
            >
              <Plus size={19} />
              Agregar cita
            </button>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-3">
            <TarjetaResumen
              titulo="Total"
              cantidad={citas.length}
              icono={<CalendarDays size={22} />}
              clases="bg-blue-50 text-blue-600"
            />

            <TarjetaResumen
              titulo="Próximas"
              cantidad={citasProximas.length}
              icono={<CalendarCheck size={22} />}
              clases="bg-emerald-50 text-emerald-600"
            />

            <TarjetaResumen
              titulo="Anteriores"
              cantidad={citasAnteriores.length}
              icono={<Clock3 size={22} />}
              clases="bg-slate-100 text-slate-600"
            />
          </section>

          {proximaCita && !cargando && !errorCarga && (
            <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#082b63] p-7 text-white shadow-xl shadow-blue-950/10">
              <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />

              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                  Próxima cita
                </p>

                <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {proximaCita.especialista}
                    </h3>

                    <p className="mt-2 text-blue-100">
                      {proximaCita.especialidad}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                        <CalendarDays size={17} />
                        {formatearFechaCompleta(
                          proximaCita.fecha
                        )}
                      </span>

                      <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                        <Clock3 size={17} />
                        {normalizarHora(proximaCita.hora)}
                      </span>

                      {proximaCita.ubicacion && (
                        <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                          <MapPin size={17} />
                          {proximaCita.ubicacion}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCitaSeleccionada(proximaCita)
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
                  placeholder="Buscar especialista o ubicación..."
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
          ) : citasFiltradas.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {citasFiltradas.map((cita) => (
                <CitaCard
                  key={cita.id}
                  cita={cita}
                  modoDemo={modoDemo}
                  onVerDetalles={() =>
                    setCitaSeleccionada(cita)
                  }
                />
              ))}
            </section>
          ) : (
            <EstadoVacio
              existeBusqueda={
                busqueda.trim() !== "" ||
                filtroActivo !== "todas"
              }
              onLimpiar={() => {
                setBusqueda("");
                setFiltroActivo("todas");
              }}
              onAgregar={abrirNuevaCita}
              modoDemo={modoDemo}
            />
          )}
        </div>
      </main>

      {formularioAbierto && (
        <FormularioCita
          formulario={formulario}
          errores={errores}
          guardando={guardando}
          editando={Boolean(citaEditando)}
          onCambio={handleCambioFormulario}
          onCerrar={cerrarFormulario}
          onGuardar={guardarCita}
        />
      )}

      {citaSeleccionada && (
        <DetallesCita
          cita={citaSeleccionada}
          modoDemo={modoDemo}
          procesando={
            procesandoId === citaSeleccionada.id
          }
          onCerrar={() => setCitaSeleccionada(null)}
          onEditar={() =>
            abrirEditarCita(citaSeleccionada)
          }
          onEliminar={() =>
            eliminarCita(citaSeleccionada)
          }
        />
      )}
    </div>
  );
}

function FormularioCita({
  formulario,
  errores,
  guardando,
  editando,
  onCambio,
  onCerrar,
  onGuardar,
}) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-formulario-cita"
    >
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/20">
          <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf6ff] text-[#087ef5]">
                <CalendarDays size={24} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#087ef5]">
                  {editando
                    ? "Actualizar agenda"
                    : "Nueva visita"}
                </p>

                <h2
                  id="titulo-formulario-cita"
                  className="mt-1 text-2xl font-bold text-[#10254b]"
                >
                  {editando
                    ? "Editar cita"
                    : "Registrar cita"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Agrega la información de tu próxima visita
                  médica.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              aria-label="Cerrar formulario"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={21} />
            </button>
          </div>

          <form
            onSubmit={onGuardar}
            className="px-6 py-6 sm:px-8"
          >
            <fieldset
              disabled={guardando}
              className="grid gap-5 md:grid-cols-2"
            >
              <CampoSeleccion
                etiqueta="Tipo de cita"
                nombre="tipo"
                valor={formulario.tipo}
                onCambio={onCambio}
                opciones={opcionesTipo}
              />

              <CampoFormulario
                etiqueta="Especialista"
                nombre="especialista"
                valor={formulario.especialista}
                onCambio={onCambio}
                error={errores.especialista}
                placeholder="Ej. Dra. Ana García"
                icono={<UserRound size={18} />}
                autoFocus
              />

              <CampoFormulario
                etiqueta="Especialidad"
                nombre="especialidad"
                valor={formulario.especialidad}
                onCambio={onCambio}
                error={errores.especialidad}
                placeholder="Ej. Cardiología"
                icono={<Stethoscope size={18} />}
              />

              <CampoFormulario
                etiqueta="Ubicación"
                nombre="ubicacion"
                valor={formulario.ubicacion}
                onCambio={onCambio}
                error={errores.ubicacion}
                placeholder="Ej. Clínica Central, consultorio 5"
                icono={<MapPin size={18} />}
                ayuda="Opcional"
              />

              <CampoFormulario
                etiqueta="Fecha"
                nombre="fecha"
                tipo="date"
                valor={formulario.fecha}
                onCambio={onCambio}
                error={errores.fecha}
                icono={<CalendarDays size={18} />}
              />

              <CampoFormulario
                etiqueta="Hora"
                nombre="hora"
                tipo="time"
                valor={formulario.hora}
                onCambio={onCambio}
                error={errores.hora}
                icono={<Clock3 size={18} />}
              />
            </fieldset>

            <fieldset
              disabled={guardando}
              className="mt-5"
            >
              <label
                htmlFor="motivo"
                className="text-sm font-bold text-[#10254b]"
              >
                Motivo o notas
              </label>

              <div className="relative mt-2">
                <FileText
                  size={18}
                  className="absolute left-4 top-4 text-slate-400"
                />

                <textarea
                  id="motivo"
                  name="motivo"
                  value={formulario.motivo}
                  onChange={onCambio}
                  rows={4}
                  placeholder="Ej. Revisión general y seguimiento del tratamiento."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </fieldset>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardando}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Registrar cita"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function DetallesCita({
  cita,
  modoDemo,
  procesando,
  onCerrar,
  onEditar,
  onEliminar,
}) {
  const proxima = esCitaProxima(cita);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalles-cita"
    >
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <section className="w-full rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  proxima
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                <Stethoscope size={24} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#087ef5]">
                  Detalles de la cita
                </p>

                <h2
                  id="titulo-detalles-cita"
                  className="mt-1 text-2xl font-bold text-[#10254b]"
                >
                  {cita.especialista}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {cita.especialidad}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar detalles"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={21} />
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <DatoDetalle
              etiqueta="Estado"
              valor={proxima ? "Próxima" : "Finalizada"}
            />

            <DatoDetalle
              etiqueta="Tipo"
              valor={formatearTipo(cita.tipo)}
            />

            <DatoDetalle
              etiqueta="Fecha"
              valor={formatearFechaCompleta(cita.fecha)}
              icono={
                <CalendarDays
                  size={17}
                  className="text-[#087ef5]"
                />
              }
            />

            <DatoDetalle
              etiqueta="Hora"
              valor={normalizarHora(cita.hora)}
              icono={
                <Clock3
                  size={17}
                  className="text-[#087ef5]"
                />
              }
            />

            <div className="sm:col-span-2">
              <DatoDetalle
                etiqueta="Ubicación"
                valor={
                  cita.ubicacion || "Sin especificar"
                }
                icono={
                  <MapPin
                    size={17}
                    className="text-[#087ef5]"
                  />
                }
              />
            </div>
          </div>

          {cita.motivo && (
            <div className="mt-5 rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Motivo o notas
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                {cita.motivo}
              </p>
            </div>
          )}

          {modoDemo && (
            <p className="mt-5 text-center text-xs font-semibold text-[#087ef5]">
              Cita de demostración de solo lectura
            </p>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onEditar}
              disabled={modoDemo || procesando}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil size={18} />
              Editar cita
            </button>

            <button
              type="button"
              onClick={onEliminar}
              disabled={modoDemo || procesando}
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Trash2 size={18} />
              )}

              Eliminar cita
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function CampoFormulario({
  etiqueta,
  nombre,
  tipo = "text",
  valor,
  onCambio,
  error,
  placeholder,
  icono,
  ayuda,
  min,
  autoFocus = false,
}) {
  const id = `campo-${nombre}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-sm font-bold text-[#10254b]"
        >
          {etiqueta}
        </label>

        {ayuda && (
          <span className="text-xs text-slate-400">
            {ayuda}
          </span>
        )}
      </div>

      <div className="relative mt-2">
        {icono && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icono}
          </span>
        )}

        <input
          id={id}
          name={nombre}
          type={tipo}
          value={valor}
          onChange={onCambio}
          placeholder={placeholder}
          min={min}
          autoFocus={autoFocus}
          className={[
            "w-full rounded-2xl border bg-slate-50 py-3 pr-4 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4",
            icono ? "pl-12" : "pl-4",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
          ].join(" ")}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function CampoSeleccion({
  etiqueta,
  nombre,
  valor,
  onCambio,
  opciones,
}) {
  const id = `campo-${nombre}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-bold text-[#10254b]"
      >
        {etiqueta}
      </label>

      <select
        id={id}
        name={nombre}
        value={valor}
        onChange={onCambio}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#10254b] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      >
        {opciones.map((opcion) => (
          <option
            key={`${nombre}-${opcion.valor}`}
            value={opcion.valor}
          >
            {opcion.etiqueta}
          </option>
        ))}
      </select>
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

function CitaCard({
  cita,
  modoDemo,
  onVerDetalles,
}) {
  const proxima = esCitaProxima(cita);

  return (
    <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf6ff] text-[#087ef5]">
          <Stethoscope size={24} />
        </div>

        <span
          className={[
            "rounded-full px-3 py-1.5 text-xs font-bold",
            proxima
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {proxima ? "Próxima" : "Finalizada"}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold text-[#10254b]">
          {cita.especialista}
        </h3>

        <p className="mt-1 text-sm font-medium text-[#087ef5]">
          {cita.especialidad}
        </p>

        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {formatearTipo(cita.tipo)}
        </p>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
        <DetalleCita
          icono={<CalendarDays size={18} />}
          etiqueta="Fecha"
          valor={formatearFechaCompleta(cita.fecha)}
        />

        <DetalleCita
          icono={<Clock3 size={18} />}
          etiqueta="Hora"
          valor={normalizarHora(cita.hora)}
        />

        <DetalleCita
          icono={<MapPin size={18} />}
          etiqueta="Ubicación"
          valor={cita.ubicacion || "Sin especificar"}
        />
      </div>

      {modoDemo && (
        <p className="mt-4 text-center text-xs font-semibold text-[#087ef5]">
          Cita de demostración
        </p>
      )}

      <button
        type="button"
        onClick={onVerDetalles}
        className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#087ef5]"
      >
        Ver detalles
      </button>
    </article>
  );
}

function DetalleCita({
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

function DatoDetalle({
  etiqueta,
  valor,
  icono,
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {etiqueta}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {icono}
        <p className="text-sm font-semibold text-[#10254b]">
          {valor}
        </p>
      </div>
    </div>
  );
}

function EstadoCargando() {
  return (
    <section className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-slate-100 bg-white px-6 text-center shadow-lg shadow-slate-200/30">
      <LoaderCircle
        size={34}
        className="animate-spin text-[#087ef5]"
      />

      <p className="mt-4 font-bold text-[#10254b]">
        Cargando citas
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Estamos consultando tu agenda médica.
      </p>
    </section>
  );
}

function EstadoError({
  mensaje,
  onReintentar,
}) {
  return (
    <section className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-red-100 bg-white px-6 text-center shadow-lg shadow-slate-200/30">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-600">
        <X size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#10254b]">
        No pudimos cargar las citas
      </h3>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {mensaje}
      </p>

      <button
        type="button"
        onClick={onReintentar}
        className="mt-5 flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#075dd6]"
      >
        <RefreshCw size={18} />
        Reintentar
      </button>
    </section>
  );
}

function EstadoVacio({
  existeBusqueda,
  onLimpiar,
  onAgregar,
  modoDemo,
}) {
  return (
    <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#eaf6ff] text-[#087ef5]">
        <UserRound size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#10254b]">
        {existeBusqueda
          ? "No encontramos citas"
          : "No tienes citas registradas"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {existeBusqueda
          ? "Prueba con otra búsqueda o elimina el filtro seleccionado."
          : "Cuando registres una cita médica, aparecerá en esta sección."}
      </p>

      {existeBusqueda ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="mt-5 rounded-xl bg-[#087ef5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#075dd6]"
        >
          Limpiar filtros
        </button>
      ) : (
        !modoDemo && (
          <button
            type="button"
            onClick={onAgregar}
            className="mt-5 flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#075dd6]"
          >
            <Plus size={18} />
            Registrar primera cita
          </button>
        )
      )}
    </section>
  );
}

function validarFormulario(formulario) {
  const errores = {};

  if (!formulario.especialista.trim()) {
    errores.especialista =
      "Escribe el nombre del especialista.";
  }

  if (!formulario.especialidad.trim()) {
    errores.especialidad =
      "Escribe la especialidad médica.";
  }

  if (!formulario.fecha) {
    errores.fecha = "Selecciona la fecha de la cita.";
  }

  if (!formulario.hora) {
    errores.hora = "Selecciona la hora de la cita.";
  }

  if (
    !opcionesTipo.some(
      (opcion) => opcion.valor === formulario.tipo
    )
  ) {
    errores.tipo = "Selecciona un tipo válido.";
  }

  return errores;
}

function normalizarCita(cita = {}) {
  return {
    id: cita.id,
    createdAt: cita.created_at || null,
    actualizadoEn: cita.actualizado_en || null,
    userId: cita.user_id || null,
    tipo: cita.tipo || "consulta",
    especialista:
      cita.especialista || "Sin especificar",
    especialidad:
      cita.especialidad || "Sin especificar",
    ubicacion: cita.ubicacion || "",
    fecha: cita.fecha || obtenerFechaActual(),
    hora: normalizarHora(cita.hora || "09:00"),
    motivo: cita.motivo || "",
  };
}

function ordenarCitasParaEstado(citas) {
  return [...citas].sort((a, b) => {
    const aProxima = esCitaProxima(a);
    const bProxima = esCitaProxima(b);

    if (aProxima && !bProxima) {
      return -1;
    }

    if (!aProxima && bProxima) {
      return 1;
    }

    return aProxima
      ? ordenarCitasAscendente(a, b)
      : ordenarCitasDescendente(a, b);
  });
}

function obtenerFechaCita(cita) {
  const fecha = cita?.fecha || "1970-01-01";
  const hora = normalizarHora(cita?.hora || "00:00");

  return new Date(`${fecha}T${hora}:00`);
}

function esCitaProxima(cita) {
  return obtenerFechaCita(cita).getTime() >= Date.now();
}

function ordenarCitasAscendente(a, b) {
  return obtenerFechaCita(a) - obtenerFechaCita(b);
}

function ordenarCitasDescendente(a, b) {
  return obtenerFechaCita(b) - obtenerFechaCita(a);
}

function normalizarHora(hora = "") {
  return String(hora).slice(0, 5);
}

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenerFechaActual() {
  const fecha = new Date();
  const desplazamiento = fecha.getTimezoneOffset();
  const fechaLocal = new Date(
    fecha.getTime() - desplazamiento * 60 * 1000
  );

  return fechaLocal.toISOString().slice(0, 10);
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

function formatearTipo(tipo) {
  return tipo === "estudio"
    ? "Estudio médico"
    : "Consulta médica";
}

function obtenerClasesMensaje(tipo) {
  const clases = {
    exito: {
      contenedor:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
      boton:
        "text-emerald-600 hover:text-emerald-800",
    },
    error: {
      contenedor:
        "border-red-200 bg-red-50 text-red-800",
      boton: "text-red-600 hover:text-red-800",
    },
    informacion: {
      contenedor:
        "border-amber-200 bg-amber-50 text-amber-800",
      boton:
        "text-amber-600 hover:text-amber-800",
    },
  };

  return clases[tipo] || clases.informacion;
}

export default CitasPage;