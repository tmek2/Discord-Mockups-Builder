"use client";

/* The editor's form primitives.
 *
 * One of each, used everywhere. The reason to have them at all rather than
 * writing inputs inline is not brevity — it is that a label, its control, its
 * hint and its counter have a fixed relationship, and every place that
 * rebuilds that relationship by hand gets one of the four slightly wrong.
 */

import { useId, useRef, useState } from "react";
import { IconChevronDown, IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react";
import "./fields.css";

export function Field({ label, hint, children, counter }) {
  return (
    <label className="e-field">
      {label ? (
        <span className="e-field-head">
          <span className="e-field-label">{label}</span>
          {counter ? <span className="e-field-counter">{counter}</span> : null}
        </span>
      ) : null}
      {children}
      {hint ? <span className="e-field-hint">{hint}</span> : null}
    </label>
  );
}

/** How far into a limit a value is, said plainly and coloured once it is over.
 *  Nothing refuses the extra character — a mockup showing an over-long title is
 *  a legitimate thing to want to see — but it should be impossible to miss. */
export function Counter({ value = "", limit }) {
  const n = (value ?? "").length;
  if (!limit) return null;
  return (
    <span className="e-counter" data-over={n > limit ? "true" : "false"}>
      {n}/{limit}
    </span>
  );
}

/* Takes a ref, because inserting an emoji at the caret needs the element the
   caret is in. React 19 passes `ref` as an ordinary prop, so no forwardRef. */
export function Text({ value, onChange, limit, multiline, rows = 3, ref, ...rest }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <Tag
      ref={ref}
      className={`e-input${multiline ? " e-textarea" : ""}`}
      value={value ?? ""}
      rows={multiline ? rows : undefined}
      onChange={(e) => onChange(e.target.value)}
      data-over={limit && (value ?? "").length > limit ? "true" : "false"}
      {...rest}
    />
  );
}

export function Num({ value, onChange, min, max, step = 1, suffix }) {
  return (
    <span className="e-num">
      <input
        className="e-input"
        type="number"
        value={value ?? 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {suffix ? <span className="e-num-suffix">{suffix}</span> : null}
    </span>
  );
}

export function Slider({ value, onChange, min, max, step = 1, suffix = "" }) {
  return (
    <span className="e-slider">
      <input
        type="range"
        value={value ?? min}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output>
        {value}
        {suffix}
      </output>
    </span>
  );
}

export function Pick({ value, onChange, options }) {
  return (
    <span className="e-pick">
      <select className="e-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
      <IconChevronDown size={15} className="e-pick-caret" />
    </span>
  );
}

/* A segmented control, for a choice of three or four where the options are
   short enough to read at once. Above that it is a select: a segmented control
   with six segments is a row of truncated words. */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="e-segmented" role="group" aria-label={label}>
      {options.map((o) => {
        const v = o.value ?? o;
        return (
          <button
            key={v}
            type="button"
            className="e-segment"
            data-on={value === v ? "true" : "false"}
            onClick={() => onChange(v)}
          >
            {o.icon ?? null}
            {o.label ?? o}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ label, hint, value, onChange }) {
  const id = useId();
  return (
    <div className="e-toggle">
      <label htmlFor={id} className="e-toggle-copy">
        <span className="e-toggle-label">{label}</span>
        {hint ? <span className="e-field-hint">{hint}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        className="e-switch"
        data-on={value ? "true" : "false"}
        onClick={() => onChange(!value)}
      >
        <span className="e-switch-knob" />
      </button>
    </div>
  );
}

/* Discord's own accent presets alongside a free picker. The presets exist
   because most embeds want one of about eight colours and hunting for #5865f2
   in a colour wheel every time is not a workflow. */
const SWATCHES = [
  { value: "#5865f2", name: "Blurple" },
  { value: "#f7a8c4", name: "Gator" },
  { value: "#23a55a", name: "Green" },
  { value: "#f0b232", name: "Yellow" },
  { value: "#f23f43", name: "Red" },
  { value: "#eb459e", name: "Pink" },
  { value: "#00a8fc", name: "Blue" },
  { value: "#949ba4", name: "Grey" },
];

export function ColorField({ value, onChange, allowNone = false }) {
  return (
    <div className="e-color">
      <div className="e-swatches">
        {allowNone ? (
          <button
            type="button"
            className="e-swatch e-swatch-none"
            data-on={!value || value === "none" ? "true" : "false"}
            onClick={() => onChange("none")}
            aria-label="No accent"
            title="No accent"
          />
        ) : null}
        {SWATCHES.map((s) => (
          <button
            key={s.value}
            type="button"
            className="e-swatch"
            style={{ background: s.value }}
            data-on={value?.toLowerCase() === s.value ? "true" : "false"}
            onClick={() => onChange(s.value)}
            aria-label={s.name}
            title={s.name}
          />
        ))}
      </div>
      <div className="e-color-custom">
        <input
          type="color"
          className="e-color-input"
          value={/^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#5865f2"}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Custom colour"
        />
        <input
          className="e-input e-color-hex"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#5865f2"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

/* An image, from a file or from a URL.
 *
 * Both, because they solve different problems. A pasted file becomes a data
 * URI, which travels inside the project file and works offline but counts
 * against the cloud backup's size limit; a URL costs nothing and breaks if the
 * host goes away. The field says which one is in use rather than hiding it.
 */
export function ImageField({ value, onChange, label, hint, onError }) {
  const [mode, setMode] = useState(() => (value?.startsWith("data:") ? "file" : "url"));
  const input = useRef(null);

  const take = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError?.("That file is not an image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      onError?.("Images pasted into a mockup are capped at 4 MB. Link it by URL instead.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => onError?.("That image could not be read.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="e-image">
      <div className="e-field-head">
        <span className="e-field-label">{label}</span>
        <Segmented
          value={mode}
          onChange={setMode}
          label="Image source"
          options={[
            { value: "file", label: "Upload" },
            { value: "url", label: "Link" },
          ]}
        />
      </div>

      <div className="e-image-row">
        <span className="e-image-preview">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" />
          ) : (
            <IconPhoto size={18} />
          )}
        </span>

        {mode === "file" ? (
          <button type="button" className="e-btn e-btn-quiet" onClick={() => input.current?.click()}>
            <IconUpload size={15} />
            {value ? "Replace" : "Choose a file"}
          </button>
        ) : (
          <input
            className="e-input"
            value={value?.startsWith("data:") ? "" : (value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            spellCheck={false}
          />
        )}

        {value ? (
          <button
            type="button"
            className="e-btn e-btn-quiet e-btn-icon"
            onClick={() => onChange("")}
            aria-label="Remove image"
          >
            <IconTrash size={15} />
          </button>
        ) : null}

        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {hint ? <span className="e-field-hint">{hint}</span> : null}
    </div>
  );
}

export function Row({ children, gap = 8 }) {
  return (
    <div className="e-row" style={{ gap }}>
      {children}
    </div>
  );
}

export function Group({ title, action, children, collapsible = false, open: openProp = true }) {
  const [open, setOpen] = useState(openProp);
  return (
    <section className="e-group" data-open={open ? "true" : "false"}>
      <header className="e-group-head">
        {collapsible ? (
          <button type="button" className="e-group-toggle" onClick={() => setOpen((v) => !v)}>
            <IconChevronDown size={14} className="e-group-caret" />
            {title}
          </button>
        ) : (
          <span className="e-group-title">{title}</span>
        )}
        {action}
      </header>
      {open ? <div className="e-group-body">{children}</div> : null}
    </section>
  );
}

export function Empty({ children }) {
  return <p className="e-empty">{children}</p>;
}
