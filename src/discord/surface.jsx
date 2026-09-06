"use client";

/* The chat surface, and as much of the client around it as the canvas asks for.
 *
 * Three settings, and they are a ladder rather than a set of options. "None"
 * is the messages alone on the chat ground, which is what most mockups want
 * and what exports cleanly into a document. "Chat" adds the channel header and
 * the message box, which is what makes a picture read as a conversation rather
 * than as a list. "Full" adds the server rail, the channel sidebar and the
 * member list — the whole window, for a screenshot that has to look like
 * somebody took it.
 *
 * The mobile platform is not the desktop one narrowed. Discord's phone client
 * has a different grid: no member list, no rail, a back arrow instead of a
 * hash, a rounded composer that floats, and messages inset from a 40px avatar
 * with the author line above rather than beside the first line. That is a
 * second layout, and it is drawn as one.
 */

import { useMemo } from "react";
import { RenderContext } from "./context";
import { Message } from "./message";
import { DateDivider, NewDivider } from "./system";
import "./tokens.css";
import "./discord.css";
import "./chrome.css";

/* -------------------------------------------------------------- chrome */

function ServerRail({ canvas }) {
  const initial = (canvas.server?.name || "S").slice(0, 1).toUpperCase();
  return (
    <nav className="dc-rail" aria-hidden="true">
      <span className="dc-rail-home">
        <svg width="26" height="20" viewBox="0 0 24 18" fill="currentColor">
          <path d="M20 1.5A17 17 0 0 0 15.7.2l-.5 1a15 15 0 0 0-6.4 0l-.5-1A17 17 0 0 0 4 1.5C1.3 5.5.6 9.4.9 13.2A17 17 0 0 0 6.1 15.8l1-1.6a11 11 0 0 1-1.8-.8l.5-.4a12 12 0 0 0 10.4 0l.5.4a11 11 0 0 1-1.8.9l1 1.6a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-2.9-11.8ZM8.3 10.9c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.9 2.1-1.9 2.1Zm7.4 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.9 2.1-1.9 2.1Z" />
        </svg>
      </span>
      <span className="dc-rail-rule" />
      <span className="dc-rail-server dc-rail-active">
        {canvas.server?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={canvas.server.icon} alt="" />
        ) : (
          initial
        )}
      </span>
      <span className="dc-rail-server dc-rail-ghost" />
      <span className="dc-rail-server dc-rail-ghost" />
      <span className="dc-rail-server dc-rail-add">+</span>
    </nav>
  );
}

function ChannelList({ canvas }) {
  const channels = canvas.channels?.length ? canvas.channels : [canvas.channel?.name || "general"];
  return (
    <aside className="dc-sidebar" aria-hidden="true">
      <header className="dc-sidebar-head">
        {canvas.server?.name || "Community"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </header>
      <div className="dc-sidebar-body">
        <div className="dc-sidebar-category">{canvas.channel?.category || "TEXT CHANNELS"}</div>
        {channels.map((name) => (
          <div className={`dc-sidebar-channel${name === canvas.channel?.name ? " dc-sidebar-on" : ""}`} key={name}>
            <span className="dc-hash">#</span>
            {name}
          </div>
        ))}
      </div>
    </aside>
  );
}

function ChannelHeader({ canvas, mobile }) {
  if (mobile) {
    return (
      <header className="dc-m-head" aria-hidden="true">
        <svg className="dc-m-back" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="dc-hash">#</span>
        <span className="dc-m-head-name">{canvas.channel?.name || "general"}</span>
        <span className="dc-m-head-tools">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 3h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </header>
    );
  }
  return (
    <header className="dc-head" aria-hidden="true">
      <span className="dc-hash">#</span>
      <span className="dc-head-name">{canvas.channel?.name || "general"}</span>
      {canvas.channel?.topic ? (
        <>
          <span className="dc-head-rule" />
          <span className="dc-head-topic">{canvas.channel.topic}</span>
        </>
      ) : null}
    </header>
  );
}

function MemberList({ canvas, users }) {
  const online = users.filter((u) => u.status !== "offline");
  const offline = users.filter((u) => u.status === "offline");
  const group = (label, list) =>
    list.length ? (
      <>
        <div className="dc-members-label">
          {label} — {list.length}
        </div>
        {list.map((u) => (
          <div className="dc-member" key={u.id}>
            <span className="dc-member-face">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.avatar} alt="" />
              <span className={`dc-presence dc-presence-${u.status || "online"}`} />
            </span>
            <span className="dc-member-name" style={u.color ? { color: u.color } : undefined}>
              {u.name}
            </span>
            {u.bot ? <span className="dc-app-badge dc-app-badge-sm">{u.badge || "APP"}</span> : null}
          </div>
        ))}
      </>
    ) : null;

  return (
    <aside className="dc-members" aria-hidden="true">
      {group("ONLINE", online)}
      {group("OFFLINE", offline)}
    </aside>
  );
}

