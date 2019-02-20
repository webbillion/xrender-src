// 不考虑`handler`不是函数的情况
class Eventful {
  /**
   * 事件回调
   */
  _handlers: {
    [prop: string]: Function[]
  } = {}
  /**
   * 监听事件
   */
  on (event: string, handler: Function) {
    let handlers = this._handlers
    if (!handler[event]) {
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
  off (event?: string, handler?: Function) {
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
  dispatch (event: string, params: any) {
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
