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