function Composer({ canvas, mobile }) {
  return (
    <div className={mobile ? "dc-m-composer" : "dc-composer"} aria-hidden="true">
      {mobile ? null : <span className="dc-composer-plus">+</span>}
      <span className="dc-composer-text">Message #{canvas.channel?.name || "general"}</span>
      <span className="dc-composer-tools">
        {mobile ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M9 10h.01M15 10h.01M8.5 14a4.5 4.5 0 0 0 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <span className="dc-composer-gift">🎁</span>
            <span className="dc-composer-gif">GIF</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M9 10h.01M15 10h.01M8.5 14a4.5 4.5 0 0 0 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </>
        )}
      </span>
    </div>
  );
}

function Typing({ names }) {
  return (
    <div className="dc-typing" aria-hidden="true">
      <span className="dc-typing-dots">
        <i />
        <i />
        <i />
      </span>
      <span>
        <strong>{names}</strong> is typing…
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- surface */

export function DiscordSurface({ project, selectedId, onSelect, innerRef }) {
  const canvas = project.canvas ?? {};
  const mobile = canvas.platform === "mobile";

  /* Context rather than props: a mention can appear at any depth of a
     container tree, and threading the user list through every renderer to
     reach it is how a component ends up with eleven props it does not use. */
  const ctx = useMemo(
    () => ({ users: project.users ?? [], emojis: project.emojis ?? [], messages: project.messages ?? [] }),
    [project.users, project.emojis, project.messages],
  );

  const stream = (
    <div className="dc-stream">
      {canvas.showDateDivider ? <DateDivider label={canvas.dateLabel || "Today"} /> : null}
      {(project.messages ?? []).map((message, i) => (
        <div key={message.id}>
          {canvas.showNewDivider && i === (project.messages.length - 1) ? <NewDivider /> : null}
          <Message
            message={message}
            selected={selectedId === message.id}
            onSelect={onSelect ? () => onSelect(message.id) : undefined}
          />
        </div>
      ))}
      {canvas.showTyping ? <Typing names={canvas.typingNames || "Someone"} /> : null}
    </div>
  );

  const surfaceStyle = {
    "--dc-font": `${canvas.fontSize ?? 16}px`,
    background:
      canvas.background === "custom" && canvas.customBackground
        ? `center/cover url(${JSON.stringify(canvas.customBackground)})`
        : canvas.background === "transparent"
          ? "transparent"
          : undefined,
  };

  return (
    <RenderContext.Provider value={ctx}>
      <div
        ref={innerRef}
        className={`dc dc-${canvas.theme || "ash"} dc-chrome-${canvas.chrome || "none"} ${
          mobile ? "dc-mobile" : "dc-desktop"
        } dc-density-${canvas.density || "cozy"}`}
        style={surfaceStyle}
      >
        {canvas.chrome === "full" && !mobile ? <ServerRail canvas={canvas} /> : null}
        {canvas.chrome === "full" && !mobile ? <ChannelList canvas={canvas} /> : null}

        <div className="dc-main">
          {canvas.chrome !== "none" ? <ChannelHeader canvas={canvas} mobile={mobile} /> : null}
          {/* With no chrome the canvas sets its own inset — but only the
              vertical half of it goes on the scroller. The horizontal half is
              handed down as `--dc-edge` and added to each message's own
              padding instead, so a hovered or selected row washes the full
              width of the column the way the client does, rather than
              stopping short of the edge. */}
          <div
            className="dc-scroll"
            style={
              canvas.chrome === "none"
                ? { paddingBlock: canvas.padding, "--dc-edge": `${canvas.padding ?? 0}px` }
                : undefined
            }
          >
            {stream}
          </div>
          {canvas.chrome !== "none" ? <Composer canvas={canvas} mobile={mobile} /> : null}
        </div>

        {canvas.chrome === "full" && !mobile ? <MemberList canvas={canvas} users={ctx.users} /> : null}
      </div>
    </RenderContext.Provider>
  );
}
