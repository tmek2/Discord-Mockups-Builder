"use client";

/* A rich embed.
 *
 * The layout is a two-column grid rather than a float, because the thumbnail
 * is not text-adjacent: it occupies the top-right corner and the title,
 * description and fields flow in the column beside it, then the image and the
 * footer run the full width underneath. A float gets the common case right and
 * then wraps the footer around the thumbnail, which the client never does.
 *
 * Fields are a twelve-column grid. Discord packs up to three inline fields
 * onto a row, and a row with two takes six columns each rather than four —
 * which is why the span has to be computed from the run of inline fields a
 * field belongs to rather than from the field itself.
 */

import { Markdown, MarkdownInline, formatTime } from "./markdown";

/* How wide one field sits, in twelfths.
 *
 * Walk out to the ends of the unbroken run of inline fields this one is in,
 * find which row of three it lands on, and divide twelve by how many are
 * actually on that row. A non-inline field is always the full width. */
function fieldSpan(fields, i) {
  if (!fields[i].inline) return 12;
  let start = i;
  while (start > 0 && fields[start - 1].inline) start -= 1;
  let end = i;
  while (end + 1 < fields.length && fields[end + 1].inline) end += 1;
  const rowStart = start + Math.floor((i - start) / 3) * 3;
  return 12 / Math.min(3, end - rowStart + 1);
}

function footerTime(value) {
  if (!value) return "";
  const n = Number(value);
  if (Number.isFinite(n) && String(value).trim() !== "") return formatTime(n, "f");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : formatTime(Math.floor(date.getTime() / 1000), "f");
}

export function Embed({ embed }) {
  const fields = embed.fields ?? [];
  const hasSide = Boolean(embed.thumbnail);

  return (
    <div className="dc-embed" style={{ borderLeftColor: embed.color || "#5865f2" }}>
      <div className={`dc-embed-grid${hasSide ? " dc-embed-has-thumb" : ""}`}>
        <div className="dc-embed-main">
          {embed.provider ? <div className="dc-embed-provider">{embed.provider}</div> : null}

          {embed.author ? (
            <div className="dc-embed-author">
              {embed.authorIcon ? <img className="dc-embed-author-icon" src={embed.authorIcon} alt="" /> : null}
              {embed.authorUrl ? (
                <a className="dc-embed-author-name dc-link" href={embed.authorUrl} target="_blank" rel="noreferrer nofollow">
                  {embed.author}
                </a>
              ) : (
                <span className="dc-embed-author-name">{embed.author}</span>
              )}
            </div>
          ) : null}

          {embed.title ? (
            <div className="dc-embed-title">
              {embed.url ? (
                <a className="dc-link" href={embed.url} target="_blank" rel="noreferrer nofollow">
                  <MarkdownInline text={embed.title} />
                </a>
              ) : (
                <MarkdownInline text={embed.title} />
              )}
            </div>
          ) : null}

          {embed.description ? (
            <div className="dc-embed-description">
              <Markdown text={embed.description} jumbo={false} />
            </div>
          ) : null}

          {fields.length ? (
            <div className="dc-embed-fields">
              {fields.map((field, i) => (
                <div
                  className="dc-embed-field"
                  key={field.id}
                  style={{ gridColumn: `span ${fieldSpan(fields, i)}` }}
                >
                  <div className="dc-embed-field-name">
                    <MarkdownInline text={field.name} />
                  </div>
                  <div className="dc-embed-field-value">
                    <Markdown text={field.value} jumbo={false} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {embed.thumbnail ? (
          <img className="dc-embed-thumb" src={embed.thumbnail} alt="" draggable={false} />
        ) : null}
      </div>

      {embed.image ? <img className="dc-embed-image" src={embed.image} alt="" draggable={false} /> : null}
      {embed.video && !embed.image ? (
        <video className="dc-embed-image" src={embed.video} controls playsInline />
      ) : null}

      {embed.footer || embed.timestamp ? (
        <div className="dc-embed-footer">
          {embed.footerIcon ? <img className="dc-embed-footer-icon" src={embed.footerIcon} alt="" /> : null}
          {embed.footer ? <span>{embed.footer}</span> : null}
          {embed.footer && embed.timestamp ? <span className="dc-embed-dot">•</span> : null}
          {embed.timestamp ? <span>{footerTime(embed.timestamp)}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
