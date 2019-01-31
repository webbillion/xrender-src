import XElement from './xElements/XElement'

class Stage {
  /**
   * 所有元素的集合
   */
  xelements: XElement[] = []
  constructor () {
    console.log('Stage')
  }
  /**
   * 添加元素
   * 显然可能会添加多个元素
   */
  add (...xelements: XElement[]) {
    this.xelements.push(...xelements)
  }
  /**
   * 删除指定元素
   */
  delete (xel: XElement) {
    let index = this.xelements.indexOf(xel)
    if (index > -1) {
      this.xelements.splice(index)
    }
  }
  /**
   * 获取所有元素
   */
  getAll () {
    this.updateXElements()
    return this.xelements.filter(xel => !xel.ignored)
  }
  updateXElements () {
    // zLevel高的在后，其它按加入次序排列
    this.xelements.sort((a, b) => {
      return a.zLevel - b.zLevel
    })
  }
}

export default Stage
