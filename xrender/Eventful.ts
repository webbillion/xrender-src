type Handler<T> = (e?: T) => void

// 不考虑`handler`不是函数的情况
class Eventful<EventType = string, Params = any> {
  /**
   * 事件回调
   */
  _handlers: {
    [prop: string]: Handler<Params>[]
  } = {}
  /**
   * 监听事件
   */
  on (event: EventType, handler: Handler<Params>) {
    // 绕过类型检查
    if (typeof event !== 'string') {
      return
    }
    let handlers = this._handlers
    if (!handlers[event]) {
      handlers[event] = [handler]
    } else {
      if (handlers[event].indexOf(handler) > -1) {
        return
      }
      handlers[event].push(handler)
    }
    
  }
  /**
   * 取消监听
   */
  off (event?: EventType, handler?: Handler<Params>) {
    // 绕过类型检查
    if (typeof event !== 'string') {
      return
    }
    if (!event) {
      this._handlers = {}
      return
    }
    let handlers = this._handlers[event]
    if (!handlers) {
      return
    }
    if (!handler) {
      this._handlers[event] = []
    } else {
      let index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
  /**
   * 触发回调
   */
  dispatch (event: EventType, params?: Params) {
    // 绕过类型检查
    if (typeof event !== 'string') {
      return
    }
    let handlers = this._handlers[event]
    if (!handlers) {
      return
    }
    for (let i = 0; i < handlers.length; i += 1) {
      handlers[i](params)
    }
  }
}

export default Eventful
