import XRedner, { XRenderOptions } from './XRender'
// 导出具体的元素类
export { default as Circle } from './xElements/Circle'
export { default as Rect } from './xElements/Rect'
export { default as Group } from './xElements/Group'
export { default as Image } from './xElements/Image'
export { default as Arc } from './xElements/Arc'
export { default as Line } from './xElements/Line'
export { default as BezierCurve } from './xElements/BezierCurve'
// 只暴露方法而不直接暴露`XRender`类
export function init (dom: string | HTMLElement, opt?: XRenderOptions) {
  return new XRedner(dom, opt)
}
