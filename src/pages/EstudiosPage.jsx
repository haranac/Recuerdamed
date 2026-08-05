import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileImage,
  FileText,
  FlaskConical,
  Info,
  LoaderCircle,
  MapPin,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";
import { supabase } from "../lib/supabase";

const BUCKET_ESTUDIOS = "estudios";
const TAMANIO_MAXIMO_ARCHIVO = 6 * 1024 * 1024;

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
  user_id,
  nombre,
  descripcion,
  fecha_estudio,
  nombre_archivo,
  archivo_path,
  mime_type,
  tamanio,
  bucket_id,
  created_at,
  actualizado_en
`;

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

const opcionesEstado = [
  {
    valor: "programado",
    etiqueta: "Programado",
  },
  {
    valor: "completado",
    etiqueta: "Completado",
  },
];

const extensionesPermitidas = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

function crearFormularioInicial() {
  return {
    nombre: "",
    tipo: "",
    institucion: "",
    estado: "programado",
    fecha: obtenerFechaActual(),
    hora: "",
    descripcion: "",
    resultado: "",
  };
}

function EstudiosPage() {
  const { user, modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState("todos");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");

  const [estudios, setEstudios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [versionCarga, setVersionCarga] =
    useState(0);

  const [formularioAbierto, setFormularioAbierto] =
    useState(false);
  const [estudioEditando, setEstudioEditando] =
    useState(null);
  const [formulario, setFormulario] = useState(
    crearFormularioInicial
  );
  const [errores, setErrores] = useState({});
  const [archivosPendientes, setArchivosPendientes] =
    useState([]);
  const [claveInputArchivos, setClaveInputArchivos] =
    useState(0);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] =
    useState(null);
  const [procesandoArchivoId, setProcesandoArchivoId] =
    useState(null);
  const [estudioSeleccionado, setEstudioSeleccionado] =
    useState(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarEstudios() {
      setCargando(true);
      setErrorCarga("");

      if (modoDemo) {
        const estudiosDemo = (
          datosDemo.estudios ?? []
        ).map((estudio) =>
          normalizarEstudio({
            ...estudio,
            archivos: estudio.archivos ?? [],
          })
        );

        if (componenteActivo) {
          setEstudios(
            ordenarEstudiosParaEstado(estudiosDemo)
          );
          setCargando(false);
        }

        return;
      }

      if (!user?.id) {
        if (componenteActivo) {
          setEstudios([]);
          setCargando(false);
        }

        return;
      }

      try {
        const [respuestaEstudios, respuestaArchivos] =
          await Promise.all([
            supabase
              .from("estudios")
              .select(CAMPOS_ESTUDIO)
              .eq("user_id", user.id),
            supabase
              .from("estudios_medicos")
              .select(CAMPOS_ARCHIVO)
              .eq("user_id", user.id)
              .order("created_at", {
                ascending: false,
              }),
          ]);

        if (respuestaEstudios.error) {
          throw respuestaEstudios.error;
        }

        if (respuestaArchivos.error) {
          throw respuestaArchivos.error;
        }

        const archivosPorEstudio = new Map();

        for (const archivo of respuestaArchivos.data ?? []) {
          if (!archivo.estudio_id) {
            continue;
          }

          const lista =
            archivosPorEstudio.get(archivo.estudio_id) ?? [];

          lista.push(normalizarArchivo(archivo));
          archivosPorEstudio.set(
            archivo.estudio_id,
            lista
          );
        }

        const estudiosNormalizados = (
          respuestaEstudios.data ?? []
        ).map((estudio) =>
          normalizarEstudio({
            ...estudio,
            archivos:
              archivosPorEstudio.get(estudio.id) ?? [],
          })
        );

        if (componenteActivo) {
          setEstudios(
            ordenarEstudiosParaEstado(
              estudiosNormalizados
            )
          );
        }
      } catch (error) {
        console.error(
          "No fue posible cargar los estudios:",
          error
        );

        if (componenteActivo) {
          setEstudios([]);
          setErrorCarga(
            "No fue posible cargar tus estudios. Verifica la conexión, las tablas y las políticas RLS de Supabase."
          );
        }
      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    }

    cargarEstudios();

    return () => {
      componenteActivo = false;
    };
  }, [modoDemo, user?.id, versionCarga]);

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
    const texto = normalizarTexto(busqueda.trim());

    return estudios
      .filter((estudio) => {
        const contenido = normalizarTexto(
          [
            estudio.nombre,
            estudio.tipo,
            estudio.institucion,
            estudio.estado,
            estudio.descripcion,
            estudio.resultado,
            ...(estudio.archivos ?? []).map(
              (archivo) => archivo.nombreArchivo
            ),
          ]
            .filter(Boolean)
            .join(" ")
        );

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

        return aProgramado
          ? ordenarEstudiosAscendente(a, b)
          : ordenarEstudiosDescendente(a, b);
      });
  }, [busqueda, estudios, filtroActivo]);

  const proximoEstudio = estudiosProgramados[0];

  function mostrarMensaje(
    texto,
    tipo = "informacion"
  ) {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  function abrirNuevoEstudio() {
    if (modoDemo) {
      mostrarMensaje(
        "El modo demostración es de solo lectura. No se guardará ningún estudio."
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

    setEstudioEditando(null);
    setFormulario(crearFormularioInicial());
    setErrores({});
    setArchivosPendientes([]);
    setClaveInputArchivos((valor) => valor + 1);
    setFormularioAbierto(true);
  }

  function abrirEditarEstudio(estudio) {
    if (modoDemo) {
      mostrarMensaje(
        "Los estudios de demostración no pueden modificarse."
      );
      return;
    }

    setEstudioSeleccionado(null);
    setEstudioEditando(estudio);
    setFormulario({
      nombre: estudio.nombre || "",
      tipo: estudio.tipo || "",
      institucion: estudio.institucion || "",
      estado: normalizarEstado(estudio.estado),
      fecha: estudio.fecha || obtenerFechaActual(),
      hora: normalizarHora(estudio.hora),
      descripcion: estudio.descripcion || "",
      resultado: estudio.resultado || "",
    });
    setErrores({});
    setArchivosPendientes([]);
    setClaveInputArchivos((valor) => valor + 1);
    setFormularioAbierto(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setFormularioAbierto(false);
    setEstudioEditando(null);
    setFormulario(crearFormularioInicial());
    setErrores({});
    setArchivosPendientes([]);
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

  function handleSeleccionArchivos(event) {
    const seleccionados = Array.from(
      event.target.files ?? []
    );

    const validos = [];
    const mensajesError = [];

    for (const archivo of seleccionados) {
      const error = validarArchivo(archivo);

      if (error) {
        mensajesError.push(
          `${archivo.name}: ${error}`
        );
      } else {
        validos.push(archivo);
      }
    }

    setArchivosPendientes((actuales) => {
      const combinados = [...actuales];

      for (const archivo of validos) {
        const duplicado = combinados.some(
          (existente) =>
            existente.name === archivo.name &&
            existente.size === archivo.size &&
            existente.lastModified ===
              archivo.lastModified
        );

        if (!duplicado) {
          combinados.push(archivo);
        }
      }

      return combinados;
    });

    setErrores((erroresActuales) => ({
      ...erroresActuales,
      archivos:
        mensajesError.length > 0
          ? mensajesError.join(" ")
          : "",
    }));

    setClaveInputArchivos((valor) => valor + 1);
  }

  function quitarArchivoPendiente(indice) {
    setArchivosPendientes((actuales) =>
      actuales.filter(
        (_, indiceActual) => indiceActual !== indice
      )
    );
  }

  async function guardarEstudio(event) {
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
      formulario,
      archivosPendientes
    );

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const datosEstudio = {
      user_id: user.id,
      nombre: formulario.nombre.trim(),
      tipo:
        formulario.tipo.trim() || "Estudio médico",
      institucion:
        formulario.institucion.trim() || null,
      estado: normalizarEstado(formulario.estado),
      fecha: formulario.fecha,
      hora: formulario.hora
        ? normalizarHora(formulario.hora)
        : null,
      descripcion:
        formulario.descripcion.trim() || null,
      resultado:
        formulario.resultado.trim() || null,
    };

    setGuardando(true);
    setMensaje("");

    try {
      let estudioGuardado;

      if (estudioEditando) {
        const { data, error } = await supabase
          .from("estudios")
          .update(datosEstudio)
          .eq("id", estudioEditando.id)
          .eq("user_id", user.id)
          .select(CAMPOS_ESTUDIO)
          .single();

        if (error) {
          throw error;
        }

        estudioGuardado = normalizarEstudio({
          ...data,
          archivos: estudioEditando.archivos ?? [],
        });

        const { error: errorMetadatos } =
          await supabase
            .from("estudios_medicos")
            .update({
              nombre: estudioGuardado.nombre,
              descripcion:
                estudioGuardado.descripcion || null,
              fecha_estudio: estudioGuardado.fecha,
            })
            .eq("estudio_id", estudioGuardado.id)
            .eq("user_id", user.id);

        if (errorMetadatos) {
          console.warn(
            "El estudio se actualizó, pero no fue posible sincronizar todos los metadatos de sus archivos:",
            errorMetadatos
          );
        }
      } else {
        const { data, error } = await supabase
          .from("estudios")
          .insert(datosEstudio)
          .select(CAMPOS_ESTUDIO)
          .single();

        if (error) {
          throw error;
        }

        estudioGuardado = normalizarEstudio({
          ...data,
          archivos: [],
        });
      }

      const resultadoCarga =
        await subirArchivosDelEstudio({
          archivos: archivosPendientes,
          estudio: estudioGuardado,
          userId: user.id,
        });

      const estudioCompleto = {
        ...estudioGuardado,
        archivos: [
          ...(estudioGuardado.archivos ?? []),
          ...resultadoCarga.subidos,
        ],
      };

      setEstudios((actuales) => {
        const existe = actuales.some(
          (estudio) =>
            estudio.id === estudioCompleto.id
        );

        const siguientes = existe
          ? actuales.map((estudio) =>
              estudio.id === estudioCompleto.id
                ? estudioCompleto
                : estudio
            )
          : [...actuales, estudioCompleto];

        return ordenarEstudiosParaEstado(siguientes);
      });

      if (resultadoCarga.fallidos.length > 0) {
        setEstudioEditando(estudioCompleto);
        setArchivosPendientes(
          resultadoCarga.fallidos.map(
            (elemento) => elemento.archivo
          )
        );

        mostrarMensaje(
          `El estudio se guardó, pero ${resultadoCarga.fallidos.length} archivo(s) no pudieron subirse. Puedes intentar guardarlos nuevamente.`,
          "advertencia"
        );
      } else {
        mostrarMensaje(
          estudioEditando
            ? "El estudio se actualizó correctamente."
            : "El estudio se registró correctamente.",
          "exito"
        );

        setFormularioAbierto(false);
        setEstudioEditando(null);
        setFormulario(crearFormularioInicial());
        setArchivosPendientes([]);
        setErrores({});
      }
    } catch (error) {
      console.error(
        "No fue posible guardar el estudio:",
        error
      );

      mostrarMensaje(
        error?.message
          ? `No fue posible guardar el estudio: ${error.message}`
          : "No fue posible guardar el estudio.",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  }

  async function abrirArchivo(archivo) {
    if (modoDemo) {
      mostrarMensaje(
        "Los archivos de demostración son únicamente ilustrativos."
      );
      return;
    }

    if (!archivo?.archivoPath) {
      mostrarMensaje(
        "El archivo no tiene una ruta válida.",
        "error"
      );
      return;
    }

    const ventana = window.open(
      "about:blank",
      "_blank"
    );

    if (!ventana) {
      mostrarMensaje(
        "El navegador bloqueó la nueva pestaña. Permite las ventanas emergentes para abrir el estudio.",
        "advertencia"
      );
      return;
    }

    ventana.opener = null;
    ventana.document.title = "Abriendo estudio...";
    ventana.document.body.innerHTML =
      '<p style="font-family: sans-serif; padding: 24px; color: #334155;">Abriendo estudio...</p>';

    setProcesandoArchivoId(archivo.id);

    try {
      const { data, error } = await supabase.storage
        .from(archivo.bucketId || BUCKET_ESTUDIOS)
        .createSignedUrl(archivo.archivoPath, 300);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Supabase no devolvió una URL válida."
        );
      }

      ventana.location.replace(data.signedUrl);
    } catch (error) {
      ventana.close();

      console.error(
        "No fue posible abrir el archivo:",
        error
      );

      mostrarMensaje(
        error?.message
          ? `No fue posible abrir el estudio: ${error.message}`
          : "No fue posible abrir el estudio.",
        "error"
      );
    } finally {
      setProcesandoArchivoId(null);
    }
  }

  async function descargarArchivo(archivo) {
    if (modoDemo) {
      mostrarMensaje(
        "Los archivos de demostración son únicamente ilustrativos."
      );
      return;
    }

    if (!archivo?.archivoPath) {
      mostrarMensaje(
        "El archivo no tiene una ruta válida.",
        "error"
      );
      return;
    }

    setProcesandoArchivoId(archivo.id);

    try {
      const { data, error } = await supabase.storage
        .from(archivo.bucketId || BUCKET_ESTUDIOS)
        .download(archivo.archivoPath);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download =
        archivo.nombreArchivo || "archivo-estudio";
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        "No fue posible descargar el archivo:",
        error
      );

      mostrarMensaje(
        "No fue posible descargar el archivo.",
        "error"
      );
    } finally {
      setProcesandoArchivoId(null);
    }
  }

  async function eliminarArchivo(estudio, archivo) {
    if (modoDemo) {
      mostrarMensaje(
        "Los archivos de demostración no pueden eliminarse."
      );
      return;
    }

    if (!user?.id || procesandoArchivoId !== null) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar el archivo “${archivo.nombreArchivo}”? Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    setProcesandoArchivoId(archivo.id);

    try {
      const { error: errorStorage } =
        await supabase.storage
          .from(archivo.bucketId || BUCKET_ESTUDIOS)
          .remove([archivo.archivoPath]);

      if (errorStorage) {
        throw errorStorage;
      }

      const { error: errorRegistro } = await supabase
        .from("estudios_medicos")
        .delete()
        .eq("id", archivo.id)
        .eq("user_id", user.id);

      if (errorRegistro) {
        throw errorRegistro;
      }

      const actualizarArchivos = (elemento) => ({
        ...elemento,
        archivos: (elemento.archivos ?? []).filter(
          (archivoActual) =>
            archivoActual.id !== archivo.id
        ),
      });

      setEstudios((actuales) =>
        actuales.map((elemento) =>
          elemento.id === estudio.id
            ? actualizarArchivos(elemento)
            : elemento
        )
      );

      setEstudioSeleccionado((actual) =>
        actual?.id === estudio.id
          ? actualizarArchivos(actual)
          : actual
      );

      setEstudioEditando((actual) =>
        actual?.id === estudio.id
          ? actualizarArchivos(actual)
          : actual
      );

      mostrarMensaje(
        "El archivo se eliminó correctamente.",
        "exito"
      );
    } catch (error) {
      console.error(
        "No fue posible eliminar el archivo:",
        error
      );

      mostrarMensaje(
        "No fue posible eliminar el archivo.",
        "error"
      );
    } finally {
      setProcesandoArchivoId(null);
    }
  }

  async function eliminarEstudio(estudio) {
    if (modoDemo) {
      mostrarMensaje(
        "Los estudios de demostración no pueden eliminarse."
      );
      return;
    }

    if (!user?.id || procesandoId !== null) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar “${estudio.nombre}” y todos sus archivos? Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    setProcesandoId(estudio.id);

    try {
      const rutas = (estudio.archivos ?? [])
        .map((archivo) => archivo.archivoPath)
        .filter(Boolean);

      if (rutas.length > 0) {
        const { error: errorStorage } =
          await supabase.storage
            .from(BUCKET_ESTUDIOS)
            .remove(rutas);

        if (errorStorage) {
          throw errorStorage;
        }
      }

      const { error } = await supabase
        .from("estudios")
        .delete()
        .eq("id", estudio.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setEstudios((actuales) =>
        actuales.filter(
          (elemento) => elemento.id !== estudio.id
        )
      );
      setEstudioSeleccionado(null);

      mostrarMensaje(
        "El estudio se eliminó correctamente.",
        "exito"
      );
    } catch (error) {
      console.error(
        "No fue posible eliminar el estudio:",
        error
      );

      mostrarMensaje(
        "No fue posible eliminar el estudio o alguno de sus archivos.",
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
                Control de estudios
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#10254b]">
                Mis estudios
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Consulta tus estudios programados,
                resultados y documentos médicos.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirNuevoEstudio}
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

          {proximoEstudio &&
            !cargando &&
            !errorCarga && (
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

                        {(proximoEstudio.archivos?.length ??
                          0) > 0 && (
                          <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                            <Paperclip size={17} />
                            {proximoEstudio.archivos.length}{" "}
                            archivo(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEstudioSeleccionado(
                          proximoEstudio
                        )
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
                  placeholder="Buscar estudio, institución o archivo..."
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
                setVersionCarga((valor) => valor + 1)
              }
            />
          ) : estudiosFiltrados.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {estudiosFiltrados.map((estudio) => (
                <EstudioCard
                  key={estudio.id}
                  estudio={estudio}
                  modoDemo={modoDemo}
                  onVerDetalles={() =>
                    setEstudioSeleccionado(estudio)
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
              onAgregar={abrirNuevoEstudio}
              modoDemo={modoDemo}
            />
          )}
        </div>
      </main>

      {formularioAbierto && (
        <FormularioEstudio
          formulario={formulario}
          errores={errores}
          editando={Boolean(estudioEditando)}
          archivosExistentes={
            estudioEditando?.archivos ?? []
          }
          archivosPendientes={archivosPendientes}
          claveInputArchivos={claveInputArchivos}
          guardando={guardando}
          procesandoArchivoId={procesandoArchivoId}
          onCambio={handleCambioFormulario}
          onSeleccionArchivos={handleSeleccionArchivos}
          onQuitarPendiente={quitarArchivoPendiente}
          onAbrirArchivo={abrirArchivo}
          onDescargarArchivo={descargarArchivo}
          onEliminarArchivo={(archivo) =>
            eliminarArchivo(estudioEditando, archivo)
          }
          onCerrar={cerrarFormulario}
          onGuardar={guardarEstudio}
        />
      )}

      {estudioSeleccionado && (
        <ModalDetallesEstudio
          estudio={estudioSeleccionado}
          modoDemo={modoDemo}
          procesandoId={procesandoId}
          procesandoArchivoId={procesandoArchivoId}
          onCerrar={() =>
            setEstudioSeleccionado(null)
          }
          onEditar={() =>
            abrirEditarEstudio(estudioSeleccionado)
          }
          onEliminar={() =>
            eliminarEstudio(estudioSeleccionado)
          }
          onAbrirArchivo={abrirArchivo}
          onDescargarArchivo={descargarArchivo}
          onEliminarArchivo={(archivo) =>
            eliminarArchivo(
              estudioSeleccionado,
              archivo
            )
          }
        />
      )}
    </div>
  );
}

function FormularioEstudio({
  formulario,
  errores,
  editando,
  archivosExistentes,
  archivosPendientes,
  claveInputArchivos,
  guardando,
  procesandoArchivoId,
  onCambio,
  onSeleccionArchivos,
  onQuitarPendiente,
  onAbrirArchivo,
  onDescargarArchivo,
  onEliminarArchivo,
  onCerrar,
  onGuardar,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-formulario-estudio"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-bold text-[#087ef5]">
              {editando
                ? "Actualizar información"
                : "Nuevo registro"}
            </p>

            <h2
              id="titulo-formulario-estudio"
              className="mt-1 text-2xl font-bold text-[#10254b]"
            >
              {editando
                ? "Editar estudio"
                : "Registrar estudio"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar formulario"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <form
          onSubmit={onGuardar}
          className="space-y-6 px-6 py-6 sm:px-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <CampoTexto
              etiqueta="Nombre del estudio"
              nombre="nombre"
              valor={formulario.nombre}
              onCambio={onCambio}
              error={errores.nombre}
              placeholder="Ej. Biometría hemática"
              requerido
              clasesContenedor="sm:col-span-2"
            />

            <CampoTexto
              etiqueta="Tipo"
              nombre="tipo"
              valor={formulario.tipo}
              onCambio={onCambio}
              error={errores.tipo}
              placeholder="Ej. Análisis de laboratorio"
            />

            <CampoTexto
              etiqueta="Institución"
              nombre="institucion"
              valor={formulario.institucion}
              onCambio={onCambio}
              error={errores.institucion}
              placeholder="Hospital, clínica o laboratorio"
            />

            <CampoSeleccion
              etiqueta="Estado"
              nombre="estado"
              valor={formulario.estado}
              onCambio={onCambio}
              opciones={opcionesEstado}
              error={errores.estado}
            />

            <CampoTexto
              etiqueta="Fecha"
              nombre="fecha"
              tipo="date"
              valor={formulario.fecha}
              onCambio={onCambio}
              error={errores.fecha}
              requerido
            />

            <CampoTexto
              etiqueta="Hora"
              nombre="hora"
              tipo="time"
              valor={formulario.hora}
              onCambio={onCambio}
              error={errores.hora}
            />
          </div>

          <CampoAreaTexto
            etiqueta="Descripción o indicaciones"
            nombre="descripcion"
            valor={formulario.descripcion}
            onCambio={onCambio}
            error={errores.descripcion}
            placeholder="Preparación necesaria, ayuno, instrucciones o notas..."
          />

          <CampoAreaTexto
            etiqueta="Resultado o resumen"
            nombre="resultado"
            valor={formulario.resultado}
            onCambio={onCambio}
            error={errores.resultado}
            placeholder="Resumen del resultado cuando esté disponible..."
          />

          <section className="rounded-[22px] border border-dashed border-violet-200 bg-violet-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                <Upload size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#10254b]">
                  Archivos del estudio
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Adjunta PDF, JPG, JPEG, PNG o WEBP. El
                  tamaño máximo es de 6 MB por archivo.
                </p>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700">
                  <Paperclip size={18} />
                  Seleccionar archivos

                  <input
                    key={claveInputArchivos}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={onSeleccionArchivos}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {errores.archivos && (
              <p className="mt-3 text-sm font-medium text-red-600">
                {errores.archivos}
              </p>
            )}

            {archivosPendientes.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  Pendientes por subir
                </p>

                {archivosPendientes.map(
                  (archivo, indice) => (
                    <ArchivoPendiente
                      key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`}
                      archivo={archivo}
                      onQuitar={() =>
                        onQuitarPendiente(indice)
                      }
                    />
                  )
                )}
              </div>
            )}

            {archivosExistentes.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Archivos guardados
                </p>

                {archivosExistentes.map((archivo) => (
                  <ArchivoGuardado
                    key={archivo.id}
                    archivo={archivo}
                    procesando={
                      procesandoArchivoId === archivo.id
                    }
                    onAbrir={() =>
                      onAbrirArchivo(archivo)
                    }
                    onDescargar={() =>
                      onDescargarArchivo(archivo)
                    }
                    onEliminar={() =>
                      onEliminarArchivo(archivo)
                    }
                    permitirEliminar
                  />
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
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
                  : "Registrar estudio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalDetallesEstudio({
  estudio,
  modoDemo,
  procesandoId,
  procesandoArchivoId,
  onCerrar,
  onEditar,
  onEliminar,
  onAbrirArchivo,
  onDescargarArchivo,
  onEliminarArchivo,
}) {
  const completado = esEstado(
    estudio,
    "completado"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalles-estudio"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
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
              {completado
                ? "Completado"
                : "Programado"}
            </span>

            <h2
              id="titulo-detalles-estudio"
              className="mt-3 text-2xl font-bold text-[#10254b]"
            >
              {estudio.nombre}
            </h2>

            <p className="mt-1 text-sm font-medium text-[#087ef5]">
              {estudio.tipo || "Estudio médico"}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalles"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <DatoDetalle
              etiqueta="Fecha"
              valor={formatearFechaCompleta(
                estudio.fecha
              )}
              icono={
                <CalendarDays
                  size={18}
                  className="text-[#087ef5]"
                />
              }
            />

            <DatoDetalle
              etiqueta="Hora"
              valor={
                estudio.hora
                  ? normalizarHora(estudio.hora)
                  : "Sin especificar"
              }
              icono={
                <Clock3
                  size={18}
                  className="text-[#087ef5]"
                />
              }
            />

            <DatoDetalle
              etiqueta="Institución"
              valor={
                estudio.institucion || "Sin especificar"
              }
              icono={
                <Building2
                  size={18}
                  className="text-[#087ef5]"
                />
              }
            />

            <DatoDetalle
              etiqueta="Archivos"
              valor={`${estudio.archivos?.length ?? 0} adjunto(s)`}
              icono={
                <Paperclip
                  size={18}
                  className="text-[#087ef5]"
                />
              }
            />
          </div>

          {estudio.descripcion && (
            <section className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Descripción e indicaciones
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {estudio.descripcion}
              </p>
            </section>
          )}

          {estudio.resultado && (
            <section className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-5">
              <FileText
                size={21}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-bold text-emerald-700">
                  Resultado
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-700/80">
                  {estudio.resultado}
                </p>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-[#10254b]">
                  Documentos adjuntos
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Archivos almacenados en el bucket privado.
                </p>
              </div>

              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600">
                {estudio.archivos?.length ?? 0}
              </span>
            </div>

            {(estudio.archivos?.length ?? 0) > 0 ? (
              <div className="mt-4 space-y-2">
                {estudio.archivos.map((archivo) => (
                  <ArchivoGuardado
                    key={archivo.id}
                    archivo={archivo}
                    procesando={
                      procesandoArchivoId === archivo.id
                    }
                    onAbrir={() =>
                      onAbrirArchivo(archivo)
                    }
                    onDescargar={() =>
                      onDescargarArchivo(archivo)
                    }
                    onEliminar={() =>
                      onEliminarArchivo(archivo)
                    }
                    permitirEliminar={!modoDemo}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-5 py-7 text-center">
                <Paperclip
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-2 text-sm text-slate-500">
                  Este estudio no tiene archivos adjuntos.
                </p>
              </div>
            )}
          </section>

          {modoDemo && (
            <p className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-xs font-semibold text-[#087ef5]">
              Estudio de demostración de solo lectura
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cerrar
            </button>

            {!modoDemo && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onEliminar}
                  disabled={procesandoId === estudio.id}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {procesandoId === estudio.id ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Eliminar
                </button>

                <button
                  type="button"
                  onClick={onEditar}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#075dd6]"
                >
                  <Pencil size={18} />
                  Editar estudio
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampoTexto({
  etiqueta,
  nombre,
  valor,
  onCambio,
  error,
  placeholder,
  tipo = "text",
  requerido = false,
  clasesContenedor = "",
}) {
  const id = `campo-${nombre}`;

  return (
    <div className={clasesContenedor}>
      <label
        htmlFor={id}
        className="text-sm font-bold text-[#10254b]"
      >
        {etiqueta}
        {requerido && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        id={id}
        name={nombre}
        type={tipo}
        value={valor}
        onChange={onCambio}
        placeholder={placeholder}
        required={requerido}
        className={[
          "mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
        ].join(" ")}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function CampoAreaTexto({
  etiqueta,
  nombre,
  valor,
  onCambio,
  error,
  placeholder,
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

      <textarea
        id={id}
        name={nombre}
        value={valor}
        onChange={onCambio}
        placeholder={placeholder}
        rows={4}
        className={[
          "mt-2 w-full resize-y rounded-2xl border bg-slate-50 px-4 py-3 text-sm leading-6 text-[#10254b] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
        ].join(" ")}
      />

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
        className={[
          "mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-[#10254b] outline-none transition focus:bg-white focus:ring-4",
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

function ArchivoPendiente({
  archivo,
  onQuitar,
}) {
  const Icono = esImagen(archivo.type)
    ? FileImage
    : FileText;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
        <Icono size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#10254b]">
          {archivo.name}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {formatearTamanioArchivo(archivo.size)}
        </p>
      </div>

      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar ${archivo.name}`}
        className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ArchivoGuardado({
  archivo,
  procesando,
  onAbrir,
  onDescargar,
  onEliminar,
  permitirEliminar,
}) {
  const Icono = esImagen(archivo.mimeType)
    ? FileImage
    : FileText;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
        <Icono size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#10254b]">
          {archivo.nombreArchivo}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {formatearTamanioArchivo(archivo.tamanio)}
        </p>
      </div>

      <button
        type="button"
        onClick={onAbrir}
        disabled={procesando}
        aria-label={`Abrir ${archivo.nombreArchivo}`}
        title="Abrir archivo"
        className="rounded-xl p-2 text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {procesando ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        ) : (
          <Eye size={18} />
        )}
      </button>

      <button
        type="button"
        onClick={onDescargar}
        disabled={procesando}
        aria-label={`Descargar ${archivo.nombreArchivo}`}
        className="rounded-xl p-2 text-[#087ef5] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {procesando ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        ) : (
          <Download size={18} />
        )}
      </button>

      {permitirEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          disabled={procesando}
          aria-label={`Eliminar ${archivo.nombreArchivo}`}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
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

function EstudioCard({
  estudio,
  modoDemo,
  onVerDetalles,
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

          {completado ? "Completado" : "Programado"}
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
            estudio.institucion || "Sin especificar"
          }
        />

        <DetalleEstudio
          icono={<Paperclip size={18} />}
          etiqueta="Archivos"
          valor={`${estudio.archivos?.length ?? 0}`}
        />
      </div>

      {completado && estudio.resultado && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
          <FileText
            size={19}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-700">
              Resultado disponible
            </p>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-600">
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
        onClick={onVerDetalles}
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

      <div className="mt-1 flex items-start gap-2">
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
        Cargando estudios
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Estamos consultando tus estudios y archivos.
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
        No pudimos cargar los estudios
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
            Registrar primer estudio
          </button>
        )
      )}
    </section>
  );
}

async function subirArchivosDelEstudio({
  archivos,
  estudio,
  userId,
}) {
  const subidos = [];
  const fallidos = [];

  for (const archivo of archivos) {
    const extension = obtenerExtension(archivo.name);
    const mimeType = obtenerMimeType(archivo);
    const identificador = generarIdentificador();
    const archivoPath = [
      userId,
      estudio.id,
      `${identificador}.${extension}`,
    ].join("/");

    try {
      const { error: errorSubida } =
        await supabase.storage
          .from(BUCKET_ESTUDIOS)
          .upload(archivoPath, archivo, {
            contentType: mimeType,
            upsert: false,
          });

      if (errorSubida) {
        throw errorSubida;
      }

      const datosArchivo = {
        estudio_id: estudio.id,
        user_id: userId,
        nombre: estudio.nombre,
        descripcion: estudio.descripcion || null,
        fecha_estudio: estudio.fecha,
        nombre_archivo: archivo.name,
        archivo_path: archivoPath,
        mime_type: mimeType,
        tamanio: archivo.size,
        bucket_id: BUCKET_ESTUDIOS,
      };

      const { data, error: errorRegistro } =
        await supabase
          .from("estudios_medicos")
          .insert(datosArchivo)
          .select(CAMPOS_ARCHIVO)
          .single();

      if (errorRegistro) {
        await supabase.storage
          .from(BUCKET_ESTUDIOS)
          .remove([archivoPath]);

        throw errorRegistro;
      }

      subidos.push(normalizarArchivo(data));
    } catch (error) {
      console.error(
        `No fue posible subir ${archivo.name}:`,
        error
      );

      fallidos.push({
        archivo,
        error,
      });
    }
  }

  return {
    subidos,
    fallidos,
  };
}

function validarFormulario(
  formulario,
  archivosPendientes
) {
  const errores = {};

  if (!formulario.nombre.trim()) {
    errores.nombre =
      "Escribe el nombre del estudio.";
  }

  if (!formulario.fecha) {
    errores.fecha =
      "Selecciona la fecha del estudio.";
  }

  if (
    !opcionesEstado.some(
      (opcion) =>
        opcion.valor ===
        normalizarEstado(formulario.estado)
    )
  ) {
    errores.estado = "Selecciona un estado válido.";
  }

  const erroresArchivo = archivosPendientes
    .map(validarArchivo)
    .filter(Boolean);

  if (erroresArchivo.length > 0) {
    errores.archivos = erroresArchivo.join(" ");
  }

  return errores;
}

function validarArchivo(archivo) {
  const extension = obtenerExtension(archivo?.name);

  if (!extensionesPermitidas.has(extension)) {
    return "Formato no permitido.";
  }

  if (!archivo?.size || archivo.size <= 0) {
    return "El archivo está vacío.";
  }

  if (archivo.size > TAMANIO_MAXIMO_ARCHIVO) {
    return "Supera el límite de 6 MB.";
  }

  return "";
}

function normalizarEstudio(estudio = {}) {
  return {
    id: estudio.id,
    createdAt: estudio.created_at || null,
    actualizadoEn: estudio.actualizado_en || null,
    userId: estudio.user_id || null,
    nombre:
      estudio.nombre ||
      estudio.titulo ||
      "Estudio médico",
    tipo: estudio.tipo || "Estudio médico",
    institucion: estudio.institucion || "",
    estado: normalizarEstado(
      estudio.estado || "programado"
    ),
    fecha: estudio.fecha || obtenerFechaActual(),
    hora: normalizarHora(estudio.hora),
    resultado: estudio.resultado || "",
    descripcion: estudio.descripcion || "",
    imagenUrl: estudio.imagen_url || "",
    archivos: (estudio.archivos ?? []).map(
      normalizarArchivo
    ),
  };
}

function normalizarArchivo(archivo = {}) {
  return {
    id: archivo.id,
    estudioId:
      archivo.estudio_id || archivo.estudioId || null,
    userId: archivo.user_id || archivo.userId || null,
    nombre: archivo.nombre || "",
    descripcion: archivo.descripcion || "",
    fechaEstudio:
      archivo.fecha_estudio ||
      archivo.fechaEstudio ||
      null,
    nombreArchivo:
      archivo.nombre_archivo ||
      archivo.nombreArchivo ||
      "Archivo médico",
    archivoPath:
      archivo.archivo_path ||
      archivo.archivoPath ||
      "",
    mimeType:
      archivo.mime_type ||
      archivo.mimeType ||
      "application/octet-stream",
    tamanio: Number(
      archivo.tamanio ?? archivo.size ?? 0
    ),
    bucketId:
      archivo.bucket_id ||
      archivo.bucketId ||
      BUCKET_ESTUDIOS,
    createdAt:
      archivo.created_at || archivo.createdAt || null,
    actualizadoEn:
      archivo.actualizado_en ||
      archivo.actualizadoEn ||
      null,
  };
}

function ordenarEstudiosParaEstado(estudios) {
  return [...estudios].sort((a, b) => {
    const aProgramado = esEstado(a, "programado");
    const bProgramado = esEstado(b, "programado");

    if (aProgramado && !bProgramado) {
      return -1;
    }

    if (!aProgramado && bProgramado) {
      return 1;
    }

    return aProgramado
      ? ordenarEstudiosAscendente(a, b)
      : ordenarEstudiosDescendente(a, b);
  });
}

function normalizarEstado(estado = "programado") {
  const valor = normalizarTexto(estado);

  if (
    ["completado", "finalizado", "terminado"].includes(
      valor
    )
  ) {
    return "completado";
  }

  return "programado";
}

function esEstado(estudio, estado) {
  return (
    normalizarEstado(estudio?.estado) ===
    normalizarEstado(estado)
  );
}

function obtenerFechaEstudio(estudio) {
  const fecha = estudio?.fecha || "1970-01-01";
  const hora = normalizarHora(
    estudio?.hora || "12:00"
  );

  return new Date(`${fecha}T${hora}:00`);
}

function ordenarEstudiosAscendente(a, b) {
  return (
    obtenerFechaEstudio(a) - obtenerFechaEstudio(b)
  );
}

function ordenarEstudiosDescendente(a, b) {
  return (
    obtenerFechaEstudio(b) - obtenerFechaEstudio(a)
  );
}

function normalizarHora(hora = "") {
  return hora ? String(hora).slice(0, 5) : "";
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

function obtenerExtension(nombre = "") {
  const partes = String(nombre).toLowerCase().split(".");

  return partes.length > 1 ? partes.pop() : "";
}

function obtenerMimeType(archivo) {
  if (
    archivo?.type &&
    archivo.type !== "application/octet-stream"
  ) {
    if (archivo.type === "image/jpg") {
      return "image/jpeg";
    }

    return archivo.type;
  }

  const extension = obtenerExtension(archivo?.name);
  const tipos = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return tipos[extension] || "application/octet-stream";
}

function esImagen(tipo = "") {
  return String(tipo).startsWith("image/");
}

function generarIdentificador() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function formatearTamanioArchivo(bytes = 0) {
  const cantidad = Number(bytes) || 0;

  if (cantidad < 1024) {
    return `${cantidad} B`;
  }

  if (cantidad < 1024 * 1024) {
    return `${(cantidad / 1024).toFixed(1)} KB`;
  }

  return `${(cantidad / (1024 * 1024)).toFixed(1)} MB`;
}

function obtenerClasesMensaje(tipo) {
  const configuraciones = {
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
    advertencia: {
      contenedor:
        "border-amber-200 bg-amber-50 text-amber-800",
      boton:
        "text-amber-600 hover:text-amber-800",
    },
    informacion: {
      contenedor:
        "border-blue-200 bg-blue-50 text-blue-800",
      boton: "text-blue-600 hover:text-blue-800",
    },
  };

  return (
    configuraciones[tipo] ??
    configuraciones.informacion
  );
}

export default EstudiosPage;