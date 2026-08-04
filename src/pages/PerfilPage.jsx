import { useEffect, useState } from "react";
import {
  CalendarDays,
  Camera,
  HeartPulse,
  Info,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

const perfilDemostracion = {
  nombreCompleto: "Usuario invitado",
  email: "invitado@recuerdamed.demo",
  telefono: "614 123 4567",
  fechaNacimiento: "1995-06-18",
  tipoSangre: "O+",
  contactoEmergencia: "María López",
  telefonoEmergencia: "614 987 6543",
};

function PerfilPage() {
  const { user, modoDemo } = useAuth();

  const [formulario, setFormulario] = useState({
    nombreCompleto: "",
    email: "",
    telefono: "",
    fechaNacimiento: "",
    tipoSangre: "",
    contactoEmergencia: "",
    telefonoEmergencia: "",
  });

  const [formularioInicial, setFormularioInicial] =
    useState(null);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const datosIniciales = modoDemo
      ? perfilDemostracion
      : {
          nombreCompleto:
            user?.user_metadata?.nombre_completo || "",
          email: user?.email || "",
          telefono:
            user?.user_metadata?.telefono || "",
          fechaNacimiento:
            user?.user_metadata?.fecha_nacimiento || "",
          tipoSangre:
            user?.user_metadata?.tipo_sangre || "",
          contactoEmergencia:
            user?.user_metadata?.contacto_emergencia || "",
          telefonoEmergencia:
            user?.user_metadata
              ?.telefono_emergencia || "",
        };

    setFormulario(datosIniciales);
    setFormularioInicial(datosIniciales);
  }, [modoDemo, user]);

  const hayCambios =
    formularioInicial !== null &&
    JSON.stringify(formulario) !==
      JSON.stringify(formularioInicial);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormulario((datosActuales) => ({
      ...datosActuales,
      [name]: value,
    }));
  }

  function handleCancelarCambios() {
    if (!formularioInicial) {
      return;
    }

    setFormulario(formularioInicial);
    setMensaje("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (modoDemo) {
      setTipoMensaje("informacion");
      setMensaje(
        "El modo demostración es de solo lectura. Los cambios no se guardarán."
      );
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      /*
       * La persistencia se conectará después mediante
       * una tabla perfiles protegida con RLS.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      setTipoMensaje("informacion");
      setMensaje(
        "La interfaz está lista. El guardado se conectará a la tabla de perfiles de Supabase."
      );
    } catch (error) {
      console.error(
        "No fue posible guardar el perfil:",
        error
      );

      setTipoMensaje("error");
      setMensaje(
        "No fue posible guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  }

  const iniciales = obtenerIniciales(
    formulario.nombreCompleto
  );

  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header
          titulo="Perfil"
          descripcion="Consulta y administra tu información personal."
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
                  Perfil de demostración
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  La información es ficticia y no puede
                  modificarse ni guardarse.
                </p>
              </div>
            </section>
          )}

          {mensaje && (
            <section
              role="status"
              className={[
                "mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4",
                tipoMensaje === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50",
              ].join(" ")}
            >
              <p
                className={[
                  "text-sm leading-6",
                  tipoMensaje === "error"
                    ? "text-red-700"
                    : "text-amber-800",
                ].join(" ")}
              >
                {mensaje}
              </p>

              <button
                type="button"
                onClick={() => setMensaje("")}
                aria-label="Cerrar mensaje"
                className={
                  tipoMensaje === "error"
                    ? "text-red-600"
                    : "text-amber-600"
                }
              >
                <X size={19} />
              </button>
            </section>
          )}

          <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
            <aside className="space-y-6">
              <article className="rounded-[28px] border border-slate-100 bg-white p-7 text-center shadow-lg shadow-slate-200/40">
                <div className="relative mx-auto w-fit">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-[#082b63] text-3xl font-bold text-white shadow-xl shadow-blue-950/15">
                    {iniciales}
                  </div>

                  <button
                    type="button"
                    disabled={modoDemo}
                    onClick={() => {
                      setMensaje(
                        "La carga de fotografía se agregará posteriormente."
                      );
                      setTipoMensaje("informacion");
                    }}
                    aria-label="Cambiar fotografía"
                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-[#087ef5] text-white shadow-lg transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Camera size={18} />
                  </button>
                </div>

                <h2 className="mt-6 text-xl font-bold text-[#10254b]">
                  {formulario.nombreCompleto ||
                    "Usuario"}
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {formulario.email}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600">
                  <ShieldCheck size={16} />
                  {modoDemo
                    ? "Cuenta de demostración"
                    : "Cuenta activa"}
                </span>
              </article>

              <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <HeartPulse size={22} />
                </div>

                <h3 className="mt-4 font-bold text-[#10254b]">
                  Información médica
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Estos datos pueden ayudar a identificar
                  rápidamente información importante.
                </p>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tipo de sangre
                  </p>

                  <p className="mt-1 text-2xl font-bold text-[#10254b]">
                    {formulario.tipoSangre ||
                      "Sin registrar"}
                  </p>
                </div>
              </article>
            </aside>

            <form
              onSubmit={handleSubmit}
              className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8"
            >
              <div>
                <p className="text-sm font-bold text-[#087ef5]">
                  Datos personales
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#10254b]">
                  Información del perfil
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Mantén actualizados tus datos personales
                  y de contacto.
                </p>
              </div>

              <fieldset
                disabled={modoDemo || guardando}
                className="mt-8"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <CampoFormulario
                    label="Nombre completo"
                    name="nombreCompleto"
                    value={formulario.nombreCompleto}
                    onChange={handleChange}
                    placeholder="Escribe tu nombre"
                    icono={<UserRound size={19} />}
                  />

                  <CampoFormulario
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    value={formulario.email}
                    onChange={handleChange}
                    placeholder="nombre@correo.com"
                    icono={<Mail size={19} />}
                    readOnly
                  />

                  <CampoFormulario
                    label="Teléfono"
                    name="telefono"
                    type="tel"
                    value={formulario.telefono}
                    onChange={handleChange}
                    placeholder="Número telefónico"
                    icono={<Phone size={19} />}
                  />

                  <CampoFormulario
                    label="Fecha de nacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={formulario.fechaNacimiento}
                    onChange={handleChange}
                    icono={<CalendarDays size={19} />}
                  />

                  <div>
                    <label
                      htmlFor="tipoSangre"
                      className="mb-2 block text-sm font-semibold text-[#10254b]"
                    >
                      Tipo de sangre
                    </label>

                    <div className="relative">
                      <HeartPulse
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        id="tipoSangre"
                        name="tipoSangre"
                        value={formulario.tipoSangre}
                        onChange={handleChange}
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-[#10254b] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-70"
                      >
                        <option value="">
                          Seleccionar
                        </option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="my-8 h-px bg-slate-100" />

                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <UsersRound size={21} />
                    </div>

                    <div>
                      <h3 className="font-bold text-[#10254b]">
                        Contacto de emergencia
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Persona a quien contactar en caso de
                        emergencia.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <CampoFormulario
                      label="Nombre del contacto"
                      name="contactoEmergencia"
                      value={
                        formulario.contactoEmergencia
                      }
                      onChange={handleChange}
                      placeholder="Nombre completo"
                      icono={<UserRound size={19} />}
                    />

                    <CampoFormulario
                      label="Teléfono de emergencia"
                      name="telefonoEmergencia"
                      type="tel"
                      value={
                        formulario.telefonoEmergencia
                      }
                      onChange={handleChange}
                      placeholder="Número telefónico"
                      icono={<Phone size={19} />}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelarCambios}
                  disabled={
                    modoDemo ||
                    guardando ||
                    !hayCambios
                  }
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar cambios
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando ||
                    (!modoDemo && !hayCambios)
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={18} />

                  {modoDemo
                    ? "Solo visualización"
                    : guardando
                      ? "Guardando..."
                      : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function CampoFormulario({
  label,
  icono,
  readOnly = false,
  type = "text",
  ...propiedades
}) {
  return (
    <div>
      <label
        htmlFor={propiedades.name}
        className="mb-2 block text-sm font-semibold text-[#10254b]"
      >
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icono}
        </span>

        <input
          id={propiedades.name}
          type={type}
          readOnly={readOnly}
          {...propiedades}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-[#10254b] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 read-only:cursor-not-allowed read-only:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>
    </div>
  );
}

function obtenerIniciales(nombre = "") {
  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) =>
      palabra.charAt(0).toUpperCase()
    )
    .join("");

  return iniciales || "U";
}

export default PerfilPage;