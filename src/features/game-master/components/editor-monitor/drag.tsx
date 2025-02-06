import { listen, TauriEvent } from '@tauri-apps/api/event';
import { readTextFile } from '@tauri-apps/plugin-fs';
import React, { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import * as d3 from 'd3';

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

type SvgMenuProps = {
  children: React.ReactNode;
};

const SvgMenu = ({ children }: SvgMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset>
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              Save Page As...
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
            <ContextMenuItem>Name Window...</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Developer Tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>
          Show Bookmarks Bar
          <ContextMenuShortcut>⌘⇧B</ContextMenuShortcut>
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value="pedro">
          <ContextMenuLabel inset>People</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuRadioItem value="pedro">
            Pedro Duarte
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const SVGViewer = () => {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const unlisteners = [
      listen<{ paths: string[] }>(TauriEvent.DRAG_ENTER, (event) => {
        console.log('DRAG ENTER:', event);
      }),

      listen<{ paths: string[] }>(TauriEvent.DRAG_DROP, async (event) => {
        console.log('DROP:', event);
        const filePath = event.payload.paths[0];
        if (filePath.toLowerCase().endsWith('.svg')) {
          try {
            const content = await readTextFile(filePath);
            loadSVG(content);
          } catch (err) {
            setError('Error reading SVG file');
            console.error(err);
          }
        } else {
          setError('Please drop a valid SVG file');
        }
      }),

      listen<{ paths: string[] }>(TauriEvent.DRAG_LEAVE, (event) => {
        console.log('DRAG LEAVE:', event);
      }),
    ];

    return () => {
      unlisteners.forEach((unlistener) => unlistener.then((fn) => fn()));
    };
  }, []);

  const loadSVG = async (svgContent: string) => {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

      if (svgDoc.querySelector('parsererror')) {
        throw new Error('Invalid SVG format');
      }

      const container = d3.select(svgContainerRef.current);
      container.selectAll('*').remove();

      const originalSvg = svgDoc.documentElement;
      const contentDiv = container
        .append('div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center');

      const newSvg = contentDiv
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', originalSvg.getAttribute('viewBox') || null)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const defs = originalSvg.querySelector('defs');
      if (defs) {
        const newDefs = newSvg.append('defs');
        Array.from(defs.children).forEach((child) => {
          newDefs.node()?.appendChild(child.cloneNode(true));
        });
      }

      const styles = originalSvg.querySelectorAll('style');
      styles.forEach((style) => {
        newSvg.append('style').text(style.textContent || '');
      });

      const mainGroup = newSvg.append('g');

      Array.from(originalSvg.children).forEach((child) => {
        if (child.tagName !== 'defs' && child.tagName !== 'style') {
          mainGroup.node()?.appendChild(child.cloneNode(true));
        }
      });

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          mainGroup.attr('transform', event.transform.toString());
        });

      newSvg
        .call(zoom)
        .on('dblclick.zoom', null)
        .on('dblclick', () => {
          newSvg
            .transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
        });

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading SVG');
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  return (
    <div className="w-full">
      <SvgMenu>
        <div
          className="p-2 text-center transition-colors hover:border-gray-400"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          ref={svgContainerRef}
        >
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-600 mt-4">
            Glissez et déposez votre fichier SVG ici
          </p>
          <p className="text-sm text-gray-500">Format accepté : .svg</p>
        </div>
      </SvgMenu>
    </div>
  );
};

export default SVGViewer;
