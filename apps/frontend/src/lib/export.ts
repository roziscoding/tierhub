import { toPng } from 'html-to-image'

export async function exportTierlistAsImage(element: HTMLElement, filename = 'tierlist.png') {
  const dataUrl = await toPng(element, {
    backgroundColor: '#1a1a1a',
    pixelRatio: 2,
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
