import type { PDFArray, PDFDict, PDFDocument, PDFRef } from 'pdf-lib'

export interface TimecodeHoverMarker {
  pageNum: number
  x: number
  y: number
  w: number
  h: number
  frameKey: string
  label: string
  source: string
}

interface PopupSizingOptions {
  targetWidth?: number
  targetHeight?: number
  pageMargin?: number
}

function dataUrlToJpegBytes(dataUrl: string): Uint8Array | null {
  if (!dataUrl.startsWith('data:image/jpeg')) return null
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx < 0) return null
  const base64 = dataUrl.slice(commaIdx + 1)
  try {
    const bin = atob(base64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

export async function addTimecodeHoverWidgets(
  pdfBytes: Uint8Array,
  markers: TimecodeHoverMarker[],
  previews: Map<string, string>,
  options: PopupSizingOptions = {},
): Promise<Uint8Array> {
  if (markers.length === 0 || previews.size === 0) return pdfBytes

  // pdf-lib is heavy (~200KB minified) and only needed for PDF export with
  // timecode hover previews — load it on demand instead of bundling eagerly.
  const {
    PDFArray: PDFArrayCls,
    PDFDict: PDFDictCls,
    PDFDocument: PDFDocumentCls,
    PDFName,
  } = await import('pdf-lib')

  const TARGET_W = options.targetWidth ?? 130
  const TARGET_H = options.targetHeight ?? Math.round((TARGET_W * 9) / 16)
  const MARGIN = options.pageMargin ?? 20

  let pdfDoc: PDFDocument
  try {
    pdfDoc = await PDFDocumentCls.load(pdfBytes, { ignoreEncryption: true })
  } catch {
    return pdfBytes
  }

  const context = pdfDoc.context

  const emptyForm = context.flateStream('', {
    Type: 'XObject',
    Subtype: 'Form',
    FormType: 1,
    BBox: [0, 0, 1, 1],
    Resources: {},
  })
  const emptyFormRef = context.register(emptyForm)

  const imageFormRefs = new Map<string, PDFRef>()
  // Decode/embed every JPEG concurrently (each embedJpg is independent), then
  // register the resulting form streams sequentially to keep output deterministic.
  const embeddedImages = await Promise.all(
    [...previews.entries()].map(async ([key, dataUrl]) => {
      const bytes = dataUrlToJpegBytes(dataUrl)
      if (!bytes || bytes.length < 8) return null
      try {
        return { key, pdfImage: await pdfDoc.embedJpg(bytes) }
      } catch {
        return null
      }
    }),
  )
  for (const embedded of embeddedImages) {
    if (!embedded) continue
    const { key, pdfImage } = embedded
    const imgW = pdfImage.width
    const imgH = pdfImage.height
    const contentStr = `q ${imgW} 0 0 ${imgH} 0 0 cm /Img Do Q`
    const formStream = context.flateStream(contentStr, {
      Type: 'XObject',
      Subtype: 'Form',
      FormType: 1,
      BBox: [0, 0, imgW, imgH],
      Resources: {
        XObject: { Img: pdfImage.ref },
      },
    })
    imageFormRefs.set(key, context.register(formStream))
  }

  if (imageFormRefs.size === 0) return pdfBytes

  const acroFormLookup = pdfDoc.catalog.lookup(PDFName.of('AcroForm'))
  let acroForm: PDFDict
  if (acroFormLookup instanceof PDFDictCls) {
    acroForm = acroFormLookup
    acroForm.set(PDFName.of('NeedAppearances'), context.obj(false))
  } else {
    acroForm = context.obj({ Fields: [], NeedAppearances: false }) as PDFDict
    pdfDoc.catalog.set(PDFName.of('AcroForm'), acroForm)
  }
  const fieldsLookup = acroForm.lookup(PDFName.of('Fields'))
  let fields: PDFArray
  if (fieldsLookup instanceof PDFArrayCls) {
    fields = fieldsLookup
  } else {
    fields = context.obj([]) as PDFArray
    acroForm.set(PDFName.of('Fields'), fields)
  }

  const pages = pdfDoc.getPages()

  for (let i = 0; i < markers.length; i += 1) {
    const marker = markers[i]
    const formRef = imageFormRefs.get(marker.frameKey)
    if (!formRef) continue
    const pageIndex = marker.pageNum - 1
    if (pageIndex < 0 || pageIndex >= pages.length) continue
    const page = pages[pageIndex]
    const pageW = page.getWidth()
    const pageH = page.getHeight()

    let widgetW = TARGET_W
    let widgetH = TARGET_H
    if (widgetW > pageW - MARGIN * 2) {
      widgetW = pageW - MARGIN * 2
      widgetH = Math.round((widgetW * 9) / 16)
    }
    let widgetX = marker.x
    if (widgetX + widgetW > pageW - MARGIN) {
      widgetX = Math.max(MARGIN, pageW - MARGIN - widgetW)
    }

    const tcBottomBu = pageH - marker.y - marker.h
    const tcTopBu = pageH - marker.y
    let widgetLowerY = tcBottomBu
    let widgetUpperY = tcTopBu + widgetH
    if (widgetUpperY > pageH - MARGIN) {
      widgetUpperY = tcTopBu
      widgetLowerY = tcBottomBu - widgetH
      if (widgetLowerY < MARGIN) {
        widgetLowerY = MARGIN
        widgetUpperY = widgetLowerY + widgetH + marker.h
      }
    }

    const widgetDict = context.obj({
      Type: 'Annot',
      Subtype: 'Widget',
      Rect: [widgetX, widgetLowerY, widgetX + widgetW, widgetUpperY],
      FT: 'Btn',
      Ff: 65536,
      T: `tc_w_${marker.pageNum}_${i}`,
      H: 'P',
      F: 4,
      AP: { N: emptyFormRef, D: formRef },
      MK: { TP: 1, I: emptyFormRef, IX: formRef },
      BS: { Type: 'Border', W: 0, S: 'S' },
    }) as PDFDict
    const widgetRef = context.register(widgetDict)

    const annotsLookup = page.node.lookup(PDFName.of('Annots'))
    let annotsArr: PDFArray
    if (annotsLookup instanceof PDFArrayCls) {
      annotsArr = annotsLookup
    } else {
      annotsArr = context.obj([]) as PDFArray
      page.node.set(PDFName.of('Annots'), annotsArr)
    }
    annotsArr.push(widgetRef)
    fields.push(widgetRef)
  }

  try {
    return await pdfDoc.save({ updateFieldAppearances: false })
  } catch {
    return pdfBytes
  }
}
