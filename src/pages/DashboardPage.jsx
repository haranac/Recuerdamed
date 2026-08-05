import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  FlaskConical,
  Info,
  LoaderCircle,
  Pill,
  RefreshCw,
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { datosDemo } from "../demoData";
import { supabase } from "../lib/supabase";

function DashboardPage() {
  const { user, modoDemo } = useAuth();

  const [citas, setCitas] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [estudios, setEstudios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [intentoCarga, setIntentoCarga] = useState(0);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarDashboard() {
      setCargando(true);
      setErrorCarga("");

      if (modoDemo) {
        if (componenteActivo) {
          setCitas(datosDemo.citas ?? []);
          setMedicamentos(
            datosDemo.medicamentos ?? []
          );
          setEstudios(datosDemo.estudios ?? []);
          setCargando(false);
        }

        return;
      }

      if (!user?.id) {
        if (componenteActivo) {
          setErrorCarga(
            "No se encontró una sesión válida."
          );
          setCargando(false);
        }

        return;
      }

      try {
        const [
          respuestaCitas,
          respuestaMedicamentos,
          respuestaEstudios,
        ] = await Promise.all([
          supabase
            .from("citas")
            .select(`
              id,
              tipo,
              especialista,
              especialidad,
              ubicacion,
              fecha,
              hora,
              motivo,
              created_at,
              actualizado_en
            `)
            .eq("user_id", user.id)
            .order("fecha", {
              ascending: true,
            })
            .order("hora", {
              ascending: true,
            }),

          supabase
            .from("medicamentos")
            .select(`
              id,
              nombre,
              dosis,
              tipo,
              unidad,
              frecuencia,
              hora,
              fecha_inicio,
              fecha_fin,
              indicaciones,
              activo,
              tomado,
              created_at,
              actualizado_en
            `)
            .eq("user_id", user.id)
            .order("hora", {
              ascending: true,
            }),

          supabase
            .from("estudios")
            .select(`
              id,
              nombre,
              tipo,
              institucion,
              estado,
              fecha,
              hora,
              resultado,
              descripcion,
              created_at,
              actualizado_en
            `)
            .eq("user_id", user.id)
            .order("fecha", {
              ascending: true,
            }),
        ]);

        if (respuestaCitas.error) {
          throw respuestaCitas.error;
        }

        if (respuestaMedicamentos.error) {
          throw respuestaMedicamentos.error;
        }

        if (respuestaEstudios.error) {
          throw respuestaEstudios.error;
        }

        if (componenteActivo) {
          setCitas(respuestaCitas.data ?? []);
          setMedicamentos(
            respuestaMedicamentos.data ?? []
          );
          setEstudios(
            respuestaEstudios.data ?? []
          );
        }
      } catch (error) {
        console.error(
          "No fue posible cargar el inicio:",
          error
        );

        if (componenteActivo) {
          setErrorCarga(
            obtenerMensajeError(error)
          );
        }
      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    }

    cargarDashboard();

    return () => {
      componenteActivo = false;
    };
  }, [
    intentoCarga,
    modoDemo,
    user?.id,
  ]);

  const citasProximas = useMemo(
    () =>
      citas
        .filter((cita) =>
          esFechaFutura(
            cita.fecha,
            cita.hora
          )
        )
        .sort(
          (a, b) =>
            obtenerFechaHora(
              a.fecha,
              a.hora
            ) -
            obtenerFechaHora(
              b.fecha,
              b.hora
            )
        ),
    [citas]
  );

  const medicamentosActivos = useMemo(
    () =>
      medicamentos.filter(
        (medicamento) =>
          medicamento.activo !== false &&
          tratamientoVigente(medicamento)
      ),
    [medicamentos]
  );

  const estudiosPendientes = useMemo(
    () =>
      estudios
        .filter(
          (estudio) =>
            normalizarTexto(
              estudio.estado
            ) === "programado"
        )
        .sort(
          (a, b) =>
            obtenerFechaHora(
              a.fecha,
              a.hora || "12:00"
            ) -
            obtenerFechaHora(
              b.fecha,
              b.hora || "12:00"
            )
        ),
    [estudios]
  );

  const actividad = useMemo(() => {
    if (modoDemo) {
      return (
        datosDemo.actividad ?? []
      ).slice(0, 6);
    }

    const registrosCitas = citas.map(
      (cita) => ({
        id: `cita-${cita.id}`,
        tipo: "cita",
        titulo:
          cita.especialidad ||
          "Cita médica",
        descripcion: [
          cita.especialista,
          cita.ubicacion,
        ]
          .filter(Boolean)
          .join(" · "),
        fechaActividad:
          cita.actualizado_en ||
          cita.created_at ||
          combinarFechaHora(
            cita.fecha,
            cita.hora
          ),
      })
    );

    const registrosMedicamentos =
      medicamentos.map(
        (medicamento) => ({
          id: `medicamento-${medicamento.id}`,
          tipo: "medicamento",
          titulo:
            medicamento.nombre ||
            "Medicamento",
          descripcion: [
            formatearDosis(
              medicamento
            ),
            medicamento.frecuencia,
          ]
            .filter(Boolean)
            .join(" · "),
          fechaActividad:
            medicamento.actualizado_en ||
            medicamento.created_at,
        })
      );

    const registrosEstudios = estudios.map(
      (estudio) => ({
        id: `estudio-${estudio.id}`,
        tipo: "estudio",
        titulo:
          estudio.nombre ||
          "Estudio médico",
        descripcion: [
          estudio.tipo,
          estudio.institucion,
          capitalizar(estudio.estado),
        ]
          .filter(Boolean)
          .join(" · "),
        fechaActividad:
          estudio.actualizado_en ||
          estudio.created_at ||
          combinarFechaHora(
            estudio.fecha,
            estudio.hora || "12:00"
          ),
      })
    );

    return [
      ...registrosCitas,
      ...registrosMedicamentos,
      ...registrosEstudios,
    ]
      .filter(
        (registro) =>
          registro.fechaActividad
      )
      .sort(
        (a, b) =>
          new Date(
            b.fechaActividad
          ).getTime() -
          new Date(
            a.fechaActividad
          ).getTime()
      )
      .slice(0, 6);
  }, [
    citas,
    estudios,
    medicamentos,
    modoDemo,
  ]);

  const proximaCita =
    citasProximas[0] ?? null;

  const proximoEstudio =
    estudiosPendientes[0] ?? null;

  const proximoMedicamento =
    useMemo(
      () =>
        obtenerProximoMedicamento(
          medicamentosActivos
        ),
      [medicamentosActivos]
    );

  const proximoRecordatorio = useMemo(
    () =>
      obtenerProximoRecordatorio({
        proximaCita,
        proximoEstudio,
        proximoMedicamento,
      }),
    [
      proximaCita,
      proximoEstudio,
      proximoMedicamento,
    ]
  );

  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          {modoDemo && (
            <div className="mb-6 flex flex-col justify-between gap-3 rounded-[22px] border border-blue-100 bg-[#eaf6ff] px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Info
                  size={21}
                  className="mt-0.5 shrink-0 text-[#087ef5]"
                />

                <div>
                  <p className="font-bold text-[#10254b]">
                    Estás explorando RecuerdaMed
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Los datos visibles son ejemplos y no se
                    guardará ninguna modificación.
                  </p>
                </div>
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

          {cargando ? (
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
            <>
              <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <TarjetaResumen
                  titulo="Próximas citas"
                  cantidad={
                    citasProximas.length
                  }
                  descripcion={
                    proximaCita
                      ? `${proximaCita.especialidad} · ${formatearFecha(proximaCita.fecha)}`
                      : "No tienes citas programadas"
                  }
                  icono={
                    <CalendarDays
                      size={24}
                    />
                  }
                  fondoIcono="bg-[#eaf6ff]"
                  colorIcono="text-[#087ef5]"
                />

                <TarjetaResumen
                  titulo="Medicamentos activos"
                  cantidad={
                    medicamentosActivos.length
                  }
                  descripcion={
                    proximoMedicamento
                      ? `Próxima toma ${formatearMomentoRecordatorio(
                          proximoMedicamento.fechaHora
                        )}`
                      : "No hay tratamientos activos"
                  }
                  icono={<Pill size={24} />}
                  fondoIcono="bg-[#ddf8ee]"
                  colorIcono="text-emerald-600"
                />

                <TarjetaResumen
                  titulo="Estudios pendientes"
                  cantidad={
                    estudiosPendientes.length
                  }
                  descripcion={
                    proximoEstudio
                      ? `${proximoEstudio.nombre} · ${formatearFecha(proximoEstudio.fecha)}`
                      : "No tienes estudios programados"
                  }
                  icono={
                    <FlaskConical
                      size={24}
                    />
                  }
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
                    Tus últimos registros y modificaciones.
                  </p>

                  {actividad.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      {actividad.map(
                        (registro) => (
                          <ActividadItem
                            key={
                              registro.id
                            }
                            registro={
                              registro
                            }
                          />
                        )
                      )}
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

                  {proximoRecordatorio ? (
                    <RecordatorioPrincipal
                      recordatorio={
                        proximoRecordatorio
                      }
                    />
                  ) : (
                    <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl bg-[#eaf6ff] px-6 text-center">
                      <p className="text-sm leading-6 text-slate-500">
                        Agrega un medicamento, una cita o un
                        estudio para comenzar a organizar tus
                        próximas actividades.
                      </p>
                    </div>
                  )}

                  {proximaCita &&
                    proximoRecordatorio?.tipo !==
                      "cita" && (
                      <div className="mt-4 rounded-[22px] border border-slate-100 p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Próxima cita
                        </p>

                        <p className="mt-2 font-bold text-[#10254b]">
                          {
                            proximaCita.especialista
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            proximaCita.especialidad
                          }
                        </p>

                        <p className="mt-3 text-sm font-semibold text-[#087ef5]">
                          {formatearFecha(
                            proximaCita.fecha
                          )}{" "}
                          ·{" "}
                          {normalizarHora(
                            proximaCita.hora
                          )}
                        </p>
                      </div>
                    )}
                </article>
              </section>
            </>
          )}
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

function ActividadItem({
  registro,
}) {
  const configuracion = {
    medicamento: {
      icono: <Pill size={19} />,
      clases:
        "bg-emerald-50 text-emerald-600",
    },
    cita: {
      icono: (
        <CalendarDays size={19} />
      ),
      clases: "bg-blue-50 text-blue-600",
    },
    estudio: {
      icono: (
        <FlaskConical size={19} />
      ),
      clases:
        "bg-violet-50 text-violet-600",
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

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#10254b]">
          {registro.titulo}
        </p>

        {registro.descripcion && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {registro.descripcion}
          </p>
        )}

        {registro.fechaActividad && (
          <p className="mt-2 text-xs font-medium text-slate-400">
            {formatearFechaActividad(
              registro.fechaActividad
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function RecordatorioPrincipal({
  recordatorio,
}) {
  const configuraciones = {
    medicamento: {
      icono: Pill,
      clases:
        "bg-emerald-50 text-emerald-600",
      fondo: "bg-emerald-50/70",
      etiqueta: "Medicamento",
    },
    cita: {
      icono: CalendarDays,
      clases: "bg-white text-[#087ef5]",
      fondo: "bg-[#eaf6ff]",
      etiqueta: "Cita",
    },
    estudio: {
      icono: FlaskConical,
      clases:
        "bg-white text-violet-600",
      fondo: "bg-violet-50",
      etiqueta: "Estudio",
    },
  };

  const configuracion =
    configuraciones[
      recordatorio.tipo
    ];

  const Icono =
    configuracion.icono;

  return (
    <div
      className={`mt-6 rounded-[22px] p-5 ${configuracion.fondo}`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${configuracion.clases}`}
      >
        <Icono size={22} />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        {configuracion.etiqueta}
      </p>

      <p className="mt-2 font-bold text-[#10254b]">
        {recordatorio.titulo}
      </p>

      {recordatorio.descripcion && (
        <p className="mt-1 text-sm text-slate-500">
          {recordatorio.descripcion}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#087ef5]">
        <Clock3 size={17} />
        {formatearMomentoRecordatorio(
          recordatorio.fechaHora
        )}
      </div>
    </div>
  );
}

function EstadoCarga() {
  return (
    <section className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-slate-100 bg-white px-6 text-center shadow-lg shadow-slate-200/40">
      <LoaderCircle
        size={36}
        className="animate-spin text-[#087ef5]"
      />

      <h2 className="mt-5 text-lg font-bold text-[#10254b]">
        Cargando tu información
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Estamos consultando tus citas, medicamentos y
        estudios.
      </p>
    </section>
  );
}

function EstadoError({
  mensaje,
  onReintentar,
}) {
  return (
    <section className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-red-100 bg-white px-6 text-center shadow-lg shadow-slate-200/40">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-600">
        <AlertCircle size={30} />
      </div>

      <h2 className="mt-5 text-lg font-bold text-[#10254b]">
        No se pudo cargar el inicio
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

function obtenerProximoMedicamento(
  medicamentos
) {
  if (!medicamentos.length) {
    return null;
  }

  const ahora = new Date();

  const opciones = medicamentos
    .filter(
      (medicamento) =>
        medicamento.hora
    )
    .map((medicamento) => {
      const [hora, minuto] =
        normalizarHora(
          medicamento.hora
        )
          .split(":")
          .map(Number);

      const fechaHora = new Date(ahora);
      fechaHora.setHours(
        hora,
        minuto,
        0,
        0
      );

      if (
        fechaHora.getTime() <
        ahora.getTime()
      ) {
        fechaHora.setDate(
          fechaHora.getDate() + 1
        );
      }

      return {
        ...medicamento,
        fechaHora,
      };
    })
    .sort(
      (a, b) =>
        a.fechaHora - b.fechaHora
    );

  return opciones[0] ?? null;
}

function obtenerProximoRecordatorio({
  proximaCita,
  proximoEstudio,
  proximoMedicamento,
}) {
  const opciones = [];

  if (proximoMedicamento) {
    opciones.push({
      tipo: "medicamento",
      titulo:
        proximoMedicamento.nombre,
      descripcion: [
        formatearDosis(
          proximoMedicamento
        ),
        proximoMedicamento.frecuencia,
      ]
        .filter(Boolean)
        .join(" · "),
      fechaHora:
        proximoMedicamento.fechaHora,
    });
  }

  if (proximaCita) {
    opciones.push({
      tipo: "cita",
      titulo:
        proximaCita.especialista ||
        "Cita médica",
      descripcion:
        proximaCita.especialidad,
      fechaHora: obtenerFechaHora(
        proximaCita.fecha,
        proximaCita.hora
      ),
    });
  }

  if (proximoEstudio) {
    opciones.push({
      tipo: "estudio",
      titulo:
        proximoEstudio.nombre ||
        "Estudio médico",
      descripcion: [
        proximoEstudio.tipo,
        proximoEstudio.institucion,
      ]
        .filter(Boolean)
        .join(" · "),
      fechaHora: obtenerFechaHora(
        proximoEstudio.fecha,
        proximoEstudio.hora ||
          "12:00"
      ),
    });
  }

  return (
    opciones.sort(
      (a, b) =>
        a.fechaHora - b.fechaHora
    )[0] ?? null
  );
}

function tratamientoVigente(
  medicamento
) {
  const hoy =
    obtenerFechaLocal(new Date());

  if (
    medicamento.fecha_inicio &&
    medicamento.fecha_inicio > hoy
  ) {
    return false;
  }

  if (
    medicamento.fecha_fin &&
    medicamento.fecha_fin < hoy
  ) {
    return false;
  }

  return true;
}

function esFechaFutura(
  fecha,
  hora
) {
  return (
    obtenerFechaHora(
      fecha,
      hora
    ).getTime() >= Date.now()
  );
}

function obtenerFechaHora(
  fecha,
  hora = "00:00"
) {
  if (!fecha) {
    return new Date(0);
  }

  return new Date(
    `${fecha}T${normalizarHora(
      hora
    )}:00`
  );
}

function combinarFechaHora(
  fecha,
  hora
) {
  if (!fecha) {
    return null;
  }

  return `${fecha}T${normalizarHora(
    hora || "00:00"
  )}:00`;
}

function formatearDosis(
  medicamento
) {
  const dosis =
    medicamento?.dosis || "";

  const unidad =
    medicamento?.unidad || "";

  return [dosis, unidad]
    .filter(Boolean)
    .join(" ");
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
    }
  ).format(
    new Date(`${fecha}T12:00:00`)
  );
}

function formatearFechaActividad(
  fecha
) {
  const fechaActividad =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaActividad.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(fechaActividad);
}

function formatearMomentoRecordatorio(
  fecha
) {
  if (!fecha) {
    return "";
  }

  const fechaRecordatorio =
    new Date(fecha);

  const hoy =
    obtenerFechaLocal(new Date());

  const mananaFecha = new Date();
  mananaFecha.setDate(
    mananaFecha.getDate() + 1
  );

  const manana =
    obtenerFechaLocal(mananaFecha);

  const fechaLocal =
    obtenerFechaLocal(
      fechaRecordatorio
    );

  const hora =
    new Intl.DateTimeFormat(
      "es-MX",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    ).format(fechaRecordatorio);

  if (fechaLocal === hoy) {
    return `hoy a las ${hora}`;
  }

  if (fechaLocal === manana) {
    return `mañana a las ${hora}`;
  }

  const fechaTexto =
    new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "numeric",
        month: "short",
      }
    ).format(fechaRecordatorio);

  return `${fechaTexto} a las ${hora}`;
}

function obtenerFechaLocal(fecha) {
  const anio =
    fecha.getFullYear();
  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function normalizarHora(
  hora = ""
) {
  return String(hora)
    .slice(0, 5)
    .padStart(5, "0");
}

function normalizarTexto(
  texto = ""
) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function capitalizar(
  texto = ""
) {
  if (!texto) {
    return "";
  }

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}

function obtenerMensajeError(
  error
) {
  const mensaje =
    error?.message?.toLowerCase() ||
    "";

  if (
    mensaje.includes(
      "row-level security"
    ) ||
    mensaje.includes(
      "permission denied"
    )
  ) {
    return "No tienes permiso para consultar esta información. Revisa las políticas RLS de citas, medicamentos y estudios.";
  }

  if (
    mensaje.includes(
      "failed to fetch"
    ) ||
    mensaje.includes("network")
  ) {
    return "No fue posible conectarse con Supabase. Revisa tu conexión e inténtalo nuevamente.";
  }

  if (
    mensaje.includes(
      "column"
    ) &&
    mensaje.includes(
      "does not exist"
    )
  ) {
    return "La estructura de alguna tabla no coincide con el Dashboard. Revisa que las migraciones de citas, medicamentos y estudios estén aplicadas.";
  }

  return "No fue posible consultar la información del inicio.";
}

export default DashboardPage;