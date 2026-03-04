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

export const PREVIEW_FONT_SIZES: Record<string, string> = {
  sm: "clamp(0.6rem, 1.4vw, 1.1rem)",
  md: "clamp(0.75rem, 1.8vw, 1.4rem)",
  lg: "clamp(0.95rem, 2.3vw, 1.8rem)",
  xl: "clamp(1.2rem,  3vw,   2.3rem)",
};

export const CONTROLLER_FONT_SIZES: Record<string, string> = {
  sm: "clamp(0.9rem, 2vw,  1.8rem)",
  md: "clamp(1.2rem, 2.5vw, 2.2rem)",
  lg: "clamp(1.5rem, 3vw,  2.8rem)",
  xl: "clamp(1.9rem, 3.8vw, 3.5rem)",
};

export const FONT_LABELS: Record<string, string> = Object.fromEntries(
  FONTS.map((f) => [f.id, f.label])
);

export function parseLyrics(text: string): string[] {
  return text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
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
  "deep-space":     "bg-indigo-500/15 text-indigo-400",
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
