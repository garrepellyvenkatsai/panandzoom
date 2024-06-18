import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import rough from 'roughjs/bin/rough';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';


const BpmnDiagram = forwardRef(({ xml, isRough, taskColor, eventColor, gatewayColor }, ref) => {
  const containerRef = useRef(null);
  const bpmnModelerRef = useRef(null);
  const roughLayerRef = useRef(null);

  useEffect(() => {
    const bpmnModeler = new BpmnJS({
      container: containerRef.current
    });
    bpmnModelerRef.current = bpmnModeler;

    async function renderDiagram() {
      try {
        await bpmnModeler.importXML(xml);
        bpmnModeler.get('canvas').zoom('fit-viewport');
        removeWatermark(); // Remove the watermark after rendering
        colorizeElements(); // Colorize elements after rendering
        if (isRough) {
          applyRoughStyle(containerRef.current.querySelector('svg'));
        }
        addColorChangeListener(); // Add event listener for new elements
      } catch (error) {
        console.error('Error rendering BPMN diagram', error);
      }
    }

    if (xml) {
      renderDiagram();
    }

    return () => bpmnModeler.destroy();
  }, [xml, isRough, taskColor, eventColor, gatewayColor]);

  useImperativeHandle(ref, () => ({
    async exportDiagram() {
      try {
        const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
        return xml;
      } catch (error) {
        console.error('Error exporting BPMN diagram', error);
        return null;
      }
    },
    exportAsSVG() {
      bpmnModelerRef.current.saveSVG({ format: true }).then(({ svg }) => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }).catch(err => {
        console.error('Error exporting as SVG', err);
      });
    },
    exportAsPNG() {
      bpmnModelerRef.current.saveSVG({ format: true }).then(({ svg }) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          // Set background color
          context.fillStyle = '#FFFFFF'; // Change this to your desired background color
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
        img.src = 'data:image/svg+xml;base64,' + btoa(svg);
      }).catch(err => {
        console.error('Error exporting as PNG', err);
      });
    },
    openInNewTab() {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fullscreen Diagram</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: white;
            }
            .diagramContainer {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div class="diagramContainer" id="diagramContainer"></div>
          <script src="https://unpkg.com/bpmn-js/dist/bpmn-modeler.production.min.js"></script>
          <script src="https://unpkg.com/roughjs/bundled/rough.umd.js"></script>
          <script>
            const xml = \`${xml.replace(/`/g, '\\`')}\`;
            const taskColor = "${taskColor}";
            const eventColor = "${eventColor}";
            const gatewayColor = "${gatewayColor}";
            const BpmnJS = window.BpmnJS;
            const bpmnModeler = new BpmnJS({ container: document.getElementById('diagramContainer') });
            bpmnModeler.importXML(xml).then(() => {
              bpmnModeler.get('canvas').zoom('fit-viewport');
              colorizeElements();
              ${isRough ? `applyRoughStyle(document.getElementById('diagramContainer').querySelector('svg'));` : ''}
            }).catch(err => {
              console.error('Error rendering BPMN diagram', err);
            });

            function colorizeElements() {
              const elementRegistry = bpmnModeler.get('elementRegistry');
              const modeling = bpmnModeler.get('modeling');

              elementRegistry.getAll().forEach(element => {
                const businessObject = element.businessObject;
                const strokeColor = '#000';

                if (businessObject.$instanceOf('bpmn:Task')) {
                  modeling.setColor(element, {
                    fill: taskColor,
                    stroke: strokeColor
                  });
                } else if (businessObject.$instanceOf('bpmn:Event')) {
                  modeling.setColor(element, {
                    fill: eventColor,
                    stroke: strokeColor
                  });
                } else if (businessObject.$instanceOf('bpmn:Gateway')) {
                  modeling.setColor(element, {
                    fill: gatewayColor,
                    stroke: strokeColor
                  });
                }
              });
            }

            function applyRoughStyle(svg) {
              if (!svg) {
                console.error('SVG not found');
                return;
              }

              const roughLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              roughLayer.setAttribute('class', 'rough-layer');
              svg.appendChild(roughLayer);

              const rc = rough.svg(svg);
              const bpmnElements = svg.querySelectorAll('.djs-element .djs-visual > *:not(.djs-hit)');

              bpmnElements.forEach(element => {
                let roughElement;

                switch (element.tagName.toLowerCase()) {
                  case 'rect':
                    roughElement = rc.rectangle(
                      +element.getAttribute('x'),
                      +element.getAttribute('y'),
                      +element.getAttribute('width'),
                      +element.getAttribute('height'),
                      {
                        stroke: element.getAttribute('stroke') || '#000',
                        fill: element.getAttribute('fill') || 'none',
                        roughness: 2.8,
                        bowing: 1.5
                      }
                    );
                    break;
                  case 'circle':
                    roughElement = rc.circle(
                      +element.getAttribute('cx'),
                      +element.getAttribute('cy'),
                      +element.getAttribute('r') * 2,
                      {
                        stroke: element.getAttribute('stroke') || '#000',
                        fill: element.getAttribute('fill') || 'none',
                        roughness: 2.8,
                        bowing: 1.5
                      }
                    );
                    break;
                  case 'ellipse':
                    roughElement = rc.ellipse(
                      +element.getAttribute('cx'),
                      +element.getAttribute('cy'),
                      +element.getAttribute('rx') * 2,
                      +element.getAttribute('ry') * 2,
                      {
                        stroke: element.getAttribute('stroke') || '#000',
                        fill: element.getAttribute('fill') || 'none',
                        roughness: 2.8,
                        bowing: 1.5
                      }
                    );
                    break;
                  case 'polygon':
                    const points = element.getAttribute('points').split(' ').map(p => p.split(',').map(Number));
                    roughElement = rc.polygon(points, {
                      stroke: element.getAttribute('stroke') || '#000',
                      fill: element.getAttribute('fill') || 'none',
                      roughness: 2.8,
                      bowing: 1.5
                    });
                    break;
                  case 'path':
                    roughElement = rc.path(element.getAttribute('d'), {
                      stroke: element.getAttribute('stroke') || '#000',
                      fill: element.getAttribute('fill') || 'none',
                      roughness: 2.8,
                      bowing: 1.5
                    });
                    break;
                  default:
                    console.warn('Unsupported element type:', element.tagName);
                    return;
                }

                roughLayer.appendChild(roughElement);
              });
            }
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  }));

  const applyRoughStyle = (svg) => {
    if (!svg) {
      console.error('SVG not found');
      return;
    }

    const roughLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    roughLayer.setAttribute('class', 'rough-layer');
    svg.appendChild(roughLayer);
    roughLayerRef.current = roughLayer;

    const rc = rough.svg(svg);
    const bpmnElements = svg.querySelectorAll('.djs-element .djs-visual > *:not(.djs-hit)');

    bpmnElements.forEach(element => {
      let roughElement;

      switch (element.tagName.toLowerCase()) {
        case 'rect':
          roughElement = rc.rectangle(
            +element.getAttribute('x'),
            +element.getAttribute('y'),
            +element.getAttribute('width'),
            +element.getAttribute('height'),
            {
              stroke: element.getAttribute('stroke') || '#000',
              fill: element.getAttribute('fill') || 'none',
              roughness: 2.8,
              bowing: 1.5
            }
          );
          break;
        case 'circle':
          roughElement = rc.circle(
            +element.getAttribute('cx'),
            +element.getAttribute('cy'),
            +element.getAttribute('r') * 2,
            {
              stroke: element.getAttribute('stroke') || '#000',
              fill: element.getAttribute('fill') || 'none',
              roughness: 2.8,
              bowing: 1.5
            }
          );
          break;
        case 'ellipse':
          roughElement = rc.ellipse(
            +element.getAttribute('cx'),
            +element.getAttribute('cy'),
            +element.getAttribute('rx') * 2,
            +element.getAttribute('ry') * 2,
            {
              stroke: element.getAttribute('stroke') || '#000',
              fill: element.getAttribute('fill') || 'none',
              roughness: 2.8,
              bowing: 1.5
            }
          );
          break;
        case 'polygon':
          const points = element.getAttribute('points').split(' ').map(p => p.split(',').map(Number));
          roughElement = rc.polygon(points, {
            stroke: element.getAttribute('stroke') || '#000',
            fill: element.getAttribute('fill') || 'none',
            roughness: 2.8,
            bowing: 1.5
          });
          break;
        case 'path':
          roughElement = rc.path(element.getAttribute('d'), {
            stroke: element.getAttribute('stroke') || '#000',
            fill: element.getAttribute('fill') || 'none',
            roughness: 2.8,
            bowing: 1.5
          });
          break;
        default:
          console.warn('Unsupported element type:', element.tagName);
          return;
      }

      roughLayer.appendChild(roughElement);
    });
  };

  const colorizeElements = () => {
    const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
    const modeling = bpmnModelerRef.current.get('modeling');

    elementRegistry.getAll().forEach(element => {
      const businessObject = element.businessObject;
      const strokeColor = '#000';

      if (businessObject.$instanceOf('bpmn:Task')) {
        modeling.setColor(element, {
          fill: taskColor,
          stroke: strokeColor
        });
      } else if (businessObject.$instanceOf('bpmn:Event')) {
        modeling.setColor(element, {
          fill: eventColor,
          stroke: strokeColor
        });
      } else if (businessObject.$instanceOf('bpmn:Gateway')) {
        modeling.setColor(element, {
          fill: gatewayColor,
          stroke: strokeColor
        });
      }
    });
  };

  const addColorChangeListener = () => {
    const eventBus = bpmnModelerRef.current.get('eventBus');
    eventBus.on('shape.added', function(event) {
      const element = event.element;
      setTimeout(() => {
        const modeling = bpmnModelerRef.current.get('modeling');
        const businessObject = element.businessObject;
        const strokeColor = '#000';

        if (businessObject.$instanceOf('bpmn:Task')) {
          modeling.setColor(element, {
            fill: taskColor,
            stroke: strokeColor
          });
        } else if (businessObject.$instanceOf('bpmn:Event')) {
          modeling.setColor(element, {
            fill: eventColor,
            stroke: strokeColor
          });
        } else if (businessObject.$instanceOf('bpmn:Gateway')) {
          modeling.setColor(element, {
            fill: gatewayColor,
            stroke: strokeColor
          });
        }
      }, 0);
    });
  };

  const removeWatermark = () => {
    const watermark = containerRef.current.querySelector('.bjs-powered-by');
    if (watermark) {
      watermark.style.display = 'none';
    }
  };

  const toggleRoughStyle = (enableRough) => {
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    if (enableRough) {
      applyRoughStyle(svg);
    } else {
      const roughLayer = roughLayerRef.current;
      if (roughLayer) {
        roughLayer.remove();
      }
    }
  };

  useEffect(() => {
    toggleRoughStyle(isRough);
  }, [isRough]);

  return (
    <div ref={containerRef} className="diagramContainer" style={{ width: '100%', height: '100%' }}></div>
  );
});

export default BpmnDiagram;
