/**
 * Self-contained Code 128B barcode encoder and SVG generator.
 * Produces crisp vector barcodes for POS thermal receipts and previews.
 */

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Encodes an ASCII string (chars 32-126) into Code 128B bar widths.
 */
export function encodeCode128B(text: string): number[] {
  const sanitized = text.replace(/[^\x20-\x7e]/g, '').trim() || '000000';
  const codes: number[] = [104]; // Start Code B
  let checksum = 104;

  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(106); // Stop

  const widths: number[] = [];
  for (const c of codes) {
    const pat = CODE128_PATTERNS[c];
    for (let j = 0; j < pat.length; j++) {
      widths.push(Number(pat[j]));
    }
  }
  return widths;
}

/**
 * Renders a Code 128B barcode as an inline SVG string with human-readable label.
 */
export function generateCode128Svg(
  value: string,
  options: { height?: number; showText?: boolean } = {},
): string {
  const cleanValue = value.replace(/[^\x20-\x7e]/g, '').trim() || '000000';
  const barHeight = options.height ?? 38;
  const showText = options.showText ?? true;
  const widths = encodeCode128B(cleanValue);
  const totalModules = widths.reduce((sum, w) => sum + w, 0);
  const quietZone = 8;
  const svgWidth = totalModules + quietZone * 2;
  const svgHeight = showText ? barHeight + 16 : barHeight;

  let x = quietZone;
  let rects = '';
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    if (i % 2 === 0) {
      rects += `<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="#000" />`;
    }
    x += w;
  }

  const labelSvg = showText
    ? `<text x="${svgWidth / 2}" y="${barHeight + 12}" text-anchor="middle" font-family="'Courier New', Courier, monospace" font-size="10" fill="#000">${escapeXml(cleanValue)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%;max-width:210px;height:auto;display:block;margin:6px auto 0;">${rects}${labelSvg}</svg>`;
}
