import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  RefreshCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { useSldStore } from '../stores/sld.store';

export interface SingleLineDiagram {
  id: string;
}

export const Sld: React.FC<SingleLineDiagram> = ({ id }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    isLoading,
    isLoaded,
    isError,
    diagramData,
    error,
    lineId,
    cacheSize,
    loadDiagram,
    clearDiagram,
    clearCache,
    retry,
    isInCache,
  } = useSldStore();

  // Charge automatiquement le diagramme quand l'ID change
  useEffect(() => {
    if (id) {
      loadDiagram(id);
    }
  }, [id, loadDiagram]);

  // Fonction pour rendre le SVG avec D3
  useEffect(() => {
    if (!isLoaded || !diagramData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Nettoie le contenu précédent
    svg.selectAll('*').remove();

    try {
      // Parse le SVG string
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(diagramData.svg, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Récupère les dimensions du SVG original
      const viewBox = svgElement.getAttribute('viewBox');
      const originalWidth = svgElement.getAttribute('width');
      const originalHeight = svgElement.getAttribute('height');

      // Configure le SVG container
      if (viewBox) {
        svg.attr('viewBox', viewBox);
      } else if (originalWidth && originalHeight) {
        svg.attr('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
      }

      // Importe le contenu du SVG
      const svgContent = svgElement.innerHTML;
      svg.node()!.innerHTML = svgContent;

      // Ajoute les fonctionnalités de zoom et pan avec D3
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          const g = svg.select('g.zoom-group');
          if (g.empty()) {
            // Créer un groupe pour le zoom s'il n'existe pas
            const content = svg.node()!.innerHTML;
            svg.node()!.innerHTML = '';
            const zoomGroup = svg.append('g').attr('class', 'zoom-group');
            zoomGroup.node()!.innerHTML = content;
          }
          svg.select('g.zoom-group').attr('transform', event.transform);
        });

      svg.call(zoom);

      // Wrap le contenu existant dans un groupe pour le zoom
      if (svg.select('g.zoom-group').empty()) {
        const content = svg.node()!.innerHTML;
        svg.node()!.innerHTML = '';
        const zoomGroup = svg.append('g').attr('class', 'zoom-group');
        zoomGroup.node()!.innerHTML = content;
      }

      // Ajuste la taille du SVG au container
      svg
        .attr('width', '100%')
        .attr('height', '100%')
        .style('border', '1px solid #e2e8f0')
        .style('border-radius', '0.5rem');

      // Ajoute des événements aux éléments interactifs si nécessaire
      addInteractivity(svg, diagramData.metadata);
    } catch (error) {
      console.error('Erreur lors du rendu SVG:', error);
    }
  }, [isLoaded, diagramData]);

  // Fonction pour ajouter l'interactivité aux éléments SVG
  const addInteractivity = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    metadata: any,
  ) => {
    // Ajoute des tooltips aux composants
    svg
      .selectAll('[data-equipment-id]')
      .on('mouseover', function (event, d) {
        const equipmentId = d3.select(this).attr('data-equipment-id');
        // Créer et afficher tooltip
        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'sld-tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        tooltip.transition().duration(200).style('opacity', 1);

        tooltip
          .html(`Equipment ID: ${equipmentId}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', function () {
        d3.selectAll('.sld-tooltip').remove();
      })
      .on('click', function (event, d) {
        const equipmentId = d3.select(this).attr('data-equipment-id');
        console.log('Clicked equipment:', equipmentId);
        // Ajouter votre logique de clic ici
      });

    // Ajoute des effets de survol
    svg
      .selectAll('rect, circle, path')
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).style('opacity', 0.8);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 1);
      });
  };

  // Fonctions de contrôle du zoom
  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1 / 1.5);
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity,
      );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Chargement du diagramme...</p>
          </div>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-destructive">
              <p className="font-semibold">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      );
    }

    if (isLoaded && diagramData) {
      return (
        <div className="h-full flex flex-col">
          {/* Informations sur les métadonnées */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Composants: </span>
                <span className="text-primary">
                  {diagramData.metadata.components.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Nœuds: </span>
                <span className="text-primary">
                  {diagramData.metadata.nodes.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Fils: </span>
                <span className="text-primary">
                  {diagramData.metadata.wires.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Feeders: </span>
                <span className="text-primary">
                  {diagramData.metadata.feederInfos.length}
                </span>
              </div>
            </div>
          </div>

          {/* Contrôles de zoom */}
          <div className="mb-2 flex gap-2">
            <Button onClick={handleZoomIn} variant="outline" size="sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button onClick={handleZoomOut} variant="outline" size="sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button onClick={handleResetZoom} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Container SVG avec D3 */}
          <div className="flex-1 overflow-hidden bg-white rounded-lg">
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Aucun diagramme chargé</p>
      </div>
    );
  };

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col border-0 rounded-none">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <h1>Diagramme Unifilaire - {id}</h1>
              <div className="flex items-center gap-2">
                {isInCache(id) && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    En cache
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Cache: {cacheSize} éléments
                </span>
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            {lineId ? `Ligne: ${lineId}` : 'Aucune ligne sélectionnée'}
          </CardDescription>
          <CardAction>
            <div className="flex gap-2">
              <Button
                onClick={() => loadDiagram(id)}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Recharger
              </Button>
              {cacheSize > 0 && (
                <Button onClick={clearCache} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vider le cache
                </Button>
              )}
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {renderContent()}
        </CardContent>

        <CardFooter>
          <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
            <span>
              État:{' '}
              {isLoading
                ? 'Chargement'
                : isLoaded
                  ? 'Chargé'
                  : isError
                    ? 'Erreur'
                    : 'Inactif'}
            </span>
            {diagramData && (
              <span>
                Dimensions:{' '}
                {diagramData.metadata.layoutParams?.cellWidth || 'N/A'}px
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
