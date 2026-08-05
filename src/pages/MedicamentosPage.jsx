import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  LoaderCircle,
  Moon,
  Pencil,
  Pill,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sun,
  Sunset,
  Trash2,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";
import { supabase } from "../lib/supabase";

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

const filtros = [
  {
    id: "todos",
    nombre: "Todos",
  },
  {
    id: "activos",
    nombre: "Activos",
  },
  {
    id: "manana",
    nombre: "Mañana",
  },
  {
    id: "tarde",
    nombre: "Tarde",
  },
  {
    id: "noche",
    nombre: "Noche",
  },
];

const opcionesTipo = [
  { valor: "", etiqueta: "Selecciona un tipo" },
  { valor: "pastilla", etiqueta: "Pastilla" },
  { valor: "capsula", etiqueta: "Cápsula" },
  { valor: "jarabe", etiqueta: "Jarabe" },
  { valor: "inyectable", etiqueta: "Inyectable" },
  { valor: "gotas", etiqueta: "Gotas" },
  { valor: "crema", etiqueta: "Crema o ungüento" },
  { valor: "otro", etiqueta: "Otro" },
];

const unidadesPorTipo = {
  pastilla: [
    { valor: "mg", etiqueta: "Miligramos (mg)" },
    { valor: "g", etiqueta: "Gramos (g)" },
    { valor: "mcg", etiqueta: "Microgramos (mcg)" },
    { valor: "tableta", etiqueta: "Tableta(s)" },
  ],
  capsula: [
    { valor: "mg", etiqueta: "Miligramos (mg)" },
    { valor: "g", etiqueta: "Gramos (g)" },
    { valor: "mcg", etiqueta: "Microgramos (mcg)" },
    { valor: "capsula", etiqueta: "Cápsula(s)" },
  ],
  jarabe: [
    { valor: "ml", etiqueta: "Mililitros (ml)" },
    { valor: "mg/5ml", etiqueta: "Miligramos por 5 ml (mg/5 ml)" },
    { valor: "cucharadita", etiqueta: "Cucharadita(s)" },
  ],
  inyectable: [
    { valor: "ml", etiqueta: "Mililitros (ml)" },
    { valor: "mg", etiqueta: "Miligramos (mg)" },
    { valor: "mg/ml", etiqueta: "Miligramos por ml (mg/ml)" },
    { valor: "ui", etiqueta: "Unidades internacionales (UI)" },
  ],
  gotas: [
    { valor: "gota", etiqueta: "Gota(s)" },
    { valor: "ml", etiqueta: "Mililitros (ml)" },
    { valor: "mg/ml", etiqueta: "Miligramos por ml (mg/ml)" },
  ],
  crema: [
    { valor: "g", etiqueta: "Gramos (g)" },
    { valor: "mg/g", etiqueta: "Miligramos por gramo (mg/g)" },
    { valor: "%", etiqueta: "Porcentaje (%)" },
    { valor: "ml", etiqueta: "Mililitros (ml)" },
  ],
  otro: [
    { valor: "mg", etiqueta: "Miligramos (mg)" },
    { valor: "g", etiqueta: "Gramos (g)" },
    { valor: "mcg", etiqueta: "Microgramos (mcg)" },
    { valor: "ml", etiqueta: "Mililitros (ml)" },
    { valor: "unidad", etiqueta: "Unidad(es)" },
    { valor: "ui", etiqueta: "Unidades internacionales (UI)" },
    { valor: "%", etiqueta: "Porcentaje (%)" },
  ],
};

function obtenerOpcionesUnidad(tipo, unidadActual = "") {
  if (!tipo) {
    return [
      {
        valor: "",
        etiqueta: "Selecciona primero el tipo",
      },
    ];
  }

  const opciones = unidadesPorTipo[tipo] ??
    unidadesPorTipo.otro;

  const opcionesConPlaceholder = [
    { valor: "", etiqueta: "Selecciona una unidad" },
    ...opciones,
  ];

  const unidadRegistrada = unidadActual?.trim();
  const yaExiste = opcionesConPlaceholder.some(
    (opcion) => opcion.valor === unidadRegistrada
  );

  if (unidadRegistrada && !yaExiste) {
    opcionesConPlaceholder.push({
      valor: unidadRegistrada,
      etiqueta: `${unidadRegistrada} (unidad registrada)`,
    });
  }

  return opcionesConPlaceholder;
}

