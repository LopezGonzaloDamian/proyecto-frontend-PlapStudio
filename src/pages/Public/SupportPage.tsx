import { useState, type FormEvent } from 'react'
import { BotonPrimario, Input, Label, Textarea } from '../../components/common/ui'

export default function SupportPage() {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const canSubmit = email.trim().length > 0 && subject.trim().length > 0 && description.trim().length > 0

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const mailto = new URL('mailto:soporte@agendify.app')
    mailto.searchParams.set('subject', subject.trim())
    mailto.searchParams.set(
      'body',
      `Email de contacto: ${email.trim()}\n\nDescripcion:\n${description.trim()}`,
    )
    window.location.href = mailto.toString()
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-5 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="max-w-xl">
          <span className="inline-flex rounded-full bg-fondo px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-primario">Soporte</span>
          <h1 className="font-hero mt-5 max-w-[620px] text-[2.45rem] font-extrabold leading-[1.06] text-texto-principal lg:text-[3rem]">
            Envia tu consulta al equipo de Agendify
          </h1>
          <p className="mt-5 text-[16px] leading-8 text-texto-secundario">
            Si necesitas ayuda con acceso, uso de la plataforma o comportamiento de alguna funcionalidad, dejanos un mensaje y te preparamos el correo para soporte.
          </p>
        </section>

        <form onSubmit={submit} className="rounded-[28px] border border-borde bg-white p-6 shadow-sm lg:p-8">
          <div className="grid gap-5">
            <div>
              <Label>Email de contacto</Label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tuemail@ejemplo.com"
                type="email"
                className="rounded-2xl px-4 py-3"
              />
            </div>

            <div>
              <Label>Asunto</Label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ej: No puedo finalizar una reserva"
                className="rounded-2xl px-4 py-3"
              />
            </div>

            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contanos el problema o la ayuda que necesitas."
                rows={8}
                className="rounded-2xl px-4 py-3"
              />
            </div>

            <BotonPrimario type="submit" className="rounded-full py-4 text-base" disabled={!canSubmit}>
              Enviar correo a soporte
            </BotonPrimario>
          </div>
        </form>
      </div>
    </main>
  )
}
