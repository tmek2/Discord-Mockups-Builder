/* The default avatar set.
 *
 * 240 PNGs at their original 45px artwork bounds, served from /avatars. They
 * used to be inlined as base64 in a single 700 KB JavaScript module, which
 * meant the whole collection was parsed on boot whether the picker was opened
 * or not, and none of it could be cached separately from the bundle. As files
 * the browser fetches only the ones it draws, and the grid can lazy-load.
 */
export const AVATAR_COUNT = 240;

/** The nth default avatar, wrapping so an out-of-range index still resolves. */
export const avatarUrl = (i) => `/avatars/${((i % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT}.png`;

export const DEFAULT_AVATARS = Array.from({ length: AVATAR_COUNT }, (_, i) => avatarUrl(i));
