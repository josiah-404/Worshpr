export const REMOTE_EVENTS = {
  NAV: 'nav',
  STATE: 'state',
  REQUEST_STATE: 'request_state',
} as const;

export const getRemoteChannelName = (token: string): string =>
  `worship-remote:${token}`;

export const getRemoteUrl = (origin: string, token: string): string =>
  `${origin}/worship/remote/${token}`;
