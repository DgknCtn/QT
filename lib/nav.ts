import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  BookOpen,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Wallet,
  Calculator,
  Layers,
  ListChecks,
  Bitcoin,
  CandlestickChart,
  Radar,
  Target,
  NotebookPen,
  Brain,
  FileText,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for application navigation.
 *
 * The sidebar and the top bar used to keep two independent pathname-keyed lists,
 * which had already drifted apart -- seven routes had a title but no sidebar
 * entry. Both now derive from this array.
 */

export const NAV_GROUP_ORDER = ["Home", "Plan", "Analyze", "Tools", "Research"] as const;
export type NavGroup = (typeof NAV_GROUP_ORDER)[number];

export type NavItem = {
  href: string;
  /** Sidebar label and top-bar page title. */
  label: string;
  icon: LucideIcon;
  /** Omit to keep the route out of the sidebar; it still resolves a page title. */
  group?: NavGroup;
  /** Renders a primary action button in the top bar for this route. */
  quickAdd?: { label: string; href: string };
  /** Set when the section renders its own heading, to avoid a duplicate title. */
  hideTopBarTitle?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, group: "Home" },
  { href: "/daily-prep", label: "Daily Prep", icon: ClipboardList,   group: "Home",
    quickAdd: { label: "New Prep", href: "/daily-prep/new" } },
  { href: "/katmanlar",  label: "Education",  icon: Layers,          group: "Home" },
  { href: "/journal",    label: "Journal",    icon: BookOpen,        group: "Home",
    quickAdd: { label: "Add Trade", href: "/journal/new" } },
  { href: "/binance-log", label: "Binance Log", icon: Bitcoin,          group: "Home" },
  { href: "/okx-log",     label: "OKX Log",     icon: CandlestickChart, group: "Home" },
  { href: "/calendar",   label: "Calendar",   icon: Calendar,        group: "Home" },

  { href: "/analytics",  label: "Analytics",  icon: BarChart3,       group: "Analyze" },
  { href: "/accounts",   label: "Accounts",   icon: Wallet,          group: "Analyze" },

  { href: "/risk-calculator", label: "Risk Calc",  icon: Calculator,     group: "Tools" },
  { href: "/mentorship",      label: "Mentorship", icon: GraduationCap,  group: "Tools" },

  // The Market Research sub-app renders its own <h1> and tab bar.
  { href: "/market-research", label: "Market Research", icon: Radar, group: "Research", hideTopBarTitle: true },

  // DELIBERATELY HIDDEN from the sidebar (owner's decision) -- reachable by
  // direct URL only. They are listed here purely so the top bar can title them.
  // Do not add a `group` to these without asking first.
  //
  // /trade-log is hidden but MUST NOT be deleted: /trade-log/[id] is the
  // detail page every broker log links to, Binance and OKX rows included.
  { href: "/trade-log",     label: "Trade Log",      icon: ListChecks },
  { href: "/levels",        label: "Levels",         icon: TrendingUp,
    quickAdd: { label: "Add Level", href: "/levels/new" } },
  { href: "/setups",        label: "Setups",         icon: Target },
  { href: "/playbook",      label: "Playbook",       icon: NotebookPen },
  { href: "/knowledge",     label: "Knowledge Base", icon: Brain },
  { href: "/goals",         label: "Goals",          icon: Target },
  { href: "/weekly-review", label: "Weekly Review",  icon: CalendarCheck },
  { href: "/notion",        label: "Notion",         icon: FileText },
  { href: "/settings",      label: "Settings",       icon: FileText },
];

/** Longest-prefix match, so `/journal/123/edit` still resolves to "Journal". */
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/")).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
}

/** Grouped items for the sidebar, in declared group order. */
export function getNavGroups(): { label: NavGroup; items: NavItem[] }[] {
  return NAV_GROUP_ORDER.map((label) => ({
    label,
    items: NAV_ITEMS.filter((i) => i.group === label),
  })).filter((g) => g.items.length > 0);
}
