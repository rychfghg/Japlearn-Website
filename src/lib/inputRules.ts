// Plain-text rules for names, emails and passwords. The server enforces the same rules;
// these give instant feedback and stop emojis from being typed in the first place.

export const NAME_RULE = "Names can only use letters, spaces, hyphens, apostrophes and periods. Emojis, numbers and symbols are not allowed.";
export const PASSWORD_RULE = "Passwords can only use letters, numbers and keyboard symbols. Emojis are not allowed.";

const NOT_NAME = /[^\p{L}\p{M} .'’\-・]/gu;
const NAME = /^[\p{L}\p{M}](?:[\p{L}\p{M} .'’\-・]{0,58}[\p{L}\p{M}.])?$/u;

/** Drops emojis, numbers and symbols while typing a name. */
export const cleanName = (text: string) => text.replace(NOT_NAME, "").replace(/^\s+/, "").replace(/\s+/g, " ");
export const isValidName = (value: string) => NAME.test(value.trim().replace(/\s+/g, " "));

/** Keyboard characters only (no emojis, accents or spaces). */
export const cleanPassword = (text: string) => text.replace(/[^\x21-\x7E]/g, "");
export const isValidPassword = (value: string) => /^[\x21-\x7E]{8,128}$/.test(value);

/** Lower-case, and only the characters the server accepts in an email address. */
export const cleanEmail = (text: string) => text.toLowerCase().replace(/[^a-z0-9._%+\-@]/g, "");
export const STRICT_EMAIL = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/;
export const isStrictEmail = (value: string) => STRICT_EMAIL.test(value) && !value.includes("..");
