"use client";

/* The three panels that are about the project rather than about one message:
 * who is in it, what it looks like, and where it is saved.
 */

import { useEffect, useState } from "react";
import {
  IconCloudCheck,
  IconCloudOff,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { AVATAR_COUNT, avatarUrl } from "@/lib/avatars";
import { newUser } from "@/lib/model";
import {
  ColorField,
  Empty,
  Field,
  Group,
  ImageField,
  Pick,
  Row,
  Segmented,
  Slider,
  Text,
  Toggle,
} from "./fields";

/* ---------------------------------------------------------------- users */

/* The avatar grid loads 240 files. `loading="lazy"` on each one means the
   browser fetches the two rows in view rather than the whole set, which is
   the reason the collection is files rather than one inlined blob. */
function AvatarPicker({ value, onChange, onClose }) {
  return (
    <div className="e-avatars">
      <header className="e-avatars-head">
        <span>Pick an avatar</span>
        <button type="button" className="e-btn e-btn-quiet" onClick={onClose}>
          Done
        </button>
      </header>
      <div className="e-avatars-grid">
        {Array.from({ length: AVATAR_COUNT }, (_, i) => avatarUrl(i)).map((src) => (
          <button
            key={src}
            type="button"
            className="e-avatar-cell"
            data-on={value === src ? "true" : "false"}
            onClick={() => onChange(src)}
            aria-label="Use this avatar"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function UsersPanel({ project, commit, onError }) {
  const [picking, setPicking] = useState(null);

  const patch = (id, over) =>
    commit((p) => ({ ...p, users: p.users.map((u) => (u.id === id ? { ...u, ...over } : u)) }));

  const remove = (id) => {
    if (project.users.length <= 1) {
      onError("A project needs at least one member.");
      return;
    }
    const fallback = project.users.find((u) => u.id !== id).id;
    commit((p) => ({
      ...p,
      users: p.users.filter((u) => u.id !== id),
      // A message whose author has gone is reassigned rather than deleted:
      // losing a message because a member was tidied up would be a surprise.
      messages: p.messages.map((m) => (m.user === id ? { ...m, user: fallback } : m)),
    }));
  };

  return (
    <>
      {project.users.map((user, i) => (
        <Group
          key={user.id}
          title={user.name || `Member ${i + 1}`}
          collapsible
          open={i === 0}
          action={
            <button type="button" className="e-icon-btn" onClick={() => remove(user.id)} aria-label="Remove member">
              <IconTrash size={14} />
            </button>
          }
        >
          <Row>
            <Field label="Name">
              <Text value={user.name} onChange={(v) => patch(user.id, { name: v })} />
            </Field>
          </Row>

          <Field label="Name colour" hint="Their top coloured role. Leave empty for the default text colour.">
            <ColorField value={user.color} onChange={(v) => patch(user.id, { color: v === "none" ? "" : v })} allowNone />
          </Field>

          <Field label="Avatar">
            <div className="e-avatar-row">
              <span className="e-avatar-current">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt="" />
              </span>
              <button
                type="button"
                className="e-btn e-btn-quiet"
                onClick={() => setPicking(picking === user.id ? null : user.id)}
              >
                Choose from the set
              </button>
            </div>
          </Field>

          {picking === user.id ? (
            <AvatarPicker
              value={user.avatar}
              onChange={(src) => patch(user.id, { avatar: src })}
              onClose={() => setPicking(null)}
            />
          ) : null}

          <ImageField
            label="Or upload one"
            value={user.avatar?.startsWith("data:") ? user.avatar : ""}
            onChange={(v) => patch(user.id, { avatar: v || avatarUrl(0) })}
            onError={onError}
          />

          <Toggle
            label="Application"
            hint="Draws the APP tag beside the name."
            value={user.bot}
            onChange={(v) => patch(user.id, { bot: v })}
          />
          {user.bot ? (
            <>
              <Row>
                <Field label="Tag text">
                  <Text value={user.badge} onChange={(v) => patch(user.id, { badge: v })} placeholder="APP" />
                </Field>
              </Row>
              <Toggle
                label="Verified"
                hint="Adds the check inside the tag. A webhook has the tag without the check."
                value={user.verified}
                onChange={(v) => patch(user.id, { verified: v })}
              />
            </>
          ) : null}

          <Field label="Server tag" hint="The clan badge after the name. Leave empty for none.">
            <Text value={user.tag} onChange={(v) => patch(user.id, { tag: v })} placeholder="GATOR" />
          </Field>

          <Field label="Presence" hint="Only drawn in the member list.">
            <Pick
              value={user.status || "online"}
              onChange={(v) => patch(user.id, { status: v })}
              options={[
                { value: "online", label: "Online" },
                { value: "idle", label: "Idle" },
                { value: "dnd", label: "Do not disturb" },
                { value: "offline", label: "Offline" },
              ]}
            />
          </Field>

          <ImageField
            label="Avatar decoration"
            hint="Drawn over the avatar at 1.2×, the way the client layers one."
            value={user.decoration}
            onChange={(v) => patch(user.id, { decoration: v })}
            onError={onError}
          />
          <ImageField
            label="Role icon"
            value={user.roleIcon}
            onChange={(v) => patch(user.id, { roleIcon: v })}
            onError={onError}
          />
        </Group>
      ))}

      <button
        type="button"
        className="e-btn e-btn-dashed"
        onClick={() =>
          commit((p) => ({
            ...p,
            users: [...p.users, newUser({ avatar: avatarUrl(p.users.length * 7), name: `Member ${p.users.length + 1}` })],
          }))
        }
      >
        <IconPlus size={15} /> Add a member
      </button>
    </>
  );
}

/* --------------------------------------------------------------- emojis */

export function EmojiPanel({ project, commit, onError }) {
  const emojis = project.emojis ?? [];
  return (
    <>
      <div className="e-note">
        Upload a server emoji and use it anywhere as <code>:name:</code> — in a message, on a button,
        on a poll answer or as a reaction. Unicode emoji need no upload: they are drawn from the same
        set the client uses.
      </div>

      {emojis.map((emoji, i) => (
        <Group
          key={i}
          title={emoji.name ? `:${emoji.name}:` : `Emoji ${i + 1}`}
          collapsible
          open={i === emojis.length - 1}
          action={
            <button
              type="button"
              className="e-icon-btn"
              onClick={() => commit((p) => ({ ...p, emojis: p.emojis.filter((_, n) => n !== i) }))}
              aria-label="Remove emoji"
            >
              <IconTrash size={14} />
            </button>
          }
        >
          <Field label="Name" hint="Letters, numbers and underscores, the way Discord names one.">
            <Text
              value={emoji.name}
              onChange={(v) =>
                commit((p) => ({
                  ...p,
                  emojis: p.emojis.map((e, n) => (n === i ? { ...e, name: v.replace(/[^\w]/g, "") } : e)),
                }))
              }
            />
          </Field>
          <ImageField
            label="Image"
            value={emoji.src}
            onChange={(v) =>
              commit((p) => ({ ...p, emojis: p.emojis.map((e, n) => (n === i ? { ...e, src: v } : e)) }))
            }
            onError={onError}
          />
        </Group>
      ))}

      <button
        type="button"
        className="e-btn e-btn-dashed"
        onClick={() => commit((p) => ({ ...p, emojis: [...(p.emojis ?? []), { name: `emoji_${(p.emojis?.length ?? 0) + 1}`, src: "" }] }))}
      >
        <IconPlus size={15} /> Add a custom emoji
      </button>
    </>
  );
}

/* --------------------------------------------------------------- canvas */

export function CanvasPanel({ project, commit, onError, onChrome }) {
  const canvas = project.canvas;
  const set = (key, value) => commit((p) => ({ ...p, canvas: { ...p.canvas, [key]: value } }));
  const setIn = (key, over) => commit((p) => ({ ...p, canvas: { ...p.canvas, [key]: { ...p.canvas[key], ...over } } }));

  return (
    <>
      <Group title="Appearance">
        <Field label="Discord theme" hint="The four the client ships. Ash is its default dark.">
          <Segmented
            value={canvas.theme}
            onChange={(v) => set("theme", v)}
            label="Discord theme"
            options={[
              { value: "light", label: "Light" },
              { value: "ash", label: "Ash" },
              { value: "dark", label: "Dark" },
              { value: "onyx", label: "Onyx" },
            ]}
          />
        </Field>

        <Field label="Client">
          <Segmented
            value={canvas.platform}
            onChange={(v) => set("platform", v)}
            label="Client"
            options={[
              { value: "desktop", label: "Desktop", icon: <IconDeviceDesktop size={14} /> },
              { value: "mobile", label: "Phone", icon: <IconDeviceMobile size={14} /> },
            ]}
          />
        </Field>

        <Field label="How much of the client" hint="Messages alone, the channel with its header and box, or the whole window.">
          <Segmented
            value={canvas.chrome}
            onChange={onChrome}
            label="Chrome"
            options={[
              { value: "none", label: "Messages" },
              { value: "chat", label: "Channel" },
              { value: "full", label: "Window" },
            ]}
          />
        </Field>
      </Group>

      <Group title="Canvas">
        <Field label="Width">
          <Slider value={canvas.width} min={320} max={1400} step={10} onChange={(v) => set("width", v)} suffix="px" />
        </Field>
        {canvas.chrome === "none" ? (
          <Field label="Padding">
            <Slider value={canvas.padding} min={0} max={80} onChange={(v) => set("padding", v)} suffix="px" />
          </Field>
        ) : null}
        <Field label="Corner radius">
          <Slider value={canvas.radius} min={0} max={32} onChange={(v) => set("radius", v)} suffix="px" />
        </Field>
        <Field label="Export scale" hint="A 2× export is what a retina screenshot looks like.">
          <Segmented
            value={String(canvas.scale)}
            onChange={(v) => set("scale", Number(v))}
            label="Export scale"
            options={[
              { value: "1", label: "1×" },
              { value: "2", label: "2×" },
              { value: "3", label: "3×" },
            ]}
          />
        </Field>
        <Field label="Background">
          <Segmented
            value={canvas.background}
            onChange={(v) => set("background", v)}
            label="Background"
            options={[
              { value: "surface", label: "Chat" },
              { value: "transparent", label: "None" },
              { value: "custom", label: "Image" },
            ]}
          />
        </Field>
        {canvas.background === "custom" ? (
          <ImageField
            label="Background image"
            value={canvas.customBackground}
            onChange={(v) => set("customBackground", v)}
            onError={onError}
          />
        ) : null}
      </Group>

      <Group title="Channel" collapsible open={canvas.chrome !== "none"}>
        <Row>
          <Field label="Server name">
            <Text value={canvas.server?.name} onChange={(v) => setIn("server", { name: v })} />
          </Field>
          <Field label="Channel">
            <Text value={canvas.channel?.name} onChange={(v) => setIn("channel", { name: v })} />
          </Field>
        </Row>
        <Field label="Topic">
          <Text value={canvas.channel?.topic} onChange={(v) => setIn("channel", { topic: v })} />
        </Field>
        <ImageField
          label="Server icon"
          value={canvas.server?.icon}
          onChange={(v) => setIn("server", { icon: v })}
          onError={onError}
        />
        <Field label="Other channels" hint="Comma separated. Only drawn with the whole window.">
          <Text
            value={(canvas.channels ?? []).join(", ")}
            onChange={(v) => set("channels", v.split(",").map((s) => s.trim()).filter(Boolean))}
          />
        </Field>
      </Group>

      <Group title="Extras" collapsible>
        <Toggle label="Date divider" value={canvas.showDateDivider} onChange={(v) => set("showDateDivider", v)} />
        {canvas.showDateDivider ? (
          <Field label="Date">
            <Text value={canvas.dateLabel} onChange={(v) => set("dateLabel", v)} />
          </Field>
        ) : null}
        <Toggle
          label="New messages line"
          hint="The red rule the client leaves where you stopped reading."
          value={canvas.showNewDivider}
          onChange={(v) => set("showNewDivider", v)}
        />
        <Toggle label="Typing indicator" value={canvas.showTyping} onChange={(v) => set("showTyping", v)} />
        {canvas.showTyping ? (
          <Field label="Who is typing">
            <Text value={canvas.typingNames} onChange={(v) => set("typingNames", v)} />
          </Field>
        ) : null}
        <Field label="Density" hint="Compact is Discord's setting that removes the gap between messages.">
          <Segmented
            value={canvas.density}
            onChange={(v) => set("density", v)}
            label="Density"
            options={[
              { value: "cozy", label: "Cozy" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </Field>
      </Group>
    </>
  );
}

/* ---------------------------------------------------------------- cloud */

/* The backup panel.
 *
 * It says which copy is which, always. Local is the working copy and is
 * written on every change; the cloud is a snapshot taken when asked. Blurring
 * that line is how a person ends up believing a save happened that did not,
 * so the list shows the cloud's own timestamp rather than the editor's.
 */
export function CloudPanel({ project, slug, user, onLoad, onError, onNotify }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const res = await fetch("/api/mockups", { cache: "no-store" });
      if (res.status === 503) {
        setUnavailable(true);
        setRows([]);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.mockups ?? []);
      setUnavailable(false);
    } catch {
      onError("Could not read your saved mockups.");
      setRows([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (user) refresh();
    // Only when the account changes: refreshing on every keystroke would be a
    // request per character typed into the project name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/mockups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, project }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onError(data.error ?? "The backup did not go through.");
        return;
      }
      onNotify("Backed up.");
      refresh();
    } catch {
      onError("The backup did not go through. Your work is still saved in this browser.");
    } finally {
      setBusy(false);
    }
  };

  const open = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/mockups/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onLoad(data.project, data.slug);
      onNotify(`Opened “${data.name}”.`);
    } catch {
      onError("That mockup could not be opened.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/mockups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      refresh();
    } catch {
      onError("That mockup could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="e-cloud-empty">
        <IconCloudOff size={26} />
        <h3>Sign in to back your work up</h3>
        <p>
          Everything you draw is already saved in this browser and stays there. Signing in with the
          same Discord account you use for Gator keeps a second copy in the cloud, so a cleared
          browser or a different machine is not the end of it.
        </p>
        <a className="e-btn e-btn-solid" href="/api/auth/signin?callbackUrl=%2Fbuilder">
          Sign in with Discord
        </a>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="e-cloud-empty">
        <IconCloudOff size={26} />
        <h3>Cloud backup is switched off</h3>
        <p>
          This deployment has no backup store configured. Your work is still saved in this browser,
          and the project file below is a full copy you can keep anywhere.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="e-cloud-actions">
        <button type="button" className="e-btn e-btn-solid" onClick={save} disabled={busy}>
          <IconCloudCheck size={15} /> Back this one up
        </button>
        <button type="button" className="e-btn e-btn-quiet" onClick={refresh} disabled={busy} aria-label="Refresh">
          <IconRefresh size={15} />
        </button>
      </div>

      {rows === null ? (
        <Empty>Reading your saved mockups…</Empty>
      ) : rows.length === 0 ? (
        <Empty>Nothing backed up yet. The button above takes the first snapshot.</Empty>
      ) : (
        <ul className="e-cloud-list">
          {rows.map((row) => (
            <li className="e-cloud-row" key={row.id} data-current={row.slug === slug ? "true" : "false"}>
              <button type="button" className="e-cloud-open" onClick={() => open(row.id)} disabled={busy}>
                <span className="e-cloud-name">{row.name}</span>
                <span className="e-cloud-meta">
                  {row.messages} {row.messages === 1 ? "message" : "messages"} ·{" "}
                  {new Date(row.updatedAt).toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                className="e-icon-btn"
                onClick={() => remove(row.id)}
                disabled={busy}
                aria-label={`Delete ${row.name}`}
              >
                <IconTrash size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
