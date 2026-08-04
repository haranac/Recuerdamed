import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Info,
  Moon,
  Pill,
  Plus,
  Search,
  Sun,
  Sunset,
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

function MedicamentosPage() {
  const { modoDemo } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState("todos");
  const [mensaje, setMensaje] = useState("");

  const medicamentos = modoDemo
    ? datosDemo.medicamentos ?? []
    : [];

  const medicamentosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda
      .trim()
      .toLowerCase();

    return medicamentos
      .filter((medicamento) => {
        const coincideBusqueda =
          medicamento.nombre
            .toLowerCase()
            .includes(textoBusqueda) ||
          medicamento.dosis
            .toLowerCase()
            .includes(textoBusqueda) ||
          medicamento.frecuencia
            .toLowerCase()
            .includes(textoBusqueda);

        if (!coincideBusqueda) {
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
        a.hora.localeCompare(b.hora)
      );
  }, [
    busqueda,
    filtroActivo,
    medicamentos,
  ]);

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

  function handleAgregarMedicamento() {
    if (modoDemo) {
      setMensaje(
        "El modo demostración es de solo lectura. No se guardará ningún medicamento."
      );

      return;
    }

    setMensaje(
      "El formulario para registrar medicamentos se conectará en el siguiente paso."
    );
  }

  function handleAccionMedicamento() {
    if (modoDemo) {
      setMensaje(
        "Los medicamentos de demostración no pueden editarse ni eliminarse."
      );
    }
  }

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

          {medicamentosFiltrados.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {medicamentosFiltrados.map(
                (medicamento) => (
                  <MedicamentoCard
                    key={medicamento.id}
                    medicamento={medicamento}
                    modoDemo={modoDemo}
                    onAccion={handleAccionMedicamento}
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

function MedicamentoCard({
  medicamento,
  modoDemo,
  onAccion,
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

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
          <CheckCircle2 size={14} />
          Activo
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold text-[#10254b]">
          {medicamento.nombre}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {medicamento.dosis}
        </p>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-3 text-sm">
          <Clock3
            size={18}
            className="text-[#087ef5]"
          />

          <span className="text-slate-500">
            Horario
          </span>

          <span className="ml-auto font-bold text-[#10254b]">
            {normalizarHora(medicamento.hora)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <IconoMomento
            size={18}
            className={momento.colorTexto}
          />

          <span className="text-slate-500">
            Momento
          </span>

          <span className="ml-auto font-semibold text-[#10254b]">
            {momento.nombre}
          </span>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <Pill
            size={18}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <span className="text-slate-500">
            Frecuencia
          </span>

          <span className="ml-auto max-w-32 text-right font-semibold text-[#10254b]">
            {medicamento.frecuencia}
          </span>
        </div>
      </div>

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
          : "Cuando registres un medicamento, aparecerá en esta sección."}
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

export default MedicamentosPage;