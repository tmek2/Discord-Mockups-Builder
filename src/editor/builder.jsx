"use client";

/* The builder.
 *
 * Three columns on a desktop: the outline of what is in the mockup, the
 * mockup itself, and the inspector for whatever is selected. On a phone the
 * same three become one column with a bar at the bottom that switches between
 * them, because a three-column tool on a 390px screen is three unusable
 * columns rather than one usable one.
 *
 * The project is one piece of state and every change goes through `commit`,
 * which is also what pushes onto the undo stack. Nothing writes to the project
 * any other way — that is the whole reason undo can be four lines.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCheck,
  IconCloud,
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconFileText,
  IconGripVertical,
  IconLayoutList,
  IconMoodSmile,
  IconPalette,
  IconPhotoDown,
  IconPlus,
  IconSettings,
  IconShare2,
  IconStack2,
  IconTrash,
  IconUsers,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { SiteNav } from "@/gator/site-nav";
import { DiscordSurface } from "@/discord/surface";
import { blankProject, newMessage, reid, uid } from "@/lib/model";
import { TEMPLATES } from "@/lib/templates";
import { loadValue, saveValue } from "@/lib/storage";
import { migrate, validProject } from "@/lib/validate";
import { Inspector, TABS } from "./inspector";
import { CanvasPanel, CloudPanel, EmojiPanel, UsersPanel } from "./panels";
import { exportMessageJson, exportPng, exportProject, messageJson, readShareLink, shareLink } from "./export";
import { Palette } from "./palette";
import { useCanvasGestures } from "./use-canvas";
import { useOverlay } from "./use-overlay";
import { useReorder } from "./use-reorder";
import "./editor.css";

const SECTIONS = [
  { id: "messages", label: "Messages", Icon: IconLayoutList },
  { id: "users", label: "Members", Icon: IconUsers },
  { id: "emojis", label: "Emoji", Icon: IconMoodSmile },
  { id: "canvas", label: "Canvas", Icon: IconPalette },
  { id: "cloud", label: "Saved", Icon: IconCloud },
];

const STORE_KEY = "project";
const SLUG_KEY = "slug";

export function Builder({ user, canSignIn = true }) {
  const [project, setProject] = useState(blankProject);
  const [slug, setSlug] = useState("draft");
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [section, setSection] = useState("messages");
  const [tab, setTab] = useState("Content");
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [savedLocally, setSavedLocally] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pane, setPane] = useState("preview");
  const [exporting, setExporting] = useState(false);

  const stage = useRef(null);
  const importer = useRef(null);
  const scroller = useRef(null);
  const outline = useRef(null);
  const [room, setRoom] = useState(0);

  const notify = useCallback((text, tone = "ok") => setToast({ text, tone, key: uid() }), []);
  const fail = useCallback((text) => setToast({ text, tone: "bad", key: uid() }), []);

  /* ------------------------------------------------------------ loading */

  useEffect(() => {
    let alive = true;

    /* A share link wins over what is in storage: somebody who opened a link
       meant to look at that, and the draft they had is still in IndexedDB
       under the same key, untouched. */
    const shared = readShareLink(window.location.hash);
    if (shared && validProject(migrate(shared))) {
      setProject(migrate(shared));
      setSlug(uid().slice(0, 8));
      setLoaded(true);
      notify("Opened a shared mockup. Saving keeps it as your own copy.");
      window.history.replaceState(null, "", window.location.pathname);
      return () => {
        alive = false;
      };
    }

    Promise.all([loadValue(STORE_KEY), loadValue(SLUG_KEY)])
      .then(([saved, savedSlug]) => {
        if (!alive) return;
        const next = migrate(saved);
        if (validProject(next)) {
          setProject(next);
          if (typeof savedSlug === "string") setSlug(savedSlug);
        }
      })
      .catch(() => {
        if (alive) fail("This browser is not letting the editor save. Download the project file to keep your work.");
      })
      .finally(() => alive && setLoaded(true));

    return () => {
      alive = false;
    };
  }, [notify, fail]);

  /* Autosave. Debounced, because a keystroke is a state change and writing
     the whole project on every one of them is a transaction per character. */
  useEffect(() => {
    if (!loaded) return undefined;
    setSavedLocally(false);
    const timer = window.setTimeout(() => {
      Promise.all([saveValue(STORE_KEY, project), saveValue(SLUG_KEY, slug)])
        .then(() => setSavedLocally(true))
        .catch(() => fail("Browser storage is full. Download the project file to keep your changes."));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [project, slug, loaded, fail]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* How much room the canvas has. A 1200px window mockup on a 390px phone has
     to be looked at somehow, and a horizontal scrollbar under a preview is the
     one thing that makes a preview useless — so the canvas is scaled down to
     fit rather than clipped. Zoom multiplies that rather than replacing it, so
     "100%" means "as large as it fits" and going above it still works. */
  useEffect(() => {
    const node = scroller.current;
    if (!node) return undefined;
    const measure = () => setRoom(node.clientWidth - 64);
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(node);
    return () => watch.disconnect();
  }, []);

  /* -------------------------------------------------------------- state */

  const commit = useCallback(
    (next) => {
      setPast((p) => [...p.slice(-49), project]);
      setFuture([]);
      setProject((current) => (typeof next === "function" ? next(current) : next));
    },
    [project],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      setFuture((f) => [project, ...f].slice(0, 50));
      setProject(p[p.length - 1]);
      return p.slice(0, -1);
    });
  }, [project]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      setPast((p) => [...p, project]);
      setProject(f[0]);
      return f.slice(1);
    });
  }, [project]);

  const message = useMemo(
    () => project.messages.find((m) => m.id === selected) ?? project.messages[0] ?? null,
    [project.messages, selected],
  );

  const patchMessage = useCallback(
    (over) => {
      if (!message) return;
      commit((p) => ({ ...p, messages: p.messages.map((m) => (m.id === message.id ? { ...m, ...over } : m)) }));
    },
    [commit, message],
  );

  const addMessage = useCallback(() => {
    const author = message?.user ?? project.users[0].id;
    const next = newMessage(author, { content: "New message", timestamp: message?.timestamp ?? "Today at 10:03" });
    commit((p) => ({ ...p, messages: [...p.messages, next] }));
    setSelected(next.id);
    setSection("messages");
    setTab("Content");
    setPane("inspector");
  }, [commit, message, project.users]);

  const duplicateMessage = useCallback(() => {
    if (!message) return;
    const copy = reid(message);
    copy.reply = "";
    const i = project.messages.findIndex((m) => m.id === message.id);
    commit((p) => ({ ...p, messages: [...p.messages.slice(0, i + 1), copy, ...p.messages.slice(i + 1)] }));
    setSelected(copy.id);
  }, [commit, message, project.messages]);

  const removeMessage = useCallback(() => {
    if (!message || project.messages.length <= 1) {
      fail("A mockup needs at least one message.");
      return;
    }
    const id = message.id;
    const rest = project.messages.filter((m) => m.id !== id);
    commit((p) => ({
      ...p,
      // A reply pointing at a message that has gone would draw an empty spine.
      messages: p.messages.filter((m) => m.id !== id).map((m) => (m.reply === id ? { ...m, reply: "" } : m)),
    }));
    setSelected(rest[0]?.id ?? null);
  }, [commit, fail, message, project.messages]);

  /* One move, expressed as "this one goes there". The arrow buttons are a
     one-step case of it and the drag is an any-step case, so both go through
     here rather than each having its own idea of what moving means. */
  const reorder = useCallback(
    (from, to) => {
      if (from === to) return;
      commit((p) => {
        const list = [...p.messages];
        const [held] = list.splice(from, 1);
        list.splice(to, 0, held);
        return { ...p, messages: list };
      });
    },
    [commit],
  );

  const moveMessage = useCallback(
    (delta) => {
      if (!message) return;
      const i = project.messages.findIndex((m) => m.id === message.id);
      const j = i + delta;
      if (j < 0 || j >= project.messages.length) return;
      reorder(i, j);
    },
    [message, project.messages, reorder],
  );

  /* The whole window is 72px of rail, 240 of channels and 240 of members
     before the chat gets any: at the 780px a bare message list wants, the
     conversation is squeezed into 228 and every line wraps twice. Switching to
     it widens the canvas, and only ever widens — a canvas already big enough
     is left alone. */
  const setChrome = useCallback(
    (chrome) => {
      const floor = chrome === "full" ? 1180 : chrome === "chat" ? 640 : 0;
      commit((p) => ({
        ...p,
        canvas: { ...p.canvas, chrome, width: Math.max(p.canvas.width, floor) },
      }));
    },
    [commit],
  );

  const load = useCallback(
    (next, nextSlug) => {
      const migrated = migrate(next);
      if (!validProject(migrated)) {
        fail("That is not a valid mockup file.");
        return;
      }
      commit(migrated);
      if (nextSlug) setSlug(nextSlug);
      setSelected(migrated.messages[0]?.id ?? null);
      setSection("messages");
      setTab("Content");
    },
    [commit, fail],
  );

  /* ------------------------------------------------------------ actions */

  const doExportPng = useCallback(async () => {
    if (!stage.current) return;
    setExporting(true);
    try {
      await exportPng(stage.current, project);
      notify("PNG exported.");
    } catch {
      fail("The export failed. An image linked from another site can block it — upload it instead.");
    } finally {
      setExporting(false);
    }
  }, [fail, notify, project]);

  const doShare = useCallback(async () => {
    const link = shareLink(project);
    if (!link) {
      fail("This mockup is too big for a link. Download the project file, or back it up to the cloud.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      notify("Link copied. It carries the whole mockup and never touches the server.");
    } catch {
      fail("Could not reach the clipboard.");
    }
  }, [fail, notify, project]);

  const copyJson = useCallback(async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(messageJson(message));
      notify("Message JSON copied.");
    } catch {
      fail("Could not reach the clipboard.");
    }
  }, [fail, message, notify]);

  const importFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (file.size > 24 * 1024 * 1024) {
        fail("That file is too large to be a mockup.");
        return;
      }
      try {
        load(JSON.parse(await file.text()), uid().slice(0, 8));
        notify("Project imported.");
      } catch {
        fail("That file could not be read as a mockup.");
      }
    },
    [fail, load, notify],
  );

  /* ---------------------------------------------------------- gestures */

  const { dragging, zoomShown, handlers: canvasHandlers } = useCanvasGestures({
    scrollerRef: scroller,
    zoom,
    setZoom,
  });

  const fit = room > 0 ? Math.min(1, room / project.canvas.width) : 1;
  const shown = zoomShown * fit;

  const rows = useReorder({ count: project.messages.length, onMove: reorder });
  const sheet = useOverlay(templatesOpen, 200);

  /* --------------------------------------------------------- shortcuts */

  useEffect(() => {
    const onKey = (event) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setTemplatesOpen(false);
        return;
      }
      if (typing) return;

      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateMessage();
      }
      if (mod && event.key === "Enter") {
        event.preventDefault();
        addMessage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addMessage, duplicateMessage, redo, undo]);

  /* ------------------------------------------------------------- render */

  const panelTitle = SECTIONS.find((s) => s.id === section)?.label ?? "";

  return (
    <div className="e-app">
      <SiteNav user={user} canSignIn={canSignIn} compact links={false}>
        <div className="e-titlebar">
          <input
            className="e-project-name"
            aria-label="Mockup name"
            value={project.name}
            onChange={(e) => commit((p) => ({ ...p, name: e.target.value }))}
          />
          <span className="e-save" data-saved={savedLocally ? "true" : "false"}>
            {savedLocally ? <IconCheck size={13} /> : <IconDeviceFloppy size={13} />}
            {savedLocally ? "Saved in this browser" : "Saving…"}
          </span>
        </div>

        <div className="e-topbar-actions e-no-export">
          <button type="button" className="e-icon-btn" onClick={undo} disabled={!past.length} aria-label="Undo">
            <IconArrowBackUp size={16} />
          </button>
          <button type="button" className="e-icon-btn" onClick={redo} disabled={!future.length} aria-label="Redo">
            <IconArrowForwardUp size={16} />
          </button>
          <button type="button" className="e-btn e-btn-quiet" onClick={() => setTemplatesOpen(true)}>
            <IconStack2 size={15} /> Templates
          </button>
          <button type="button" className="e-btn e-btn-quiet" onClick={doShare}>
            <IconShare2 size={15} /> Share
          </button>
          <button type="button" className="e-btn e-btn-solid" onClick={doExportPng} disabled={exporting}>
            <IconPhotoDown size={15} /> {exporting ? "Exporting…" : "PNG"}
          </button>
        </div>
      </SiteNav>

      <div className="e-body" data-pane={pane}>
        {/* ------------------------------------------------------ left */}
        <aside className="e-left">
          <nav className="e-sections" aria-label="Sections">
            {SECTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className="e-section"
                data-on={section === id ? "true" : "false"}
                onClick={() => setSection(id)}
              >
                <Icon size={17} stroke={1.8} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {section === "messages" ? (
            <div className="e-outline">
              <ol className="e-outline-list" ref={outline}>
                {project.messages.map((m, i) => {
                  const author = project.users.find((u) => u.id === m.user);
                  const summary =
                    m.kind === "system"
                      ? `${m.systemType ?? "system"} notice`
                      : m.content?.split("\n")[0].slice(0, 46) ||
                        (m.embeds?.length ? `${m.embeds.length} embed${m.embeds.length > 1 ? "s" : ""}` : "") ||
                        (m.components?.length ? "Components" : "") ||
                        "Empty message";
                  const held = rows.drag?.index === i && rows.drag.held;
                  const landing = rows.drag?.index === i && rows.drag.landing;
                  const shift = rows.offsetFor(i, 46);
                  return (
                    <li
                      key={m.id}
                      data-row
                      className="e-outline-item"
                      data-held={held ? "true" : "false"}
                      data-landing={landing ? "true" : "false"}
                      /* The held row moves with the pointer and the rest slide
                         one slot out of its way. Both are transforms, so the
                         list never reflows while it is being rearranged. */
                      style={{
                        transform: shift ? `translateY(${shift}px)` : undefined,
                        /* Only the displaced rows ease. The held one is glued
                           to the pointer, and easing that is putting the row a
                           few pixels behind the finger on purpose. */
                        transition:
                          held || landing
                            ? "none"
                            : "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
                        zIndex: held || landing ? 2 : undefined,
                      }}
                    >
                      <button
                        type="button"
                        className="e-outline-row"
                        data-on={message?.id === m.id ? "true" : "false"}
                        onClick={() => {
                          if (rows.drag) return;
                          setSelected(m.id);
                          setPane("inspector");
                        }}
                        {...rows.handlers(i, outline)}
                      >
                        {/* The handle. A span rather than a button, because a
                            button inside a button is invalid markup — it
                            carries pointer handlers only, and the arrow
                            buttons below are the keyboard's way to reorder.
                            On a touch screen it is the only way in, since
                            dragging the row itself is how the list scrolls. */}
                        <span
                          className="e-grip"
                          aria-hidden="true"
                          {...rows.gripHandlers(i, outline)}
                        >
                          <IconGripVertical size={14} />
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="e-outline-face" src={author?.avatar} alt="" draggable={false} />
                        <span className="e-outline-copy">
                          <span className="e-outline-name">{author?.name ?? "Unknown"}</span>
                          <span className="e-outline-text">{summary}</span>
                        </span>
                        <span className="e-outline-index">{i + 1}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="e-outline-actions">
                <button type="button" className="e-btn e-btn-dashed" onClick={addMessage}>
                  <IconPlus size={15} /> Add a message
                </button>
                <div className="e-outline-tools">
                  <button type="button" className="e-icon-btn" onClick={() => moveMessage(-1)} aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" className="e-icon-btn" onClick={() => moveMessage(1)} aria-label="Move down">
                    ↓
                  </button>
                  <button type="button" className="e-icon-btn" onClick={duplicateMessage} aria-label="Duplicate">
                    <IconCopy size={15} />
                  </button>
                  <button type="button" className="e-icon-btn" onClick={removeMessage} aria-label="Delete">
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="e-left-foot">
            {/* The header drops these two below 720px for room, and the
                command palette that also carries them wants a keyboard. On a
                phone this pane is where they live instead — drawn only at the
                widths where the header is not showing them. */}
            <div className="e-left-narrow">
              <button type="button" className="e-btn e-btn-quiet" onClick={() => setTemplatesOpen(true)}>
                <IconStack2 size={15} /> Templates
              </button>
              <button type="button" className="e-btn e-btn-quiet" onClick={doShare}>
                <IconShare2 size={15} /> Share a link
              </button>
              <button type="button" className="e-btn e-btn-quiet" onClick={() => setPaletteOpen(true)}>
                <IconSettings size={15} /> All commands
              </button>
            </div>
            <button type="button" className="e-btn e-btn-quiet" onClick={() => importer.current?.click()}>
              <IconDownload size={15} style={{ transform: "rotate(180deg)" }} /> Import a project
            </button>
            <button type="button" className="e-btn e-btn-quiet" onClick={() => exportProject(project)}>
              <IconFileText size={15} /> Download the project
            </button>
            <input ref={importer} type="file" accept="application/json,.json" hidden onChange={importFile} />
          </div>
        </aside>

        {/* --------------------------------------------------- preview */}
        <main className="e-stage">
          <div className="e-stage-bar e-no-export">
            <span className="e-stage-label">{project.canvas.platform === "mobile" ? "Phone" : "Desktop"} · {project.canvas.theme}</span>
            <span className="e-stage-spacer" />
            <button
              type="button"
              className="e-icon-btn"
              onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
              aria-label="Zoom out"
            >
              <IconZoomOut size={16} />
            </button>
            <button type="button" className="e-zoom" onClick={() => setZoom(1)} title="Reset the zoom">
              {Math.round(shown * 100)}%
            </button>
            <button
              type="button"
              className="e-icon-btn"
              onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
              aria-label="Zoom in"
            >
              <IconZoomIn size={16} />
            </button>
          </div>

          <div
            className="e-stage-scroll"
            ref={scroller}
            data-grabbing={dragging ? "true" : "false"}
            {...canvasHandlers}
          >
            <div
              className={`e-frame${project.canvas.platform === "mobile" ? " e-frame-phone" : ""}`}
              style={{
                width: project.canvas.width,
                borderRadius: project.canvas.radius,
                /* `zoom`, not `transform: scale()`. A transform paints the
                   element smaller and leaves its box the original size, so a
                   1180px canvas shrunk to fit a phone still laid out 1180px
                   wide and the scaled picture sat off to one side of it.
                   `zoom` scales the box too, so the frame centres and the
                   scroller measures what is actually on screen. The PNG export
                   is unaffected: it rasterises the surface inside this
                   element, with its own `zoom: 1`. */
                zoom: shown,
              }}
            >
              <DiscordSurface
                project={project}
                selectedId={message?.id}
                onSelect={(id) => {
                  setSelected(id);
                  setSection("messages");
                }}
                innerRef={stage}
              />
            </div>
          </div>
        </main>

        {/* ------------------------------------------------- inspector */}
        <aside className="e-right">
          <header className="e-right-head">
            <h2>{section === "messages" ? "Message" : panelTitle}</h2>
            {section === "messages" && message ? (
              <button type="button" className="e-btn e-btn-quiet" onClick={copyJson}>
                <IconCopy size={14} /> JSON
              </button>
            ) : null}
          </header>

          {section === "messages" ? (
            <nav className="e-tabs" aria-label="Message parts">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="e-tab"
                  data-on={tab === t ? "true" : "false"}
                  onClick={() => setTab(t)}
                >
                  {t}
                  {t === "Embeds" && message?.embeds?.length ? (
                    <span className="e-tab-count">{message.embeds.length}</span>
                  ) : null}
                  {t === "Components" && message?.components?.length ? (
                    <span className="e-tab-count">{message.components.length}</span>
                  ) : null}
                </button>
              ))}
            </nav>
          ) : null}

          <div className="e-right-body">
            {section === "messages" ? (
              <Inspector tab={tab} message={message} project={project} patch={patchMessage} onError={fail} />
            ) : section === "users" ? (
              <UsersPanel project={project} commit={commit} onError={fail} />
            ) : section === "emojis" ? (
              <EmojiPanel project={project} commit={commit} onError={fail} />
            ) : section === "canvas" ? (
              <CanvasPanel project={project} commit={commit} onError={fail} onChrome={setChrome} />
            ) : (
              <CloudPanel
                project={project}
                slug={slug}
                user={user}
                canSignIn={canSignIn}
                onLoad={load}
                onError={fail}
                onNotify={notify}
              />
            )}
          </div>

          {section === "messages" && message ? (
            <footer className="e-right-foot">
              <button type="button" className="e-btn e-btn-quiet" onClick={() => exportMessageJson(message, project.name)}>
                <IconDownload size={14} /> Download the message JSON
              </button>
            </footer>
          ) : null}
        </aside>
      </div>

      {/* The phone's pane switcher. Below 1080px the three columns are one, and
          this is what moves between them. */}
      <nav className="e-panes e-no-export" aria-label="Panes">
        {[
          { id: "outline", label: "Outline", Icon: IconLayoutList },
          { id: "preview", label: "Preview", Icon: IconPhotoDown },
          { id: "inspector", label: "Edit", Icon: IconSettings },
        ].map(({ id, label, Icon }) => (
          <button key={id} type="button" className="e-pane" data-on={pane === id ? "true" : "false"} onClick={() => setPane(id)}>
            <Icon size={18} stroke={1.8} />
            {label}
          </button>
        ))}
      </nav>

      {sheet.mounted ? (
        <div className="e-sheet-scrim" data-state={sheet.state} onClick={() => setTemplatesOpen(false)}>
          <div
            className="e-sheet"
            data-state={sheet.state}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Templates"
          >
            <header className="e-sheet-head">
              <h2>Start from something</h2>
              <p>Each one is built to show a different surface. Opening one replaces what is on the canvas.</p>
            </header>
            <ul className="e-template-grid">
              {TEMPLATES.map((template) => (
                <li key={template.id}>
                  <button
                    type="button"
                    className="e-template"
                    onClick={() => {
                      load(template.build(), uid().slice(0, 8));
                      setTemplatesOpen(false);
                      notify(`Opened “${template.name}”.`);
                    }}
                  >
                    <span className="e-template-name">{template.name}</span>
                    <span className="e-template-hint">{template.hint}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="e-template"
                  onClick={() => {
                    load(blankProject(), uid().slice(0, 8));
                    setTemplatesOpen(false);
                  }}
                >
                  <span className="e-template-name">Empty</span>
                  <span className="e-template-hint">One message and two members. Build it up from there.</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      <Palette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          actions={[
            { label: "Add a message", run: addMessage },
            { label: "Duplicate this message", run: duplicateMessage },
            { label: "Delete this message", run: removeMessage },
            { label: "Export a PNG", run: doExportPng },
            { label: "Copy a share link", run: doShare },
            { label: "Copy the message JSON", run: copyJson },
            { label: "Download the project file", run: () => exportProject(project) },
            { label: "Open templates", run: () => setTemplatesOpen(true) },
            { label: "Undo", run: undo },
            { label: "Redo", run: redo },
            ...["light", "ash", "dark", "onyx"].map((theme) => ({
              label: `Discord theme: ${theme}`,
              run: () => commit((p) => ({ ...p, canvas: { ...p.canvas, theme } })),
            })),
            {
              label: `Switch to the ${project.canvas.platform === "mobile" ? "desktop" : "phone"} client`,
              run: () =>
                commit((p) => ({
                  ...p,
                  canvas: { ...p.canvas, platform: p.canvas.platform === "mobile" ? "desktop" : "mobile" },
                })),
            },
            ...SECTIONS.map((s) => ({ label: `Go to ${s.label}`, run: () => setSection(s.id) })),
          ]}
      />

      {toast ? (
        <div className="e-toast e-no-export" data-tone={toast.tone} key={toast.key} role="status">
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
