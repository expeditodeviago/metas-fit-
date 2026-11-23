import { toBlob, toPng } from 'html-to-image';

function slugifyFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFileName(studentName: string, assessmentDate: string): string {
  const slug = slugifyFileName(studentName) || 'aluno';
  const datePart = assessmentDate.slice(0, 10) || 'atual';
  return `medidas-e-metas-${slug}-${datePart}.png`;
}

async function prepareCaptureOptions(
  element: HTMLElement,
  backgroundColor = '#09090B',
) {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const width = element.offsetWidth;
  const height = element.offsetHeight;

  return {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor,
    width,
    height,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      margin: '0',
    },
  };
}

export async function downloadCardPng(
  element: HTMLElement,
  studentName: string,
  assessmentDate: string,
  backgroundColor = '#09090B',
): Promise<string> {
  const options = await prepareCaptureOptions(element, backgroundColor);
  const dataUrl = await toPng(element, options);
  const fileName = buildFileName(studentName, assessmentDate);

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return fileName;
}

export interface ShareCardResult {
  method: 'web-share' | 'download' | 'cancelled';
  fileName: string;
}

export async function shareCardWhatsApp(
  element: HTMLElement,
  studentName: string,
  assessmentDate: string,
  backgroundColor = '#09090B',
): Promise<ShareCardResult> {
  const options = await prepareCaptureOptions(element, backgroundColor);
  const fileName = buildFileName(studentName, assessmentDate);
  const blob = await toBlob(element, options);

  if (!blob) {
    throw new Error('Não foi possível gerar a imagem do card.');
  }

  const file = new File([blob], fileName, { type: 'image/png' });

  const canUseWebShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canUseWebShare) {
    try {
      await navigator.share({
        files: [file],
        title: `Medidas & Metas — ${studentName}`,
        text: `Evolução física de ${studentName} — Medidas & Metas`,
      });
      return { method: 'web-share', fileName };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { method: 'cancelled', fileName };
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return { method: 'download', fileName };
}
