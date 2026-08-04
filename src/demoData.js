function obtenerFechaFutura(dias) {
  const fecha = new Date();

  fecha.setHours(12, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);

  return fecha.toISOString().slice(0, 10);
}

export const datosDemo = {
  citas: [
  {
    id: "demo-cita-1",
    especialista: "Dra. Ana López",
    especialidad: "Medicina general",
    fecha: obtenerFechaFutura(2),
    hora: "10:30",
    ubicacion: "Clínica Salud Integral",
  },
  {
    id: "demo-cita-2",
    especialista: "Dr. Carlos Ramírez",
    especialidad: "Cardiología",
    fecha: "2026-07-15",
    hora: "09:00",
    ubicacion: "Centro Médico del Norte",
  },
],

  medicamentos: [
    {
      id: "demo-medicamento-1",
      nombre: "Medicamento de ejemplo",
      dosis: "1 tableta",
      frecuencia: "Cada 24 horas",
      hora: "08:00",
      activo: true,
    },
    {
      id: "demo-medicamento-2",
      nombre: "Suplemento de ejemplo",
      dosis: "1 cápsula",
      frecuencia: "Cada 12 horas",
      hora: "20:00",
      activo: true,
    },
  ],

  estudios: [
  {
    id: "demo-estudio-1",
    nombre: "Biometría hemática",
    tipo: "Análisis de laboratorio",
    fecha: obtenerFechaFutura(5),
    hora: "08:30",
    institucion: "Laboratorio Salud Integral",
    estado: "Programado",
  },
  {
    id: "demo-estudio-2",
    nombre: "Radiografía de tórax",
    tipo: "Imagen diagnóstica",
    fecha: "2026-07-20",
    hora: "11:00",
    institucion: "Centro Médico del Norte",
    estado: "Completado",
    resultado:
      "El archivo de resultados está disponible para consulta.",
  },
],

  actividad: [
  {
    id: "demo-actividad-1",
    tipo: "medicamento",
    titulo: "Medicamento agregado",
    descripcion:
      "Se configuró un recordatorio para Paracetamol 500 mg.",
    fecha: obtenerFechaFutura(-1),
    hora: "08:05",
    estado: "Registrado",
  },
  {
    id: "demo-actividad-2",
    tipo: "cita",
    titulo: "Cita programada",
    descripcion:
      "Se programó una consulta de medicina general con la Dra. Ana López.",
    fecha: obtenerFechaFutura(-3),
    hora: "16:20",
    estado: "Programada",
  },
  {
    id: "demo-actividad-3",
    tipo: "estudio",
    titulo: "Estudio registrado",
    descripcion:
      "Se agregó una biometría hemática al calendario.",
    fecha: obtenerFechaFutura(-5),
    hora: "11:40",
    estado: "Pendiente",
  },
  {
    id: "demo-actividad-4",
    tipo: "estudio",
    titulo: "Resultado disponible",
    descripcion:
      "La radiografía de tórax fue marcada como completada.",
    fecha: obtenerFechaFutura(-8),
    hora: "13:15",
    estado: "Completado",
  },
],
};