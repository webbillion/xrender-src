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
    obj[key] = clone(newObj[key])
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
/**
 * 只是用来继承原型的
 * @example
 * // 两个函数结合起来用
 * class A {
 *   super() {
 *     extendsClass(this, B)
 *   }
 * }
 * inherit(A, [B])
 */
export function inherit (child: Function, parents: Function | Function[], excludeProps: string[] = []) {
  if (!Array.isArray(parents)) {
    parents = [parents]
  }
  let props: string[]
  let prop: string
  let prototype = child.prototype as Object
  let parentPrototype: Object
  for (let parentIndex = 0; parentIndex < parents.length; parentIndex += 1) {
    parentPrototype = parents[parentIndex].prototype
    props = Object.getOwnPropertyNames(parentPrototype)
    for (let propIndex = 0; propIndex < props.length; propIndex += 1) {
      prop = props[propIndex]
      // 使用本方法来继承一般是混合继承，而不是子类继承父类，一般不会有同名属性
      // 另一方面因为ts的验证，需要提前设置属性做好站位，所以即使有同名属性，也需要进行覆盖
      if (prop !== 'constructor' && excludeProps.indexOf(prop) === -1) {
        prototype[prop] = clone(parentPrototype[prop])
      }
    }
  }

  return child
}
/**
 * 为类创建一个实例，然后将实例的属性复制给传入的上下文
 * 以实现多继承
 * 原型的继承则交给inherit
 * @param context 上下文，当前类
 * @param Parent 父类
 * @param args 父类的参数
 */
export function extendsClass (context, Parents, args = []) {
  if (!Array.isArray(Parents)) {
    Parents = [Parents]
  }
  Parents.forEach(Parent => {
    let instance = new Parent(...args)
    for (let key in instance) {
      if (instance.hasOwnProperty(key)) {
        context[key] = instance[key]
      }
    }
  })
}
