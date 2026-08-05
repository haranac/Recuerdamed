import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckCircle2,
  HeartPulse,
  Info,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
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
  avatarUrl: "",
};

const formularioVacio = {
  nombreCompleto: "",
  email: "",
  telefono: "",
  fechaNacimiento: "",
  tipoSangre: "",
  contactoEmergencia: "",
  telefonoEmergencia: "",
  avatarUrl: "",
};

const tiposSangre = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

function PerfilPage() {
  const { user, modoDemo } = useAuth();

  const [formulario, setFormulario] =
    useState(formularioVacio);
  const [formularioInicial, setFormularioInicial] =
    useState(null);

  const [cargandoPerfil, setCargandoPerfil] =
    useState(true);
  const [guardando, setGuardando] =
    useState(false);
  const [errorCarga, setErrorCarga] =
    useState("");
  const [mensaje, setMensaje] =
    useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("informacion");
  const [intentoCarga, setIntentoCarga] =
    useState(0);

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
          setErrorCarga(
            "No se encontró una sesión válida."
          );
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
            telefono_emergencia,
            avatar_url
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
            user.user_metadata?.full_name ||
            "",
          email: user.email || "",
          telefono: data?.telefono || "",
          fechaNacimiento:
            data?.fecha_nacimiento || "",
          tipoSangre: data?.tipo_sangre || "",
          contactoEmergencia:
            data?.contacto_emergencia || "",
          telefonoEmergencia:
            data?.telefono_emergencia || "",
          avatarUrl:
            data?.avatar_url ||
            user.user_metadata?.avatar_url ||
            "",
        };

        if (componenteActivo) {
          setFormulario(datosIniciales);
          setFormularioInicial(datosIniciales);
        }
      } catch (error) {
        console.error(
          "No fue posible cargar el perfil:",
          error
        );

        if (componenteActivo) {
          setErrorCarga(
            obtenerMensajeErrorPerfil(error, "cargar")
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
    intentoCarga,
    modoDemo,
    user?.email,
    user?.id,
    user?.user_metadata?.avatar_url,
    user?.user_metadata?.full_name,
    user?.user_metadata?.nombre_completo,
  ]);

  const hayCambios = useMemo(() => {
    if (!formularioInicial) {
      return false;
    }

    return (
      JSON.stringify(formulario) !==
      JSON.stringify(formularioInicial)
    );
  }, [formulario, formularioInicial]);

  const iniciales = obtenerIniciales(
    formulario.nombreCompleto
  );

  const edad = obtenerEdad(
    formulario.fechaNacimiento
  );

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

  function handleFotografia() {
    setTipoMensaje("informacion");
    setMensaje(
      "La tabla ya admite avatar_url. Para subir fotografías falta definir un bucket de perfiles y sus políticas de Storage."
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

    const errorValidacion =
      validarFormulario(formulario);

    if (errorValidacion) {
      setTipoMensaje("error");
      setMensaje(errorValidacion);
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      const datosPerfil = {
        id: user.id,
        nombre_completo:
          formulario.nombreCompleto.trim(),
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
        avatar_url:
          formulario.avatarUrl.trim() || null,
        actualizado_en:
          new Date().toISOString(),
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
          telefono_emergencia,
          avatar_url
        `)
        .single();

      if (error) {
        throw error;
      }

      const { error: errorUsuario } =
        await supabase.auth.updateUser({
          data: {
            nombre_completo:
              data.nombre_completo,
            avatar_url:
              data.avatar_url || undefined,
          },
        });

      const datosActualizados = {
        nombreCompleto:
          data.nombre_completo || "",
        email: user.email || "",
        telefono: data.telefono || "",
        fechaNacimiento:
          data.fecha_nacimiento || "",
        tipoSangre:
          data.tipo_sangre || "",
        contactoEmergencia:
          data.contacto_emergencia || "",
        telefonoEmergencia:
          data.telefono_emergencia || "",
        avatarUrl:
          data.avatar_url || "",
      };

      setFormulario(datosActualizados);
      setFormularioInicial(datosActualizados);

      if (errorUsuario) {
        console.warn(
          "El perfil se guardó, pero no se actualizó el nombre en Auth:",
          errorUsuario
        );

        setTipoMensaje("advertencia");
        setMensaje(
          "El perfil se guardó, pero el nombre podría tardar en actualizarse en el encabezado."
        );
      } else {
        setTipoMensaje("exito");
        setMensaje(
          "El perfil se guardó correctamente."
        );
      }
    } catch (error) {
      console.error(
        "No fue posible guardar el perfil:",
        error
      );

      setTipoMensaje("error");
      setMensaje(
        obtenerMensajeErrorPerfil(
          error,
          "guardar"
        )
      );
    } finally {
      setGuardando(false);
    }
  }

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
              tipo={tipoMensaje}
              mensaje={mensaje}
              onCerrar={() => setMensaje("")}
            />
          )}

          {cargandoPerfil ? (
            <EstadoCarga />
          ) : errorCarga ? (
            <EstadoError
              mensaje={errorCarga}
              onReintentar={() =>
                setIntentoCarga(
                  (valorActual) =>
                    valorActual + 1
                )
              }
            />
          ) : (
            <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
              <aside className="space-y-6">
                <article className="rounded-[28px] border border-slate-100 bg-white p-7 text-center shadow-lg shadow-slate-200/40">
                  <div className="relative mx-auto w-fit">
                    {formulario.avatarUrl ? (
                      <img
                        src={formulario.avatarUrl}
                        alt="Fotografía de perfil"
                        className="h-28 w-28 rounded-[32px] object-cover shadow-xl shadow-blue-950/15"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-[#082b63] text-3xl font-bold text-white shadow-xl shadow-blue-950/15">
                        {iniciales}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={modoDemo}
                      onClick={handleFotografia}
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
                    Datos útiles para identificar
                    información importante rápidamente.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <DatoResumen
                      etiqueta="Tipo de sangre"
                      valor={
                        formulario.tipoSangre ||
                        "Sin registrar"
                      }
                    />

                    <DatoResumen
                      etiqueta="Edad"
                      valor={
                        edad !== null
                          ? `${edad} años`
                          : "Sin registrar"
                      }
                    />
                  </div>
                </article>

                <article className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <UsersRound size={21} />
                  </div>

                  <h3 className="mt-4 font-bold text-[#10254b]">
                    Contacto de emergencia
                  </h3>

                  <p className="mt-3 text-sm font-semibold text-[#10254b]">
                    {formulario.contactoEmergencia ||
                      "Sin registrar"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formulario.telefonoEmergencia ||
                      "Sin teléfono"}
                  </p>
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
                    Mantén actualizados tus datos personales,
                    médicos y de contacto.
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
                      value={
                        formulario.nombreCompleto
                      }
                      onChange={handleChange}
                      placeholder="Escribe tu nombre"
                      icono={
                        <UserRound size={19} />
                      }
                      required
                      maxLength={120}
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
                      maxLength={20}
                    />

                    <CampoFormulario
                      label="Fecha de nacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={
                        formulario.fechaNacimiento
                      }
                      onChange={handleChange}
                      icono={
                        <CalendarDays size={19} />
                      }
                      max={obtenerFechaActual()}
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
                          value={
                            formulario.tipoSangre
                          }
                          onChange={handleChange}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-[#10254b] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-70"
                        >
                          <option value="">
                            Seleccionar
                          </option>

                          {tiposSangre.map(
                            (tipo) => (
                              <option
                                key={tipo}
                                value={tipo}
                              >
                                {tipo}
                              </option>
                            )
                          )}
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
                        icono={
                          <UserRound size={19} />
                        }
                        maxLength={120}
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
                        icono={
                          <Phone size={19} />
                        }
                        maxLength={20}
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
                      modoDemo ||
                      guardando ||
                      !hayCambios
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#075dd6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {guardando ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={18} />
                    )}

                    {guardando
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

function MensajeEstado({
  tipo,
  mensaje,
  onCerrar,
}) {
  const configuraciones = {
    exito: {
      contenedor:
        "border-emerald-200 bg-emerald-50",
      texto: "text-emerald-700",
      boton: "text-emerald-600",
      icono: CheckCircle2,
    },
    error: {
      contenedor: "border-red-200 bg-red-50",
      texto: "text-red-700",
      boton: "text-red-600",
      icono: AlertCircle,
    },
    advertencia: {
      contenedor:
        "border-amber-200 bg-amber-50",
      texto: "text-amber-800",
      boton: "text-amber-600",
      icono: Info,
    },
    informacion: {
      contenedor: "border-blue-200 bg-blue-50",
      texto: "text-blue-700",
      boton: "text-blue-600",
      icono: Info,
    },
  };

  const configuracion =
    configuraciones[tipo] ||
    configuraciones.informacion;

  const Icono = configuracion.icono;

  return (
    <section
      role="status"
      className={[
        "mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4",
        configuracion.contenedor,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <Icono
          size={20}
          className={[
            "mt-0.5 shrink-0",
            configuracion.texto,
          ].join(" ")}
        />

        <p
          className={[
            "text-sm leading-6",
            configuracion.texto,
          ].join(" ")}
        >
          {mensaje}
        </p>
      </div>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar mensaje"
        className={[
          "shrink-0 transition hover:opacity-70",
          configuracion.boton,
        ].join(" ")}
      >
        <X size={19} />
      </button>
    </section>
  );
}

function DatoResumen({
  etiqueta,
  valor,
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {etiqueta}
      </p>

      <p className="mt-1 text-xl font-bold text-[#10254b]">
        {valor}
      </p>
    </div>
  );
}

function EstadoCarga() {
  return (
    <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-slate-100 bg-white px-6 text-center shadow-lg shadow-slate-200/40">
      <LoaderCircle
        size={36}
        className="animate-spin text-[#087ef5]"
      />

      <h2 className="mt-5 text-lg font-bold text-[#10254b]">
        Cargando perfil
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Estamos consultando tu información.
      </p>
    </section>
  );
}

function EstadoError({
  mensaje,
  onReintentar,
}) {
  return (
    <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-red-100 bg-white px-6 text-center shadow-lg shadow-slate-200/40">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-600">
        <AlertCircle size={30} />
      </div>

      <h2 className="mt-5 text-lg font-bold text-[#10254b]">
        No se pudo cargar el perfil
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {mensaje}
      </p>

      <button
        type="button"
        onClick={onReintentar}
        className="mt-5 flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#075dd6]"
      >
        <RefreshCw size={17} />
        Reintentar
      </button>
    </section>
  );
}

function validarFormulario(formulario) {
  const nombre =
    formulario.nombreCompleto.trim();

  if (!nombre) {
    return "El nombre completo es obligatorio.";
  }

  if (nombre.length < 3) {
    return "El nombre completo debe contener al menos 3 caracteres.";
  }

  if (
    formulario.fechaNacimiento &&
    formulario.fechaNacimiento >
      obtenerFechaActual()
  ) {
    return "La fecha de nacimiento no puede estar en el futuro.";
  }

  if (
    formulario.tipoSangre &&
    !tiposSangre.includes(
      formulario.tipoSangre
    )
  ) {
    return "El tipo de sangre seleccionado no es válido.";
  }

  if (
    formulario.telefono &&
    !esTelefonoValido(formulario.telefono)
  ) {
    return "El teléfono solo puede contener números, espacios, paréntesis, guiones y el signo +.";
  }

  if (
    formulario.telefonoEmergencia &&
    !esTelefonoValido(
      formulario.telefonoEmergencia
    )
  ) {
    return "El teléfono de emergencia no tiene un formato válido.";
  }

  return "";
}

function esTelefonoValido(telefono) {
  return /^[0-9+\-()\s]{7,20}$/.test(
    telefono.trim()
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

function obtenerEdad(fechaNacimiento) {
  if (!fechaNacimiento) {
    return null;
  }

  const nacimiento = new Date(
    `${fechaNacimiento}T12:00:00`
  );

  if (
    Number.isNaN(nacimiento.getTime()) ||
    nacimiento > new Date()
  ) {
    return null;
  }

  const hoy = new Date();
  let edad =
    hoy.getFullYear() -
    nacimiento.getFullYear();

  const diferenciaMes =
    hoy.getMonth() -
    nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (diferenciaMes === 0 &&
      hoy.getDate() <
        nacimiento.getDate())
  ) {
    edad -= 1;
  }

  return edad;
}

function obtenerFechaActual() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(
    hoy.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    hoy.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerMensajeErrorPerfil(
  error,
  accion
) {
  const mensaje =
    error?.message?.toLowerCase() || "";

  if (
    mensaje.includes("row-level security") ||
    mensaje.includes(
      "violates row-level security"
    )
  ) {
    return "No tienes permiso para administrar este perfil. Revisa las políticas RLS de la tabla perfiles.";
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
    mensaje.includes("failed to fetch") ||
    mensaje.includes("network")
  ) {
    return "No fue posible conectarse con Supabase. Revisa tu conexión e inténtalo nuevamente.";
  }

  return accion === "cargar"
    ? "No fue posible cargar la información del perfil."
    : "No fue posible guardar los cambios del perfil.";
}

export default PerfilPage;