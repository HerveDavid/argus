import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import React, { useRef, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

import { NodeData, LinkData } from '../types';
import { EditorHeader } from './editor-header';
import { EditorFooter } from './editor-footer';
import { useGrafcetEditor } from '../hooks/use-grafcet-editor';
import { useGrafcetDiagram } from '../hooks/use-grafcet-diagram';

/**
 * GrafcetEditor - Point de montage principal
 * Responsabilités:
 * - Montage du diagramme GoJS
 * - Liaison entre le diagramme et la machine d'état
 * - Gestion des événements du diagramme
 * - Interface utilisateur (header, actions)
 */
export const GrafcetEditor = () => {
  const diagramRef = useRef<ReactDiagram>(null);

  // Hook pour la logique métier (machine d'état)
  const {
    context,
    canUndo,
    canRedo,
    hasSelection,
    isModified,
    isSaving,
    isExporting,
    isImporting,
    hasError,
    actions,
  } = useGrafcetEditor();

  // Hook pour la configuration du diagramme GoJS
  const { initDiagram } = useGrafcetDiagram();

  /**
   * Configuration des événements du diagramme
   */
  useEffect(() => {
    if (diagramRef.current === null) return;

    const diagram = diagramRef.current.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;

    const handleSelectionChanged = (e: go.DiagramEvent) => {
      const selection = e.subject.first();
      if (selection instanceof go.Node) {
        actions.selectNode(selection.key);
      } else if (selection instanceof go.Link) {
        actions.selectLink(selection.key);
      } else {
        actions.deselectAll();
      }
    };

    const handleModified = (e: go.DiagramEvent) => {
      // La modification est déjà gérée par onModelChange
      console.log('Diagram modified:', e.diagram.isModified);
    };

    diagram.addDiagramListener('ChangedSelection', handleSelectionChanged);
    diagram.addDiagramListener('Modified', handleModified);

    return () => {
      diagram.removeDiagramListener('ChangedSelection', handleSelectionChanged);
      diagram.removeDiagramListener('Modified', handleModified);
    };
  }, [actions]);

  /**
   * Gestion des changements du modèle GoJS
   */
  const handleModelChange = (incrementalData: go.IncrementalData) => {
    const diagram = diagramRef.current?.getDiagram();
    if (!diagram) return;

    // Nœuds modifiés
    incrementalData.modifiedNodeData?.forEach((nodeData) => {
      actions.updateNode(nodeData as NodeData);
    });

    // Nœuds supprimés
    incrementalData.removedNodeKeys?.forEach((key) => {
      actions.deleteNode(key);
    });

    // Nœuds ajoutés
    incrementalData.insertedNodeKeys?.forEach((key) => {
      const nodeData = diagram.model.findNodeDataForKey(key);
      if (nodeData) {
        actions.addNode(nodeData as NodeData);
      }
    });

    // Liens modifiés
    incrementalData.modifiedLinkData?.forEach((linkData) => {
      actions.updateLink(linkData as LinkData);
    });

    // Liens supprimés
    incrementalData.removedLinkKeys?.forEach((key) => {
      actions.deleteLink(key);
    });

    // Liens ajoutés
    incrementalData.insertedLinkKeys?.forEach((key) => {
      const linkData = diagram.model.findLinkDataForKey(key);
      if (linkData) {
        actions.addLink(linkData as LinkData);
      }
    });
  };

  /**
   * Gestion des erreurs
   */
  useEffect(() => {
    if (hasError && context.error) {
      alert(`Erreur: ${context.error.message}`);
      actions.dismissError();
    }
  }, [hasError, context.error, actions]);

  /**
   * Handlers pour les actions de l'interface
   */
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      actions.importFile(file);
    }
    event.target.value = '';
  };

  const handleUndo = () => {
    if (canUndo) {
      actions.undo();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      actions.redo();
    }
  };

  // Calcul des statistiques du diagramme
  const nodeCount = context.diagramData.nodeDataArray.length;
  const linkCount = context.diagramData.linkDataArray.length;
  const selectedCount = (context.selectedNodeKey !== null ? 1 : 0) +
    (context.selectedLinkKey !== null ? 1 : 0);

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="h-full flex flex-col border-0 rounded-none p-0 gap-0">
        <CardHeader className="p-0 m-0 gap-0">
          <EditorHeader
            onSave={actions.save}
            onExportJSON={actions.exportJSON}
            onImport={handleImport}
            onResetToExample={actions.resetToExample}
            onClearDiagram={actions.clearDiagram}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            isModified={isModified}
            isSaving={isSaving}
            isExporting={isExporting}
            isImporting={isImporting}
          />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-2 m-0">
          <ReactDiagram
            ref={diagramRef}
            divClassName="w-full h-full bg-background rounded"
            initDiagram={initDiagram}
            nodeDataArray={context.diagramData.nodeDataArray}
            linkDataArray={context.diagramData.linkDataArray}
            modelData={context.diagramData.modelData}
            onModelChange={handleModelChange}
            skipsDiagramUpdate={context.diagramData.skipsDiagramUpdate}
          />
        </CardContent>

        <CardFooter className="p-0 m-0">
          <EditorFooter
            onSave={actions.save}
            onValidate={actions.validate}
            onPreview={() => {/* TODO: Implement preview */}}
            onSettings={() => {/* TODO: Implement settings */}}
            isModified={isModified}
            isSaving={isSaving}
            isValidating={false} // TODO: Add validation state
            validationStatus={null} // TODO: Add validation logic
            validationMessage=""
            nodeCount={nodeCount}
            linkCount={linkCount}
            selectedCount={selectedCount}
          />
        </CardFooter>
      </Card>
    </div>
  );
};