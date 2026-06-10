const CATEGORIES = [
  { icon: '💈', label: 'Barbería' },
  { icon: '💅', label: 'Manicuría' },
  { icon: '✂️', label: 'Peluquería' },
  { icon: '🧖', label: 'Spa' },
  { icon: '💄', label: 'Maquillaje' },
  { icon: '🧴', label: 'Estética' },
  { icon: '💪', label: 'Personal Trainer' },
  { icon: '🦷', label: 'Odontología' },
  { icon: '🧘', label: 'Yoga / Pilates' },
  { icon: '👁️', label: 'Cejas & Pestañas' },
  { icon: '🏋️', label: 'Gimnasio' },
  { icon: '➕', label: 'Ver más' },
]

export default function BusinessCategoriesSection() {
  return (
    <section id="negocios" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primario text-sm font-semibold uppercase tracking-wider">Para todo tipo de negocio</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-texto-principal mt-2 tracking-tight">
            ¿Dónde querés reservar?
          </h2>
          <p className="text-texto-secundario mt-3 max-w-xl mx-auto">
            Conectamos clientes con los mejores profesionales de bienestar y cuidado personal.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {CATEGORIES.map(({ icon, label }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-borde hover:border-primario hover:bg-primario-claro transition-all group cursor-pointer"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
              <span className="text-xs font-medium text-texto-secundario group-hover:text-primario transition-colors text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
