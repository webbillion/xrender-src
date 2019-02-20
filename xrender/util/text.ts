import { XElementStyle } from '../xElements/XElement'
import { TextShape } from '../xElements/Text'

let ctxForLineHeight: CanvasRenderingContext2D
let canvasForLineHeight: HTMLCanvasElement
export function createCtx () {
  canvasForLineHeight = document.createElement('canvas')
  // 一般来说测量行高应该够用了
  canvasForLineHeight.width = 1000
  canvasForLineHeight.height = 1000
  // 是的，即使display为none，也能取到数据
  canvasForLineHeight.style.display = 'none'
  document.body.appendChild(canvasForLineHeight)
  ctxForLineHeight = canvasForLineHeight.getContext('2d')

  return ctxForLineHeight
}
/**
 * 用字体和比值计算
 */
const FontsData = {
  example: {
    fontSize: 12,
    lineHeight: 14,
    top: 0
  }
}
const chars = {
  // g
  g: '\u0067',
  // ŋ
  n: '\u014B',
  // 家
  q: '\u5bb6'
}
/**
 * 将imageData转为二维数组
 */
function sliceImageData (data: Uint8ClampedArray, width: number, height: number) {
  let result = []
  let len = 0
  for (let i = 0; i < height; i += 1) {
    let row = result[i] = []
    for (let j = 0; j < width; j += 1) {
      row.push([
        data[len++],
        data[len++],
        data[len++],
        data[len++]
      ])
    }
  }

  return result
}
/**
 * 查询某一行是否有像素 
 */
function hasPx (data: any[], row: number) {
  return data[row].filter(item => item[3]).length !== 0
}
/**
 * 获取单个字符的高度 
 */
function getCharRange (char: string, width: number) {
  // 可能会超出范围
  let clearWidth = 1.5 * width
  ctxForLineHeight.clearRect(0, 0, clearWidth, clearWidth)
  // 在顶部画字
  ctxForLineHeight.textBaseline = 'top'
  // 画一个字
  ctxForLineHeight.fillText(char, 0, 0)
  // 获取它该有的像素
  let imgData = sliceImageData(
    ctxForLineHeight.getImageData(0, 0, clearWidth, clearWidth).data,
    clearWidth,
    clearWidth
  )
  let top = 0
  let bottom = width - 1
  let rowHasPx = hasPx(imgData, bottom)
  if (rowHasPx) {
    // 向后取直到没有像素为止
    while ((bottom < clearWidth) && hasPx(imgData, bottom)) {
      bottom += 1
    }
  } else {
    // 向前取
    while ((bottom >= 0) && !hasPx(imgData, bottom)) {
      bottom -= 1
    }
  }
  while ((top < clearWidth) && !hasPx(imgData, top)) {
    top += 1
  }
  // 在底部画字
  ctxForLineHeight.clearRect(0, 0, clearWidth, clearWidth)
  ctxForLineHeight.textBaseline = 'bottom'
  ctxForLineHeight.fillText(char, 0, clearWidth)
  imgData = sliceImageData(
    ctxForLineHeight.getImageData(0, 0, clearWidth, clearWidth).data,
    clearWidth,
    clearWidth
  )
  let bottomOffset = clearWidth - 1
  while ((bottomOffset >= 0) && !hasPx(imgData, bottomOffset)) {
    bottomOffset -= 1
  }
  bottomOffset = clearWidth - bottomOffset
  // 排除掉无法显示的字符
  // if ((top < 11) && bottom !== -1) {
  //   console.log(char, char.charCodeAt(0), {
  //     top,
  //     bottom,
  //     bottomOffset,
  //     lineHeight: bottom + bottomOffset
  //   })
  // }
  return {
    top,
    bottom,
    bottomOffset,
    lineHeight: bottom + bottomOffset
  }
}
/**
 * 根据当前样式获取文字行高和偏移
 */
export function getFontData (style: XElementStyle) {
  if (!ctxForLineHeight) {
    createCtx()
  }
  let fontFamily = style.fontFamily
  let fontData = FontsData[fontFamily]
  if (fontData) {
    return {
      lineHeight: fontData.lineHeight / fontData.fontSize * style.fontSize,
      top: fontData.top / fontData.fontSize * style.fontSize
    }
  }
  let font = `${style.fontSize}px ${fontFamily}`

  ctxForLineHeight.save()
  ctxForLineHeight.font = font
  ctxForLineHeight.setTransform(1, 0, 0, 1, 0, 0)
  // 重置样式
  ctxForLineHeight.textBaseline = 'top'
  ctxForLineHeight.fillStyle = '#000'
  // 这是国字的高度
  let width = ctxForLineHeight.measureText('国').width
  let lineHeight = getCharRange(chars.g, width).lineHeight
  let top = getCharRange(chars.q, width).top
  lineHeight -= top
  // 再加1px以免超出
  lineHeight += 1
  ctxForLineHeight.restore()
  FontsData[fontFamily] = {
    fontSize: style.fontSize,
    lineHeight,
    top
  }

  return FontsData[fontFamily]
}

export interface LineText {
  x: number
  y: number
  text: string
  width: number
}
function createLineText (x, y, text, width) {
  return {
    x,
    y,
    text,
    width
  }
}
const ellipsis = '...'
/**
 * 获取换行后的文字
 */
