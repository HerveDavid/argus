import { SldMetadata, Node, Wire, FeederInfo } from '@/types/sld-metadata';
import { ElementData } from '../../../types';
import { parseSvgString } from './svg-parser';

const createMetadataMaps = (metadata?: SldMetadata) => {
  const nodeMap = new Map<string, Node>();
  const wireMap = new Map<string, Wire>();
  const feederMap = new Map<string, FeederInfo>();

  metadata?.nodes?.forEach((node) => {
    if (node?.id) {
      nodeMap.set(node.id, node);
      if (node.equipmentId) nodeMap.set(node.equipmentId, node);
    }
  });

  metadata?.wires?.forEach((wire) => {
    if (wire?.id) wireMap.set(wire.id, wire);
  });

  metadata?.feederInfos?.forEach((feeder) => {
    if (feeder?.id) feederMap.set(feeder.id, feeder);
  });

  return { nodeMap, wireMap, feederMap };
};

const determineElementType = (
  element: Element,
  node?: Node,
  wire?: Wire,
  feeder?: FeederInfo,
): { type: ElementData['type']; priority: number } => {
  const classList = element.getAttribute('class')?.split(' ') || [];

  if (classList.includes('sld-breaker') || node?.componentType === 'BREAKER') {
    return { type: 'breaker', priority: 1 };
  }
  if (
    classList.includes('sld-disconnector') ||
    node?.componentType === 'DISCONNECTOR'
  ) {
    return { type: 'disconnector', priority: 2 };
  }
  if (classList.includes('sld-wire') || wire) {
    return { type: 'wire', priority: 3 };
  }
  if (classList.some((cls) => cls.includes('feeder')) || feeder) {
    return { type: 'feeder', priority: 4 };
  }
  if (classList.includes('sld-busbar-section')) {
    return { type: 'busbar', priority: 2 };
  }
  if (classList.includes('sld-node')) {
    return { type: 'node', priority: 6 };
  }
  return { type: 'other', priority: 5 };
};

const extractPowerData = (
  element: Element,
  type: ElementData['type'],
): { powerActive?: number; powerReactive?: number } => {
  if (type !== 'feeder' || !element.textContent) return {};

  const classList = element.getAttribute('class')?.split(' ') || [];
  const text = element.textContent.trim();
  const numValue = parseFloat(text);

  if (isNaN(numValue)) return {};

  if (classList.includes('sld-active-power')) {
    return { powerActive: numValue };
  }
  if (classList.includes('sld-reactive-power')) {
    return { powerReactive: numValue };
  }

  return {};
};

export const enrichElementsWithMetadata = (
  svgString: string,
  metadata?: SldMetadata,
): ElementData[] => {
  const doc = parseSvgString(svgString);
  if (!doc) return [];

  const { nodeMap, wireMap, feederMap } = createMetadataMaps(metadata);
  const elements: ElementData[] = [];

  doc.querySelectorAll('[id]').forEach((element) => {
    if (!element?.id || element.id.trim() === '') return;

    const node = nodeMap.get(element.id);
    const wire = wireMap.get(element.id);
    const feeder = feederMap.get(element.id);

    const { type, priority } = determineElementType(
      element,
      node,
      wire,
      feeder,
    );
    const powerData = extractPowerData(element, type);

    elements.push({
      id: element.id,
      type,
      element: element.cloneNode(true) as Element,
      transform: element.getAttribute('transform') || undefined,
      fill: element.getAttribute('fill') || undefined,
      stroke: element.getAttribute('stroke') || undefined,
      className: element.getAttribute('class') || undefined,
      d: element.getAttribute('d') || undefined,
      equipmentId: node?.equipmentId,
      isOpen: node?.open,
      direction: node?.direction,
      ...powerData,
      priority,
    });
  });

  return elements.sort((a, b) => a.priority - b.priority);
};