function crearFormularioInicial() {
  return {
    nombre: "",
    dosis: "",
    tipo: "",
    unidad: "",
    frecuencia: "",
    hora: "08:00",
    fechaInicio: obtenerFechaActual(),
    fechaFin: "",
    indicaciones: "",
    activo: true,
  };
}

function MedicamentosPage() {
  const { user, modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState("todos");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");
  const [medicamentos, setMedicamentos] =
    useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [versionCarga, setVersionCarga] =
    useState(0);

  const [formularioAbierto, setFormularioAbierto] =
    useState(false);
  const [medicamentoEditando, setMedicamentoEditando] =
    useState(null);
  const [formulario, setFormulario] = useState(
    crearFormularioInicial
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] =
    useState(null);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] =
    useState(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarMedicamentos() {
      setCargando(true);
      setErrorCarga("");

      if (modoDemo) {
        const medicamentosDemo = (
          datosDemo.medicamentos ?? []
        ).map(normalizarMedicamento);

        if (componenteActivo) {
          setMedicamentos(medicamentosDemo);
          setCargando(false);
        }

        return;
      }

      if (!user?.id) {
        if (componenteActivo) {
          setMedicamentos([]);
          setCargando(false);
        }

        return;
      }

      try {
        const { data, error } = await supabase
          .from("medicamentos")
          .select(CAMPOS_MEDICAMENTO)
          .eq("user_id", user.id)
          .order("hora", {
            ascending: true,
          })
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        if (componenteActivo) {
          setMedicamentos(
            (data ?? []).map(normalizarMedicamento)
          );
        }
      } catch (error) {
        console.error(
          "No fue posible cargar los medicamentos:",
          error
        );

        if (componenteActivo) {
          setMedicamentos([]);
          setErrorCarga(
            "No fue posible cargar tus medicamentos. Verifica la conexión y que la migración SQL se haya ejecutado correctamente."
          );
        }
      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    }

    cargarMedicamentos();

    return () => {
      componenteActivo = false;
    };
  }, [modoDemo, user?.id, versionCarga]);

  const medicamentosFiltrados = useMemo(() => {
    const textoBusqueda = normalizarTexto(
      busqueda.trim()
    );

    return medicamentos
      .filter((medicamento) => {
        const contenido = normalizarTexto(
          [
            medicamento.nombre,
            medicamento.dosis,
            medicamento.unidad,
            medicamento.tipo,
            medicamento.frecuencia,
            medicamento.indicaciones,
          ]
            .filter(Boolean)
            .join(" ")
        );

        if (
          textoBusqueda &&
          !contenido.includes(textoBusqueda)
        ) {
          return false;
        }

        if (filtroActivo === "activos") {
          return medicamento.activo;
        }

        if (
          ["manana", "tarde", "noche"].includes(
            filtroActivo
          )
        ) {
          return (
            obtenerMomentoDelDia(medicamento.hora) ===
            filtroActivo
          );
        }

        return true;
      })
      .sort((a, b) =>
        normalizarHora(a.hora).localeCompare(
          normalizarHora(b.hora)
        )
      );
  }, [busqueda, filtroActivo, medicamentos]);

  const resumen = useMemo(() => {
    return {
      total: medicamentos.length,
      manana: medicamentos.filter(
        (medicamento) =>
          obtenerMomentoDelDia(medicamento.hora) ===
          "manana"
      ).length,
      tarde: medicamentos.filter(
        (medicamento) =>
          obtenerMomentoDelDia(medicamento.hora) ===
          "tarde"
      ).length,
      noche: medicamentos.filter(
        (medicamento) =>
          obtenerMomentoDelDia(medicamento.hora) ===
          "noche"
      ).length,
    };
  }, [medicamentos]);

  function mostrarMensaje(
    texto,
    tipo = "informacion"
  ) {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  function abrirNuevoMedicamento() {
    if (modoDemo) {
      mostrarMensaje(
        "El modo demostración es de solo lectura. No se guardará ningún medicamento."
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

    setMedicamentoEditando(null);
    setFormulario(crearFormularioInicial());
    setErrores({});
    setFormularioAbierto(true);
  }

  function abrirEditarMedicamento(medicamento) {
    if (modoDemo) {
      mostrarMensaje(
        "Los medicamentos de demostración no pueden modificarse."
      );
      return;
    }

    setMedicamentoSeleccionado(null);
    setMedicamentoEditando(medicamento);
    setFormulario({
      nombre: medicamento.nombre,
      dosis: medicamento.dosis,
      tipo: medicamento.tipo,
      unidad: medicamento.unidad,
      frecuencia: medicamento.frecuencia,
      hora: normalizarHora(medicamento.hora),
      fechaInicio:
        medicamento.fechaInicio ||
        obtenerFechaActual(),
      fechaFin: medicamento.fechaFin || "",
      indicaciones:
        medicamento.indicaciones || "",
      activo: medicamento.activo,
    });
    setErrores({});
    setFormularioAbierto(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setFormularioAbierto(false);
    setMedicamentoEditando(null);
    setErrores({});
  }

  function handleCambioFormulario(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormulario((formularioActual) => {
      if (name === "tipo") {
        const unidadesPermitidas =
          obtenerOpcionesUnidad(value).map(
            (opcion) => opcion.valor
          );

        return {
          ...formularioActual,
          tipo: value,
          unidad: unidadesPermitidas.includes(
            formularioActual.unidad
          )
            ? formularioActual.unidad
            : "",
        };
      }

      return {
        ...formularioActual,
        [name]:
          type === "checkbox" ? checked : value,
      };
    });

    if (
      errores[name] ||
      (name === "tipo" && errores.unidad)
    ) {
      setErrores((erroresActuales) => ({
        ...erroresActuales,
        [name]: "",
        ...(name === "tipo" ? { unidad: "" } : {}),
      }));
    }
  }

  async function guardarMedicamento(event) {
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

    const datosMedicamento = {
      user_id: user.id,
      nombre: formulario.nombre.trim(),
      dosis: formulario.dosis.trim(),
      tipo: formulario.tipo,
      unidad: formulario.unidad,
      frecuencia: formulario.frecuencia.trim(),
      hora: normalizarHora(formulario.hora),
      fecha_inicio: formulario.fechaInicio,
      fecha_fin: formulario.fechaFin || null,
      indicaciones:
        formulario.indicaciones.trim() || null,
      activo: formulario.activo,
    };

    setGuardando(true);
    setMensaje("");

    try {
      if (medicamentoEditando) {
        const { data, error } = await supabase
          .from("medicamentos")
          .update(datosMedicamento)
          .eq("id", medicamentoEditando.id)
          .eq("user_id", user.id)
          .select(CAMPOS_MEDICAMENTO)
          .single();

        if (error) {
          throw error;
        }

        const medicamentoActualizado =
          normalizarMedicamento(data);

        setMedicamentos((actuales) =>
          actuales.map((medicamento) =>
            medicamento.id ===
            medicamentoActualizado.id
              ? medicamentoActualizado
              : medicamento
          )
        );

        mostrarMensaje(
          "El medicamento se actualizó correctamente.",
          "exito"
        );
      } else {
        const { data, error } = await supabase
          .from("medicamentos")
          .insert({
            ...datosMedicamento,
            tomado: false,
          })
          .select(CAMPOS_MEDICAMENTO)
          .single();

        if (error) {
          throw error;
        }

        const medicamentoCreado =
          normalizarMedicamento(data);

        setMedicamentos((actuales) =>
          [...actuales, medicamentoCreado].sort(
            (a, b) =>
              normalizarHora(a.hora).localeCompare(
                normalizarHora(b.hora)
              )
          )
        );

        mostrarMensaje(
          "El medicamento se registró correctamente.",
          "exito"
        );
      }

      setFormularioAbierto(false);
      setMedicamentoEditando(null);
      setFormulario(crearFormularioInicial());
      setErrores({});
    } catch (error) {
      console.error(
        "No fue posible guardar el medicamento:",
        error
      );

      mostrarMensaje(
        error?.message
          ? `No fue posible guardar el medicamento: ${error.message}`
          : "No fue posible guardar el medicamento.",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoTomado(medicamento) {
    if (modoDemo) {
      mostrarMensaje(
        "Los medicamentos de demostración no pueden modificarse."
      );
      return;
    }

    if (!user?.id || procesandoId !== null) {
      return;
    }

    const nuevoEstado = !medicamento.tomado;
    setProcesandoId(medicamento.id);

    try {
      const { data, error } = await supabase
        .from("medicamentos")
        .update({
          tomado: nuevoEstado,
        })
        .eq("id", medicamento.id)
        .eq("user_id", user.id)
        .select(CAMPOS_MEDICAMENTO)
        .single();

      if (error) {
        throw error;
      }

      const medicamentoActualizado =
        normalizarMedicamento(data);

      actualizarMedicamentoEnEstado(
        medicamentoActualizado
      );

      mostrarMensaje(
        nuevoEstado
          ? "La dosis se marcó como tomada."
          : "La dosis se marcó como pendiente.",
        "exito"
      );
    } catch (error) {
      console.error(
        "No fue posible actualizar la toma:",
        error
      );

      mostrarMensaje(
        "No fue posible actualizar el estado de la dosis.",
        "error"
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarMedicamento(medicamento) {
    if (modoDemo) {
      mostrarMensaje(
        "Los medicamentos de demostración no pueden eliminarse."
      );
      return;
    }

    if (!user?.id || procesandoId !== null) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar ${medicamento.nombre}? Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    setProcesandoId(medicamento.id);

    try {
      const { error } = await supabase
        .from("medicamentos")
        .delete()
        .eq("id", medicamento.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setMedicamentos((actuales) =>
        actuales.filter(
          (elemento) =>
            elemento.id !== medicamento.id
        )
      );
      setMedicamentoSeleccionado(null);

      mostrarMensaje(
        "El medicamento se eliminó correctamente.",
        "exito"
      );
    } catch (error) {
      console.error(
        "No fue posible eliminar el medicamento:",
        error
      );

      mostrarMensaje(
        "No fue posible eliminar el medicamento.",
        "error"
      );
    } finally {
      setProcesandoId(null);
    }
  }

  function actualizarMedicamentoEnEstado(
    medicamentoActualizado
  ) {
    setMedicamentos((actuales) =>
      actuales.map((medicamento) =>
        medicamento.id === medicamentoActualizado.id
          ? medicamentoActualizado
          : medicamento
      )
    );

    setMedicamentoSeleccionado((seleccionado) =>
      seleccionado?.id === medicamentoActualizado.id
        ? medicamentoActualizado
        : seleccionado
    );
  }

  const clasesMensaje = obtenerClasesMensaje(
    tipoMensaje
  );

  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header
          titulo="Medicamentos"
          descripcion="Administra tus tratamientos y horarios."
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
                  Puedes consultar y filtrar los
                  medicamentos, pero no guardar cambios.
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
                Tratamiento diario
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#10254b]">
                Mis medicamentos
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Consulta tus dosis y horarios registrados.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirNuevoMedicamento}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6]"
            >
              <Plus size={19} />
              Agregar medicamento
            </button>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TarjetaResumen
              titulo="Total"
              cantidad={resumen.total}
              icono={<Pill size={21} />}
              clases="bg-blue-50 text-blue-600"
            />

            <TarjetaResumen
              titulo="Mañana"
              cantidad={resumen.manana}
              icono={<Sun size={21} />}
              clases="bg-amber-50 text-amber-600"
            />

            <TarjetaResumen
              titulo="Tarde"
              cantidad={resumen.tarde}
              icono={<Sunset size={21} />}
              clases="bg-orange-50 text-orange-600"
            />

            <TarjetaResumen
              titulo="Noche"
              cantidad={resumen.noche}
              icono={<Moon size={21} />}
              clases="bg-indigo-50 text-indigo-600"
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
                  placeholder="Buscar medicamento..."
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
          ) : medicamentosFiltrados.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {medicamentosFiltrados.map(
                (medicamento) => (
                  <MedicamentoCard
                    key={medicamento.id}
                    medicamento={medicamento}
                    modoDemo={modoDemo}
                    procesando={
                      procesandoId === medicamento.id
                    }
                    onVerDetalles={() =>
                      setMedicamentoSeleccionado(
                        medicamento
                      )
                    }
                    onCambiarTomado={() =>
                      cambiarEstadoTomado(
                        medicamento
                      )
                    }
                  />
                )
              )}
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
              onAgregar={abrirNuevoMedicamento}
              modoDemo={modoDemo}
            />
          )}
        </div>
      </main>

      {formularioAbierto && (
        <FormularioMedicamento
          formulario={formulario}
          errores={errores}
          guardando={guardando}
          editando={Boolean(medicamentoEditando)}
          onCambio={handleCambioFormulario}
          onCerrar={cerrarFormulario}
          onGuardar={guardarMedicamento}
        />
      )}

      {medicamentoSeleccionado && (
        <DetallesMedicamento
          medicamento={medicamentoSeleccionado}
          modoDemo={modoDemo}
          procesando={
            procesandoId ===
            medicamentoSeleccionado.id
          }
          onCerrar={() =>
            setMedicamentoSeleccionado(null)
          }
          onEditar={() =>
            abrirEditarMedicamento(
              medicamentoSeleccionado
            )
          }
          onEliminar={() =>
            eliminarMedicamento(
              medicamentoSeleccionado
            )
          }
          onCambiarTomado={() =>
            cambiarEstadoTomado(
              medicamentoSeleccionado
            )
          }
        />
      )}
    </div>
  );
}

function FormularioMedicamento({
  formulario,
  errores,
  guardando,
  editando,
  onCambio,
  onCerrar,
  onGuardar,
}) {
  const opcionesUnidadDisponibles =
    obtenerOpcionesUnidad(
      formulario.tipo,
      formulario.unidad
    );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-formulario-medicamento"
    >
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/20">
          <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf6ff] text-[#087ef5]">
                <Pill size={24} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#087ef5]">
                  {editando
                    ? "Actualizar tratamiento"
                    : "Nuevo tratamiento"}
                </p>

                <h2
                  id="titulo-formulario-medicamento"
                  className="mt-1 text-2xl font-bold text-[#10254b]"
                >
                  {editando
                    ? "Editar medicamento"
                    : "Registrar medicamento"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ingresa la dosis, frecuencia y horario
                  indicado.
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
              <CampoFormulario
                etiqueta="Nombre del medicamento"
                nombre="nombre"
                valor={formulario.nombre}
                onCambio={onCambio}
                error={errores.nombre}
                placeholder="Ej. Metformina"
                autoFocus
              />

              <CampoFormulario
                etiqueta="Dosis"
                nombre="dosis"
                valor={formulario.dosis}
                onCambio={onCambio}
                error={errores.dosis}
                placeholder="Ej. 500 o 1/2"
              />

              <CampoSeleccion
                etiqueta="Tipo"
                nombre="tipo"
                valor={formulario.tipo}
                onCambio={onCambio}
                opciones={opcionesTipo}
                error={errores.tipo}
              />

              <CampoSeleccion
                etiqueta="Unidad de medida"
                nombre="unidad"
                valor={formulario.unidad}
                onCambio={onCambio}
                opciones={opcionesUnidadDisponibles}
                error={errores.unidad}
                disabled={!formulario.tipo}
                ayuda={
                  formulario.tipo
                    ? "Opciones según el tipo"
                    : "Selecciona primero el tipo"
                }
              />

              <CampoFormulario
                etiqueta="Frecuencia"
                nombre="frecuencia"
                valor={formulario.frecuencia}
                onCambio={onCambio}
                error={errores.frecuencia}
                placeholder="Ej. Cada 12 horas"
              />

              <CampoFormulario
                etiqueta="Hora principal"
                nombre="hora"
                tipo="time"
                valor={formulario.hora}
                onCambio={onCambio}
                error={errores.hora}
                icono={<Clock3 size={18} />}
              />

              <CampoFormulario
                etiqueta="Fecha de inicio"
                nombre="fechaInicio"
                tipo="date"
                valor={formulario.fechaInicio}
                onCambio={onCambio}
                error={errores.fechaInicio}
                icono={<CalendarDays size={18} />}
              />

              <CampoFormulario
                etiqueta="Fecha de finalización"
                nombre="fechaFin"
                tipo="date"
                valor={formulario.fechaFin}
                onCambio={onCambio}
                error={errores.fechaFin}
                icono={<CalendarDays size={18} />}
                ayuda="Opcional"
                min={formulario.fechaInicio}
              />
            </fieldset>

            <fieldset
              disabled={guardando}
              className="mt-5"
            >
              <label
                htmlFor="indicaciones"
                className="text-sm font-bold text-[#10254b]"
              >
                Indicaciones adicionales
              </label>

              <div className="relative mt-2">
                <FileText
                  size={18}
                  className="absolute left-4 top-4 text-slate-400"
                />

                <textarea
                  id="indicaciones"
                  name="indicaciones"
                  value={formulario.indicaciones}
                  onChange={onCambio}
                  rows={4}
                  placeholder="Ej. Tomar después de los alimentos."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formulario.activo}
                  onChange={onCambio}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#087ef5] focus:ring-blue-400"
                />

                <span>
                  <span className="block text-sm font-bold text-[#10254b]">
                    Tratamiento activo
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Desactívalo cuando el tratamiento haya
                    finalizado.
                  </span>
                </span>
              </label>
            </fieldset>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
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
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={19} />
                )}

                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Registrar medicamento"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function DetallesMedicamento({
  medicamento,
  modoDemo,
  procesando,
  onCerrar,
  onEditar,
  onEliminar,
  onCambiarTomado,
}) {
  const momento = obtenerConfiguracionMomento(
    medicamento.hora
  );
  const IconoMomento = momento.icono;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalles-medicamento"
    >
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <section className="w-full rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${momento.clases}`}
              >
                <Pill size={24} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#087ef5]">
                  Detalles del tratamiento
                </p>

                <h2
                  id="titulo-detalles-medicamento"
                  className="mt-1 text-2xl font-bold text-[#10254b]"
                >
                  {medicamento.nombre}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatearDosis(medicamento)}
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
              etiqueta="Tipo"
              valor={
                formatearEtiqueta(medicamento.tipo) ||
                "Sin especificar"
              }
            />

            <DatoDetalle
              etiqueta="Frecuencia"
              valor={
                medicamento.frecuencia ||
                "Sin especificar"
              }
            />

            <DatoDetalle
              etiqueta="Horario"
              valor={normalizarHora(
                medicamento.hora
              )}
            />

            <DatoDetalle
              etiqueta="Momento"
              valor={momento.nombre}
              icono={
                <IconoMomento
                  size={17}
                  className={momento.colorTexto}
                />
              }
            />

            <DatoDetalle
              etiqueta="Inicio"
              valor={formatearFecha(
                medicamento.fechaInicio
              )}
            />

            <DatoDetalle
              etiqueta="Finalización"
              valor={
                medicamento.fechaFin
                  ? formatearFecha(
                      medicamento.fechaFin
                    )
                  : "Sin fecha"
              }
            />
          </div>

          {medicamento.indicaciones && (
            <div className="mt-5 rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Indicaciones
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                {medicamento.indicaciones}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold",
                medicamento.activo
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {medicamento.activo
                ? "Tratamiento activo"
                : "Tratamiento inactivo"}
            </span>

            <span
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold",
                medicamento.tomado
                  ? "bg-blue-50 text-blue-600"
                  : "bg-amber-50 text-amber-600",
              ].join(" ")}
            >
              {medicamento.tomado
                ? "Dosis tomada"
                : "Dosis pendiente"}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCambiarTomado}
              disabled={modoDemo || procesando}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={18} />
              )}

              {medicamento.tomado
                ? "Marcar pendiente"
                : "Marcar tomada"}
            </button>

            <button
              type="button"
              onClick={onEditar}
              disabled={modoDemo || procesando}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil size={18} />
              Editar
            </button>
          </div>

          <button
            type="button"
            onClick={onEliminar}
            disabled={modoDemo || procesando}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={18} />
            Eliminar medicamento
          </button>
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
  error,
  disabled = false,
  ayuda,
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

      <select
        id={id}
        name={nombre}
        value={valor}
        onChange={onCambio}
        disabled={disabled}
        className={[
          "mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-[#10254b] outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
        ].join(" ")}
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

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
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

