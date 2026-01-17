import { TOOL_TYPES } from "../canvas/tools.js";

export default function ToolBox({
  toolType,
  setToolType,
  color,
  setColor,
  width,
  setWidth,
}) {
  return (
    <div className="tool-box">
      <div className="tool-options">
        <h3 className="heading-tertiary">Tools</h3>
        <div className="tool-buttons">
          <button
            className={`tool-button ${toolType === TOOL_TYPES.BRUSH ? "active" : ""}`}
            onClick={() => setToolType(TOOL_TYPES.BRUSH)}
          >
            Brush
          </button>
          <button
            className={`tool-button ${toolType === TOOL_TYPES.ERASER ? "active" : ""}`}
            onClick={() => setToolType(TOOL_TYPES.ERASER)}
          >
            Eraser
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
    </div>
  );
}
