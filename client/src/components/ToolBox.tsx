import { TOOL_TYPES } from "../canvas/tools";
import { ToolBoxProps } from "../types/allTypes";
import { HiMiniPaintBrush } from "react-icons/hi2";
import { BsEraserFill } from "react-icons/bs";
import { MdDelete } from "react-icons/md";

export default function ToolBox({
  toolType,
  setToolType,
  color,
  setColor,
  width,
  setWidth,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onReset,
}: ToolBoxProps) {
  const presetColors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
  return (
    <div className="tool-box">
      <div className="tool-options">
        <h3 className="heading-tertiary">Tools</h3>
        <div className="tool-buttons">
          <button
            className={`tool-button ${toolType === TOOL_TYPES.BRUSH ? "active" : ""}`}
            onClick={() => setToolType(TOOL_TYPES.BRUSH)}
          >
            <HiMiniPaintBrush className="tool-icon" />
          </button>
          <button
            className={`tool-button ${toolType === TOOL_TYPES.ERASER ? "active" : ""}`}
            onClick={() => setToolType(TOOL_TYPES.ERASER)}
          >
            <BsEraserFill className="tool-icon" />
          </button>
        </div>
      </div>

      <div className="color-options">
        <h3 className="heading-tertiary">Color picker</h3>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="color-picker"
        />
        <div className="preset-colors">
          {presetColors.map((presetColor) => (
            <button
              key={presetColor}
              className="preset-color"
              style={{
                backgroundColor: presetColor,
              }}
              onClick={() => setColor(presetColor)}
            />
          ))}
        </div>
      </div>

      <div className="width-options">
        <h3 className="heading-tertiary">Width: {width}</h3>
        <input
          type="range"
          min="1"
          max="50"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="width-slider"
        />
      </div>
      <div className="state-control-buttons">
        <div className="history-buttons">
          <button
            className="history-button"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <span className="history-icon">↶</span>
            Undo
          </button>
          <button
            className="history-button"
            onClick={onRedo}
            disabled={!canRedo}
          >
            Redo
            <span className="history-icon">↷</span>
          </button>
        </div>
        <button className="reset-canvas" onClick={onReset} disabled={!canUndo}>
          <MdDelete />
        </button>
      </div>
    </div>
  );
}
