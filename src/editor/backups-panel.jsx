"use client";

/* Backups: everything that is a copy of this mockup, in one list.
 *
 * Three tiers, and the panel says plainly which is which rather than blurring
 * them into "saved". A person needs to know what survives what.
 *
 *   This browser   written on every change, restored when you come back, gone
 *                  if the browser is cleared.
 *   Backups        copies you made on purpose, plus automatic snapshots the
 *                  editor takes every minute or so and prunes. Same browser.
 *   Cloud          a copy on the deployment, tied to your Discord account, and
 *                  the only one that survives a new machine.
 */

import { useCallback, useEffect, useState } from "react";
import {
  IconCloud,
  IconCloudCheck,
  IconCloudOff,
  IconArrowBackUp,
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconFileText,
  IconPlus,
  IconHistory,
  IconPencil,
  IconRefresh,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import {
  AUTO_KEEP,
  deleteBackup,
  listAll,
  readBackup,
  renameBackup,
  saveBackup,
  updateBackup,
} from "@/lib/backups";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Empty, Group } from "./fields";
import "./backups-panel.css";

/* Discohook caps a backup name at 100; the same number, for the same reason —
   a name is a label, not a description. */
const NAME_MAX = 100;

const when = (t) => {
  const secs = Math.round((Date.now() - t) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.round(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
};

const size = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/* Hoisted deliberately.
 *
 * Declared inside `BackupsPanel` this is a new component *type* on every
 * render, so React throws the list away and rebuilds it whenever anything
 * above changes. The autosave flips `savedLocally` a moment after every
 * keystroke, which re-rendered the panel, which remounted every row — and a
 * row that remounts between the press and the release never sees the click.
 * That is why restoring, renaming and deleting all silently did nothing. */
function BackupRow({ row, busy, onOpen, onRename, onDuplicate, onDelete, icon }) {
  return (
    <li className="b-row" data-current={row.current ? "true" : "false"}>
      <button type="button" className="b-open" onClick={onOpen} disabled={busy}>
        <span className="b-name">
          {icon}
          {row.name}
        </span>
        <span className="b-meta">
          {row.messages} {row.messages === 1 ? "message" : "messages"}
          {row.bytes ? ` · ${size(row.bytes)}` : ""} · {when(row.savedAt ?? row.updatedAt)}
        </span>
        {/* The whole row opens the backup, which is not something anybody
            guesses from a row. It says so when you point at it. */}
        <span className="b-open-hint">
          {row.current ? "Open again" : "Open"}
          <IconArrowBackUp size={13} />
        </span>
      </button>
      {onRename ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="e-icon-btn" onClick={onRename} aria-label="Rename">
              <IconPencil size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Rename</TooltipContent>
        </Tooltip>
      ) : null}
      {onDuplicate ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="e-icon-btn" onClick={onDuplicate} aria-label="Duplicate">
              <IconCopy size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Duplicate</TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="e-icon-btn" onClick={onDelete} aria-label="Delete this backup">
            <IconTrash size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </li>
  );
}

export function BackupsPanel({ project, slug, user, canSignIn, linkedId, onLink, onLoad, onError, onNotify, savedLocally }) {
  const [rows, setRows] = useState(null);
  const [cloud, setCloud] = useState(null);
  const [busy, setBusy] = useState(false);
  const [noCloud, setNoCloud] = useState(false);
  const [query, setQuery] = useState("");

  /* The backup this working copy belongs to, if it still exists — a backup can
     be deleted from under a link. */
  const linked = (rows ?? []).find((r) => r.id === linkedId) ?? null;

  const refreshLocal = useCallback(() => {
    listAll()
      .then(setRows)
      .catch(() => {
        setRows([]);
        onError("This browser is not letting the editor list its backups.");
      });
  }, [onError]);

  const refreshCloud = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/mockups", { cache: "no-store" });
      if (res.status === 503) {
        setNoCloud(true);
        setCloud([]);
        return;
      }
      if (!res.ok) throw new Error();
      setCloud((await res.json()).mockups ?? []);
      setNoCloud(false);
    } catch {
      setCloud([]);
      onError("Could not read your cloud backups.");
    }
  }, [onError, user]);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal, savedLocally]);

  useEffect(() => {
    refreshCloud();
    // Only when the account changes; not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const makeBackup = async () => {
    setBusy(true);
    try {
      await saveBackup(project);
      onNotify(`“${project.name}” backed up in this browser.`);
      refreshLocal();
    } catch {
      onError("Could not write the backup. Browser storage may be full.");
    } finally {
      setBusy(false);
    }
  };

  const open = async (id) => {
    const restored = await readBackup(id).catch(() => null);
    if (!restored) {
      onError("That backup could not be read.");
      return;
    }
    onLoad(restored);
    /* Opening a named backup links to it, so the next Save updates the thing
       you just opened. An automatic snapshot is a moment in time rather than
       a document, so restoring one links to nothing. */
    onLink?.(String(id).startsWith("auto:") ? null : id);
    onNotify("Backup opened as a working copy.");
  };

  const rename = async (row) => {
    const next = window.prompt("Name this backup", row.name);
    if (next == null) return;
    await renameBackup(row.id, next.trim());
    refreshLocal();
  };

  const remove = async (id) => {
    await deleteBackup(id).catch(() => {});
    refreshLocal();
  };

  const pushCloud = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/mockups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, project }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onError(data.error ?? "The cloud backup did not go through.");
        return;
      }
      onNotify("Backed up to the cloud.");
      refreshCloud();
    } catch {
      onError("The cloud backup did not go through. Your work is still saved here.");
    } finally {
      setBusy(false);
    }
  };

  const openCloud = async (id) => {
    try {
      const res = await fetch(`/api/mockups/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onLoad(data.project, data.slug);
      onNotify(`Opened “${data.name}”.`);
    } catch {
      onError("That cloud backup could not be opened.");
    }
  };

  const removeCloud = async (id) => {
    try {
      const res = await fetch(`/api/mockups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      refreshCloud();
    } catch {
      onError("That backup could not be deleted.");
    }
  };

  /* Saving a linked mockup updates the backup it belongs to. Without the link
     every save made another copy, so a person working on one mockup ended up
     with fourteen of it and no way to tell which was current. */
  const saveLinked = async () => {
    if (!linked) return makeBackup();
    setBusy(true);
    try {
      await updateBackup(linked.id, project);
      onNotify(`\u201c${linked.name}\u201d updated.`);
      refreshLocal();
    } catch {
      onError("Could not write the backup. Browser storage may be full.");
    } finally {
      setBusy(false);
    }
  };

  const createNamed = async () => {
    const name = query.trim() || project.name;
    setBusy(true);
    try {
      const id = await saveBackup(project, name);
      onLink?.(id);
      setQuery("");
      onNotify(`\u201c${name}\u201d backed up in this browser.`);
      refreshLocal();
    } catch {
      onError("Could not write the backup. Browser storage may be full.");
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (row) => {
    const copy = await readBackup(row.id).catch(() => null);
    if (!copy) return onError("That backup could not be read.");
    await saveBackup(copy, `${row.name} copy`);
    refreshLocal();
  };

  const named = (rows ?? []).filter((r) => !r.auto);
  const autos = (rows ?? []).filter((r) => r.auto);
  const hit = (r) => r.name.toLowerCase().includes(query.trim().toLowerCase());
  const shownNamed = query.trim() ? named.filter(hit) : named;
  const exact = named.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <>
      {/* The backup this mockup belongs to, if it belongs to one. Everything
          about it is here: what it is called, when it was last written, and
          the two things you can do to the relationship. */}
      {linked ? (
        <div className="b-linked">
          <span className="b-linked-icon">
            <IconFileText size={17} />
          </span>
          <span className="b-linked-copy">
            <button type="button" className="b-linked-name" onClick={() => rename(linked)}>
              {linked.name}
              <IconPencil size={13} />
            </button>
            <em data-saved={savedLocally ? "true" : "false"}>
              {savedLocally ? `Saved ${when(linked.savedAt)}` : "Saving\u2026"}
            </em>
          </span>
          <span className="b-linked-actions">
            <button type="button" className="e-btn e-btn-solid" onClick={saveLinked} disabled={busy}>
              <IconDeviceFloppy size={14} /> Save
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="e-btn e-btn-quiet" onClick={() => onLink?.(null)}>
                  Unlink
                </button>
              </TooltipTrigger>
              <TooltipContent>Keep editing without changing that backup</TooltipContent>
            </Tooltip>
          </span>
        </div>
      ) : (
        <div className="b-state" data-saved={savedLocally ? "true" : "false"}>
          <IconDeviceFloppy size={15} />
          <span>
            <strong>{savedLocally ? "Saved in this browser" : "Saving\u2026"}</strong>
            <em>Written on every change and restored when you come back. Not a backup.</em>
          </span>
        </div>
      )}

      {/* One field for both jobs, because with a list this long they are the
          same job: you type a name to find it, and if it is not there yet the
          button beside you makes it. */}
      <div className="b-find">
        <label className="b-find-label" htmlFor="b-find-input">
          Search or name a new backup
          <span className="b-find-count">
            {query.length}/{NAME_MAX}
          </span>
        </label>
        <div className="b-find-row">
          <Input
            id="b-find-input"
            className="e-control"
            value={query}
            maxLength={NAME_MAX}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={project.name}
            spellCheck={false}
          />
          <button
            type="button"
            className="e-btn e-btn-solid"
            onClick={createNamed}
            disabled={busy || exact}
            title={exact ? "A backup already has that name" : undefined}
          >
            <IconPlus size={15} /> Create backup
          </button>
        </div>
      </div>

      <Group
        title="Backups in this browser"
        action={<span className="b-count">{named.length}</span>}
      >
        {rows === null ? (
          <Empty>Reading your backups…</Empty>
        ) : named.length === 0 ? (
          <Empty>
            No backups yet. Name one above and press Create backup to keep a copy you can come back
            to.
          </Empty>
        ) : shownNamed.length === 0 ? (
          <Empty>Nothing matches “{query.trim()}”. Create backup makes one with that name.</Empty>
        ) : (
          <ul className="b-list">
            {shownNamed.map((row) => (
              <BackupRow
                key={row.id}
                row={{ ...row, current: row.id === linkedId }}
                busy={busy}
                onOpen={() => open(row.id)}
                onRename={() => rename(row)}
                onDuplicate={() => duplicate(row)}
                onDelete={() => remove(row.id)}
              />
            ))}
          </ul>
        )}
      </Group>

      <Group title="Automatic snapshots" collapsible open={false}>
        <p className="e-field-hint">
          Taken while you work and pruned to the last {AUTO_KEEP}. These are the ones that cover
          “I pasted over everything” — they are not a place to keep anything on purpose.
        </p>
        {autos.length === 0 ? (
          <Empty>Nothing yet. The first is taken a minute or two in.</Empty>
        ) : (
          <ul className="b-list">
            {autos.map((row) => (
              <BackupRow
                key={row.id}
                row={row}
                busy={busy}
                onOpen={() => open(row.id)}
                onDelete={() => remove(row.id)}
              />
            ))}
          </ul>
        )}
      </Group>

      <Group
        title="Cloud"
        action={
          user && !noCloud ? (
            <span className="b-cloud-tools">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="e-icon-btn" onClick={refreshCloud} aria-label="Refresh">
                    <IconRefresh size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <button type="button" className="e-btn e-btn-quiet" onClick={pushCloud} disabled={busy}>
                <IconCloudCheck size={14} /> Back up
              </button>
            </span>
          ) : null
        }
      >
        {!canSignIn ? (
          <Empty>
            This deployment has no account set up, so there is nowhere to keep a cloud copy. Everything
            above still works, and the project file is a full copy you can keep anywhere.
          </Empty>
        ) : !user ? (
          <div className="b-signin">
            <IconCloudOff size={24} />
            <p>
              Sign in with the same Discord account you use for Gator and a copy is kept on the
              deployment — the only one that survives a cleared browser or a different machine.
            </p>
            <a className="e-btn e-btn-solid" href="/signin">
              Sign in with Discord
            </a>
          </div>
        ) : noCloud ? (
          <Empty>Cloud backup is switched off on this deployment.</Empty>
        ) : cloud === null ? (
          <Empty>Reading your cloud backups…</Empty>
        ) : cloud.length === 0 ? (
          <Empty>Nothing in the cloud yet.</Empty>
        ) : (
          <ul className="b-list">
            {cloud.map((row) => (
              <BackupRow
                key={row.id}
                row={{ ...row, current: row.slug === slug }}
                busy={busy}
                icon={<IconCloud size={13} />}
                onOpen={() => openCloud(row.id)}
                onDelete={() => removeCloud(row.id)}
              />
            ))}
          </ul>
        )}
      </Group>

      <Group title="Files" collapsible open={false}>
        <p className="e-field-hint">
          A project file is the whole mockup, including every pasted image. It is the copy that does
          not depend on this browser or on us.
        </p>
        <div className="b-files">
          <button type="button" className="e-btn e-btn-quiet" onClick={() => onLoad(null, null, "import")}>
            <IconUpload size={14} /> Import a project file
          </button>
          <button type="button" className="e-btn e-btn-quiet" onClick={() => onLoad(null, null, "export")}>
            <IconDownload size={14} /> Download this project
          </button>
        </div>
      </Group>

      <p className="e-field-hint b-foot">
        <IconHistory size={13} /> Undo goes back 50 steps within this session; backups go back
        further and survive a reload.
      </p>
    </>
  );
}
