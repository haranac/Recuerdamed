import { Construction } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function PlaceholderPage({
  titulo,
  descripcion,
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f9ff]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header
          titulo={titulo}
          descripcion={descripcion}
        />

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          <section className="flex min-h-[500px] flex-col items-center justify-center rounded-[30px] border border-dashed border-slate-200 bg-white px-6 text-center shadow-lg shadow-slate-200/30">
            <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#eaf6ff] text-[#087ef5]">
              <Construction size={36} />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-[#10254b]">
              {titulo} está en construcción
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              Esta sección se desarrollará en las
              siguientes etapas de RecuerdaMed V2.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default PlaceholderPage;