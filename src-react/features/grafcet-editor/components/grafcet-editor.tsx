import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import React, { useRef, useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

import {
  NodeData,
  LinkData,
  DiagramData,
  CustomLinkingTool,
  BarLink,
} from '../types';

import { EditorHeader } from './editor-header';

// Main component with proper TypeScript typing
export const GrafcetEditor = () => {
  const diagramRef = useRef<ReactDiagram>(null);
  const [_selectedKey, setSelectedKey] = useState<number | null>(null);

  // Initial diagram data
  const [diagramData, setDiagramData] = useState<DiagramData>({
    nodeDataArray: [
      {
        key: 11,
        category: 'Start',
        location: '300 350',
        step: '11',
        text: 'Action 1',
      },
      { key: 12, category: 'Exclusive', location: '300 400' },
      { key: 13, location: '225 450', step: '13', text: 'Action 2' },
      { key: 14, location: '325 475', step: '14', text: 'Action 3' },
      { key: 15, location: '225 500', step: '15', text: 'Action 4' },
      { key: 16, category: 'Exclusive', location: '300 550' },
      { key: 17, location: '300 600', step: '17', text: 'Action 6' },
    ],
    linkDataArray: [
      { key: -1, from: 1, to: 2, text: 'condition 1' },
      { key: -2, from: 2, to: 3 },
      { key: -3, from: 2, to: 4 },
      { key: -4, from: 3, to: 5, text: 'condition 2' },
      { key: -5, from: 4, to: 6 },
      { key: -6, from: 5, to: 6 },
      { key: -7, from: 6, to: 7, text: 'condition 5' },
      { key: -8, from: 11, to: 12, text: 'condition 1' },
      { key: -9, from: 12, to: 13, text: 'condition 12' },
      { key: -10, from: 12, to: 14, text: 'condition 13' },
      { key: -11, from: 13, to: 15, text: 'condition 2' },
      { key: -12, from: 14, to: 16, text: 'condition 14' },
      { key: -13, from: 15, to: 16, text: 'condition 15' },
      { key: -14, from: 16, to: 17, text: 'condition 5' },
      { key: -15, from: 21, to: 22, text: 'c1' },
      { key: -16, from: 22, to: 23, text: 'c2' },
      { key: -17, from: 23, to: 24, text: 'c3' },
      { key: -18, from: 21, to: 24, text: 'c14', category: 'Skip' },
      { key: -19, from: 31, to: 32, text: 'c1' },
      { key: -20, from: 32, to: 33, text: 'c2' },
      { key: -21, from: 33, to: 34, text: 'c3' },
      { key: -22, from: 33, to: 32, text: 'c14', category: 'Repeat' },
    ],
    modelData: { canRelink: true },
    skipsDiagramUpdate: false,
  });

  // Add diagram event listeners
  useEffect(() => {
    if (diagramRef.current === null) return;

    const diagram = diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener('ChangedSelection', handleDiagramEvent);
      diagram.addDiagramListener('Modified', handleModified);
    }

    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener('ChangedSelection', handleDiagramEvent);
        diagram.removeDiagramListener('Modified', handleModified);
      }
    };
  }, []);

  /**
   * Initialize the GRAFCET diagram
   */
  const initDiagram = (): go.Diagram => {
    const $ = go.GraphObject.make;

    const diagram = new go.Diagram({
      allowLink: false, // linking only starts via buttons
      'clickCreatingTool.archetypeNodeData': {
        category: 'Start',
        step: 1,
        text: 'Action',
      },
      linkingTool: new CustomLinkingTool(),
      'undoManager.isEnabled': true,
      model: new go.GraphLinksModel({
        linkKeyProperty: 'key',
        makeUniqueKeyFunction: (m: go.Model, data: go.ObjectData) => {
          let k = data.key || 1;
          while (m.findNodeDataForKey(k)) k++;
          data.key = k;
          return k;
        },
        makeUniqueLinkKeyFunction: (
          m: go.GraphLinksModel,
          data: go.ObjectData,
        ) => {
          let k = data.key || -1;
          while (m.findLinkDataForKey(k)) k--;
          data.key = k;
          return k;
        },
      }),
    });

    // Helper function for creating tooltips
    const makeTooltip = (str: string) => {
      return $(go.Adornment, 'Auto').add(
        $(go.Shape, { fill: 'lightyellow', stroke: 'black' }),
        $(go.TextBlock, str, { margin: 4 }),
      );
    };

    // Command button functions
    const addStep = (_e: go.InputEvent, obj: go.GraphObject) => {
      const adornment = obj.part as go.Adornment;
      const node = adornment.adornedPart as go.Node;
      const model = diagram.model;
      model.startTransaction('add Step');
      const loc = node.location.copy();
      loc.y += 50;
      const nodedata = { location: go.Point.stringify(loc) };
      model.addNodeData(nodedata);
      const nodekey = model.getKeyForNodeData(nodedata);
      const linkdata = {
        from: model.getKeyForNodeData(node.data),
        to: nodekey,
        text: 'c',
      };
      model.addLinkData(linkdata);
      const newnode = diagram.findNodeForData(nodedata);
      if (newnode) diagram.select(newnode);
      model.commitTransaction('add Step');
    };

    const canAddStep = (adornment: go.Adornment) => {
      const node = adornment.adornedPart as go.Node;
      if (node.category === '' || node.category === 'Start') {
        return node.findLinksOutOf().count === 0;
      } else if (
        node.category === 'Parallel' ||
        node.category === 'Exclusive'
      ) {
        return true;
      }
      return false;
    };

    const addParallel = (e: go.InputEvent, obj: go.GraphObject) => {
      const adornment = obj.part as go.Adornment;
      const node = adornment.adornedPart as go.Node;
      addSplit(node, 'Parallel');
    };

    const addExclusive = (e: go.InputEvent, obj: go.GraphObject) => {
      const adornment = obj.part as go.Adornment;
      const node = adornment.adornedPart as go.Node;
      addSplit(node, 'Exclusive');
    };

    const addSplit = (node: go.Node, type: string) => {
      const model = diagram.model;
      model.startTransaction('add ' + type);
      const loc = node.location.copy();
      loc.y += 50;
      const nodedata = { category: type, location: go.Point.stringify(loc) };
      model.addNodeData(nodedata);
      const nodekey = model.getKeyForNodeData(nodedata);
      const linkdata = {
        from: model.getKeyForNodeData(node.data),
        to: nodekey,
      };
      model.addLinkData(linkdata);
      const newnode = diagram.findNodeForData(nodedata);
      if (newnode) diagram.select(newnode);
      model.commitTransaction('add ' + type);
    };

    const canAddSplit = (adornment: go.Adornment) => {
      const node = adornment.adornedPart as go.Node;
      if (node.category === '' || node.category === 'Start') {
        return node.findLinksOutOf().count === 0;
      }
      return false;
    };

    const startLinkDown = (e: go.InputEvent, obj: go.GraphObject) => {
      const adornment = obj.part as go.Adornment;
      const node = adornment.adornedPart as go.Node;
      startLink(node, '', 'c');
    };

    const startLinkAround = (e: go.InputEvent, obj: go.GraphObject) => {
      const adornment = obj.part as go.Adornment;
      const node = adornment.adornedPart as go.Node;
      startLink(node, 'Skip', 's');
    };

    const startLinkUp = (e: go.InputEvent, obj: go.GraphObject) => {
      const adornment = obj.part as go.Adornment;
      const node = adornment.adornedPart as go.Node;
      startLink(node, 'Repeat', 'r');
    };

    const startLink = (node: go.Node, category: string, condition: string) => {
      const tool = diagram.toolManager.linkingTool;
      diagram.model.setCategoryForLinkData(tool.archetypeLinkData, category);
      tool.archetypeLinkData.text = condition;
      tool.startObject = node.port;
      diagram.currentTool = tool;
      tool.doActivate();
    };

    const canStartLink = () => {
      return true; // Could be more intelligent
    };

    // Selection adornment with command buttons
    const commandsAdornment = $(go.Adornment, 'Auto').add(
      $(go.Panel, 'Auto').add(
        $(go.Shape, {
          fill: null,
          stroke: 'deepskyblue',
          strokeWidth: 2,
          shadowVisible: false,
        }),
        $(go.Placeholder),
      ),
      $(go.Panel, 'Horizontal', { defaultStretch: go.Stretch.Vertical }).add(
        $('Button', {
          click: addExclusive,
          toolTip: makeTooltip('Add Exclusive'),
        })
          .add(
            $(go.Shape, {
              geometryString: 'M0 0 L10 0',
              fill: null,
              stroke: 'red',
              margin: 3,
            }),
          )
          .bindObject('visible', '', canAddSplit),
        $('Button', {
          click: addParallel,
          toolTip: makeTooltip('Add Parallel'),
        })
          .add(
            $(go.Shape, {
              geometryString: 'M0 0 L10 0 M0 3 10 3',
              fill: null,
              stroke: 'red',
              margin: 3,
            }),
          )
          .bindObject('visible', '', canAddSplit),
        $('Button', {
          click: addStep,
          toolTip: makeTooltip('Add Step'),
        })
          .add(
            $(go.Shape, {
              geometryString: 'M0 0 L10 0 10 6 0 6z',
              fill: 'lightyellow',
              margin: 3,
            }),
          )
          .bindObject('visible', '', canAddStep),
        $('Button', {
          click: startLinkDown,
          toolTip: makeTooltip('Draw Link Down'),
        })
          .add(
            $(go.Shape, {
              geometryString: 'M0 0 M5 0 L5 10 M3 8 5 10 7 8 M10 0',
              fill: null,
              margin: 3,
            }),
          )
          .bindObject('visible', '', canStartLink),
        $('Button', {
          click: startLinkAround,
          toolTip: makeTooltip('Draw Link Skip'),
        })
          .add(
            $(go.Shape, {
              geometryString:
                'M0 0 M3 0 L3 2 7 2 7 6 3 6 3 10 M1 8 3 10 5 8 M10 0',
              fill: null,
              margin: 3,
            }),
          )
          .bindObject('visible', '', canStartLink),
        $('Button', {
          click: startLinkUp,
          toolTip: makeTooltip('Draw Link Repeat'),
        })
          .add(
            $(go.Shape, {
              geometryString:
                'M0 0 M3 2 L3 0 7 0 7 10 3 10 3 8 M5 6 7 4 9 6 M10 0',
              fill: null,
              margin: 3,
            }),
          )
          .bindObject('visible', '', canStartLink),
      ),
    );

    // Common node style helper
    const commonNodeStyle = () => {
      return {
        locationSpot: go.Spot.Center,
        selectionAdornmentTemplate: commandsAdornment,
      };
    };

    const applyCommonNodeBindings = (node: go.Node) => {
      node.bindTwoWay(
        'location',
        'location',
        go.Point.parse,
        go.Point.stringify,
      );
      return node;
    };

    // Node templates
    diagram.nodeTemplateMap.add(
      'Start',
      applyCommonNodeBindings(
        $(go.Node, 'Horizontal', {
          ...commonNodeStyle(),
          locationObjectName: 'STEPPANEL',
          selectionObjectName: 'STEPPANEL',
        }).add(
          $(go.Panel, 'Auto', {
            name: 'STEPPANEL',
            portId: '',
            fromSpot: go.Spot.Bottom,
            fromLinkable: true,
          }).add(
            $(go.Shape, { fill: 'lightgreen' }),
            $(go.Panel, 'Auto', { margin: 3 }).add(
              $(go.Shape, {
                fill: null,
                minSize: new go.Size(20, 20),
              }),
              $(go.TextBlock, 'Start', {
                margin: 3,
                editable: true,
              }).bindTwoWay('text', 'step'),
            ),
          ),
          $(go.Shape, 'LineH', { width: 10, height: 1 }),
          $(go.Panel, 'Auto').add(
            $(go.Shape, { fill: 'white' }),
            $(go.TextBlock, 'Action', {
              margin: 3,
              editable: true,
            }).bindTwoWay('text'),
          ),
        ),
      ),
    );

    diagram.nodeTemplateMap.add(
      '',
      applyCommonNodeBindings(
        $(go.Node, 'Horizontal', {
          ...commonNodeStyle(),
          locationObjectName: 'STEPPANEL',
          selectionObjectName: 'STEPPANEL',
        }).add(
          $(go.Panel, 'Auto', {
            name: 'STEPPANEL',
            portId: '',
            fromSpot: go.Spot.Bottom,
            fromLinkable: true,
            toSpot: go.Spot.Top,
            toLinkable: true,
          }).add(
            $(go.Shape, {
              fill: 'lightyellow',
              minSize: new go.Size(20, 20),
            }),
            $(go.TextBlock, 'Step', {
              margin: 3,
              editable: true,
            }).bindTwoWay('text', 'step'),
          ),
          $(go.Shape, 'LineH', { width: 10, height: 1 }),
          $(go.Panel, 'Auto').add(
            $(go.Shape, { fill: 'white' }),
            $(go.TextBlock, 'Action', {
              margin: 3,
              editable: true,
            }).bindTwoWay('text'),
          ),
        ),
      ),
    );

    const resizeAdornment = $(go.Adornment, 'Spot').add(
      $(go.Placeholder),
      $(go.Shape, {
        alignment: go.Spot.Left,
        cursor: 'col-resize',
        desiredSize: new go.Size(6, 6),
        fill: 'lightblue',
        stroke: 'dodgerblue',
      }),
      $(go.Shape, {
        alignment: go.Spot.Right,
        cursor: 'col-resize',
        desiredSize: new go.Size(6, 6),
        fill: 'lightblue',
        stroke: 'dodgerblue',
      }),
    );

    diagram.nodeTemplateMap.add(
      'Parallel',
      applyCommonNodeBindings(
        $(go.Node, {
          ...commonNodeStyle(),
          resizable: true,
          resizeObjectName: 'SHAPE',
          resizeAdornmentTemplate: resizeAdornment,
          fromLinkable: true,
          toLinkable: true,
        }).add(
          $(go.Shape, {
            name: 'SHAPE',
            geometryString: 'M0 0 L100 0 M0 4 L100 4',
            fill: 'transparent',
            stroke: 'red',
            width: 200,
          }).bindTwoWay(
            'desiredSize',
            'size',
            go.Size.parse,
            go.Size.stringify,
          ),
        ),
      ),
    );

    diagram.nodeTemplateMap.add(
      'Exclusive',
      applyCommonNodeBindings(
        $(go.Node, {
          ...commonNodeStyle(),
          resizable: true,
          resizeObjectName: 'SHAPE',
          resizeAdornmentTemplate: resizeAdornment,
          fromLinkable: true,
          toLinkable: true,
        }).add(
          $(go.Shape, {
            name: 'SHAPE',
            geometryString: 'M0 0 L100 0',
            fill: 'transparent',
            stroke: 'red',
            width: 200,
          }).bindTwoWay(
            'desiredSize',
            'size',
            go.Size.parse,
            go.Size.stringify,
          ),
        ),
      ),
    );

    // Link templates
    diagram.linkTemplateMap.add(
      '',
      $(BarLink, { routing: go.Routing.Orthogonal }).add(
        $(go.Shape, { strokeWidth: 1.5 }),
        $(go.Shape, 'LineH', {
          width: 20,
          height: 1,
          visible: false,
        }).bind('visible', 'text', (t: string) => t !== ''),
        $(go.TextBlock, {
          alignmentFocus: new go.Spot(0, 0.5, -12, 0),
          editable: true,
        })
          .bindTwoWay('text')
          .bind('visible', 'text', (t: string) => t !== ''),
      ),
    );

    diagram.linkTemplateMap.add(
      'Skip',
      $(go.Link, {
        routing: go.Routing.AvoidsNodes,
        fromSpot: go.Spot.Bottom,
        toSpot: go.Spot.Top,
        fromEndSegmentLength: 4,
        toEndSegmentLength: 4,
      }).add(
        $(go.Shape, { strokeWidth: 1.5 }),
        $(go.Shape, 'LineH', {
          width: 20,
          height: 1,
          visible: false,
        }).bind('visible', 'text', (t: string) => t !== ''),
        $(go.TextBlock, {
          alignmentFocus: new go.Spot(1, 0.5, 12, 0),
          editable: true,
        })
          .bindTwoWay('text')
          .bind('visible', 'text', (t: string) => t !== ''),
      ),
    );

    diagram.linkTemplateMap.add(
      'Repeat',
      $(go.Link, {
        routing: go.Routing.AvoidsNodes,
        fromSpot: go.Spot.Bottom,
        toSpot: go.Spot.Top,
        fromEndSegmentLength: 4,
        toEndSegmentLength: 4,
      }).add(
        $(go.Shape, { strokeWidth: 1.5 }),
        $(go.Shape, {
          toArrow: 'OpenTriangle',
          segmentIndex: 3,
          segmentFraction: 0.75,
        }),
        $(go.Shape, {
          toArrow: 'OpenTriangle',
          segmentIndex: 3,
          segmentFraction: 0.25,
        }),
        $(go.Shape, 'LineH', {
          width: 20,
          height: 1,
          visible: false,
        }).bind('visible', 'text', (t: string) => t !== ''),
        $(go.TextBlock, {
          alignmentFocus: new go.Spot(1, 0.5, 12, 0),
          editable: true,
        })
          .bindTwoWay('text')
          .bind('visible', 'text', (t: string) => t !== ''),
      ),
    );

    return diagram;
  };

  /**
   * Handle diagram events
   */
  const handleDiagramEvent = (e: go.DiagramEvent) => {
    const { name } = e;
    switch (name) {
      case 'ChangedSelection': {
        const sel = e.subject.first();
        if (sel && sel instanceof go.Node) {
          setSelectedKey(sel.key);
        } else {
          setSelectedKey(null);
        }
        break;
      }
      default:
        break;
    }
  };

  /**
   * Handle diagram modifications
   */
  const handleModified = (e: go.DiagramEvent) => {
    console.log('Diagram modified:', e.diagram.isModified);
  };

  /**
   * Handle model changes
   */
  const handleModelChange = (obj: go.IncrementalData) => {
    setDiagramData((prev) => {
      const newData = { ...prev };

      // Handle modified nodes
      if (obj.modifiedNodeData) {
        obj.modifiedNodeData.forEach((nodeData) => {
          const index = newData.nodeDataArray.findIndex(
            (n) => n.key === nodeData.key,
          );
          if (index !== -1) {
            newData.nodeDataArray[index] = {
              ...newData.nodeDataArray[index],
              ...nodeData,
            };
          }
        });
      }

      // Handle removed nodes
      if (obj.removedNodeKeys) {
        obj.removedNodeKeys.forEach((key) => {
          newData.nodeDataArray = newData.nodeDataArray.filter(
            (n) => n.key !== key,
          );
        });
      }

      // Handle added nodes
      if (obj.insertedNodeKeys) {
        const diagram = diagramRef.current?.getDiagram();
        if (diagram) {
          obj.insertedNodeKeys.forEach((key) => {
            const nodeData = diagram.model.findNodeDataForKey(key);
            if (nodeData && !newData.nodeDataArray.find((n) => n.key === key)) {
              newData.nodeDataArray.push(nodeData as NodeData);
            }
          });
        }
      }

      // Handle modified links
      if (obj.modifiedLinkData) {
        obj.modifiedLinkData.forEach((linkData) => {
          const index = newData.linkDataArray.findIndex(
            (l) => l.key === linkData.key,
          );
          if (index !== -1) {
            newData.linkDataArray[index] = {
              ...newData.linkDataArray[index],
              ...linkData,
            };
          }
        });
      }

      // Handle removed links
      if (obj.removedLinkKeys) {
        obj.removedLinkKeys.forEach((key) => {
          newData.linkDataArray = newData.linkDataArray.filter(
            (l) => l.key !== key,
          );
        });
      }

      // Handle added links
      if (obj.insertedLinkKeys) {
        const diagram = diagramRef.current?.getDiagram();
        if (diagram) {
          obj.insertedLinkKeys.forEach((key) => {
            const linkData = diagram.model.findLinkDataForKey(key);
            if (linkData && !newData.linkDataArray.find((l) => l.key === key)) {
              newData.linkDataArray.push(linkData as LinkData);
            }
          });
        }
      }

      newData.skipsDiagramUpdate = true;
      return newData;
    });
  };

  /**
   * Save the model to a JSON file
   */
  const saveModel = () => {
    const diagram = diagramRef.current?.getDiagram();
    if (diagram) {
      const jsonData = diagram.model.toJson();
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
      const exportFileDefaultName = 'grafcet-model.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      diagram.isModified = false;
    }
  };

  /**
   * Load the model from current state
   */
  const loadModel = () => {
    if (diagramRef.current) {
      diagramRef.current.clear();
      setDiagramData((prev) => ({
        ...prev,
        skipsDiagramUpdate: false,
      }));
    }
  };

  /**
   * Import a model from a JSON file
   */
  const importModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const parsedData = JSON.parse(jsonData);

        if (diagramRef.current) {
          diagramRef.current.clear();
          setDiagramData({
            nodeDataArray: parsedData.nodeDataArray || [],
            linkDataArray: parsedData.linkDataArray || [],
            modelData: { canRelink: true },
            skipsDiagramUpdate: false,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        alert('Erreur lors du chargement du fichier: ' + errorMessage);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  /**
   * Reset to example data
   */
  const resetToExample = () => {
    if (diagramRef.current) {
      diagramRef.current.clear();
      setDiagramData({
        nodeDataArray: [
          {
            key: 11,
            category: 'Start',
            location: '300 350',
            step: '11',
            text: 'Action 1',
          },
          { key: 12, category: 'Exclusive', location: '300 400' },
          { key: 13, location: '225 450', step: '13', text: 'Action 2' },
          { key: 14, location: '325 475', step: '14', text: 'Action 3' },
          { key: 15, location: '225 500', step: '15', text: 'Action 4' },
          { key: 16, category: 'Exclusive', location: '300 550' },
          { key: 17, location: '300 600', step: '17', text: 'Action 6' },
        ],
        linkDataArray: [
          { key: -1, from: 1, to: 2, text: 'condition 1' },
          { key: -2, from: 2, to: 3 },
          { key: -3, from: 2, to: 4 },
          { key: -4, from: 3, to: 5, text: 'condition 2' },
          { key: -5, from: 4, to: 6 },
          { key: -6, from: 5, to: 6 },
          { key: -7, from: 6, to: 7, text: 'condition 5' },
          { key: -8, from: 11, to: 12, text: 'condition 1' },
          { key: -9, from: 12, to: 13, text: 'condition 12' },
          { key: -10, from: 12, to: 14, text: 'condition 13' },
          { key: -11, from: 13, to: 15, text: 'condition 2' },
          { key: -12, from: 14, to: 16, text: 'condition 14' },
          { key: -13, from: 15, to: 16, text: 'condition 15' },
          { key: -14, from: 16, to: 17, text: 'condition 5' },
          { key: -15, from: 21, to: 22, text: 'c1' },
          { key: -16, from: 22, to: 23, text: 'c2' },
          { key: -17, from: 23, to: 24, text: 'c3' },
          { key: -18, from: 21, to: 24, text: 'c14', category: 'Skip' },
          { key: -19, from: 31, to: 32, text: 'c1' },
          { key: -20, from: 32, to: 33, text: 'c2' },
          { key: -21, from: 33, to: 34, text: 'c3' },
          { key: -22, from: 33, to: 32, text: 'c14', category: 'Repeat' },
        ],
        modelData: { canRelink: true },
        skipsDiagramUpdate: false,
      });
    }
  };

  /**
   * Clear the diagram
   */
  const clearDiagram = () => {
    if (diagramRef.current) {
      diagramRef.current.clear();
      setDiagramData((prev) => ({
        ...prev,
        nodeDataArray: [],
        linkDataArray: [],
        skipsDiagramUpdate: false,
      }));
    }
  };

  // Render the component
  return (
    <div className="w-full h-full flex flex-col">
      <Card className="h-full flex flex-col border-0 rounded-none p-2 gap-2">
        <CardHeader className="p-0 gap-0"><EditorHeader /></CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 m-0">
          <ReactDiagram
            ref={diagramRef}
            divClassName="w-full h-full bg-background rounded"
            initDiagram={initDiagram}
            nodeDataArray={diagramData.nodeDataArray}
            linkDataArray={diagramData.linkDataArray}
            modelData={diagramData.modelData}
            onModelChange={handleModelChange}
            skipsDiagramUpdate={diagramData.skipsDiagramUpdate}
          />
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
};
