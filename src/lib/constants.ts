export const QUERY_KEYS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  PRESENTATIONS: 'presentations',
  PRESENTATION: 'presentation',
  EVENTS: 'events',
  EVENT: 'event',
  COLLABORATIONS: 'collaborations',
  REGISTRATIONS: 'registrations',
  REGISTRATION: 'registration',
} as const;

export const OFFICER_TITLES = [
  'President',
  'Vice President',
  'Secretary',
  'Treasurer',
  'Auditor',
  'PIO',
  'Program Co.',
  'Intercessory Co.',
  'Media Co.',
  'Music Co.',
  'Technical Co.',
  'Business Manager',
  'Other',
] as const;

export type OfficerTitle = (typeof OFFICER_TITLES)[number];

export const EMPTY_USER_FORM = {
  name: '',
  email: '',
  role: 'officer' as const,
  password: '',
  orgId: '',
  title: '',
};

export const SPEEDS = [
  { id: "fast",   label: "Fast",   ms: 250,  animRate: 2   },
  { id: "normal", label: "Normal", ms: 600,  animRate: 1   },
  { id: "slow",   label: "Slow",   ms: 1100, animRate: 0.5 },
] as const;

export const TRANSITIONS = [
  { id: "fade", label: "Fade"     },
  { id: "up",   label: "Slide Up" },
  { id: "zoom", label: "Zoom"     },
  { id: "blur", label: "Blur In"  },
] as const;

export const FONTS = [
  { id: "inter",       label: "Inter",        family: "'Inter', sans-serif"          },
  { id: "lato",        label: "Lato",         family: "'Lato', sans-serif"           },
  { id: "poppins",     label: "Poppins",      family: "'Poppins', sans-serif"        },
  { id: "montserrat",  label: "Montserrat",   family: "'Montserrat', sans-serif"     },
  { id: "raleway",     label: "Raleway",      family: "'Raleway', sans-serif"        },
  { id: "nunito",      label: "Nunito",       family: "'Nunito', sans-serif"         },
  { id: "oswald",      label: "Oswald",       family: "'Oswald', sans-serif"         },
  { id: "bebas",       label: "Bebas Neue",   family: "'Bebas Neue', sans-serif"     },
  { id: "playfair",    label: "Playfair",     family: "'Playfair Display', serif"    },
  { id: "lora",        label: "Lora",         family: "'Lora', serif"               },
  { id: "cormorant",   label: "Cormorant",    family: "'Cormorant Garamond', serif"  },
  { id: "cinzel",      label: "Cinzel",       family: "'Cinzel', serif"              },
  { id: "eb-garamond", label: "EB Garamond",  family: "'EB Garamond', serif"         },
  { id: "dancing",     label: "Dancing Script", family: "'Dancing Script', cursive"  },
] as const;

export const SIZES = [
  { id: "sm", label: "S"  },
  { id: "md", label: "M"  },
  { id: "lg", label: "L"  },
  { id: "xl", label: "XL" },
] as const;

/**
 * Base font sizes in px at 1920px presenter resolution.
 * SlidePreview scales these by containerWidth/1920 automatically.
 */
export const PREVIEW_FONT_SIZES: Record<string, number> = {
  sm: 40,
  md: 56,
  lg: 78,
  xl: 100,
};

export const CONTROLLER_FONT_SIZES: Record<string, number> = {
  sm: 40,
  md: 56,
  lg: 78,
  xl: 100,
};

export const FONT_LABELS: Record<string, string> = Object.fromEntries(
  FONTS.map((f) => [f.id, f.label])
);

export function parseLyrics(text: string | undefined | null): string[] {
  if (!text) return [];
  return text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
}

/** Prefix that marks a slide as a song-title card: "§TITLE§\nSong Title\nArtist Name" */
export const TITLE_SLIDE_MARKER = '§TITLE§';

export function isTitleSlide(slide: string): boolean {
  return slide.startsWith(TITLE_SLIDE_MARKER);
}

/** Parse a title slide into its parts. Returns null if not a title slide.
 *  Format: §TITLE§\n<title>\n<artist>\n<role?>
 *  Sections have blank title & artist with only role set. */
export function parseTitleSlide(slide: string): { title: string; artist: string; role: string; isSection: boolean } | null {
  if (!isTitleSlide(slide)) return null;
  const [, title = '', artist = '', role = ''] = slide.split('\n');
  return { title, artist, role, isSection: !title && !artist && !!role };
}

export const BACKGROUNDS = [
  { id: "deep-space",     label: "Deep Space",     cls: "bg-deep-space"     },
  { id: "aurora",         label: "Aurora",         cls: "bg-aurora"         },
  { id: "sunset",         label: "Sunset Glory",   cls: "bg-sunset"         },
  { id: "holy-fire",      label: "Holy Fire",      cls: "bg-holy-fire"      },
  { id: "ocean",          label: "Ocean Depths",   cls: "bg-ocean"          },
  { id: "midnight-bloom", label: "Midnight Bloom", cls: "bg-midnight-bloom" },
  { id: "sacred-gold",    label: "Sacred Gold",    cls: "bg-sacred-gold"    },
  { id: "amethyst",       label: "Royal Amethyst", cls: "bg-amethyst"       },
  { id: "storm",          label: "Storm Front",    cls: "bg-storm"          },
  { id: "crimson",        label: "Crimson Tide",   cls: "bg-crimson"        },
  { id: "emerald",        label: "Emerald Isle",   cls: "bg-emerald"        },
  { id: "arctic",         label: "Arctic Dawn",    cls: "bg-arctic"         },
] as const;

export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];

export const BG_BADGE_COLORS: Record<string, string> = {
  "deep-space":     "bg-primary/15 text-primary",
  "aurora":         "bg-emerald-500/15 text-emerald-400",
  "sunset":         "bg-orange-500/15 text-orange-400",
  "holy-fire":      "bg-red-500/15 text-red-400",
  "ocean":          "bg-cyan-500/15 text-cyan-400",
  "midnight-bloom": "bg-purple-500/15 text-purple-400",
  "sacred-gold":    "bg-yellow-500/15 text-yellow-500",
  "amethyst":       "bg-violet-500/15 text-violet-400",
  "storm":          "bg-slate-500/15 text-slate-400",
  "crimson":        "bg-rose-500/15 text-rose-400",
  "emerald":        "bg-green-500/15 text-green-400",
  "arctic":         "bg-sky-500/15 text-sky-400",
};
