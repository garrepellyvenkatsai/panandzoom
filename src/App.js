import React, { useState, useRef } from 'react';
import MermaidDiagram from './MermaidDiagram';
import BpmnDiagram from './BpmnDiagram';
import './App.css';

const initialMermaidChart = `
  graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
`;

const initialBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

function App() {
  const [chart, setChart] = useState(initialMermaidChart);
  const [bpmnXml, setBpmnXml] = useState(initialBpmnXml);
  const [isBpmn, setIsBpmn] = useState(false);
  const [isRough, setIsRough] = useState(false);
  const [isPanZoom, setIsPanZoom] = useState(false);
  const [taskColor, setTaskColor] = useState('#FFC107');
  const [eventColor, setEventColor] = useState('#03A9F4');
  const [gatewayColor, setGatewayColor] = useState('#8BC34A');
  const mermaidRef = useRef();
  const bpmnRef = useRef();

  const handleInputChange = (event) => {
    if (isBpmn) {
      setBpmnXml(event.target.value);
    } else {
      setChart(event.target.value);
    }
  };

  const toggleDiagramType = () => {
    setIsBpmn(!isBpmn);
  };

  const toggleRoughDiagram = () => {
    setIsRough(!isRough);
  };

  const togglePanZoom = () => {
    setIsPanZoom(!isPanZoom);
  };

  const openMermaidFullscreen = () => {
    if (mermaidRef.current) {
      mermaidRef.current.openInNewTab();
    }
  };

  const openBpmnFullscreen = async () => {
    if (bpmnRef.current) {
      bpmnRef.current.openInNewTab();
    }
  };

  const exportMermaidAsSVG = () => {
    if (mermaidRef.current) {
      mermaidRef.current.exportAsSVG();
    }
  };

  const exportMermaidAsPNG = () => {
    if (mermaidRef.current) {
      mermaidRef.current.exportAsPNG();
    }
  };

  const exportBpmnAsSVG = () => {
    if (bpmnRef.current) {
      bpmnRef.current.exportAsSVG();
    }
  };

  const exportBpmnAsPNG = () => {
    if (bpmnRef.current) {
      bpmnRef.current.exportAsPNG();
    }
  };

  return (
    <div className="App">
      <div className="header">
        <label className="switch">
          <input
            type="checkbox"
            checked={isBpmn}
            onChange={toggleDiagramType}
          />
          <span className="slider round"></span>
        </label>
        <div className="controls">
          {isBpmn ? (
            <>
              <button onClick={openBpmnFullscreen}>FullScreen</button>
              <button className="export" onClick={exportBpmnAsSVG}>Export as SVG</button>
              <button className="export" onClick={exportBpmnAsPNG}>Export as PNG</button>
              <label>
                Rough
                <input
                  type="checkbox"
                  checked={isRough}
                  onChange={toggleRoughDiagram}
                />
              </label>
              <label>
                Task Color
                <input
                  type="color"
                  value={taskColor}
                  onChange={(e) => setTaskColor(e.target.value)}
                />
              </label>
              <label>
                Event Color
                <input
                  type="color"
                  value={eventColor}
                  onChange={(e) => setEventColor(e.target.value)}
                />
              </label>
              <label>
                Gateway Color
                <input
                  type="color"
                  value={gatewayColor}
                  onChange={(e) => setGatewayColor(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <button onClick={openMermaidFullscreen}>Fullscreen</button>
              <button className="export" onClick={exportMermaidAsSVG}>Export as SVG</button>
              <button className="export" onClick={exportMermaidAsPNG}>Export as PNG</button>
              <div className="mermaid-controls">
                <label>
                  Rough
                  <input
                    type="checkbox"
                    checked={isRough}
                    onChange={toggleRoughDiagram}
                  />
                </label>
                <label>
                  Pan & Zoom
                  <input
                    type="checkbox"
                    checked={isPanZoom}
                    onChange={togglePanZoom}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="container">
        <div className="left">
          <h1>{isBpmn ? 'BPMN CODE' : 'MERMAID CODE'}</h1>
          <textarea
            value={isBpmn ? bpmnXml : chart}
            onChange={handleInputChange}
          />
        </div>
        <div className="right">
          {isBpmn ? (
            <BpmnDiagram
              ref={bpmnRef}
              xml={bpmnXml}
              isRough={isRough}
              taskColor={taskColor}
              eventColor={eventColor}
              gatewayColor={gatewayColor}
            />
          ) : (
            <MermaidDiagram ref={mermaidRef} code={chart} isRough={isRough} isPanZoom={isPanZoom} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
