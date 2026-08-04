import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Moon,
  Pill,
  Plus,
  Save,
  Search,
  Sun,
  Sunset,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";

const CLAVE_STORAGE = "recuerdamed_medicamentos";

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

const formularioInicial = {
  nombre: "",
  dosis: "",
  frecuencia: "",
  hora: "08:00",
  fechaInicio: obtenerFechaActual(),
  fechaFin: "",
  indicaciones: "",
  activo: true,
};

function MedicamentosPage() {
  const { modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [errores, setErrores] = useState({});
  const [formulario, setFormulario] = useState(formularioInicial);
  const [medicamentosRegistrados, setMedicamentosRegistrados] = useState(
    cargarMedicamentosGuardados
  );

  const medicamentos = useMemo(
    () =>
      modoDemo
        ? datosDemo.medicamentos ?? []
        : medicamentosRegistrados,
    [medicamentosRegistrados, modoDemo]
  );

  const medicamentosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    return medicamentos
      .filter((medicamento) => {
        const contenido = [
          medicamento.nombre,
          medicamento.dosis,
          medicamento.frecuencia,
          medicamento.indicaciones,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (textoBusqueda && !contenido.includes(textoBusqueda)) {
          return false;
        }

        if (filtroActivo === "activos") {
          return medicamento.activo;
        }

        if (["manana", "tarde", "noche"].includes(filtroActivo)) {
          return obtenerMomentoDelDia(medicamento.hora) === filtroActivo;
        }

        return true;
      })
      .sort((a, b) =>
        normalizarHora(a.hora).localeCompare(normalizarHora(b.hora))
      );
  }, [busqueda, filtroActivo, medicamentos]);

  const resumen = useMemo(() => {
    return {
      total: medicamentos.length,
      manana: medicamentos.filter(
        (medicamento) =>
          obtenerMomentoDelDia(medicamento.hora) === "manana"
      ).length,
      tarde: medicamentos.filter(
        (medicamento) =>
          obtenerMomentoDelDia(medicamento.hora) === "tarde"
      ).length,
      noche: medicamentos.filter(
        (medicamento) =>
          obtenerMomentoDelDia(medicamento.hora) === "noche"
      ).length,
    };
  }, [medicamentos]);

  function mostrarMensaje(texto, tipo = "info") {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  function handleAgregarMedicamento() {
    if (modoDemo) {
      mostrarMensaje(
        "El modo demostración es de solo lectura. No se guardará ningún medicamento."
      );
      return;
    }

    setErrores({});
    setFormulario({
      ...formularioInicial,
      fechaInicio: obtenerFechaActual(),
    });
    setFormularioAbierto(true);
  }

  function handleCerrarFormulario() {
    setFormularioAbierto(false);
    setErrores({});
  }

  function handleCambioFormulario(event) {
    const { name, value, type, checked } = event.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errores[name]) {
      setErrores((erroresActuales) => ({
        ...erroresActuales,
        [name]: "",
      }));
    }
  }

  function handleRegistrarMedicamento(event) {
    event.preventDefault();

    const nuevosErrores = validarFormulario(formulario);

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const nuevoMedicamento = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString(),
      nombre: formulario.nombre.trim(),
      dosis: formulario.dosis.trim(),
      frecuencia: formulario.frecuencia.trim(),
      hora: normalizarHora(formulario.hora),
      fechaInicio: formulario.fechaInicio,
      fechaFin: formulario.fechaFin || null,
      indicaciones: formulario.indicaciones.trim(),
      activo: formulario.activo,
      creadoEn: new Date().toISOString(),
    };

    setMedicamentosRegistrados((medicamentosActuales) => {
      const medicamentosActualizados = [
        ...medicamentosActuales,
        nuevoMedicamento,
      ];

      guardarMedicamentos(medicamentosActualizados);
      return medicamentosActualizados;
    });

    setFormularioAbierto(false);
    setFormulario({
      ...formularioInicial,
      fechaInicio: obtenerFechaActual(),
    });
    setErrores({});
    mostrarMensaje("El medicamento se registró correctamente.", "exito");
  }

  function handleAccionMedicamento() {
    if (modoDemo) {
      mostrarMensaje(
        "Los medicamentos de demostración no pueden editarse ni eliminarse."
      );
      return;
    }

    mostrarMensaje(
      "La edición y eliminación del medicamento se pueden agregar en el siguiente paso."
    );
  }

  const clasesMensaje =
    tipoMensaje === "exito"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  const clasesBotonCerrarMensaje =
    tipoMensaje === "exito"
      ? "text-emerald-600 hover:text-emerald-800"
      : "text-amber-600 hover:text-amber-800";

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
                  Puedes consultar y filtrar los medicamentos, pero no guardar
                  cambios.
                </p>
              </div>
            </section>
          )}

          {mensaje && (
            <section
              role="status"
              className={`mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4 ${clasesMensaje}`}
            >
              <p className="text-sm leading-6">{mensaje}</p>

              <button
                type="button"
                onClick={() => setMensaje("")}
                aria-label="Cerrar mensaje"
                className={`shrink-0 transition ${clasesBotonCerrarMensaje}`}
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
              onClick={handleAgregarMedicamento}
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
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar medicamento..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {filtros.map((filtro) => {
                  const seleccionado = filtroActivo === filtro.id;

                  return (
                    <button
                      key={filtro.id}
                      type="button"
                      onClick={() => setFiltroActivo(filtro.id)}
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

          {medicamentosFiltrados.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {medicamentosFiltrados.map((medicamento) => (
                <MedicamentoCard
                  key={medicamento.id}
                  medicamento={medicamento}
                  modoDemo={modoDemo}
                  onAccion={handleAccionMedicamento}
                />
              ))}
            </section>
          ) : (
            <EstadoVacio
              existeBusqueda={
                busqueda.trim() !== "" || filtroActivo !== "todos"
              }
              onLimpiar={() => {
                setBusqueda("");
                setFiltroActivo("todos");
              }}
              onAgregar={handleAgregarMedicamento}
              modoDemo={modoDemo}
            />
          )}
        </div>
      </main>

      {formularioAbierto && (
        <FormularioMedicamento
          formulario={formulario}
          errores={errores}
          onCambio={handleCambioFormulario}
          onCerrar={handleCerrarFormulario}
          onGuardar={handleRegistrarMedicamento}
        />
      )}
    </div>
  );
}

function FormularioMedicamento({
  formulario,
  errores,
  onCambio,
  onCerrar,
  onGuardar,
}) {
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
                  Nuevo tratamiento
                </p>
                <h2
                  id="titulo-formulario-medicamento"
                  className="mt-1 text-2xl font-bold text-[#10254b]"
                >
                  Registrar medicamento
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ingresa la dosis, frecuencia y horario indicado.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar formulario"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={21} />
            </button>
          </div>

          <form onSubmit={onGuardar} className="px-6 py-6 sm:px-8">
            <div className="grid gap-5 md:grid-cols-2">
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
                placeholder="Ej. 500 mg"
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
            </div>

            <div className="mt-5">
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
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
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
                  El medicamento aparecerá en el filtro de tratamientos activos.
                </span>
              </span>
            </label>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6]"
              >
                <Save size={18} />
                Guardar medicamento
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function CampoFormulario({
  etiqueta,
  nombre,
  valor,
  onCambio,
  error,
  tipo = "text",
  placeholder = "",
  icono,
  ayuda,
  min,
  autoFocus = false,
}) {
  const id = `campo-${nombre}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold text-[#10254b]">
          {etiqueta}
        </label>

        {ayuda && <span className="text-xs text-slate-400">{ayuda}</span>}
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

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function TarjetaResumen({ titulo, cantidad, icono, clases }) {
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

        <p className="mt-1 text-2xl font-bold text-[#10254b]">{cantidad}</p>
      </div>
    </article>
  );
}

function MedicamentoCard({ medicamento, modoDemo, onAccion }) {
  const momento = obtenerConfiguracionMomento(medicamento.hora);
  const IconoMomento = momento.icono;
  const activo = medicamento.activo !== false;

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
            activo
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          <CheckCircle2 size={14} />
          {activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold text-[#10254b]">
          {medicamento.nombre}
        </h3>

        <p className="mt-1 text-sm text-slate-500">{medicamento.dosis}</p>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-3 text-sm">
          <Clock3 size={18} className="text-[#087ef5]" />

          <span className="text-slate-500">Horario</span>

          <span className="ml-auto font-bold text-[#10254b]">
            {normalizarHora(medicamento.hora)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <IconoMomento size={18} className={momento.colorTexto} />

          <span className="text-slate-500">Momento</span>

          <span className="ml-auto font-semibold text-[#10254b]">
            {momento.nombre}
          </span>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <Pill
            size={18}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <span className="text-slate-500">Frecuencia</span>

          <span className="ml-auto max-w-32 text-right font-semibold text-[#10254b]">
            {medicamento.frecuencia}
          </span>
        </div>

        {medicamento.fechaInicio && (
          <div className="flex items-start gap-3 text-sm">
            <CalendarDays
              size={18}
              className="mt-0.5 shrink-0 text-violet-600"
            />

            <span className="text-slate-500">Inicio</span>

            <span className="ml-auto max-w-32 text-right font-semibold text-[#10254b]">
              {formatearFecha(medicamento.fechaInicio)}
            </span>
          </div>
        )}
      </div>

      {medicamento.indicaciones && (
        <div className="mt-4 rounded-2xl bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Indicaciones
          </p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            {medicamento.indicaciones}
          </p>
        </div>
      )}

      {modoDemo && (
        <p className="mt-4 text-center text-xs font-semibold text-[#087ef5]">
          Medicamento de demostración
        </p>
      )}

      <button
        type="button"
        onClick={onAccion}
        className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#087ef5]"
      >
        Ver detalles
      </button>
    </article>
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
    errores.nombre = "Ingresa el nombre del medicamento.";
  }

  if (!formulario.dosis.trim()) {
    errores.dosis = "Ingresa la dosis indicada.";
  }

  if (!formulario.frecuencia.trim()) {
    errores.frecuencia = "Ingresa la frecuencia del tratamiento.";
  }

  if (!formulario.hora) {
    errores.hora = "Selecciona una hora.";
  }

  if (!formulario.fechaInicio) {
    errores.fechaInicio = "Selecciona la fecha de inicio.";
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

function cargarMedicamentosGuardados() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const medicamentosGuardados = window.localStorage.getItem(CLAVE_STORAGE);

    if (!medicamentosGuardados) {
      return [];
    }

    const medicamentos = JSON.parse(medicamentosGuardados);
    return Array.isArray(medicamentos) ? medicamentos : [];
  } catch (error) {
    console.error("No se pudieron cargar los medicamentos:", error);
    return [];
  }
}

function guardarMedicamentos(medicamentos) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(medicamentos));
  } catch (error) {
    console.error("No se pudieron guardar los medicamentos:", error);
  }
}

function obtenerMomentoDelDia(hora = "00:00") {
  const numeroHora = Number(String(hora).split(":")[0]);

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

function obtenerFechaActual() {
  const fecha = new Date();
  const diferenciaZonaHoraria = fecha.getTimezoneOffset() * 60 * 1000;

  return new Date(fecha.getTime() - diferenciaZonaHoraria)
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

export default MedicamentosPage;