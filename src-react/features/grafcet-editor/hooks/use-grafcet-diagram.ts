import * as go from 'gojs';
import { useCallback } from 'react';

import { CustomLinkingTool, BarLink } from '../types';

export const useGrafcetDiagram = () => {
  /**
   * Helper function for creating tooltips
   */
  const makeTooltip = useCallback((str: string) => {
    const $ = go.GraphObject.make;
    return $(go.Adornment, 'Auto').add(
      $(go.Shape, { fill: 'lightyellow', stroke: 'black' }),
      $(go.TextBlock, str, { margin: 4 }),
    );
  }, []);

  /**
   * Command button functions
   */
  const createCommandFunctions = useCallback((diagram: go.Diagram) => {
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

    return {
      addStep,
      canAddStep,
      addParallel,
      addExclusive,
      canAddSplit,
      startLinkDown,
      startLinkAround,
      startLinkUp,
      canStartLink,
    };
  }, []);

  /**
   * Create selection adornment with command buttons
   */
  const createSelectionAdornment = useCallback(
    (diagram: go.Diagram) => {
      const $ = go.GraphObject.make;
      const commands = createCommandFunctions(diagram);

      return $(go.Adornment, 'Auto').add(
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
            click: commands.addExclusive,
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
            .bindObject('visible', '', commands.canAddSplit),
          $('Button', {
            click: commands.addParallel,
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
            .bindObject('visible', '', commands.canAddSplit),
          $('Button', {
            click: commands.addStep,
            toolTip: makeTooltip('Add Step'),
          })
            .add(
              $(go.Shape, {
                geometryString: 'M0 0 L10 0 10 6 0 6z',
                fill: 'lightyellow',
                margin: 3,
              }),
            )
            .bindObject('visible', '', commands.canAddStep),
          $('Button', {
            click: commands.startLinkDown,
            toolTip: makeTooltip('Draw Link Down'),
          })
            .add(
              $(go.Shape, {
                geometryString: 'M0 0 M5 0 L5 10 M3 8 5 10 7 8 M10 0',
                fill: null,
                margin: 3,
              }),
            )
            .bindObject('visible', '', commands.canStartLink),
          $('Button', {
            click: commands.startLinkAround,
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
            .bindObject('visible', '', commands.canStartLink),
          $('Button', {
            click: commands.startLinkUp,
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
            .bindObject('visible', '', commands.canStartLink),
        ),
      );
    },
    [makeTooltip, createCommandFunctions],
  );

  /**
   * Create node templates
   */
  const createNodeTemplates = useCallback(
    (diagram: go.Diagram) => {
      const $ = go.GraphObject.make;
      const commandsAdornment = createSelectionAdornment(diagram);

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

      const templates = new go.Map<string, go.Node>();

      // Start node template
      templates.add(
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

      // Regular step node template
      templates.add(
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

      // Parallel node template
      templates.add(
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

      // Exclusive node template
      templates.add(
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

      return templates;
    },
    [createSelectionAdornment],
  );

  /**
   * Create link templates
   */
  const createLinkTemplates = useCallback(() => {
    const $ = go.GraphObject.make;
    const templates = new go.Map<string, go.Link>();

    // Regular link template
    templates.add(
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

    // Skip link template
    templates.add(
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

    // Repeat link template
    templates.add(
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

    return templates;
  }, []);

  /**
   * Initialize the GRAFCET diagram
   */
  const initDiagram = useCallback((): go.Diagram => {
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

    // Set up templates
    diagram.nodeTemplateMap = createNodeTemplates(diagram);
    diagram.linkTemplateMap = createLinkTemplates();

    return diagram;
  }, [createNodeTemplates, createLinkTemplates]);

  return {
    initDiagram,
  };
};
