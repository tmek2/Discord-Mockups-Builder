"use client";

/* The JSON view of the selected message.
 *
 * Discohook's central idea, and the right one: the message and its payload are
 * two views of one thing, so either can be edited. Most people arriving here
 * already have a payload — something a bot sends, something a teammate pasted,
 * something out of Discohook itself — and asking them to rebuild it in a form
 * is asking them to do work they have already done.
 *
 * It is not a live two-way binding. The text follows the message until you
 * touch it, and from then on it is a draft you apply or discard. A textarea
 * that rewrites itself under the cursor every time the message changes is a
 * textarea nobody can type in.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { IconArrowBackUp, IconCheck, IconClipboard, IconCode, IconPlayerPlay } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { uid } from "@/lib/model";
import { messageFromJson, messageJson } from "./export";
import { Empty } from "./fields";
import "./json-panel.css";

export function JsonPanel({ message, patch, onError, onNotify }) {
  const current = useMemo(() => (message ? messageJson(message) : ""), [message]);
  const [draft, setDraft] = useState(current);
  const [dirty, setDirty] = useState(false);
  const [problem, setProblem] = useState(null);
  const box = useRef(null);

  /* Follow the message only while the draft is untouched. Once it is dirty the
     text belongs to the person typing it, and pulling it out from under them
     on every keystroke elsewhere would make it unusable. */
  useEffect(() => {
    if (!dirty) setDraft(current);
  }, [current, dirty]);

  useEffect(() => {
    setDirty(false);
    setProblem(null);
  }, [message?.id]);

  if (!message) return <Empty>Pick a message first.</Empty>;

  const apply = () => {
    const { patch: fields, error } = messageFromJson(draft, uid);
    if (error) {
      setProblem(error);
      onError(error);
      return;
    }
    patch(fields);
    setDirty(false);
    setProblem(null);
    onNotify("Message rebuilt from the payload.");
  };

  const revert = () => {
    setDraft(current);
    setDirty(false);
    setProblem(null);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current);
      onNotify("Payload copied.");
    } catch {
      onError("Could not reach the clipboard.");
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        onError("The clipboard is empty.");
        return;
      }
      setDraft(text);
      setDirty(true);
      box.current?.focus();
    } catch {
      onError("Could not read the clipboard. Paste into the box instead.");
    }
  };

  return (
    <div className="e-json">
      <div className="e-note">
        The payload for this message, in the shape Discord's API takes. Edit it and press Apply, or
        paste one in from a bot, a webhook or Discohook — embeds, containers, sections, galleries and
        button rows all come across.
      </div>

      <div className="e-json-bar">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="e-btn e-btn-quiet" onClick={copy}>
              <IconCode size={14} /> Copy
            </button>
          </TooltipTrigger>
          <TooltipContent>Copy this message&rsquo;s payload</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="e-btn e-btn-quiet" onClick={paste}>
              <IconClipboard size={14} /> Paste
            </button>
          </TooltipTrigger>
          <TooltipContent>Paste a payload from the clipboard</TooltipContent>
        </Tooltip>
        <span className="e-json-spacer" />
        {dirty ? (
          <>
            <button type="button" className="e-btn e-btn-quiet" onClick={revert}>
              <IconArrowBackUp size={14} /> Revert
            </button>
            <button type="button" className="e-btn e-btn-solid" onClick={apply}>
              <IconPlayerPlay size={14} /> Apply
            </button>
          </>
        ) : (
          <span className="e-json-clean">
            <IconCheck size={13} /> In sync
          </span>
        )}
      </div>

      <Textarea
        ref={box}
        className="e-json-box"
        spellCheck={false}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
          setProblem(null);
        }}
        onKeyDown={(e) => {
          // Tab indents rather than leaving the box: this is code, and the one
          // thing you cannot do in a code field is lose focus on Tab.
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const at = el.selectionStart;
            const next = `${draft.slice(0, at)}  ${draft.slice(el.selectionEnd)}`;
            setDraft(next);
            setDirty(true);
            requestAnimationFrame(() => el.setSelectionRange(at + 2, at + 2));
          }
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        aria-label="Message payload"
      />

      {problem ? <p className="e-json-problem">{problem}</p> : null}

      <p className="e-field-hint">
        {dirty ? "⌘/Ctrl + Enter applies." : "Nothing here sends anything — this is the payload a bot would."}
      </p>
    </div>
  );
}
