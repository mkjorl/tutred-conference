import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import {
  Undo2,
  Redo2,
  Eraser,
  Pencil,
  Square,
  Circle,
  Type,
  Download,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useWhiteboardStore } from "../stores/whiteboardStore";
import { useNotesStore } from "../stores/notesStore";
import { useCanvasStore } from "../stores/canvasStore";
import { useUIStore } from "../stores/uiStore";
import { ColorPicker } from "./ColorPicker";
import { useSocket } from "../hooks/useSocket";

export const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const { addNote } = useNotesStore();
  const { isConnected, sendCanvasUpdate, receiveCanvasUpdate } = useSocket();
  const { toggleWhiteboard } = useUIStore();

  const {
    tool,
    color,
    strokeWidth,
    setTool,
    setColor,
    setStrokeWidth,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWhiteboardStore();

  const debounceCanvasUpdate = (canvas: fabric.Canvas) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (!isUpdating) {
        sendCanvasUpdate(canvas.toJSON());
        addToHistory(JSON.stringify(canvas.toJSON()));
      }
    }, 100);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: tool === "pencil" || tool === "eraser",
      width: window.innerWidth * 0.7,
      height: window.innerHeight * 0.6,
      backgroundColor: "#ffffff",
    });

    const canvas = fabricRef.current;
    canvas.freeDrawingBrush.width = strokeWidth;
    canvas.freeDrawingBrush.color = tool === "eraser" ? "#ffffff" : color;

    const handleObjectModified = () => {
      debounceCanvasUpdate(canvas);
    };

    const handlePathCreated = () => {
      debounceCanvasUpdate(canvas);
    };

    canvas.on("object:modified", handleObjectModified);
    canvas.on("path:created", handlePathCreated);

    receiveCanvasUpdate((update) => {
      setIsUpdating(true);
      canvas.loadFromJSON(update.data, () => {
        canvas.renderAll();
        setTimeout(() => setIsUpdating(false), 100);
      });
    });

    const handleResize = () => {
      if (!fabricRef.current) return;
      fabricRef.current.setDimensions({
        width: window.innerWidth * 0.7,
        height: window.innerHeight * 0.6,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("path:created", handlePathCreated);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    canvas.isDrawingMode = tool === "pencil" || tool === "eraser";
    canvas.freeDrawingBrush.width = strokeWidth;
    canvas.freeDrawingBrush.color = tool === "eraser" ? "#ffffff" : color;
  }, [tool, color, strokeWidth]);

  const handleUndo = () => {
    if (!fabricRef.current || isUpdating) return;
    const canvas = fabricRef.current;

    const previousState = undo();
    if (previousState) {
      setIsUpdating(true);
      canvas.loadFromJSON(previousState, () => {
        canvas.renderAll();
        canvas.isDrawingMode = tool === "pencil" || tool === "eraser";
        canvas.freeDrawingBrush.width = strokeWidth;
        canvas.freeDrawingBrush.color = tool === "eraser" ? "#ffffff" : color;
        sendCanvasUpdate(canvas.toJSON());
        setTimeout(() => setIsUpdating(false), 100);
      });
    }
  };

  const handleRedo = () => {
    if (!fabricRef.current || isUpdating) return;
    const canvas = fabricRef.current;

    const nextState = redo();
    if (nextState) {
      setIsUpdating(true);
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        canvas.isDrawingMode = tool === "pencil" || tool === "eraser";
        canvas.freeDrawingBrush.width = strokeWidth;
        canvas.freeDrawingBrush.color = tool === "eraser" ? "#ffffff" : color;
        sendCanvasUpdate(canvas.toJSON());
        setTimeout(() => setIsUpdating(false), 100);
      });
    }
  };

  const addShape = (shapeType: "rect" | "circle") => {
    if (!fabricRef.current || isUpdating) return;
    const canvas = fabricRef.current;

    const shape =
      shapeType === "rect"
        ? new fabric.Rect({
            width: 100,
            height: 100,
            fill: "transparent",
            stroke: color,
            strokeWidth: strokeWidth,
          })
        : new fabric.Circle({
            radius: 50,
            fill: "transparent",
            stroke: color,
            strokeWidth: strokeWidth,
          });

    canvas.add(shape);
    shape.center();
    canvas.setActiveObject(shape);
    debounceCanvasUpdate(canvas);
  };

  const addText = () => {
    if (!fabricRef.current || isUpdating) return;
    const canvas = fabricRef.current;

    const text = new fabric.IText("Click to edit", {
      fill: color,
      fontSize: strokeWidth * 10,
    });

    canvas.add(text);
    text.center();
    canvas.setActiveObject(text);
    debounceCanvasUpdate(canvas);
  };

  const clearCanvas = () => {
    if (!fabricRef.current || isUpdating) return;
    const canvas = fabricRef.current;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    debounceCanvasUpdate(canvas);
  };

  const saveToImage = () => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    const image = canvas.toDataURL({
      format: "png",
      quality: 1,
    });

    addNote({
      type: "image",
      content: image,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo() || isUpdating}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo2 size={20} />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo() || isUpdating}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo2 size={20} />
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <button
            onClick={() => setTool("pencil")}
            disabled={isUpdating}
            className={`p-2 rounded-lg ${
              tool === "pencil"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Pencil"
          >
            <Pencil size={20} />
          </button>

          <button
            onClick={() => setTool("eraser")}
            disabled={isUpdating}
            className={`p-2 rounded-lg ${
              tool === "eraser"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>

          <button
            onClick={() => addShape("rect")}
            disabled={isUpdating}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add Rectangle"
          >
            <Square size={20} />
          </button>

          <button
            onClick={() => addShape("circle")}
            disabled={isUpdating}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add Circle"
          >
            <Circle size={20} />
          </button>

          <button
            onClick={addText}
            disabled={isUpdating}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add Text"
          >
            <Type size={20} />
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isUpdating}
              className="w-8 h-8 rounded-lg border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color }}
              title="Color Picker"
            />
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 z-50">
                <ColorPicker
                  color={color}
                  onChange={setColor}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            )}
          </div>

          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            disabled={isUpdating}
            className="w-32 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stroke Width"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-100">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-sm text-green-500">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-sm text-red-500">Disconnected</span>
              </>
            )}
          </div>

          <button
            onClick={saveToImage}
            className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
            title="Save to Notes"
          >
            <Download size={20} />
          </button>

          <button
            onClick={clearCanvas}
            disabled={isUpdating}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>

          <button
            onClick={toggleWhiteboard}
            className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            title="Close Whiteboard"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