function MedicamentoCard({
  medicamento,
  modoDemo,
  procesando,
  onVerDetalles,
  onCambiarTomado,
}) {
  const momento = obtenerConfiguracionMomento(
    medicamento.hora
  );
  const IconoMomento = momento.icono;

  return (
    <article className="group rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${momento.clases}`}
        >
          <Pill size={23} />
        </div>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
            medicamento.activo
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          <CheckCircle2 size={14} />
          {medicamento.activo
            ? "Activo"
            : "Inactivo"}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold text-[#10254b]">
          {medicamento.nombre}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {formatearDosis(medicamento)}
        </p>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
        <DetalleFila
          icono={
            <Clock3
              size={18}
              className="text-[#087ef5]"
            />
          }
          etiqueta="Horario"
          valor={normalizarHora(medicamento.hora)}
        />

        <DetalleFila
          icono={
            <IconoMomento
              size={18}
              className={momento.colorTexto}
            />
          }
          etiqueta="Momento"
          valor={momento.nombre}
        />

        <DetalleFila
          icono={
            <Pill
              size={18}
              className="text-emerald-600"
            />
          }
          etiqueta="Frecuencia"
          valor={
            medicamento.frecuencia ||
            "Sin especificar"
          }
        />
      </div>

      <div
        className={[
          "mt-4 rounded-2xl px-4 py-3 text-center text-sm font-bold",
          medicamento.tomado
            ? "bg-blue-50 text-blue-600"
            : "bg-amber-50 text-amber-600",
        ].join(" ")}
      >
        {medicamento.tomado
          ? "Dosis marcada como tomada"
          : "Dosis pendiente"}
      </div>

      {modoDemo && (
        <p className="mt-4 text-center text-xs font-semibold text-[#087ef5]">
          Medicamento de demostración
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCambiarTomado}
          disabled={modoDemo || procesando}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#087ef5] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <CheckCircle2 size={17} />
          )}

          {medicamento.tomado
            ? "Pendiente"
            : "Tomada"}
        </button>

        <button
          type="button"
          onClick={onVerDetalles}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#087ef5]"
        >
          Ver detalles
        </button>
      </div>
    </article>
  );
}

