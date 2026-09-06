/* Discord's own profile badges.
 *
 * Extracted from the community icon library as transparent PNGs rather than
 * redrawn: these are recognisable marks, and an approximation of the HypeSquad
 * crest is worse than no crest at all. Grouped the way the client's profile
 * lists them, so the picker reads in the order somebody expects to find them.
 */

const at = (file) => `/discord/badges/${file}.png`;

export const BADGES = [
  { group: "Staff and programmes", items: [
    { id: "discord-staff-default", label: "Discord Staff" },
    { id: "partner-default", label: "Partner" },
    { id: "discord-certified-moderator-default", label: "Certified Moderator" },
    { id: "hypesquad-events-default", label: "HypeSquad Events" },
    { id: "hypesquad-bravery", label: "HypeSquad Bravery" },
    { id: "hypesquad-brilliance", label: "HypeSquad Brilliance" },
    { id: "hypesquad-balance", label: "HypeSquad Balance" },
    { id: "hypesquad-bravery-pride", label: "HypeSquad Bravery (Pride)" },
    { id: "hypesquad-brilliance-pride", label: "HypeSquad Brilliance (Pride)" },
    { id: "hypesquad-balance-pride", label: "HypeSquad Balance (Pride)" },
  ] },
  { group: "Developer", items: [
    { id: "active-developer-default", label: "Active Developer" },
    { id: "early-verified-bot-developer-default", label: "Early Verified Bot Developer" },
    { id: "bug-hunter-tier-1", label: "Bug Hunter" },
    { id: "bug-hunter-tier-2", label: "Bug Hunter, gold" },
    { id: "supports-commands", label: "Supports commands" },
    { id: "uses-automod", label: "Uses AutoMod" },
  ] },
  { group: "Subscriber", items: [
    { id: "nitro-default", label: "Nitro" },
    { id: "early-supporter-default", label: "Early Supporter" },
    { id: "server-booster", label: "Server Booster" },
    { id: "server-owner", label: "Server Owner" },
    { id: "new-member", label: "New Member" },
  ] },
  { group: "Boost length", items: [
    { id: "redesigned-boost-badge-1-month", label: "Boosting 1 month" },
    { id: "redesigned-boost-badge-2-months", label: "Boosting 2 months" },
    { id: "redesigned-boost-badge-3-months", label: "Boosting 3 months" },
    { id: "redesigned-boost-badge-6-months", label: "Boosting 6 months" },
    { id: "redesigned-boost-badge-9-months", label: "Boosting 9 months" },
    { id: "redesigned-boost-badge-12-months", label: "Boosting 12 months" },
    { id: "redesigned-boost-badge-15-months", label: "Boosting 15 months" },
    { id: "redesigned-boost-badge-18-months", label: "Boosting 18 months" },
    { id: "redesigned-boost-badge-24-months", label: "Boosting 24 months" },
  ] },
  { group: "Other", items: [
    { id: "discord-default", label: "Discord" },
    { id: "discord-staff-experimental", label: "Staff, experimental" },
    { id: "clown-for-a-limited-time-default", label: "Clown" },
  ] },
];

const KNOWN = new Map(BADGES.flatMap((g) => g.items).map((b) => [b.id, b]));

/** The badge, or nothing — an id from an older project must not break a render. */
export const badge = (id) => {
  const found = KNOWN.get(id);
  return found ? { ...found, src: at(found.id) } : null;
};

export const badgeList = () => BADGES;
