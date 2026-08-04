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
import { supabase } from "../lib/supabase";

const perfilDemostracion = {
  nombreCompleto: "Usuario invitado",
  email: "invitado@recuerdamed.demo",
  telefono: "614 123 4567",
  fechaNacimiento: "1995-06-18",
  tipoSangre: "O+",
  contactoEmergencia: "María López",
  telefonoEmergencia: "614 987 6543",
};

const formularioVacio = {
  nombreCompleto: "",
  email: "",
  telefono: "",
  fechaNacimiento: "",
  tipoSangre: "",
  contactoEmergencia: "",
  telefonoEmergencia: "",
};

function PerfilPage() {
  const { user, modoDemo } = useAuth();

  const [formulario, setFormulario] =
    useState(formularioVacio);

  const [formularioInicial, setFormularioInicial] =
    useState(null);

  const [cargandoPerfil, setCargandoPerfil] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");

  const [guardando, setGuardando] =
    useState(false);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarPerfil() {
      setCargandoPerfil(true);
      setErrorCarga("");
      setMensaje("");

      if (modoDemo) {
        if (componenteActivo) {
          setFormulario(perfilDemostracion);
          setFormularioInicial(perfilDemostracion);
          setCargandoPerfil(false);
        }

        return;
      }

      if (!user?.id) {
        if (componenteActivo) {
          setFormulario(formularioVacio);
          setFormularioInicial(formularioVacio);
          setCargandoPerfil(false);
        }

        return;
      }

      try {
        const { data, error } = await supabase
          .from("perfiles")
          .select(`
            nombre_completo,
            telefono,
            fecha_nacimiento,
            tipo_sangre,
            contacto_emergencia,
            telefono_emergencia
          `)
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const datosIniciales = {
          nombreCompleto:
            data?.nombre_completo ||
            user.user_metadata?.nombre_completo ||
            "",
          email: user.email || "",
          telefono: data?.telefono || "",
          fechaNacimiento:
            data?.fecha_nacimiento || "",
          tipoSangre:
            data?.tipo_sangre || "",
          contactoEmergencia:
            data?.contacto_emergencia || "",
          telefonoEmergencia:
            data?.telefono_emergencia || "",
        };

        if (componenteActivo) {
          setFormulario(datosIniciales);
          setFormularioInicial(datosIniciales);
        }
      } catch (error) {
        console.error(
          "No fue posible cargar el perfil:",
          {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
          }
        );

        if (componenteActivo) {
          setErrorCarga(
            obtenerMensajeErrorCarga(error)
          );
        }
      } finally {
        if (componenteActivo) {
          setCargandoPerfil(false);
        }
      }
    }

    cargarPerfil();

    return () => {
      componenteActivo = false;
    };
  }, [
    modoDemo,
    user?.id,
    user?.email,
    user?.user_metadata?.nombre_completo,
  ]);

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

    if (mensaje) {
      setMensaje("");
    }
  }

  function handleCancelarCambios() {
    if (!formularioInicial) {
      return;
    }

    setFormulario(formularioInicial);
    setMensaje("");
  }

  function handleCambiarFotografia() {
    if (modoDemo) {
      setTipoMensaje("informacion");
      setMensaje(
        "El modo demostración es de solo lectura."
      );

      return;
    }

    setTipoMensaje("informacion");
    setMensaje(
      "La carga de fotografía se agregará posteriormente."
    );
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

    if (!user?.id) {
      setTipoMensaje("error");
      setMensaje(
        "No se encontró una sesión válida."
      );

      return;
    }

    const nombreCompleto =
      formulario.nombreCompleto.trim();

    if (!nombreCompleto) {
      setTipoMensaje("error");
      setMensaje(
        "El nombre completo es obligatorio."
      );

      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      const datosPerfil = {
        id: user.id,
        nombre_completo: nombreCompleto,
        telefono:
          formulario.telefono.trim() || null,
        fecha_nacimiento:
          formulario.fechaNacimiento || null,
        tipo_sangre:
          formulario.tipoSangre || null,
        contacto_emergencia:
          formulario.contactoEmergencia.trim() ||
          null,
        telefono_emergencia:
          formulario.telefonoEmergencia.trim() ||
          null,
      };

      const { data, error } = await supabase
        .from("perfiles")
        .upsert(datosPerfil, {
          onConflict: "id",
        })
        .select(`
          nombre_completo,
          telefono,
          fecha_nacimiento,
          tipo_sangre,
          contacto_emergencia,
          telefono_emergencia
        `)
        .single();

      if (error) {
        throw error;
      }

      const datosActualizados = {
        nombreCompleto:
          data?.nombre_completo || "",
        email: user.email || "",
        telefono:
          data?.telefono || "",
        fechaNacimiento:
          data?.fecha_nacimiento || "",
        tipoSangre:
          data?.tipo_sangre || "",
        contactoEmergencia:
          data?.contacto_emergencia || "",
        telefonoEmergencia:
          data?.telefono_emergencia || "",
      };

      setFormulario(datosActualizados);
      setFormularioInicial(datosActualizados);

      const { error: errorUsuario } =
        await supabase.auth.updateUser({
          data: {
            nombre_completo:
              datosActualizados.nombreCompleto,
          },
        });

      if (errorUsuario) {
        console.error(
          "El perfil se guardó, pero no se pudo sincronizar el nombre:",
          errorUsuario
        );

        setTipoMensaje("advertencia");
        setMensaje(
          "El perfil se guardó, pero el nombre del encabezado podría actualizarse hasta que vuelvas a iniciar sesión."
        );

        return;
      }

      setTipoMensaje("exito");
      setMensaje(
        "El perfil se guardó correctamente."
      );
    } catch (error) {
      console.error(
        "No fue posible guardar el perfil:",
        {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        }
      );

      setTipoMensaje("error");
      setMensaje(
        obtenerMensajeErrorPerfil(error)
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
            <MensajeEstado
              mensaje={mensaje}
              tipo={tipoMensaje}
              onCerrar={() => setMensaje("")}
            />
          )}

          {errorCarga && !cargandoPerfil && (
            <section className="mb-6 rounded-[20px] border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm leading-6 text-red-700">
                {errorCarga}
              </p>
            </section>
          )}

          {cargandoPerfil && (
            <EstadoCarga />
          )}

          {!cargandoPerfil && (
            <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
              <aside className="space-y-6">
                <article className="rounded-[28px] border border-slate-100 bg-white p-7 text-center shadow-lg shadow-slate-200/40">
                  <div className="relative mx-auto w-fit">
                    <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-[#082b63] text-3xl font-bold text-white shadow-xl shadow-blue-950/15">
                      {iniciales}
                    </div>

                    <button
                      type="button"
                      onClick={handleCambiarFotografia}
                      aria-label="Cambiar fotografía"
                      className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-[#087ef5] text-white shadow-lg transition hover:bg-[#075dd6]"
                    >
                      <Camera size={18} />
                    </button>
                  </div>

                  <h2 className="mt-6 text-xl font-bold text-[#10254b]">
                    {formulario.nombreCompleto ||
                      "Usuario"}
                  </h2>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {formulario.email ||
                      "Correo no disponible"}
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
                      autoComplete="name"
                      icono={<UserRound size={19} />}
                    />

                    <CampoFormulario
                      label="Correo electrónico"
                      name="email"
                      type="email"
                      value={formulario.email}
                      onChange={handleChange}
                      placeholder="nombre@correo.com"
                      autoComplete="email"
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
                      autoComplete="tel"
                      icono={<Phone size={19} />}
                    />

                    <CampoFormulario
                      label="Fecha de nacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={formulario.fechaNacimiento}
                      onChange={handleChange}
                      autoComplete="bday"
                      icono={
                        <CalendarDays size={19} />
                      }
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
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <select
                          id="tipoSangre"
                          name="tipoSangre"
                          value={formulario.tipoSangre}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-[#10254b] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="">
                            Seleccionar
                          </option>
                          <option value="A+">
                            A+
                          </option>
                          <option value="A-">
                            A-
                          </option>
                          <option value="B+">
                            B+
                          </option>
                          <option value="B-">
                            B-
                          </option>
                          <option value="AB+">
                            AB+
                          </option>
                          <option value="AB-">
                            AB-
                          </option>
                          <option value="O+">
                            O+
                          </option>
                          <option value="O-">
                            O-
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="my-8 h-px bg-slate-100" />

                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <UsersRound size={21} />
                      </div>

                      <div>
                        <h3 className="font-bold text-[#10254b]">
                          Contacto de emergencia
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Persona a quien contactar en caso
                          de emergencia.
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
                        autoComplete="off"
                        icono={
                          <UserRound size={19} />
                        }
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
                        autoComplete="off"
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
          )}
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
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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

function EstadoCarga() {
  return (
    <section className="flex min-h-[400px] items-center justify-center rounded-[28px] border border-slate-100 bg-white shadow-lg shadow-slate-200/40">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-[#087ef5]" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Cargando perfil...
        </p>
      </div>
    </section>
  );
}

function MensajeEstado({
  mensaje,
  tipo,
  onCerrar,
}) {
  const configuraciones = {
    error: {
      contenedor:
        "border-red-200 bg-red-50",
      texto:
        "text-red-700",
      boton:
        "text-red-600 hover:text-red-800",
    },
    exito: {
      contenedor:
        "border-emerald-200 bg-emerald-50",
      texto:
        "text-emerald-700",
      boton:
        "text-emerald-600 hover:text-emerald-800",
    },
    advertencia: {
      contenedor:
        "border-amber-200 bg-amber-50",
      texto:
        "text-amber-800",
      boton:
        "text-amber-600 hover:text-amber-900",
    },
    informacion: {
      contenedor:
        "border-blue-200 bg-blue-50",
      texto:
        "text-blue-700",
      boton:
        "text-blue-600 hover:text-blue-800",
    },
  };

  const configuracion =
    configuraciones[tipo] ||
    configuraciones.informacion;

  return (
    <section
      role="status"
      aria-live="polite"
      className={[
        "mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4",
        configuracion.contenedor,
      ].join(" ")}
    >
      <p
        className={[
          "text-sm leading-6",
          configuracion.texto,
        ].join(" ")}
      >
        {mensaje}
      </p>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar mensaje"
        className={[
          "shrink-0 transition",
          configuracion.boton,
        ].join(" ")}
      >
        <X size={19} />
      </button>
    </section>
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

function obtenerMensajeErrorCarga(error) {
  const mensaje =
    error?.message?.toLowerCase() || "";

  if (
    mensaje.includes("row-level security") ||
    mensaje.includes("permission denied")
  ) {
    return "No tienes permiso para consultar este perfil. Revisa las políticas RLS de la tabla perfiles.";
  }

  if (
    error?.code === "42P01" ||
    mensaje.includes("relation") &&
      mensaje.includes("does not exist")
  ) {
    return "La tabla perfiles no existe o no está disponible en Supabase.";
  }

  return "No fue posible cargar la información del perfil.";
}

function obtenerMensajeErrorPerfil(error) {
  const mensaje =
    error?.message?.toLowerCase() || "";

  if (
    mensaje.includes("row-level security") ||
    mensaje.includes(
      "violates row-level security"
    ) ||
    mensaje.includes("permission denied")
  ) {
    return "No tienes permiso para modificar este perfil. Revisa las políticas RLS.";
  }

  if (
    mensaje.includes("tipo_sangre") ||
    mensaje.includes("check constraint")
  ) {
    return "El tipo de sangre seleccionado no es válido.";
  }

  if (
    mensaje.includes(
      "invalid input syntax for type date"
    )
  ) {
    return "La fecha de nacimiento no tiene un formato válido.";
  }

  if (
    error?.code === "42P01" ||
    mensaje.includes("relation") &&
      mensaje.includes("does not exist")
  ) {
    return "La tabla perfiles no existe o no está disponible en Supabase.";
  }

  return "No fue posible guardar los cambios del perfil.";
}

export default PerfilPage;