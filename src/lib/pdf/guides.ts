type GuideDefinition = {
  role: 'Cliente' | 'Profesional' | 'Asistente'
  title: string
  lines: string[]
}

const guides: Record<'cliente' | 'profesional' | 'asistente', GuideDefinition> = {
  cliente: {
    role: 'Cliente',
    title: 'Guia de uso - Cliente',
    lines: [
      '1. Inicia sesion o crea tu cuenta.',
      '2. Busca un profesional por nombre o servicio.',
      '3. Revisa horarios disponibles y reserva un turno.',
      '4. Gestiona notificaciones y consulta tus reservas.',
    ],
  },
  profesional: {
    role: 'Profesional',
    title: 'Guia de uso - Profesional',
    lines: [
      '1. Crea tu cuenta profesional.',
      '2. Configura tu agenda y horarios de disponibilidad.',
      '3. Visualiza tus turnos y gestiona clientes.',
      '4. Asigna asistentes y revisa notificaciones.',
    ],
  },
  asistente: {
    role: 'Asistente',
    title: 'Guia de uso - Asistente',
    lines: [
      '1. Inicia sesion con tu cuenta de asistente.',
      '2. Consulta los profesionales que administras.',
      '3. Crea, modifica o cancela turnos.',
      '4. Registra observaciones y apoya la gestion diaria.',
    ],
  },
}

function buildPdfContent({ title, role, lines }: GuideDefinition) {
  const textLines = [title, '', `Rol: ${role}`, '', ...lines]
  const streamLines = [
    'BT',
    '/F1 22 Tf',
    '50 760 Td',
    '28 TL',
    ...textLines.map((line, index) => `${index === 0 ? '' : 'T* ' }(${line.replace(/[()]/g, '')}) Tj`.trim()),
    'ET',
  ]
  const stream = `${streamLines.join('\n')}\n`

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = ['0000000000 65535 f ']

  objects.forEach((object) => {
    offsets.push(`${String(pdf.length).padStart(10, '0')} 00000 n `)
    pdf += object
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n${offsets.join('\n')}\n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

export function downloadGuide(key: keyof typeof guides) {
  const guide = guides[key]
  const pdf = buildPdfContent(guide)
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `guia-${key}-agendify.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
