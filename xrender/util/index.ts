export function isString (str: any) {
  return typeof str === 'string'
}

export function debounce (fn: Function, delay = 300) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function isObject (value: any) {
  return typeof value === 'object'
}

export function updateObjValue (obj: Object, newObj: Object) {
  for (let key in newObj) {
    obj[key] = newObj[key]
  }
}
