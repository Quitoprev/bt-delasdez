/**
 * Reduz a foto do celular (que costuma ter 3–8 MB) para JPEG de no máximo
 * 1280px no lado maior, antes de subir. Deixa o upload rápido e economiza storage.
 */
export async function comprimirImagem(arquivo: File, ladoMax = 1280, qualidade = 0.8): Promise<Blob> {
  const bitmap = await carregar(arquivo)
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * escala)
  const h = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return arquivo
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h)

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b ?? arquivo), 'image/jpeg', qualidade)
  })
}

async function carregar(arquivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      // respeita a orientação da câmera (foto não sai deitada)
      return await createImageBitmap(arquivo, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    } catch {
      /* cai no fallback abaixo */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(arquivo)
  })
}