function DetalleFila({ icono, etiqueta, valor }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 shrink-0">
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
      <div className="flex items-center gap-2">
        {icono}

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {etiqueta}
        </p>
      </div>

      <p className="mt-2 text-sm font-bold text-[#10254b]">
        {valor}
      </p>
    </div>
  );
}

function EstadoCargando() {
  return (
    <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-slate-100 bg-white px-6 text-center shadow-lg shadow-slate-200/30">
      <LoaderCircle
        size={34}
        className="animate-spin text-[#087ef5]"
      />

      <p className="mt-4 text-sm font-semibold text-slate-500">
        Cargando medicamentos...
      </p>
    </section>
  );
}

function EstadoError({ mensaje, onReintentar }) {
  return (
    <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-red-100 bg-white px-6 text-center shadow-lg shadow-slate-200/30">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-600">
        <X size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#10254b]">
        No se pudieron cargar los medicamentos
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
        <Pill size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#10254b]">
        {existeBusqueda
          ? "No encontramos medicamentos"
          : "No tienes medicamentos registrados"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {existeBusqueda
          ? "Prueba otra búsqueda o elimina los filtros seleccionados."
          : "Registra tu primer medicamento para consultar su dosis, frecuencia y horario."}
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
            Registrar medicamento
          </button>
        )
      )}
    </section>
  );
}

