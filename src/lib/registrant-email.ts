const PLACEHOLDER_EMAIL_SUFFIX = '@registrant.local';

export function isPlaceholderRegistrantEmail(
  email: string | null | undefined,
): boolean {
  return !!email && email.endsWith(PLACEHOLDER_EMAIL_SUFFIX);
}

/** Returns a user-facing email, or undefined when none was provided. */
export function displayRegistrantEmail(
  email: string | null | undefined,
): string | undefined {
  if (!email || isPlaceholderRegistrantEmail(email)) return undefined;
  return email;
}
