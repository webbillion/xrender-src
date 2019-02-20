import { isObject, isString, isFunction, clone } from './util'
import EasingFuns, { EasingFn, EasingFnType } from './Easing'
/**
 * 关键帧队列格式
 */
export interface KeyFrameInQueue {
  /**
   * 时间
   */
  time: number
  /**
   * 值
   */
  value: number
}
/**
 * 处理值可能存在嵌套的情况
 * 同时处理特殊值的情况
 * @param preValue 前一帧的值
 * @param nextValue 下一帧的值
 * @param currentTime 当前时间
 * @param duringTime 持续时间
 * @param easingFn 缓动函数
 */
function getNestedValue (
  preValue: any,
  nextValue: any,
  currentTime: number,
  duringTime: number,
  easingFn: EasingFn
) {
  let value
  // 假定前后两次值的类型相同
  if (isObject(nextValue)) {
    value = {}
    for (let key in nextValue) {
      value[key] = getNestedValue(preValue[key], nextValue[key], currentTime, duringTime, easingFn)
    }
  } else {
    value = easingFn(
      currentTime,
      preValue,
      nextValue - preValue,
      duringTime
    )
  }

  return value
}
/**
 * 获取当前值
 */
function getCurrentValue (
  queue: KeyFrameInQueue[],
  deltaTime: number,
  easingFn: EasingFn
) {
  let preFrame: KeyFrameInQueue
  let nextFram: KeyFrameInQueue
  for (let i = 0; i < queue.length; i += 1) {
    let frame = queue[i]
    // 已经是最后一帧了，还没有找到前一帧，说明时间已经超过最长关键帧的时间了
    // 假定最少有两个关键帧
    if (i === queue.length - 1) {
      preFrame = queue[i - 1]
      nextFram = frame
    } else if (frame.time < deltaTime && (queue[i + 1].time >= deltaTime)) {
      preFrame = frame
      nextFram = queue[i + 1]
      break
    }
  }
  let lastFram = queue[queue.length - 1]
  // 只有在最后的关键帧中进行时间截断，以免值超出范围
  // 也就是说，在回调中应当避免对关键帧设置的值做精确的比较
  // 应该有更优的方法，这里暂不讨论
  deltaTime = deltaTime > lastFram.time ? lastFram.time : deltaTime
  let value = getNestedValue(
    preFrame.value,
    nextFram.value,
    deltaTime - preFrame.time,
    nextFram.time - preFrame.time,
    easingFn
  )
  return value
}

class Animation {
  /**
   * 要动画的目标
   */
  _target: Object
  /**
   * 关键帧队列
   */
  _keyFrameQueue: {
    [prop: string]: KeyFrameInQueue[]
  } = {}
  /**
   * 持续触发的回调队列
   */
  _duringQueue: ((target: Object) => void)[] = []
  /**
   * 完成回调队列
   */
  _doneQueue: ((target: Object) => void)[] = []
  /**
   * 开始的延迟时间
   */
  _delay = 0
  /**
   * 动画开始的时间
   */
  startTime = 0
  /**
   * 动画持续的最久的时间，用来判定是否结束
   */
  _maxTime = 0
  /**
   * 指定缓动函数
   */
  _easingFn: EasingFn = EasingFuns.linear
  /**
   * 暂停
   */
  _paused = false
  /**
   * 暂停时的时间
   */
  _pausedTime = 0
  /**
   * 正在运行，可用stop来终止
   */
  _runing = false
  constructor (target: Object) {
    this._target = clone(target)
  }
  /**
   * 设置关键帧
   * @param time 关键帧时间
   * @param animateObj 要动画的对象
   */
  when (time = 1000, animateObj = {}) {
    if (!animateObj || !isObject(animateObj)) {
      return
    }
    let target = this._target
    for (let key in animateObj) {
      // 如果之前没有这个值，将其设为0
      if (!target[key]) {
        target[key] = 0
      }
      let keyQueue = this._keyFrameQueue[key]
      if (!keyQueue) {
        // 还没有的话初始化为最初的值
        keyQueue = this._keyFrameQueue[key] = [
          {
            time: 0,
            value: target[key]
          }
        ]
      }
      let keyFrame = {
        time,
        value: animateObj[key]
      }
      // 在此处插入排序
      for (let i = (keyQueue.length - 1); i >= 0; i -= 1) {
        if (keyQueue[i].time < time) {
          keyQueue.splice(i + 1, 0, keyFrame)
          break
        }
        // 如果两个关键帧时间相同，则替换掉
        if (keyQueue[i].time === time) {
          keyQueue.splice(i, 1, keyFrame)
          break
        }
        // 否则什么也不做
      }
    }
    if (time > this._maxTime) {
      this._maxTime = time
    }

    return this
  }
  /**
   * 设置每一帧的回调
   */
  during (callback: (target: Object) => void) {
    if (!isFunction(callback)) {
      return this
    }
    this._duringQueue.push(callback)

    return this
  }
  /**
   * 设置动画完成的回调
   */
  done (callback: (target: Object) => void) {
    if (!isFunction(callback)) {
      return this
    }
    this._doneQueue.push(callback)

    return this
  }
  /**
   * 设置动画开始的延迟
   */
  delay (delay: number) {
    this._delay = delay

    return this
  }
  /**
   * 开始动画
   */
  start (easingFn: EasingFnType | EasingFn) {
    if (this._runing) {
      return
    }
    this._runing = true
    if (isString(easingFn)) {
      this._easingFn = EasingFuns[easingFn as string] || EasingFuns.linear
    } else if (typeof easingFn === 'function') {
      this._easingFn = easingFn
    }
    let fn = () => {
      this.startTime = Date.now()
      requestAnimationFrame(this.update)
    }
    // 延迟执行
    if (this._delay > 0) {
      setTimeout(fn, this._delay)
    } else {
      fn()
    }

    return this
  }
  /**
   * 更新
   */
  update = () => {
    if (this._paused || !this._runing) {
      return
    }
    let nowTime = Date.now()
    let deltaTime = nowTime - this.startTime
    // 遍历关键帧队列
    for (let key in this._keyFrameQueue) {
      let keyQueue = this._keyFrameQueue[key]
      this._target[key] = getCurrentValue(keyQueue, deltaTime, this._easingFn)
    }
    // 更新时的回调
    this._duringQueue.forEach(fn => {
      fn(this._target)
    })
    // 完成时的回调
    if (deltaTime >= this._maxTime) {
      this._doneQueue.forEach(fn => {
        fn(this._target)
      })
      this._runing = false
      // TODO: 做一些重置操作，如把队列清空
      this.resetStatus()
    } else {
      requestAnimationFrame(this.update)
    }
  }
  /**
   * 动画结束后做收尾工作
   */
  resetStatus () {
    // 重置开始时间
    this.startTime = 0
    this._pausedTime = 0
    this._paused = false
  }
  /**
   * 清除所有动画及队列
   */
  clear () {
    this._maxTime = 0
    this._doneQueue = []
    this._delay = 0
    this._duringQueue = []
    this._keyFrameQueue = {}
  }
  /**
   * 停止动画
   */
  stop () {
    this._runing = false
  }
  /**
   * 暂停动画
   */
  pause () {
    this._pausedTime = Date.now()
    this._paused = true
  }
  /**
   * 恢复暂停的动画
   */
  resume () {
    if (!this._paused) {
      return
    }
    this._paused = false
    this.startTime += (Date.now() - this._pausedTime)
    requestAnimationFrame(this.update)
  }
}

export default Animation