function validarFormulario(formulario) {
  const errores = {};

  if (!formulario.nombre.trim()) {
    errores.nombre =
      "Ingresa el nombre del medicamento.";
  }

  if (!formulario.dosis.trim()) {
    errores.dosis = "Ingresa la dosis indicada.";
  }

  if (!formulario.tipo) {
    errores.tipo =
      "Selecciona el tipo de medicamento.";
  }

  if (!formulario.unidad) {
    errores.unidad =
      "Selecciona una unidad de medida.";
  }

  if (!formulario.frecuencia.trim()) {
    errores.frecuencia =
      "Ingresa la frecuencia del tratamiento.";
  }

  if (!formulario.hora) {
    errores.hora = "Selecciona una hora.";
  }

  if (!formulario.fechaInicio) {
    errores.fechaInicio =
      "Selecciona la fecha de inicio.";
  }

  if (
    formulario.fechaFin &&
    formulario.fechaInicio &&
    formulario.fechaFin < formulario.fechaInicio
  ) {
    errores.fechaFin =
      "La fecha de finalización no puede ser anterior al inicio.";
  }

  return errores;
}

function normalizarMedicamento(medicamento = {}) {
  return {
    id: medicamento.id,
    nombre: medicamento.nombre || "",
    dosis: medicamento.dosis || "",
    tomado: Boolean(medicamento.tomado),
    tipo: medicamento.tipo || "",
    unidad: medicamento.unidad || "",
    frecuencia:
      medicamento.frecuencia || "Sin especificar",
    hora: normalizarHora(
      medicamento.hora || "08:00"
    ),
    fechaInicio:
      medicamento.fecha_inicio ||
      medicamento.fechaInicio ||
      "",
    fechaFin:
      medicamento.fecha_fin ||
      medicamento.fechaFin ||
      "",
    indicaciones:
      medicamento.indicaciones || "",
    activo: medicamento.activo !== false,
    createdAt:
      medicamento.created_at ||
      medicamento.creadoEn ||
      null,
    actualizadoEn:
      medicamento.actualizado_en || null,
  };
}

