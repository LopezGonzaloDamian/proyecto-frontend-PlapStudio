import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import AccessChoiceModal from '../../components/LandingPage/AccessChoiceModal'
import { IconCheck } from '../../components/LandingPage/Icons'
import { IconChatBack, IconChatChevron, IconChatClose, IconChatRefresh, IconChatSend } from '../../chatbot/ChatbotIcons'

function SectionEyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-borde bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-primario shadow-sm">
      {children}
    </span>
  )
}

function ImagePlaceholder({
  label,
  accent = 'blue',
  imageSrc,
}: {
  label: string
  accent?: 'blue' | 'gray'
  imageSrc?: string
}) {
  const accentClasses =
    accent === 'blue'
      ? 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_34%),linear-gradient(160deg,#1E5FD4,#4A9DFF)] border-white/20'
      : 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_34%),linear-gradient(160deg,#EEF2F7,#E3EAF3)] border-[#d8e1ee]'

  const textClasses = accent === 'blue' ? 'text-white/82' : 'text-texto-secundario'
  const panelClasses = accent === 'blue' ? 'bg-white/12 border-white/18' : 'bg-white/80 border-white'

  if (imageSrc) {
    return (
      <div className="relative flex min-h-[260px] items-center justify-center sm:min-h-[420px]">
        <div className="absolute inset-x-[10%] top-[8%] h-[78%] rounded-[36px] bg-primario/6 blur-3xl" />
        <img
          src={imageSrc}
          alt={label}
          className="relative z-[1] max-h-[540px] w-auto max-w-full object-contain drop-shadow-[0_34px_80px_rgba(20,33,61,0.16)]"
        />
      </div>
    )
  }

  return (
    <div className={`rounded-[26px] border p-3 shadow-[0_20px_48px_rgba(20,33,61,0.12)] sm:rounded-[34px] sm:p-5 sm:shadow-[0_28px_70px_rgba(20,33,61,0.14)] ${accentClasses}`}>
      <div className={`rounded-[22px] border border-dashed p-4 sm:rounded-[28px] sm:p-7 ${panelClasses}`}>
        <div className="flex min-h-[250px] flex-col justify-between rounded-[20px] bg-white/8 p-5 sm:min-h-[360px] sm:rounded-[24px] sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] sm:text-[11px] ${accent === 'blue' ? 'border-white/18 text-white/82' : 'border-borde text-texto-suave'}`}>
              Imagen futura
            </span>
            <span className={`font-card-body text-xs sm:text-sm ${textClasses}`}>{label}</span>
          </div>

          <div className="grid gap-4">
            <div className={`rounded-[22px] border p-4 sm:rounded-[24px] sm:p-5 ${panelClasses}`}>
              <p className={`font-card-title text-2xl font-black ${accent === 'blue' ? 'text-white' : 'text-texto-principal'}`}>Espacio reservado para diseño</p>
              <p className={`font-card-body mt-2 text-sm leading-6 sm:leading-7 ${textClasses}`}>
                Este bloque queda listo para sumar una imagen, un mockup o una composicion visual creada por vos.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`h-16 rounded-[16px] border sm:h-24 sm:rounded-[18px] ${panelClasses}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StaticChatbotShowcase() {
  const quickActions = [
    'Como crear una agenda',
    'Como agendar un turno',
    'Como buscar un profesional',
    'Como cancelar un turno',
    'Que puede hacer cada rol',
  ]

  return (
    <div className="relative flex min-h-[340px] items-center justify-center sm:min-h-[430px]">
      <div className="absolute inset-x-[12%] top-[10%] h-[72%] rounded-[36px] bg-primario/7 blur-3xl" />

      <div className="relative z-[1] w-full max-w-[360px] rounded-[26px] bg-white shadow-[0_22px_64px_rgba(20,33,61,0.14)] sm:rounded-[34px] sm:shadow-[0_28px_80px_rgba(20,33,61,0.16)]">
        <div className="flex items-center justify-between border-b border-borde px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <span className="text-texto-secundario">
              <IconChatBack />
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario text-white">
              <img src="/favicon.svg" alt="Agendify" className="h-5 w-5 object-contain brightness-[10]" />
            </div>
            <strong className="font-card-title text-[1.12rem] font-black text-texto-principal">Agendify Chatbot</strong>
          </div>

          <div className="flex items-center gap-3 text-texto-secundario">
            <IconChatRefresh />
            <IconChatClose />
          </div>
        </div>

          <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="max-w-[280px] rounded-[22px] rounded-bl-md bg-fondo px-4 py-3 shadow-sm">
            <p className="font-card-body text-sm leading-7 text-texto-principal sm:text-[15px] sm:leading-8">
              Hola, soy el chatbot de Agendify. En que puedo ayudarte?
            </p>
          </div>
          <p className="mt-2 px-1 font-card-body text-xs text-texto-secundario">
            Agendify Chatbot · Guia de ayuda · Ahora
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <span
                key={action}
                className="rounded-full border border-borde bg-white px-3 py-2 font-card-body text-xs font-medium text-texto-secundario shadow-sm"
              >
                {action}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-borde px-4 py-3 sm:px-5 sm:py-4">
          <div className="rounded-[22px] border-2 border-primario bg-white px-4 py-3 shadow-[0_8px_24px_rgba(21,112,255,0.08)]">
            <div className="flex items-center gap-3">
              <span className="font-card-body text-sm text-texto-secundario">Escribe un mensaje...</span>
              <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#56b6ff] text-white">
                <IconChatSend className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-5 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primario text-white shadow-[0_18px_42px_rgba(21,112,255,0.28)]">
          <IconChatChevron className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function FeatureSplit({
  id,
  eyebrow,
  title,
  description,
  bullets,
  imageSide,
  imageLabel,
  background = 'white',
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  imageSide: 'left' | 'right'
  imageLabel: string
  background?: 'white' | 'gray'
}) {
  const isGray = background === 'gray'
  const content = (
    <>
      <div>
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h2 className="font-hero mt-5 max-w-[760px] text-[1.95rem] font-extrabold leading-[1.08] text-texto-principal sm:mt-6 sm:text-[3rem] lg:text-[4rem]">
          {title}
        </h2>
        <p className="font-card-body mt-4 max-w-xl text-base leading-7 text-texto-secundario sm:mt-5 sm:text-[18px] sm:leading-8">
          {description}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-3 rounded-[18px] border border-borde bg-white px-4 py-3 shadow-sm sm:rounded-[20px] sm:py-4">
            <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primario-claro text-primario">
              <IconCheck className="h-4 w-4" />
            </span>
            <p className="font-card-body text-sm leading-6 text-texto-secundario sm:text-[15px] sm:leading-7">{bullet}</p>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <section id={id} className={`scroll-mt-28 ${isGray ? 'bg-fondo' : 'bg-white'}`}>
      <div className="mx-auto grid w-full max-w-[1380px] gap-8 px-5 py-12 sm:gap-10 sm:py-18 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-24">
        <div className={`${imageSide === 'left' ? 'lg:order-2' : 'lg:order-1'} order-1`}>{content}</div>
        <div className={`${imageSide === 'left' ? 'lg:order-1' : 'lg:order-2'} order-2`}>
          <ImagePlaceholder label={imageLabel} accent={isGray ? 'gray' : 'blue'} />
        </div>
      </div>
    </section>
  )
}

function CTASection({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-10 lg:px-8 lg:py-14">
        <div className="rounded-[36px] bg-[#123B6B] px-8 py-10 text-white shadow-[0_28px_70px_rgba(18,59,107,0.28)] lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12">
          <div className="max-w-3xl">
            <h3 className="font-card-title text-[2rem] font-black tracking-[-0.04em]">{title}</h3>
            <p className="font-card-body mt-3 text-[17px] leading-8 text-white/80">{description}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0 lg:justify-end">
            <Link to="/login" className="rounded-full border border-white/18 bg-white/10 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-white/14">
              Iniciar sesion
            </Link>
            <Link to="/landing?modal=registro" className="rounded-full bg-white px-6 py-3 text-sm font-black text-[#123B6B] transition-colors hover:bg-[#eef5ff]">
              Registrarse gratis
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function ToolCard({
  id,
  title,
  description,
  imageSide,
  imageSrc,
  renderVisual,
}: {
  id: string
  title: string
  description: string
  imageSide: 'left' | 'right'
  imageSrc?: string
  renderVisual?: React.ReactNode
}) {
  const image = renderVisual ?? <ImagePlaceholder label={title} accent="gray" imageSrc={imageSrc} />
  const text = (
    <div>
      <h3 className="font-hero text-[2rem] font-extrabold leading-[1.08] text-texto-principal sm:text-[2.5rem] lg:text-[3.35rem]">
        {title}
      </h3>
      <p className="font-card-body mt-4 max-w-xl text-base leading-7 text-texto-secundario sm:mt-5 sm:text-[18px] sm:leading-8">
        {description}
      </p>
    </div>
  )

  return (
    <div id={id} className="scroll-mt-28 grid gap-8 sm:gap-10 lg:grid-cols-[0.95fr_1.05fr]">
      <div className={`${imageSide === 'left' ? 'lg:order-2' : 'lg:order-1'} order-1`}>{text}</div>
      <div className={`${imageSide === 'left' ? 'lg:order-1' : 'lg:order-2'} order-2`}>{image}</div>
    </div>
  )
}

function RoleCard({
  title,
  subtitle,
  cta,
  features,
}: {
  title: string
  subtitle: string
  cta: string
  features: string[]
}) {
  return (
    <article className="rounded-[26px] border border-borde bg-white p-6 shadow-sm sm:rounded-[30px] sm:p-7">
      <h3 className="font-card-title text-[1.7rem] font-black leading-tight text-texto-principal sm:text-[2rem]">{title}</h3>
      <p className="font-card-body mt-2 text-[15px] leading-7 text-texto-secundario">{subtitle}</p>

      <div className="mt-8">
        <p className="font-card-title text-[1.75rem] font-black leading-tight text-texto-principal sm:text-[2.1rem]">{cta}</p>
      </div>

      <Link to="/landing?modal=registro" className="mt-8 inline-flex w-full items-center justify-center rounded-[16px] bg-primario px-5 py-4 text-base font-black text-white transition-colors hover:bg-primario-hover">
        Comenzar
      </Link>

      <div className="mt-8">
        <p className="font-card-body text-sm font-bold text-texto-secundario">Ventajas destacadas:</p>
        <div className="mt-4 grid gap-4">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <span className="mt-1 text-primario">✓</span>
              <p className="font-card-body text-[15px] leading-7 text-texto-principal">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function LandingPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(searchParams.get('modal') === 'registro')

  useEffect(() => {
    setModalRegistroAbierto(searchParams.get('modal') === 'registro')
  }, [searchParams])

  useEffect(() => {
    if (!location.hash) return

    const targetId = location.hash.replace('#', '')
    const timeoutId = window.setTimeout(() => {
      const section = document.getElementById(targetId)
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)

    return () => window.clearTimeout(timeoutId)
  }, [location.hash])

  const cerrarModal = () => {
    setModalRegistroAbierto(false)
    if (searchParams.get('modal')) {
      const next = new URLSearchParams(searchParams)
      next.delete('modal')
      setSearchParams(next, { replace: true })
    }
  }

  const abrirModal = () => {
    setModalRegistroAbierto(true)
    const next = new URLSearchParams(searchParams)
    next.set('modal', 'registro')
    setSearchParams(next, { replace: true })
  }

  return (
    <main className="bg-white text-texto-principal">
      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_26%),linear-gradient(135deg,#173B70_0%,#176BFF_62%,#4A9DFF_100%)] text-white">
        <div className="mx-auto grid w-full max-w-[1380px] gap-10 px-5 py-12 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-22">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/8 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur-md">
              Agendify
            </span>
            <h1 className="font-hero mt-6 max-w-[620px] text-[2.15rem] font-extrabold leading-[1.08] text-white sm:mt-7 sm:text-[4.4rem] sm:leading-[1.04] lg:text-[5.4rem]">
              Organiza reservas y agendas con una experiencia simple.
            </h1>
            <p className="font-card-body mt-4 max-w-xl text-base leading-7 text-white/82 sm:mt-6 sm:text-[18px] sm:leading-8">
              Agendify te ayuda a reservar turnos, gestionar disponibilidad, sumar asistentes y mantener la comunicacion ordenada con cada cliente.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 sm:mt-9">
              <button onClick={abrirModal} className="rounded-full bg-white px-6 py-3 text-sm font-black text-primario transition-colors hover:bg-[#eef5ff]">
                Comenzar gratis
              </button>
              <a href="#reservas-turnos" className="rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-white/10">
                Ver como funciona
              </a>
            </div>
          </div>

          <ImagePlaceholder label="Visual principal de Agendify" accent="blue" />
        </div>
      </section>

      <FeatureSplit
        id="reservas-turnos"
        eyebrow="Producto"
        title="Reserva tu proximo turno"
        description="Desde Agendify los clientes pueden encontrar rapidamente a sus profesionales, revisar horarios disponibles y resolver su reserva en pocos pasos."
        bullets={[
          'Encuentra profesionales desde un entorno claro y ordenado.',
          'Consulta disponibilidad sin tener que escribir mensajes manuales.',
          'Confirma un turno desde una experiencia pensada para convertir mejor.',
        ]}
        imageSide="right"
        imageLabel="Reserva de turnos"
        background="white"
      />

      <FeatureSplit
        id="gestion-agenda"
        eyebrow="Producto"
        title="Atiende a tu proximo cliente"
        description="La agenda del profesional se vuelve mas clara y controlable. Puedes organizar turnos, visualizar tu disponibilidad y tener una operacion diaria mucho mas prolija."
        bullets={[
          'Configura horarios y bloques de disponibilidad por agenda.',
          'Visualiza los proximos turnos y administra cambios con mas contexto.',
          'Mantiene un flujo ordenado para atender mejor a cada cliente.',
        ]}
        imageSide="left"
        imageLabel="Gestion de agenda"
        background="gray"
      />

      <FeatureSplit
        id="asociacion-asistente"
        eyebrow="Producto"
        title="Delega la gestion de turnos a un asistente"
        description="Si necesitas ayuda operativa, Agendify te permite asociar a un asistente para que gestione turnos y acompañe el trabajo diario sin perder control."
        bullets={[
          'Asocia una persona de confianza para ayudarte con la operacion.',
          'Centraliza cambios, seguimiento y coordinacion desde el mismo sistema.',
          'Mantiene separados los roles para trabajar mejor en equipo.',
        ]}
        imageSide="right"
        imageLabel="Asociacion de asistente"
        background="white"
      />

      <CTASection
        title="Empieza con tu cuenta y adapta el flujo a tu forma de trabajar"
        description="Tanto si reservas como si administras agendas, puedes ingresar o registrarte en cualquier momento sin salir del recorrido de la landing."
      />

      <section className="bg-fondo">
        <div className="mx-auto w-full max-w-[1380px] px-5 py-12 sm:py-18 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <SectionEyebrow>Herramientas integradas</SectionEyebrow>
            <h2 className="font-hero mt-5 max-w-[920px] text-[1.95rem] font-extrabold leading-[1.08] text-texto-principal sm:mt-6 sm:text-[3rem] sm:leading-[1.05] lg:text-[4rem]">
              Complementa la experiencia con herramientas pensadas para acompanar el uso diario.
            </h2>
          </div>

          <div className="mt-10 grid gap-12 sm:mt-14 sm:gap-18">
            <ToolCard
              id="notificaciones"
              title="Notificaciones"
              description="Agendify puede enviar recordatorios, avisos y confirmaciones para que cada turno tenga mejor seguimiento y menos friccion operativa."
              imageSide="right"
            />

            <ToolCard
              id="chatbot-agendify"
              title="Chatbot Agendify"
              description="El chatbot ayuda a entender funcionalidades, resolver dudas frecuentes y orientar el uso general de la plataforma desde una conversacion clara."
              imageSide="left"
              renderVisual={<StaticChatbotShowcase />}
            />
          </div>
        </div>
      </section>

      <section id="soluciones" className="scroll-mt-28 bg-white">
        <div className="mx-auto w-full max-w-[1380px] px-5 py-12 sm:py-18 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <SectionEyebrow>Soluciones</SectionEyebrow>
            <h2 className="font-hero mt-5 max-w-[920px] text-[1.95rem] font-extrabold leading-[1.08] text-texto-principal sm:mt-6 sm:text-[3rem] sm:leading-[1.05] lg:text-[4rem]">
              Elige el rol que mejor se adapta a tu forma de usar Agendify.
            </h2>
            <p className="font-card-body mt-4 max-w-2xl text-base leading-7 text-texto-secundario sm:mt-5 sm:text-[18px] sm:leading-8">
              Cada perfil tiene ventajas distintas. La idea es que la landing lo muestre de forma simple, comparativa y clara.
            </p>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-3">
            <div id="solucion-cliente" className="scroll-mt-28">
              <RoleCard
                title="Cliente"
                subtitle="Para personas que buscan profesionales y quieren reservar de forma simple."
                cta="Reserva facil"
                features={[
                  'Encuentra profesionales desde un solo lugar.',
                  'Consulta horarios y disponibilidad en pocos pasos.',
                  'Gestiona tus proximos turnos desde tu cuenta.',
                ]}
              />
            </div>

            <div id="solucion-profesional" className="scroll-mt-28">
              <RoleCard
                title="Profesional"
                subtitle="Para quienes necesitan organizar su agenda y centralizar la atencion."
                cta="Agenda clara"
                features={[
                  'Crea y administra una agenda propia.',
                  'Organiza reservas, estados y disponibilidad.',
                  'Visualiza clientes y cobros desde el mismo entorno.',
                ]}
              />
            </div>

            <div id="solucion-asistente" className="scroll-mt-28">
              <RoleCard
                title="Asistente"
                subtitle="Para colaborar en la operacion y la gestion diaria de turnos."
                cta="Soporte real"
                features={[
                  'Ayuda a mover turnos y administrar cambios.',
                  'Trabaja junto al profesional dentro del sistema.',
                  'Acompana la operacion diaria con permisos definidos.',
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {modalRegistroAbierto ? (
        <AccessChoiceModal mode="registro" onClose={cerrarModal} />
      ) : null}
    </main>
  )
}
