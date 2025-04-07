// sld.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  getSingleLineDiagramWithMetadata,
  getSingleLineDiagram,
} from './get-single-line-diagram'; // adjust path as needed
import { SldMetadata } from '../types/sld-metatada';

// Mock for @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Test data fixtures
const mockSvgString =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';
const mockUint8Array = new TextEncoder().encode(mockSvgString);
const mockLineId = 'line_123';

// Mock metadata based on the SldMetadata interface
const mockMetadata: SldMetadata = {
  busInfos: [],
  busLegendInfos: [],
  components: [
    {
      type: 'BREAKER',
      size: { width: 20, height: 20 },
      anchorPoints: [{ orientation: 'HORIZONTAL' }],
    },
  ],
  feederInfos: [
    {
      id: 'feeder1',
      componentType: 'LINE',
      equipmentId: 'equip_123',
    },
  ],
  layoutParams: {
    adaptCellHeightToContent: true,
    busbarsAlignment: 'TOP',
    cellWidth: 50,
    cgmesDiagramName: null,
    cgmesScaleFactor: 1,
    cgmesUseNames: false,
    componentsOnBusbars: [],
    diagramPadding: { left: 10, top: 10, right: 10, bottom: 10 },
    externCellHeight: 40,
    horizontalBusPadding: 5,
    horizontalSnakeLinePadding: 10,
    internCellHeight: 30,
    maxComponentHeight: 80,
    minExternCellHeight: 20,
    minSpaceBetweenComponents: 5,
    removeFictitiousSwitchNodes: false,
    spaceForFeederInfos: 15,
    stackHeight: 5,
    verticalSnakeLinePadding: 10,
    verticalSpaceBus: 100,
    voltageLevelPadding: { left: 5, top: 5, right: 5, bottom: 5 },
    zoneLayoutSnakeLinePadding: 10,
  },
  lines: [],
  nodes: [
    {
      id: 'node1',
      componentType: 'BREAKER',
      equipmentId: 'equip_123',
      open: false,
      vid: 'voltage1',
      vlabel: true,
    },
  ],
  svgParams: {
    activePowerUnit: 'MW',
    angleLabelShift: 5,
    angleValuePrecision: 1,
    avoidSVGComponentsDuplication: true,
    busInfoMargin: 5,
    busesLegendAdded: true,
    cssLocation: '',
    currentUnit: 'A',
    currentValuePrecision: 0,
    diagramName: 'Test Diagram',
    displayConnectivityNodesId: false,
    displayCurrentFeederInfo: true,
    displayEquipmentNodesLabel: true,
    drawStraightWires: true,
    feederInfoSymmetry: true,
    feederInfosIntraMargin: 3,
    feederInfosOuterMargin: 5,
    labelCentered: true,
    labelDiagonal: false,
    languageTag: 'en',
    powerValuePrecision: 1,
    prefixId: 'sld_',
    reactivePowerUnit: 'MVAR',
    showGrid: false,
    showInternalNodes: false,
    svgWidthAndHeightAdded: true,
    tooltipEnabled: true,
    undefinedValueSymbol: '?',
    unifyVoltageLevelColors: false,
    useName: true,
    voltageValuePrecision: 1,
  },
  wires: [
    {
      id: 'wire1',
      nodeId1: 'node1',
      nodeId2: 'node2',
      snakeLine: true,
      straight: false,
    },
  ],
};

// Mock response objects
const mockResponses = {
  withMetadata: {
    svg: mockSvgString,
    metadata: mockMetadata,
  },
  svgOnly: {
    data: Array.from(mockUint8Array),
    mime_type: 'image/svg+xml',
  },
};

// Error messages
const errorMessages = {
  metadataFetch: 'Error fetching diagram with metadata',
  svgFetch: 'Error fetching diagram SVG',
};

describe('Single Line Diagram API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Clean up after all tests
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to configure invoke mock
  const mockInvoke = (returnValue: any) => {
    vi.mocked(invoke).mockResolvedValue(returnValue);
  };

  // Helper function to configure invoke mock to reject
  const mockInvokeFailure = (errorMessage: string) => {
    vi.mocked(invoke).mockRejectedValue(new Error(errorMessage));
  };

  describe('getSingleLineDiagramWithMetadata', () => {
    it('should return SVG blob and metadata when invoke succeeds', async () => {
      mockInvoke(mockResponses.withMetadata);

      const result = await getSingleLineDiagramWithMetadata(mockLineId);

      expect(invoke).toHaveBeenCalledWith(
        'get_single_line_diagram_with_metadata',
        {
          line_id: mockLineId,
        },
      );

      // Check if result contains a Blob and metadata
      expect(result).toHaveProperty('svgBlob');
      expect(result).toHaveProperty('metadata');

      // Verify blob content
      // Instead of using Blob.text() which may not be available in the test environment
      expect(result.svgBlob).toBeInstanceOf(Blob);
      expect(result.svgBlob.type).toBe('image/svg+xml');

      // We can verify the blob was created with the right content by checking its size
      // The size should match our mock SVG string length
      expect(result.svgBlob.size).toBe(mockSvgString.length);

      // Verify metadata
      expect(result.metadata).toEqual(mockMetadata);
    });

    it('should handle error when invoke rejects', async () => {
      mockInvokeFailure(errorMessages.metadataFetch);

      await expect(
        getSingleLineDiagramWithMetadata(mockLineId),
      ).rejects.toThrow(errorMessages.metadataFetch);

      expect(invoke).toHaveBeenCalledWith(
        'get_single_line_diagram_with_metadata',
        {
          line_id: mockLineId,
        },
      );
    });
  });

  describe('getSingleLineDiagram', () => {
    it('should return SVG blob when invoke succeeds', async () => {
      mockInvoke(mockResponses.svgOnly);

      const result = await getSingleLineDiagram(mockLineId);

      expect(invoke).toHaveBeenCalledWith('get_single_line_diagram', {
        line_id: mockLineId,
      });

      // Check if result is a Blob
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/svg+xml');

      // Instead of converting Blob to array (which might not be supported in test env)
      // Verify the result is a Blob with expected properties
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/svg+xml');

      // Check the size matches our mock data
      expect(result.size).toBe(mockResponses.svgOnly.data.length);
    });

    it('should handle error when invoke rejects', async () => {
      mockInvokeFailure(errorMessages.svgFetch);

      await expect(getSingleLineDiagram(mockLineId)).rejects.toThrow(
        errorMessages.svgFetch,
      );

      expect(invoke).toHaveBeenCalledWith('get_single_line_diagram', {
        line_id: mockLineId,
      });
    });
  });
});
