import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import mermaid from 'mermaid';
import rough from 'roughjs/bin/rough';
import svgPanZoom from 'svg-pan-zoom';

const MermaidDiagram = forwardRef(({ code, isRough, isPanZoom }, ref) => {
  const containerRef = useRef(null);
  const diagramRef = useRef(null);
  const panZoomInstanceRef = useRef(null);

  useEffect(() => {
    if (!code) return;

    diagramRef.current.innerHTML = `<div class="mermaid">${code}</div>`;
    mermaid.initialize({ startOnLoad: true });
    mermaid.contentLoaded();

    const checkSVGReady = setInterval(() => {
      const svg = diagramRef.current.querySelector('svg');
      if (svg) {
        clearInterval(checkSVGReady);
        
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.display = 'block';
        svg.style.margin = '0 auto';

        if (isRough) {
          applyRoughStyle(svg);
        }

        if (isPanZoom) {
          enablePanZoom(containerRef.current);
        } else {
          disablePanZoom();
        }
      }
    }, 100);

    return () => {
      clearInterval(checkSVGReady);
      disablePanZoom();
    };
  }, [code, isRough, isPanZoom]);

  useImperativeHandle(ref, () => ({
    openInNewTab,
    exportAsSVG,
    exportAsPNG
  }));
  
  const applyRoughStyle = (svg) => {
    const rc = rough.svg(svg);
    const elements = svg.querySelectorAll('rect, circle, ellipse, polygon, path');
    elements.forEach(element => {
      // Determine the type of element to apply the correct rough style
      switch (element.tagName.toLowerCase()) {
        case 'rect':
        case 'circle':
        case 'ellipse':
        case 'polygon':
          // Apply a rough fill to shapes
          const roughElement = rc.rectangle(
            element.getBBox().x,
            element.getBBox().y,
            element.getBBox().width,
            element.getBBox().height,
            {
              fill: element.getAttribute('fill') || 'skyblue', // Add fill color
              roughness: 1.5,
              fillStyle: 'hachure', // Solid fill style
              fillWeight: 2,
              hachureAngle: 120, // angle of hachure,
              hachureGap: 3,
              stroke: element.getAttribute('stroke') || '#000',
              strokeWidth: element.getAttribute('stroke-width') || '3',
              bowing: 1
            }
          );
          element.parentNode.replaceChild(roughElement, element);
          break;
        case 'path':
          // Check if it's an arrow path
          if (element.getAttribute('marker-end') && element.getAttribute('marker-end').includes('url(#arrow')) {
            // Apply a rough style to arrows
            const roughPath = rc.path(element.getAttribute('d'), {
              stroke: element.getAttribute('stroke') || '#000',
              strokeWidth: element.getAttribute('stroke-width') || '3',
              roughness: 1.5,
              bowing: 2
            });
            element.parentNode.replaceChild(roughPath, element);
          } else {
            // Apply a rough style to regular paths
            const roughPath = rc.path(element.getAttribute('d'), {
              stroke: element.getAttribute('stroke') || '#000',
              strokeWidth: element.getAttribute('stroke-width') || '3',
              roughness: 1.5,
              bowing: 2
            });
            element.parentNode.replaceChild(roughPath, element);
          }
          break;
        default:
          // Leave other elements as is
          break;
      }
    });
  };

  const enablePanZoom = (container) => {
    if (!panZoomInstanceRef.current) {
      const options = {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
        center: true,
        minZoom: 0.1,
        maxZoom: 10,
        zoomScaleSensitivity: 0.4,
        panSpeed: 0.3,
        dblClickZoomEnabled: true,
        mouseWheelZoomEnabled: true,
      };

      panZoomInstanceRef.current = svgPanZoom(container.querySelector('svg'), options);
      // Adjusting the size of the pan and zoom area based on the container size
      panZoomInstanceRef.current.resize();
    } else {
      panZoomInstanceRef.current.enablePan();
      panZoomInstanceRef.current.enableZoom();
    }
  };

  const disablePanZoom = () => {
    if (panZoomInstanceRef.current) {
      panZoomInstanceRef.current.destroy();
      panZoomInstanceRef.current = null;
    }
  };

  const openInNewTab = () => {
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fullscreen Mermaid Diagram</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
          #svgContainer { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="svgContainer">
          ${svgData}
        </div>
        <script>
          ${isPanZoom ? `svgPanZoom('#svgContainer svg', {
            zoomEnabled: true,
            controlIconsEnabled: true,
            fit: true,
            center: true,
            minZoom: 0.5,
            maxZoom: 10
          });` : ''}
        </script>
      </body>
      </html>
    `);
    newWindow.document.close();
  };

  const exportAsSVG = () => {
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = () => {
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div ref={containerRef} className="diagramContainer" style={{ width: '100%', height: '100%' }}>
    <div ref={diagramRef} className="innerDiagramContainer" style={{ width: '100%', height: '100%' }}></div>
  </div>
  );
});

export default MermaidDiagram;
