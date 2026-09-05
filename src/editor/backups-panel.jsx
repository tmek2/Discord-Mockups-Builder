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
  IconDeviceFloppy,
  IconDownload,
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
} from "@/lib/backups";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Empty, Group } from "./fields";
import "./backups-panel.css";

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
function BackupRow({ row, busy, onOpen, onRename, onDelete, icon }) {
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

export function BackupsPanel({ project, slug, user, canSignIn, onLoad, onError, onNotify, savedLocally }) {
  const [rows, setRows] = useState(null);
  const [cloud, setCloud] = useState(null);
  const [busy, setBusy] = useState(false);
  const [noCloud, setNoCloud] = useState(false);

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

  const named = (rows ?? []).filter((r) => !r.auto);
  const autos = (rows ?? []).filter((r) => r.auto);

  return (
    <>
      <div className="b-state" data-saved={savedLocally ? "true" : "false"}>
        <IconDeviceFloppy size={15} />
        <span>
          <strong>{savedLocally ? "Saved in this browser" : "Saving…"}</strong>
          <em>Written on every change and restored when you come back.</em>
        </span>
      </div>

      <Group
        title="Backups in this browser"
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="e-btn e-btn-quiet" onClick={makeBackup} disabled={busy}>
                <IconDeviceFloppy size={14} /> Back up now
              </button>
            </TooltipTrigger>
            <TooltipContent>Keep a copy of this mockup as it is</TooltipContent>
          </Tooltip>
        }
      >
        {rows === null ? (
          <Empty>Reading your backups…</Empty>
        ) : named.length === 0 ? (
          <Empty>No backups yet. “Back up now” keeps a copy you can come back to.</Empty>
        ) : (
          <ul className="b-list">
            {named.map((row) => (
              <BackupRow
                key={row.id}
                row={row}
                busy={busy}
                onOpen={() => open(row.id)}
                onRename={() => rename(row)}
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
            <a className="e-btn e-btn-solid" href="/api/auth/signin?callbackUrl=%2F">
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
