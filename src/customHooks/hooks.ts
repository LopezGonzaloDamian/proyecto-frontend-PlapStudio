import { useEffect,useRef } from 'react'

export const useOnInit = (initialCallBack: () => void)=>{
    useEffect(() => {
      initialCallBack()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])}

////////////////////////////////////////////////////////////////////////
//Hook comun de useRef, así no usamos useEffect
export function useOnChangeRef<T>(value: T, callback: (val: T) => void) {
  const prevValue = useRef<T>(value)

  if (prevValue.current !== value) {
    prevValue.current = value
    callback(value)
  }
}

////////////////////////////////////////////////////////////////////////
//Ídem que el de arriba pero con una actualización automática cada x tiempo 
//para refrescar el axios que querramos.
export function useIntervalRef(callback: () => void, delay: number) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  })

  useEffect(() => {
    const tick = () => savedCallback.current()
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}