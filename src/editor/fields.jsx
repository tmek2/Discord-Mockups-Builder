"use client";

/* The editor's form controls.
 *
 * Every one of these is the component from `src/components/ui`, which is the
 * set copied out of gatorsys.xyz — the same Radix primitives, the same markup,
 * the same classes. This file is only the layout around them: a label, its
 * control, its hint and its counter, in the one arrangement they always take.
 *
 * Nothing here is a native `<select>` any more. A native select draws the
 * operating system's menu, which on Windows is a grey rectangle with square
 * corners in a font nothing else on the page uses — the single loudest way an
 * interface can announce it was not designed.
 */

import { useId, useRef, useState } from "react";
import { IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./fields.css";

export function Field({ label, hint, children, counter, tip }) {
  const body = (
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
  if (!tip) return body;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{body}</TooltipTrigger>
      <TooltipContent side="left">{tip}</TooltipContent>
    </Tooltip>
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

export function Text({ value, onChange, limit, multiline, rows = 3, ref, className, ...rest }) {
  const over = limit && (value ?? "").length > limit;
  const shared = {
    ref,
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    "data-over": over ? "true" : "false",
    className: cn("e-control", over && "border-[var(--gator-danger)]", className),
    ...rest,
  };
  return multiline ? <Textarea rows={rows} {...shared} /> : <Input {...shared} />;
}

export function Num({ value, onChange, min, max, step = 1, suffix }) {
  return (
    <span className="e-num">
      <Input
        type="number"
        className="e-control"
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

/* Radix's slider rather than `<input type="range">`, which cannot be styled
   consistently across browsers — Firefox and Safari each draw their own track
   and thumb and ignore most of what you tell them. */
export function Slider({ value, onChange, min, max, step = 1, suffix = "" }) {
  return (
    <span className="e-slider">
      <SliderPrimitive.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value ?? min]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      >
        <SliderPrimitive.Track className="relative h-[5px] w-full grow overflow-hidden rounded-full bg-[var(--gator-border-strong)]">
          <SliderPrimitive.Range className="absolute h-full bg-[var(--accent-peach)]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-[15px] rounded-full border-2 border-[var(--accent-peach)] bg-[var(--gator-surface-raised)] shadow-sm transition-[transform,box-shadow] duration-150 ease-premium hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-peach)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gator-bg)] active:scale-95" />
      </SliderPrimitive.Root>
      <output>
        {value}
        {suffix}
      </output>
    </span>
  );
}

/** The dashboard's Select. Options are `{value,label,hint}` or bare strings. */
export function Pick({ value, onChange, options, placeholder = "Choose" }) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="e-control h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const v = o.value ?? o;
          return (
            <SelectItem key={v} value={v}>
              <span className="flex flex-col gap-0.5">
                <span>{o.label ?? o}</span>
                {o.hint ? (
                  <span className="text-[11px] leading-snug text-[var(--gator-text-muted)]">{o.hint}</span>
                ) : null}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/* A segmented control for three or four short options. Above that it is a
   Select: a segmented control with six segments is a row of truncated words. */
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

/* Radix's switch, so the thumb animates from a real state machine and the
   whole control is one keyboard target rather than a div with a click. */
export function Toggle({ label, hint, value, onChange }) {
  const id = useId();
  return (
    <div className="e-toggle">
      <label htmlFor={id} className="e-toggle-copy">
        <span className="e-toggle-label">{label}</span>
        {hint ? <span className="e-field-hint">{hint}</span> : null}
      </label>
      <SwitchPrimitive.Root
        id={id}
        checked={Boolean(value)}
        onCheckedChange={onChange}
        className="peer inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-peach)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gator-bg)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--accent-peach)] data-[state=unchecked]:bg-[var(--gator-border-strong)]"
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-premium data-[state=checked]:translate-x-[19px] data-[state=unchecked]:translate-x-[3px]" />
      </SwitchPrimitive.Root>
    </div>
  );
}

/* Discord's own accent presets alongside a free picker. The presets exist
   because most embeds want one of about eight colours, and hunting for
   #5865f2 in a colour wheel every time is not a workflow. */
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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="e-swatch e-swatch-none"
                data-on={!value || value === "none" ? "true" : "false"}
                onClick={() => onChange("none")}
                aria-label="No accent"
              />
            </TooltipTrigger>
            <TooltipContent>No accent</TooltipContent>
          </Tooltip>
        ) : null}
        {SWATCHES.map((s) => (
          <Tooltip key={s.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="e-swatch"
                style={{ background: s.value }}
                data-on={value?.toLowerCase() === s.value ? "true" : "false"}
                onClick={() => onChange(s.value)}
                aria-label={s.name}
              />
            </TooltipTrigger>
            <TooltipContent>{s.name}</TooltipContent>
          </Tooltip>
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
        <Input
          className="e-control e-color-hex"
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
 * host goes away. The field says which one is in use rather than hiding it. */
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
          <Input
            className="e-control"
            value={value?.startsWith("data:") ? "" : (value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            spellCheck={false}
          />
        )}

        {value ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="e-btn e-btn-quiet e-btn-icon"
                onClick={() => onChange("")}
                aria-label="Remove image"
              >
                <IconTrash size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Remove</TooltipContent>
          </Tooltip>
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
            <svg className="e-group-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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

/** A quiet control with a label that only appears on hover — used wherever an
 *  icon has to stand in for a word. */
export function IconAction({ label, onClick, disabled, children, className }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn("e-icon-btn", className)}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
