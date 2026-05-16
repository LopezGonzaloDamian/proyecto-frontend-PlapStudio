import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBell, IconCalendar, IconCheck } from '../../components/LandingPage/Icons'
import AccessChoiceModal from '../../components/LandingPage/AccessChoiceModal'
import { login as loginApi } from '../../api/auth'
import { extraerError } from '../../api/client'
import { useSesion } from '../../customHooks/useSesion'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'

function LoginPanel({ onCrearCuenta }: { onCrearCuenta: () => void }) {
  const navigate = useNavigate()
  const { iniciar } = useSesion()
  const { toast, showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)

  const credencialesCompletas = email.trim().length > 0 && password.trim().length > 0
  const puedeIngresar = credencialesCompletas && !enviando

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!puedeIngresar) return

    setEnviando(true)
    try {
      const usuario = await loginApi({ email: email.trim(), password: password.trim() })
      iniciar(usuario)
      const destino = usuario.roles.includes('PROFESIONAL') ? '/profesional'
                    : usuario.roles.includes('ASISTENTE') ? '/asistente'
                    : '/cliente'
      navigate(destino)
    } catch (error) {
      showToast(extraerError(error), 'error')
      setEnviando(false)
    }
  }

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold text-texto-principal">Iniciar sesión en Agendify</h2>

      <form onSubmit={enviar} className="mt-8 grid gap-4">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo electrónico"
          className="w-full rounded-[22px] border border-borde bg-white px-5 py-4 text-base font-semibold text-texto-principal outline-none placeholder:text-texto-secundario focus:border-primario focus:ring-2 focus:ring-primario/20"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          type="password"
          className="w-full rounded-[22px] border border-borde bg-white px-5 py-4 text-base font-semibold text-texto-principal outline-none placeholder:text-texto-secundario focus:border-primario focus:ring-2 focus:ring-primario/20"
        />

        <div className={`mt-3 rounded-full ${puedeIngresar ? 'cursor-pointer' : enviando ? 'cursor-wait' : 'cursor-not-allowed'}`}>
          <button
            type="submit"
            disabled={!puedeIngresar}
            className={`w-full rounded-full px-5 py-4 text-base font-semibold text-white transition-all ${
              puedeIngresar
                ? 'bg-primario hover:bg-primario-hover'
                : 'pointer-events-none bg-[#78B5F7]'
            }`}
          >
            {enviando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </div>
      </form>

      <button
        type="button"
        className="mx-auto mt-7 block text-base font-semibold text-[#111827] hover:text-primario"
      >
        ¿Olvidaste tu contraseña?
      </button>

      <button
        type="button"
        onClick={onCrearCuenta}
        className="mt-16 w-full rounded-full border border-primario bg-white px-5 py-4 text-base font-semibold text-primario transition-colors hover:bg-primario-claro"
      >
        Crear cuenta nueva
      </button>

      <div id="toast-container">
        <Toast toast={toast} />
      </div>
    </section>
  )
}

function TurnoPreview() {
  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[600px]">
      <div className="absolute left-3 top-10 w-[270px] rounded-[2rem] border border-white/25 bg-white/15 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="h-2 w-24 rounded-full bg-white/70" />
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">Hoy</span>
        </div>
        <div className="mt-5 rounded-2xl bg-white p-4 text-texto-principal shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primario-claro text-2xl">✂</span>
            <div>
              <h3 className="font-black">Barberia Leo</h3>
              <p className="text-xs text-texto-secundario">Corte y barba</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {['10:00', '10:45', '11:30', '14:00', '15:30', '18:00'].map((hora, index) => (
              <span key={hora} className={`rounded-lg px-2 py-2 text-center text-xs font-bold ${index === 1 ? 'bg-primario text-white' : 'bg-fondo text-texto-secundario'}`}>
                {hora}
              </span>
            ))}
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primario px-4 py-3 text-sm font-black text-white">
            <IconCheck className="h-4 w-4" />
            Confirmar turno
          </button>
        </div>
      </div>

      <div className="absolute right-0 top-0 w-[300px] rounded-[2rem] bg-white p-5 text-texto-principal shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-texto-suave">Agenda</p>
            <h3 className="mt-1 text-xl font-black">Turnos de hoy</h3>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primario-claro text-primario">
            <IconCalendar className="h-6 w-6" />
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {[
            ['09:00', 'Ana Garcia', 'Nutricion'],
            ['11:30', 'Carlos Lopez', 'Barberia'],
            ['17:30', 'Lucia Peralta', 'Manicura'],
          ].map(([hora, cliente, servicio]) => (
            <div key={hora} className="rounded-lg border border-borde bg-fondo p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black">{hora}</span>
                <span className="rounded-full bg-confirmacion/10 px-2 py-1 text-[11px] font-bold text-confirmacion">Confirmado</span>
              </div>
              <p className="mt-2 text-sm font-bold">{cliente}</p>
              <p className="text-xs text-texto-secundario">{servicio}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-16 left-0 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-texto-principal shadow-xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-confirmacion/10 text-confirmacion">
          <IconCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-black">Turno confirmado</p>
          <p className="text-xs text-texto-secundario">Recordatorio enviado</p>
        </div>
      </div>

      <div className="absolute bottom-3 right-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-texto-principal shadow-xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primario-claro text-primario">
          <IconBell className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-black">Pago registrado</p>
          <p className="text-xs text-texto-secundario">Cobro mock aprobado</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false)

  return (
    <main className="h-screen overflow-hidden bg-white text-texto-principal">
      <div className="grid h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#111827] via-primario to-[#0F5EC7] px-6 py-8 text-white lg:px-6 xl:px-8">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                <IconCalendar className="h-7 w-7" />
              </span>
            </div>

            <div className="grid flex-1 items-start gap-8 py-10 xl:grid-cols-[0.75fr_1.25fr]">
              <div className="max-w-lg pt-24 xl:pt-32">
                <h1 className="max-w-md text-4xl font-bold leading-[1.14] tracking-normal text-white xl:text-5xl">
                  Organiza tu agenda,
                  <span className="block text-white/75">no tu caos.</span>
                </h1>
              </div>

              <div className="-mt-10 xl:-mt-16">
                <TurnoPreview />
              </div>
            </div>
          </div>
        </section>

        <section className="flex h-screen items-center justify-center border-l border-borde bg-white px-5 py-8 sm:px-8 xl:px-12">
          <div className="w-full max-w-xl translate-y-4 xl:translate-y-2">
            <LoginPanel onCrearCuenta={() => setModalRegistroAbierto(true)} />
          </div>
        </section>
      </div>

      {modalRegistroAbierto && (
        <AccessChoiceModal mode="registro" onClose={() => setModalRegistroAbierto(false)} />
      )}
    </main>
  )
}
