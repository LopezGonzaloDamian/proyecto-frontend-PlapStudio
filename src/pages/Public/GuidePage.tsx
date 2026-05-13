import { downloadGuide } from '../../lib/pdf/guides'

const cards = [
  {
    key: 'cliente' as const,
    title: 'Descargar Guia de uso rol Cliente (.pdf)',
    role: 'Cliente',
    accent: 'from-[#DCEBFF] to-[#BFD8FF]',
    icon: 'C',
  },
  {
    key: 'profesional' as const,
    title: 'Descargar Guia de uso rol Profesional (.pdf)',
    role: 'Profesional',
    accent: 'from-[#E3F8EE] to-[#BFE9D3]',
    icon: 'P',
  },
  {
    key: 'asistente' as const,
    title: 'Descargar Guia de uso rol Asistente (.pdf)',
    role: 'Asistente',
    accent: 'from-[#F4E7FF] to-[#DAC4FF]',
    icon: 'A',
  },
]

export default function GuidePage() {
  return (
    <main className="mx-auto w-full max-w-[1320px] px-5 py-14 lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <span className="inline-flex rounded-full bg-fondo px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-primario">Guia de uso</span>
        <h1 className="font-hero mt-5 max-w-[760px] text-[2.45rem] font-extrabold leading-[1.06] text-texto-principal lg:text-[3rem]">
          Descargas rapidas para cada rol
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] leading-8 text-texto-secundario">
          Accede a una guia breve para cada perfil de Agendify y comparte el material con quien lo necesite.
        </p>
      </div>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.key} className="flex h-full flex-col rounded-[26px] border border-borde bg-white p-5 shadow-sm">
            <p className="text-sm font-bold leading-6 text-texto-secundario">{card.title}</p>
            <button
              type="button"
              onClick={() => downloadGuide(card.key)}
              className="mt-4 flex h-full min-h-[250px] flex-col overflow-hidden rounded-[22px] border border-borde bg-fondo text-left transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`flex min-h-[152px] items-center justify-center bg-gradient-to-br ${card.accent}`}>
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/80 text-4xl font-black text-texto-principal shadow-sm">
                  {card.icon}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div>
                  <p className="text-[1.15rem] font-black text-texto-principal">{card.role}</p>
                  <p className="mt-1 text-sm text-texto-secundario">Manual en PDF listo para descargar</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primario text-xl text-white shadow-sm">
                  ↓
                </span>
              </div>
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}
