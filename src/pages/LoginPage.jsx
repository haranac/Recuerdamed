import { useState } from "react";
import {
  Activity,
  CalendarDays,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

function LoginPage() {
  const {
    user,
    loadingSession,
    entrarComoInvitado,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] =
    useState(false);

  const [mensajeError, setMensajeError] =
    useState("");

  const destino =
    location.state?.from || "/app/inicio";

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMensajeError("");

    const emailNormalizado = email
      .trim()
      .toLowerCase();

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: emailNormalizado,
          password,
        });

      if (error) {
        throw error;
      }

      navigate(destino, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error.message
      );

      setMensajeError(
        obtenerMensajeInicioSesion(error.message)
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleInvitado() {
    setLoadingDemo(true);
    setMensajeError("");

    try {
      await entrarComoInvitado();

      navigate("/app/inicio", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "No fue posible iniciar el modo demo:",
        error.message
      );

      setMensajeError(
        "No fue posible iniciar el modo demostración."
      );
    } finally {
      setLoadingDemo(false);
    }
  }

  if (loadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f9ff]">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-200 border-t-[#087ef5]" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Comprobando sesión...
          </p>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/app/inicio"
        replace
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f9ff] p-4 lg:flex lg:items-center lg:justify-center lg:p-8">
      <section className="mx-auto grid min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-blue-950/10 lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#087ef5] text-white shadow-lg shadow-blue-500/25">
                <HeartPulse size={30} />
              </div>

              <div>
                <p className="text-2xl font-bold text-[#082b63]">
                  Recuerda
                  <span className="text-[#087ef5]">
                    Med
                  </span>
                </p>

                <p className="text-xs text-slate-500">
                  Tu salud, nuestra prioridad
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-bold text-[#087ef5]">
                Bienvenido de nuevo
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-[#10254b]">
                Inicia sesión
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Accede a tus citas, medicamentos, estudios
                e historial desde un solo lugar.
              </p>
            </div>

            {mensajeError && (
              <div
                role="alert"
                className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {mensajeError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#10254b]"
                >
                  Correo electrónico
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="nombre@correo.com"
                    required
                    disabled={loading || loadingDemo}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#10254b]"
                  >
                    Contraseña
                  </label>

                  <button
                    type="button"
                    className="text-xs font-semibold text-[#087ef5] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={
                      mostrarPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Ingresa tu contraseña"
                    required
                    disabled={loading || loadingDemo}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPassword(
                        (valorActual) => !valorActual
                      )
                    }
                    disabled={loading || loadingDemo}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600 disabled:opacity-50"
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || loadingDemo}
                className="flex w-full items-center justify-center rounded-2xl bg-[#087ef5] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Iniciando sesión..."
                  : "Iniciar sesión"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                o
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleInvitado}
              disabled={loading || loadingDemo}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#087ef5] bg-white px-5 py-3.5 text-sm font-bold text-[#087ef5] transition hover:bg-[#eaf6ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserRound size={19} />

              {loadingDemo
                ? "Abriendo demostración..."
                : "Continuar como invitado"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              Podrás visualizar datos de ejemplo sin guardar
              información.
            </p>

            <p className="mt-7 text-center text-sm text-slate-500">
              ¿Todavía no tienes una cuenta?{" "}
              <Link
                to="/registro"
                className="font-bold text-[#087ef5] hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        <aside className="relative hidden overflow-hidden bg-[#082b63] p-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex rounded-2xl bg-white/10 p-4 backdrop-blur">
              <Activity size={34} />
            </div>

            <h2 className="mt-8 max-w-md text-4xl font-bold leading-tight">
              Todo tu cuidado médico en un solo lugar
            </h2>

            <p className="mt-5 max-w-md leading-7 text-blue-100">
              Organiza tus citas, medicamentos y estudios
              con una experiencia sencilla, clara y segura.
            </p>

            <div className="mt-10 space-y-4">
              <Caracteristica
                icono={<CalendarDays size={21} />}
                titulo="Recordatorios organizados"
                descripcion="Consulta tus próximas actividades de salud."
              />

              <Caracteristica
                icono={<ShieldCheck size={21} />}
                titulo="Información protegida"
                descripcion="Cada cuenta accede únicamente a sus propios registros."
              />
            </div>
          </div>

          <div className="relative rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#087ef5]">
                <HeartPulse size={25} />
              </div>

              <div>
                <p className="font-bold">
                  Tu salud, siempre presente
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-100">
                  Consulta tu información cuando la
                  necesites.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Caracteristica({
  icono,
  titulo,
  descripcion,
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100">
        {icono}
      </div>

      <div>
        <p className="font-semibold">
          {titulo}
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-100">
          {descripcion}
        </p>
      </div>
    </div>
  );
}

function obtenerMensajeInicioSesion(mensaje = "") {
  const texto = mensaje.toLowerCase();

  if (texto.includes("email logins are disabled")) {
    return "El inicio de sesión por correo está desactivado en Supabase.";
  }

  if (
    texto.includes("email not confirmed") ||
    texto.includes("email_not_confirmed")
  ) {
    return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
  }

  if (
    texto.includes("invalid login credentials") ||
    texto.includes("invalid_credentials")
  ) {
    return "El correo o la contraseña no son correctos.";
  }

  if (
    texto.includes("too many requests") ||
    texto.includes("rate limit")
  ) {
    return "Se realizaron demasiados intentos. Espera un momento antes de volver a intentarlo.";
  }

  return "No fue posible iniciar sesión. Revisa tus datos e inténtalo nuevamente.";
}

export default LoginPage;