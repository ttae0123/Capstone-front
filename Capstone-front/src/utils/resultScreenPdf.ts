import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * React 화면 자체를 캡처해 A4 다중 페이지 PDF로 변환합니다.
 * 색상, Recharts SVG 차트, Gemini 분석 카드, 부품 상세 영역 등 현재 화면의 디자인을 보존합니다.
 * 이메일 모달은 캡처 영역 밖이고 data-pdf-ignore 요소는 제외됩니다.
 * 이미지 기반 PDF이므로 PDF 내 글자는 텍스트 선택이 불가능합니다.
 */
export async function createResultScreenPdf(node: HTMLElement): Promise<Blob> {
  if (!node.isConnected) throw new Error('결과 화면이 준비되지 않았습니다.');
  await document.fonts.ready;
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  const bounds = node.getBoundingClientRect();
  const cssWidth = Math.ceil(bounds.width);

  // 인쇄/이메일 버튼처럼 PDF에서 제외할 요소는 캡처 높이에도 포함하지 않습니다.
  // 기존 scrollHeight를 그대로 사용하면 실제 내용이 끝난 뒤 빈 A4 페이지가 생길 수 있습니다.
  const printableChildren = Array.from(node.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter(child => child.dataset.pdfIgnore !== 'true');
  const contentBottom = printableChildren.reduce((max, child) => {
    const rect = child.getBoundingClientRect();
    const marginBottom = Number.parseFloat(getComputedStyle(child).marginBottom) || 0;
    return Math.max(max, rect.bottom - bounds.top + marginBottom);
  }, 0);
  const cssHeight = Math.ceil(contentBottom + 16);

  if (cssWidth < 200 || cssHeight < 200) throw new Error('결과 화면 크기를 읽지 못했습니다.');
  if (cssHeight > 15_000) throw new Error('결과 화면이 너무 길어 PDF 생성이 어렵습니다.');

  let canvas: HTMLCanvasElement;
  try {
    canvas = await toCanvas(node, {
      backgroundColor: '#f9fafb',
      pixelRatio: 1.5,
      width: cssWidth,
      height: cssHeight,
      cacheBust: false,
      filter: (element: HTMLElement) => element.getAttribute?.('data-pdf-ignore') !== 'true',
      // 중요: html-to-image는 원본 요소의 계산된 margin 값까지 복제합니다.
      // 결과 화면의 mx-auto가 복제 시 400~800px 같은 고정 여백으로 남으면
      // 캡처 내용이 오른쪽으로 밀리고 왼쪽이 비는 문제가 발생합니다.
      // 실제 화면의 레이아웃은 건드리지 않고 캡처용 복제 루트만 보정합니다.
      style: {
        display: 'block',
        boxSizing: 'border-box',
        width: `${cssWidth}px`,
        maxWidth: 'none',
        minWidth: '0',
        height: `${cssHeight}px`,
        margin: '0',
        marginTop: '0',
        marginRight: '0',
        marginBottom: '0',
        marginLeft: '0',
        position: 'relative',
        left: '0',
        top: '0',
        right: 'auto',
        transform: 'none',
        transformOrigin: 'top left',
      },
    });
  } catch {
    throw new Error('화면 캡처에 실패했습니다. 차트나 글꼴 로딩 상태를 확인해 주세요.');
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: 'PickPC 추천 PC 조합 - 결과 화면', creator: 'PickPC' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const drawWidth = pageWidth - margin * 2;
  const drawHeight = pageHeight - margin * 2;
  const mmPerPixel = drawWidth / canvas.width;
  const maxSliceHeight = Math.floor(drawHeight / mmPerPixel);

  // 페이지 경계를 큰 섹션 사이에 놓아 카드와 차트가 잘리는 경우를 줄입니다.
  const box = node.getBoundingClientRect();
  const ratio = canvas.width / cssWidth;
  const boundaryYs = Array.from(node.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter(child => child.getAttribute('data-pdf-ignore') !== 'true')
    .map(child => Math.round((child.getBoundingClientRect().top - box.top) * ratio))
    .filter(y => y > 0 && y < canvas.height)
    .sort((a, b) => a - b);

  let y = 0;
  let pages = 0;
  while (y < canvas.height) {
    if (++pages > 20) throw new Error('PDF 페이지가 너무 많습니다.');
    const limit = Math.min(canvas.height, y + maxSliceHeight);
    const breakPoint = boundaryYs.filter(point => point > y + maxSliceHeight * 0.79 && point <= limit).pop();
    const end = breakPoint ?? limit;
    const h = end - y;
    if (h <= 0) throw new Error('PDF 페이지 나눔에 실패했습니다.');

    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = h;
    const context = slice.getContext('2d');
    if (!context) throw new Error('브라우저 PDF 생성 기능을 사용할 수 없습니다.');
    context.fillStyle = '#f9fafb';
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);

    if (pages > 1) pdf.addPage();
    pdf.addImage(slice.toDataURL('image/jpeg', 0.91), 'JPEG', margin, margin, drawWidth, h * mmPerPixel);
    slice.width = 0;
    slice.height = 0;
    y = end;
  }

  const result = pdf.output('blob');
  if (result.size > 12 * 1024 * 1024) {
    throw new Error('PDF 용량이 12MB를 초과했습니다. 브라우저 배율을 낮춘 후 재시도해 주세요.');
  }
  return result;
}
