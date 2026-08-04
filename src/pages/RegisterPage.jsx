import { useState } from "react";
import {
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

function RegisterPage() {
  const { user, loadingSession } = useAuth();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombreCompleto: "",
    email: "",
    password: "",
    confirmarPassword: "",
  });

  const [mostrarPassword, setMostrarPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormulario((valoresActuales) => ({
      ...valoresActuales,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMensajeError("");
    setMensajeExito("");

    const nombre = formulario.nombreCompleto.trim();
    const email = formulario.email.trim().toLowerCase();

    if (!nombre) {
      setMensajeError("Ingresa tu nombre completo.");
      return;
    }

    if (formulario.password.length < 8) {
      setMensajeError(
        "La contraseña debe contener al menos 8 caracteres."
      );
      return;
    }

    if (
      formulario.password !==
      formulario.confirmarPassword
    ) {
      setMensajeError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password: formulario.password,
          options: {
            data: {
              nombre_completo: nombre,
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

      if (error) {
        throw error;
      }

      /*
       * Si Supabase tiene desactivada la confirmación
       * por correo, puede devolver una sesión inmediatamente.
       */
      if (data.session) {
        navigate("/app/inicio", {
          replace: true,
        });

        return;
      }

      setMensajeExito(
        "Cuenta creada. Revisa tu correo electrónico para confirmar el registro."
      );

      setFormulario({
        nombreCompleto: "",
        email: "",
        password: "",
        confirmarPassword: "",
      });
    } catch (error) {
      console.error(
        "Error al crear la cuenta:",
        error.message
      );

      setMensajeError(
        obtenerMensajeRegistro(error.message)
      );
    } finally {
      setLoading(false);
    }
  }

  if (loadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f9ff]">
        <p className="text-sm text-slate-500">
          Comprobando sesión...
        </p>
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
        <aside className="relative hidden overflow-hidden bg-[#082b63] p-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-28 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex rounded-2xl bg-white/10 p-4 backdrop-blur">
              <HeartPulse size={34} />
            </div>

            <h2 className="mt-8 max-w-md text-4xl font-bold leading-tight">
              Comienza a organizar el cuidado de tu salud
            </h2>

            <p className="mt-5 max-w-md leading-7 text-blue-100">
              Registra tus citas, medicamentos y estudios
              para mantener tu información siempre
              disponible.
            </p>
          </div>

          <div className="relative rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="font-bold">
              Tu información es personal
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              Cada usuario tendrá acceso únicamente a sus
              propios registros de salud.
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#087ef5] text-white shadow-lg shadow-blue-500/25">
                <HeartPulse size={30} />
              </div>

              <div>
                <p className="text-2xl font-bold text-[#082b63]">
                  RecuerdaMed
                </p>

                <p className="text-xs text-slate-500">
                  Tu salud, nuestra prioridad
                </p>
              </div>
            </div>

            <div className="mb-7">
              <p className="mb-2 text-sm font-bold text-[#087ef5]">
                Nueva cuenta
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-[#10254b]">
                Regístrate
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Ingresa tus datos para comenzar a utilizar
                RecuerdaMed.
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

            {mensajeExito && (
              <div
                role="status"
                className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {mensajeExito}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <CampoFormulario
                id="nombreCompleto"
                name="nombreCompleto"
                type="text"
                label="Nombre completo"
                placeholder="Escribe tu nombre"
                autoComplete="name"
                value={formulario.nombreCompleto}
                onChange={handleChange}
                icono={<UserRound size={19} />}
              />

              <CampoFormulario
                id="email"
                name="email"
                type="email"
                label="Correo electrónico"
                placeholder="nombre@correo.com"
                autoComplete="email"
                value={formulario.email}
                onChange={handleChange}
                icono={<Mail size={19} />}
              />

              <CampoPassword
                id="password"
                name="password"
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={formulario.password}
                onChange={handleChange}
                mostrarPassword={mostrarPassword}
                cambiarVisibilidad={() =>
                  setMostrarPassword(
                    (valorActual) => !valorActual
                  )
                }
              />

              <CampoFormulario
                id="confirmarPassword"
                name="confirmarPassword"
                type={
                  mostrarPassword ? "text" : "password"
                }
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                value={formulario.confirmarPassword}
                onChange={handleChange}
                icono={<LockKeyhole size={19} />}
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-[#087ef5] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creando cuenta..."
                  : "Crear cuenta"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="font-bold text-[#087ef5] hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function CampoFormulario({
  id,
  label,
  icono,
  ...propiedades
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#10254b]"
      >
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icono}
        </span>

        <input
          id={id}
          required
          {...propiedades}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function CampoPassword({
  id,
  label,
  mostrarPassword,
  cambiarVisibilidad,
  ...propiedades
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#10254b]"
      >
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={id}
          type={mostrarPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          {...propiedades}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={cambiarVisibilidad}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
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
  );
}

function obtenerMensajeRegistro(mensaje = "") {
  const texto = mensaje.toLowerCase();

  if (
    texto.includes("password") &&
    texto.includes("characters")
  ) {
    return "La contraseña no cumple con los requisitos de seguridad.";
  }

  if (
    texto.includes("rate limit") ||
    texto.includes("too many")
  ) {
    return "Se realizaron demasiados intentos. Espera un momento antes de volver a intentarlo.";
  }

  return "No fue posible crear la cuenta. Revisa los datos e inténtalo nuevamente.";
}

export default RegisterPage;