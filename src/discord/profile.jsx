/* The profile popout.
 *
 * Where Discord actually shows a person's badges — not the member list, and
 * not beside their name in a message. So this is the surface the badge library
 * belongs to, and it is a thing mockups want in its own right: "here is the
 * person" is half of most screenshots that are trying to say something about
 * somebody.
 *
 * Drawn from the member the message belongs to, so it cannot disagree with the
 * message above it.
 */

import { badge } from "./badges";
import { Markdown } from "./markdown";

export function ProfileCard({ profile, user }) {
  if (!profile || !user) return null;
  const badges = (profile.badges ?? []).map(badge).filter(Boolean);
  const accent = profile.accent || user.color || "#5865f2";

  return (
    <div className="dc-profile" aria-hidden="true">
      <div
        className="dc-profile-banner"
        style={
          profile.banner
            ? { backgroundImage: `url(${JSON.stringify(profile.banner)})` }
            : { background: accent }
        }
      />

      <div className="dc-profile-avatar-slot">
        <img className="dc-profile-avatar" src={user.avatar} alt="" draggable={false} />
        {user.decoration ? <img className="dc-profile-decoration" src={user.decoration} alt="" /> : null}
        <span className={`dc-presence dc-presence-${user.status || "online"} dc-profile-presence`} />
      </div>

      <div className="dc-profile-body">
        {/* The badge tray floats top-right of the body, over the banner's
            bottom edge, exactly where the client puts it. */}
        {badges.length ? (
          <div className="dc-profile-badges">
            {badges.map((b) => (
              <img key={b.id} src={b.src} alt={b.label} title={b.label} />
            ))}
          </div>
        ) : null}

        <div className="dc-profile-names">
          <span className="dc-profile-display" style={user.color ? { color: user.color } : undefined}>
            {user.name}
          </span>
          {user.bot ? (
            <span className="dc-app-badge">
              {user.verified ? <span className="dc-app-check">✓</span> : null}
              {user.badge || "APP"}
            </span>
          ) : null}
        </div>
        {profile.handle ? <div className="dc-profile-handle">{profile.handle}</div> : null}

        {profile.bio ? (
          <div className="dc-profile-bio">
            <Markdown text={profile.bio} jumbo={false} />
          </div>
        ) : null}

        {profile.since ? (
          <div className="dc-profile-since">
            <span>Member since</span>
            <strong>{profile.since}</strong>
          </div>
        ) : null}

        {profile.roles?.length ? (
          <div className="dc-profile-roles">
            <span className="dc-profile-label">Roles</span>
            <div className="dc-profile-role-list">
              {profile.roles.map((role, i) => (
                <span className="dc-profile-role" key={i}>
                  <span className="dc-profile-role-dot" style={{ background: role.color || "#949ba4" }} />
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
