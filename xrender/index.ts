import XRedner from './XRender'
// 导出具体的元素类
export { default as Circle } from './xElements/Circle'
export { default as Rect } from './xElements/Rect'
// 只暴露方法而不直接暴露`XRender`类
export function init (dom: string | HTMLElement) {
  return new XRedner(dom)
}
