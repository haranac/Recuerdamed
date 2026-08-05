import { Link } from "react-router";
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  HeartPulse,
  Laptop,
  Pill,
  Play,
  ShieldCheck,
  Smartphone,
  Video,
} from "lucide-react";

function LandingPage() {
  const enlaces = {
    video: "https://www.tiktok.com/@haranac8/video/7670420427302341906?is_from_webapp=1&sender_device=pc&web_id=7554270024966800907",
    portafolio: "https://portafolio-indol-iota-61.vercel.app/",
    spa: "/login",
  };

  const recursos = [
    {
      titulo: "Ver video",
      descripcion:
        "Conoce RecuerdaMed y observa brevemente cómo funciona la aplicación.",
      url: enlaces.video,
      icono: Video,
      etiqueta: "Presentación de 40 segundos",
      interno: false,
    },
    {
      titulo: "Ver portafolio",
      descripcion:
        "Consulta mi perfil profesional, habilidades y proyectos de desarrollo.",
      url: enlaces.portafolio,
      icono: Briefcase,
      etiqueta: "Portafolio profesional",
      interno: false,
    },
    {
      titulo: "Probar la SPA",
      descripcion:
        "Inicia sesión para acceder a RecuerdaMed y explorar sus principales funciones.",
      url: enlaces.spa,
      icono: Laptop,
      etiqueta: "Acceso a la aplicación",
      destacado: true,
      interno: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f9ff] text-slate-900">
      {/* Encabezado */}
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-7 lg:px-10">
          <a href="#inicio" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
              <HeartPulse size={25} />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                RecuerdaMed
              </p>

              <p className="text-xs font-medium text-slate-500">
                Proyecto escolar
              </p>
            </div>
          </a>

          <a
            href="#accesos"
            className="hidden items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 sm:flex"
          >
            Explorar proyecto
            <ArrowRight size={17} />
          </a>
        </div>
      </header>

      <main>
        {/* Presentación principal */}
        <section
          id="inicio"
          className="relative overflow-hidden border-b border-sky-100"
        >
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-7 md:py-20 lg:grid-cols-2 lg:px-10 lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm">
                <ShieldCheck size={17} />
                Proyecto académico desarrollado para UNID
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Organiza el seguimiento de tu salud con{" "}
                <span className="text-sky-600">RecuerdaMed</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Una aplicación web diseñada para facilitar la administración de
                medicamentos, citas médicas y estudios clínicos desde un solo
                lugar.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={enlaces.spa}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 text-base font-bold text-white shadow-xl shadow-sky-600/20 transition hover:-translate-y-0.5 hover:bg-sky-700"
                >
                  <Play size={20} fill="currentColor" />
                  Probar la SPA
                </Link>

                <a
                  href="#accesos"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-base font-bold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
                >
                  Ver todos los recursos
                  <ArrowRight size={19} />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-500" />
                  Sin instalaciones
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-500" />
                  Compatible con dispositivos móviles
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-500" />
                  Acceso desde el navegador
                </span>
              </div>
            </div>

            {/* Vista previa de RecuerdaMed */}
            <div className="relative">
              <div className="absolute inset-8 rounded-[2.5rem] bg-sky-400/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-sky-900/15">
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f7fbff]">
                  <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-4">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />

                    <div className="ml-3 h-8 flex-1 rounded-lg bg-slate-100 px-4 py-2 text-xs text-slate-400">
                      recuerdamed.vercel.app
                    </div>
                  </div>

                  <div className="grid min-h-[390px] grid-cols-[76px_1fr]">
                    <aside className="border-r border-slate-200 bg-slate-950 px-3 py-5">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
                        <HeartPulse size={21} />
                      </div>

                      <div className="mt-8 space-y-4">
                        {[1, 2, 3, 4].map((item) => (
                          <div
                            key={item}
                            className={`mx-auto h-9 w-9 rounded-xl ${
                              item === 1 ? "bg-sky-500/30" : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </aside>

                    <div className="p-5 sm:p-7">
                      <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
                        Panel principal
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        Hola, Sergio
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Administra tu información médica.
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <PreviewCard
                          icono={Pill}
                          titulo="Medicamentos"
                          valor="3 activos"
                        />

                        <PreviewCard
                          icono={CalendarCheck}
                          titulo="Citas"
                          valor="2 próximas"
                        />

                        <PreviewCard
                          icono={HeartPulse}
                          titulo="Estudios"
                          valor="4 registros"
                        />
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-800">
                              Próximo medicamento
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Recordatorio programado
                            </p>
                          </div>

                          <div className="shrink-0 rounded-xl bg-sky-100 px-3 py-2 text-sm font-bold text-sky-700">
                            6:00 PM
                          </div>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-2/3 rounded-full bg-sky-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accesos principales */}
        <section
          id="accesos"
          className="mx-auto max-w-7xl px-5 py-16 sm:px-7 lg:px-10 lg:py-24"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
              Conoce el proyecto
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Todo el proyecto en un solo lugar
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              Selecciona uno de los siguientes accesos para ver la presentación,
              conocer mi trabajo o utilizar RecuerdaMed.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {recursos.map((recurso) => (
              <ResourceCard key={recurso.titulo} recurso={recurso} />
            ))}
          </div>
        </section>

        {/* Beneficio principal */}
        <section className="border-y border-sky-100 bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-7 lg:grid-cols-2 lg:px-10 lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
                Beneficio principal
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Información médica más organizada y accesible
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                RecuerdaMed busca ayudar al usuario a consultar y organizar
                información importante relacionada con sus medicamentos, citas
                médicas y estudios clínicos.
              </p>

              <div className="mt-8 space-y-4">
                <BenefitItem text="Centraliza información importante en un solo sitio." />

                <BenefitItem text="Facilita el seguimiento de citas y tratamientos." />

                <BenefitItem text="Ofrece una interfaz sencilla y adaptable." />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icono={Smartphone}
                titulo="Diseño responsive"
                texto="Puede consultarse desde teléfonos, tabletas y computadoras."
              />

              <FeatureCard
                icono={CalendarCheck}
                titulo="Seguimiento"
                texto="Permite administrar citas y eventos relacionados con la salud."
              />

              <FeatureCard
                icono={Pill}
                titulo="Medicamentos"
                texto="Organiza datos importantes de tratamientos y medicamentos."
              />

              <FeatureCard
                icono={ShieldCheck}
                titulo="Experiencia clara"
                texto="Presenta la información mediante una interfaz sencilla."
              />
            </div>
          </div>
        </section>

        {/* Llamado a la acción */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
          <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-12 text-center text-white shadow-2xl sm:px-10 lg:px-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500">
              <HeartPulse size={32} />
            </div>

            <h2 className="mt-7 text-3xl font-black sm:text-4xl">
              Conoce RecuerdaMed
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Mira el video, conoce mi portafolio profesional y accede a la
              aplicación desde cualquier dispositivo.
            </p>

            <Link
              to={enlaces.spa}
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-7 font-bold text-white transition hover:bg-sky-400"
            >
              Probar la SPA
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:px-7 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>RecuerdaMed — Proyecto académico.</p>

          <p>
            Desarrollado por{" "}
            <span className="font-semibold text-slate-700">
              Sergio Ricardo Leal García
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function ResourceCard({ recurso }) {
  const Icono = recurso.icono;

  const estilos = `group flex min-h-[310px] flex-col rounded-3xl border p-7 transition duration-300 hover:-translate-y-1 ${
    recurso.destacado
      ? "border-sky-500 bg-sky-600 text-white shadow-xl shadow-sky-600/20"
      : "border-slate-200 bg-white text-slate-900 shadow-sm hover:border-sky-300 hover:shadow-xl"
  }`;

  const contenido = (
    <>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          recurso.destacado
            ? "bg-white/15 text-white"
            : "bg-sky-100 text-sky-600"
        }`}
      >
        <Icono size={27} />
      </div>

      <p
        className={`mt-7 text-sm font-bold uppercase tracking-wider ${
          recurso.destacado ? "text-sky-100" : "text-sky-600"
        }`}
      >
        {recurso.etiqueta}
      </p>

      <h3 className="mt-2 text-2xl font-black">{recurso.titulo}</h3>

      <p
        className={`mt-3 flex-1 leading-7 ${
          recurso.destacado ? "text-sky-50" : "text-slate-600"
        }`}
      >
        {recurso.descripcion}
      </p>

      <div
        className={`mt-7 flex items-center gap-2 font-bold ${
          recurso.destacado ? "text-white" : "text-sky-700"
        }`}
      >
        Abrir recurso

        {recurso.interno ? (
          <ArrowRight
            size={18}
            className="transition group-hover:translate-x-1"
          />
        ) : (
          <ExternalLink
            size={18}
            className="transition group-hover:translate-x-1"
          />
        )}
      </div>
    </>
  );

  if (recurso.interno) {
    return (
      <Link to={recurso.url} className={estilos}>
        {contenido}
      </Link>
    );
  }

  return (
    <a
      href={recurso.url}
      target="_blank"
      rel="noopener noreferrer"
      className={estilos}
    >
      {contenido}
    </a>
  );
}

function PreviewCard({ icono: Icono, titulo, valor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
        <Icono size={18} />
      </div>

      <p className="mt-3 text-xs text-slate-500">{titulo}</p>

      <p className="mt-1 text-sm font-bold text-slate-800">{valor}</p>
    </div>
  );
}

function BenefitItem({ text }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        size={21}
        className="mt-1 shrink-0 text-emerald-500"
      />

      <p className="leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function FeatureCard({ icono: Icono, titulo, texto }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-[#f8fbff] p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <Icono size={23} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">{titulo}</h3>

      <p className="mt-2 leading-7 text-slate-600">{texto}</p>
    </div>
  );
}

export default LandingPage;