export function getWrapText(
  startX: number, startY: number, ctx: CanvasRenderingContext2D,
  text: string, shape: TextShape, style: XElementStyle, lineHeight: number,
  padding: number[]
): LineText[] {
  // 绑定样式
  let font = `${style.fontSize}px ${style.fontFamily}`
  ctx.save()
  ctx.font = font
  // 没有指定宽度的话直接返回即可，没有指定宽度的话指定了高度也没用
  if (!shape.maxWidth) {
    return [createLineText(startX, startY, text, ctx.measureText(text).width)]
  }
  let result = []
  let len = text.length
  let maxWidth = shape.maxWidth - padding[1] - padding[3]
  // 在一开始就要加上
  let maxHeight = (shape.maxHeight || 100000000) - padding[0] - padding[2] + startY
  // 省略号的长度
  let ellipsisLength = ctx.measureText(ellipsis).width
  // 首先，不换行
  if (!shape.wrap || (lineHeight * 2 > maxHeight)) {
    switch (shape.overflow) {
      // 可见和隐藏不需要做更多
      case 'visible':
      case 'hidden':
        result = [createLineText(startX, startY, text, 0)]
      // 省略号算出长度即可
      case 'ellipsis':
      let { index, width } = findTextIndex(ctx, text, maxWidth)
        // 如果当前宽度不能满足需要，则添加省略号
        if (index < len - 1) {
          let indexData = findTextIndex(ctx, text, maxWidth - ellipsisLength)
          text = indexData.text + ellipsis
          width = indexData.width + ellipsisLength
        }
        result = [createLineText(startX, startY, text, width)]
    }
  } else {
    let startIndex = 0
    let indexData = findTextIndex(ctx, text, maxWidth)
    let index = indexData.index
    result.push(createLineText(startX, startY, indexData.text, indexData.width))
    while (index < len) {
      startIndex = index + 1
      indexData = findTextIndex(ctx, text.slice(startIndex), maxWidth)
      if (!indexData) {
        break
      }
      index += (indexData.index + 1)
      startY += lineHeight
      let subText = text.slice(startIndex, index)
      // 最后一段超出高度，在后面加省略号，即多行超出省略
      if (startY + lineHeight * 2 > maxHeight && (shape.overflow === 'ellipsis')) {
        indexData = findTextIndex(ctx, subText, maxWidth)
        if (!indexData) {
          break
        }
        // 如果当前宽度不能满足需要，则添加省略号
        if (indexData.index < subText.length - 1 || (index < len - 1)) {
          indexData = findTextIndex(ctx, subText, maxWidth - ellipsisLength)
          indexData.text += ellipsis
          indexData.width += ellipsisLength
        }
        result.push(createLineText(startX, startY, indexData.text, indexData.width))
        break
      }
      result.push(createLineText(startX, startY, indexData.text, indexData.width))
    }
  }
  ctx.restore()

  return result
}
/**
 * 绘制文字
 */
export function renderText (ctx: CanvasRenderingContext2D, lineTexts: LineText[], method: string) {
  let lineText
  for (let i = 0; i < lineTexts.length; i += 1) {
    lineText = lineTexts[i]
    ctx[method](lineText.text, lineText.x, lineText.y)
  }
}
/**
 * 解析padding为标准格式
 */
export function parsePadding (padding: number[] | number) {
  let result = []
  if (Array.isArray(padding)) {
    switch (padding.length) {
      case 1:
        padding = padding[0]
        break
      case 2:
      case 3:
        result[0] = padding[0]
        result[1] = padding[1]
        result[2] = padding[0]
        result[3] = padding[1]
        break
      default:
        result = padding.slice(0, 4)
        break
    }
  }
  if (!result.length) {
    result = [padding, padding, padding, padding]
  }

  return result
}
interface TextIndex {
  /**
   * 索引
   */
  index: number
  /**
   * 文字片段
   */
  text: string
  /**
   * 文字片段的宽度
   */
  width: number
}
/**
 * 根据最大宽度找到索引
 */
function findTextIndex (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): TextIndex {
  if (!text) {
    return null
  }
  let measureText = text => ctx.measureText(text)
  let len = text.length
  let textWidth = measureText(text).width
  let result: TextIndex = {
    index: len - 1,
    text,
    width: textWidth
  }
  // 宽度已经满足要求
  if (textWidth <= maxWidth) {
    return result
  }
  // 取中间的索引
  let halfLen = Math.floor(len / 2)
  let halfText = text.slice(0, halfLen ? halfLen : 1)
  result.text = halfText
  textWidth = measureText(halfText).width
  result.width = textWidth
  // 同上
  if (textWidth === maxWidth) {
    result.index = (halfLen ? halfLen : 1) - 1
    return result
  }
  // 如果文字一半的宽度小于最大宽度，向后取
  if (textWidth < maxWidth) {
    let nextIndex = findTextIndex(ctx, text.slice(halfLen), maxWidth - textWidth)
    if (nextIndex !== null) {
      halfLen += (nextIndex.index + 1)
      result.text += nextIndex.text
      result.width += nextIndex.width
    }
    result.index = halfLen - 1
    return result
  }
  // 分到第一个还无法满足需求
  if (halfLen === 0) {
    return null
  }
  // 如果一半仍然大于，向前取
  return findTextIndex(ctx, text.slice(0, halfLen - 1), maxWidth)
}