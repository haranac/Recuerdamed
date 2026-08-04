import {
  CalendarDays,
  FlaskConical,
  Pill,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          {/* Bienvenida */}
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

          {/* Resumen */}
          <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <TarjetaResumen
              titulo="Próximas citas"
              cantidad={0}
              descripcion="No tienes citas programadas"
              icono={<CalendarDays size={24} />}
              fondoIcono="bg-[#eaf6ff]"
              colorIcono="text-[#087ef5]"
            />

            <TarjetaResumen
              titulo="Medicamentos"
              cantidad={0}
              descripcion="No hay recordatorios activos"
              icono={<Pill size={24} />}
              fondoIcono="bg-[#ddf8ee]"
              colorIcono="text-emerald-600"
            />

            <TarjetaResumen
              titulo="Estudios"
              cantidad={0}
              descripcion="No tienes estudios pendientes"
              icono={<FlaskConical size={24} />}
              fondoIcono="bg-[#eee9ff]"
              colorIcono="text-violet-600"
            />
          </section>

          {/* Contenido inferior */}
          <section className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
              <h2 className="text-lg font-bold text-[#10254b]">
                Actividad reciente
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Aquí aparecerán tus últimos registros.
              </p>

              <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                <p className="text-sm text-slate-400">
                  Todavía no hay actividad registrada.
                </p>
              </div>
            </article>

            <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
              <h2 className="text-lg font-bold text-[#10254b]">
                Próximo recordatorio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tus recordatorios aparecerán aquí.
              </p>

              <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl bg-[#eaf6ff] px-6 text-center">
                <p className="text-sm leading-6 text-slate-500">
                  Agrega un medicamento o una cita para
                  comenzar a recibir recordatorios.
                </p>
              </div>
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

export default DashboardPage;