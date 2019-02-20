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
  return typeof value === 'object' && (!Array.isArray(value))
}
export function isFunction (value: any) {
  return typeof value === 'function'
}

export function merge (obj: Object, newObj: Object) {
  for (let key in newObj) {
    obj[key] = newObj[key]
  }
}
/**
 * 可以满足一般使用就行了，不考虑更多更复杂的情况
 */
export function clone (source) {
  if (source == null || typeof source !== 'object') {
    return source
  }

  let result = source

  if (Array.isArray(source)) {
    result = []
    for (let i = 0, len = source.length; i < len; i++) {
      result[i] = clone(source[i])
    }
  } else {
    result = {}
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        result[key] = clone(source[key])
      }
    }
  }

  return result
}
