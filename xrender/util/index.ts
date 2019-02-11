export function isString (str) {
  return typeof str === 'string'
}

export function merge (obj: Object, newObj: Object) {
  for (let key in newObj) {
    obj[key] = newObj[key]
  }
}
