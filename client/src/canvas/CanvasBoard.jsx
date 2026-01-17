import { useEffect, useState, useRef } from "react";

export default function CanvasBoard() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    const resize = () => {
      // Set canvas dimensions - DPI scalling to avoid blurriness on high-DPI screens

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleStartDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };
  const handleStopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };
  const handleDraw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };
  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handleStartDrawing}
      onPointerUp={handleStopDrawing}
      onPointerMove={handleDraw}
      className="canvas-board"
    ></canvas>
  );
}
