type Props = {
    texto: string
    deshabilitado?: boolean
    onClick?: () => void
    tipo?: 'button' | 'submit'
}

export default function BotonPrimario({ texto, deshabilitado, onClick, tipo = 'button' }: Props) {
    return (
        <button type={tipo} className="boton-primario" disabled={deshabilitado} onClick={onClick}>
        {texto}
        </button>
    )
}