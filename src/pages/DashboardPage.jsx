import {
  CalendarDays,
  Clock3,
  FlaskConical,
  Pill,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";

function DashboardPage() {
  const { modoDemo } = useAuth();

  const citas = modoDemo
    ? datosDemo.citas
    : [];

  const medicamentos = modoDemo
    ? datosDemo.medicamentos
    : [];

  const estudios = modoDemo
    ? datosDemo.estudios
    : [];

  const actividad = modoDemo
    ? datosDemo.actividad
    : [];

  const proximaCita = citas[0];
  const proximoMedicamento = medicamentos[0];

  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          {modoDemo && (
            <div className="mb-6 flex flex-col justify-between gap-3 rounded-[22px] border border-blue-100 bg-[#eaf6ff] px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-[#10254b]">
                  Estás explorando RecuerdaMed
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Los datos visibles son ejemplos y no se
                  guardará ninguna modificación.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#087ef5] shadow-sm">
                Modo solo lectura
              </span>
            </div>
          )}

          <section className="relative overflow-hidden rounded-[30px] bg-[#082b63] p-7 text-white shadow-xl shadow-blue-950/10 sm:p-9">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-sm font-semibold text-blue-200">
                Bienvenido a RecuerdaMed
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Tu información médica en un solo lugar
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100">
                Organiza tus citas, medicamentos y estudios
                para mantener el control de tus actividades
                relacionadas con la salud.
              </p>
            </div>
          </section>

          <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <TarjetaResumen
              titulo="Próximas citas"
              cantidad={citas.length}
              descripcion={
                proximaCita
                  ? `${proximaCita.especialidad} · ${formatearFecha(proximaCita.fecha)}`
                  : "No tienes citas programadas"
              }
              icono={<CalendarDays size={24} />}
              fondoIcono="bg-[#eaf6ff]"
              colorIcono="text-[#087ef5]"
            />

            <TarjetaResumen
              titulo="Medicamentos"
              cantidad={medicamentos.length}
              descripcion={
                proximoMedicamento
                  ? `Próxima toma a las ${proximoMedicamento.hora}`
                  : "No hay recordatorios activos"
              }
              icono={<Pill size={24} />}
              fondoIcono="bg-[#ddf8ee]"
              colorIcono="text-emerald-600"
            />

            <TarjetaResumen
              titulo="Estudios"
              cantidad={estudios.length}
              descripcion={
                estudios[0]
                  ? `${estudios[0].estado} · ${formatearFecha(estudios[0].fecha)}`
                  : "No tienes estudios pendientes"
              }
              icono={<FlaskConical size={24} />}
              fondoIcono="bg-[#eee9ff]"
              colorIcono="text-violet-600"
            />
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
              <h2 className="text-lg font-bold text-[#10254b]">
                Actividad reciente
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tus últimos movimientos aparecerán aquí.
              </p>

              {actividad.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {actividad.map((registro) => (
                    <ActividadItem
                      key={registro.id}
                      registro={registro}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                  <p className="text-sm text-slate-400">
                    Todavía no hay actividad registrada.
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
              <h2 className="text-lg font-bold text-[#10254b]">
                Próximo recordatorio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tu siguiente actividad de salud.
              </p>

              {proximoMedicamento ? (
                <div className="mt-6 rounded-[22px] bg-[#eaf6ff] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#087ef5] shadow-sm">
                    <Pill size={22} />
                  </div>

                  <p className="mt-4 text-sm font-bold text-[#10254b]">
                    {proximoMedicamento.nombre}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {proximoMedicamento.dosis}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#087ef5]">
                    <Clock3 size={17} />
                    {proximoMedicamento.hora}
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl bg-[#eaf6ff] px-6 text-center">
                  <p className="text-sm leading-6 text-slate-500">
                    Agrega un medicamento o una cita para
                    comenzar a recibir recordatorios.
                  </p>
                </div>
              )}

              {proximaCita && (
                <div className="mt-4 rounded-[22px] border border-slate-100 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Próxima cita
                  </p>

                  <p className="mt-2 font-bold text-[#10254b]">
                    {proximaCita.especialista}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {proximaCita.especialidad}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-[#087ef5]">
                    {formatearFecha(proximaCita.fecha)} ·{" "}
                    {proximaCita.hora}
                  </p>
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}

function TarjetaResumen({
  titulo,
  cantidad,
  descripcion,
  icono,
  fondoIcono,
  colorIcono,
}) {
  return (
    <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${fondoIcono} ${colorIcono}`}
      >
        {icono}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-3xl font-bold text-[#10254b]">
        {cantidad}
      </p>

      <p className="mt-2 text-sm text-slate-400">
        {descripcion}
      </p>
    </article>
  );
}

function ActividadItem({ registro }) {
  const configuracion = {
    medicamento: {
      icono: <Pill size={19} />,
      clases: "bg-emerald-50 text-emerald-600",
    },
    cita: {
      icono: <CalendarDays size={19} />,
      clases: "bg-blue-50 text-blue-600",
    },
    estudio: {
      icono: <FlaskConical size={19} />,
      clases: "bg-violet-50 text-violet-600",
    },
  };

  const tipo =
    configuracion[registro.tipo] ??
    configuracion.cita;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tipo.clases}`}
      >
        {tipo.icono}
      </div>

      <div>
        <p className="text-sm font-bold text-[#10254b]">
          {registro.titulo}
        </p>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {registro.descripcion}
        </p>
      </div>
    </div>
  );
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${fecha}T12:00:00`));
}

export default DashboardPage;