import JSZip from 'jszip'

export interface DocxParagraph {
  index: number
  text: string
  isBullet: boolean
  isEmpty: boolean
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function extractParaText(paraXml: string): string {
  const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g
  const parts: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(paraXml)) !== null) parts.push(m[1])
  return parts.join('')
}

function patchParagraphText(paraXml: string, newText: string): string {
  const escaped = escapeXml(newText)
  const openTag = paraXml.match(/^(<w:p\b[^>]*>)/)?.[1] ?? '<w:p>'
  const pPr = paraXml.match(/(<w:pPr>[\s\S]*?<\/w:pPr>)/)?.[1] ?? ''
  const rPr = paraXml.match(/(<w:rPr>[\s\S]*?<\/w:rPr>)/)?.[1] ?? ''
  return `${openTag}${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`
}

export async function parseDocxParagraphs(buffer: Buffer): Promise<DocxParagraph[]> {
  const zip = await JSZip.loadAsync(buffer)
  const docFile = zip.file('word/document.xml')
  if (!docFile) throw new Error('Invalid DOCX file.')
  const xml = await docFile.async('string')

  const paragraphs: DocxParagraph[] = []
  let index = 0
  const re2 = /<w:p\b[\s\S]*?<\/w:p>/g
  let match: RegExpExecArray | null
  while ((match = re2.exec(xml)) !== null) {
    const paraXml = match[0]
    const text = extractParaText(paraXml)
    paragraphs.push({
      index,
      text,
      isBullet: paraXml.includes('<w:numPr>'),
      isEmpty: text.trim().length === 0,
    })
    index++
  }
  return paragraphs
}

export async function applyDocxModifications(
  buffer: Buffer,
  modifications: { index: number; newText: string }[]
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer)
  const docFile = zip.file('word/document.xml')
  if (!docFile) throw new Error('Invalid DOCX file.')
  const xml = await docFile.async('string')

  const modMap = new Map(modifications.map(m => [m.index, m.newText]))
  let paraIndex = 0
  const patched = xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paraXml) => {
    const newText = modMap.get(paraIndex++)
    return newText !== undefined ? patchParagraphText(paraXml, newText) : paraXml
  })

  zip.file('word/document.xml', patched)
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