function obtenerClasesMensaje(tipoMensaje) {
  if (tipoMensaje === "exito") {
    return {
      contenedor:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
      boton:
        "text-emerald-600 hover:text-emerald-800",
    };
  }

  if (tipoMensaje === "error") {
    return {
      contenedor:
        "border-red-200 bg-red-50 text-red-800",
      boton: "text-red-600 hover:text-red-800",
    };
  }

  return {
    contenedor:
      "border-amber-200 bg-amber-50 text-amber-800",
    boton:
      "text-amber-600 hover:text-amber-800",
  };
}

function obtenerMomentoDelDia(hora = "00:00") {
  const numeroHora = Number(
    String(hora).split(":")[0]
  );

  if (numeroHora < 12) {
    return "manana";
  }

  if (numeroHora < 19) {
    return "tarde";
  }

  return "noche";
}

function obtenerConfiguracionMomento(hora) {
  const momento = obtenerMomentoDelDia(hora);

  const configuraciones = {
    manana: {
      nombre: "Mañana",
      icono: Sun,
      clases: "bg-amber-50 text-amber-600",
      colorTexto: "text-amber-600",
    },
    tarde: {
      nombre: "Tarde",
      icono: Sunset,
      clases: "bg-orange-50 text-orange-600",
      colorTexto: "text-orange-600",
    },
    noche: {
      nombre: "Noche",
      icono: Moon,
      clases: "bg-indigo-50 text-indigo-600",
      colorTexto: "text-indigo-600",
    },
  };

  return configuraciones[momento];
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
  const diferenciaZonaHoraria =
    fecha.getTimezoneOffset() * 60 * 1000;

  return new Date(
    fecha.getTime() - diferenciaZonaHoraria
  )
    .toISOString()
    .slice(0, 10);
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

function formatearDosis(medicamento) {
  return [medicamento.dosis, medicamento.unidad]
    .filter(Boolean)
    .join(" ");
}

function formatearEtiqueta(valor = "") {
  if (!valor) {
    return "";
  }

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

export default MedicamentosPage;