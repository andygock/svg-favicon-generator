export function ControlPanel({ state, fontOptions, onFieldChange }) {
  return (
    <aside className="panel controls-panel">
      <section className="control-group">
        <h2 className="section-title">Glyph</h2>
        <label className="field field-text">
          <span className="field-label">Content</span>
          <input
            type="text"
            value={state.content}
            placeholder="Enter a letter or symbol"
            onChange={onFieldChange("content")}
          />
        </label>

        <label className="field field-range">
          <div className="field-head">
            <span className="field-label">Font size</span>
            <span className="field-value">{state.fontSize}</span>
          </div>
          <input
            type="range"
            min="72"
            max="200"
            step="1"
            value={state.fontSize}
            onChange={onFieldChange("fontSize")}
          />
        </label>

        <label className="field field-range">
          <div className="field-head">
            <span className="field-label">X</span>
            <span className="field-value">{state.x}</span>
          </div>
          <input
            type="range"
            min="0"
            max="128"
            step="1"
            value={state.x}
            onChange={onFieldChange("x")}
          />
        </label>

        <label className="field field-range">
          <div className="field-head">
            <span className="field-label">Y</span>
            <span className="field-value">{state.y}</span>
          </div>
          <input
            type="range"
            min="0"
            max="128"
            step="1"
            value={state.y}
            onChange={onFieldChange("y")}
          />
        </label>
      </section>

      <section className="control-group">
        <h2 className="section-title">Typography</h2>
        <label className="field">
          <span className="field-label">Font family</span>
          <select
            value={state.fontFamily}
            onChange={onFieldChange("fontFamily")}
          >
            {fontOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field field-inline">
          <span className="field-label">Bold</span>
          <input
            type="checkbox"
            checked={state.bold}
            onChange={onFieldChange("bold")}
          />
        </label>

        <label className="field field-inline">
          <span className="field-label">Fill</span>
          <input
            type="color"
            value={state.fill}
            onChange={onFieldChange("fill")}
          />
        </label>
      </section>

      <section className="control-group">
        <h2 className="section-title">Backdrop</h2>
        <label className="field field-inline">
          <span className="field-label">Use background</span>
          <input
            type="checkbox"
            checked={state.useBackground}
            onChange={onFieldChange("useBackground")}
          />
        </label>

        <label className="field">
          <span className="field-label">Background shape</span>
          <select
            value={state.backgroundShape}
            onChange={onFieldChange("backgroundShape")}
            disabled={!state.useBackground}
          >
            <option value="rect">Rectangle</option>
            <option value="circle">Circle</option>
          </select>
        </label>

        <label className="field field-inline">
          <span className="field-label">Background color</span>
          <input
            type="color"
            value={state.background}
            onChange={onFieldChange("background")}
            disabled={!state.useBackground}
          />
        </label>
      </section>
    </aside>
  );
}
