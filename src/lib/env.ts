export const serverEnv = {
  BIBLE_API_KEY: process.env.BIBLE_API_KEY ?? null,
};

export const publicEnv = {
  hasBibleApi: process.env.NEXT_PUBLIC_BIBLE_API_ENABLED === 'true',
};
