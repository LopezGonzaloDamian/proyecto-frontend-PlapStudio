// Pa que no revienten los botones a clicks.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<F extends (...args: any[]) => void>(fn: F) {
  let enEspera = false
  const limit = 500

  return function (...args: Parameters<F>) {
    if (!enEspera) {
      fn(...args)
      enEspera = true
      setTimeout(() => enEspera = false, limit)
    }
  }
}

////////// 
