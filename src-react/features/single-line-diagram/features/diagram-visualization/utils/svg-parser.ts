export const parseSvgString = (svgString: string): Document | null => {
  if (!svgString?.trim()) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('SVG parsing error:', parserError.textContent);
      return null;
    }

    return doc;
  } catch (error) {
    console.error('Error parsing SVG:', error);
    return null;
  }
};

export const validateSvgElement = (doc: Document): SVGSVGElement | null => {
  const svgElement = doc.documentElement;
  if (!svgElement || svgElement.tagName !== 'svg') {
    console.error('Invalid SVG document');
    return null;
  }

  if (svgElement instanceof SVGSVGElement) {
    return svgElement;
  }

  console.error('Document element is not an SVGSVGElement');
  return null;
};

export const extractViewBox = (svgElement: SVGSVGElement): string | null => {
  const viewBox = svgElement.getAttribute('viewBox');
  const width = svgElement.getAttribute('width');
  const height = svgElement.getAttribute('height');

  if (viewBox) return viewBox;
  if (width && height) return `0 0 ${width} ${height}`;
  return null;
};
