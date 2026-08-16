import { describe, it, expect } from "vitest";
import { NAV_ITEMS, findNavItem, getNavGroups, NAV_GROUP_ORDER } from "./nav";

describe("findNavItem", () => {
  it("matches a section root exactly", () => {
    expect(findNavItem("/journal")?.label).toBe("Journal");
  });

  it("matches nested routes to their section", () => {
    expect(findNavItem("/journal/abc123")?.label).toBe("Journal");
    expect(findNavItem("/journal/abc123/edit")?.label).toBe("Journal");
    expect(findNavItem("/daily-prep/new")?.label).toBe("Daily Prep");
  });

  it("prefers the longest matching prefix", () => {
    // Both "/mentorship" and a deeper route could match; the specific one wins.
    expect(findNavItem("/mentorship/admin/courses")?.href).toBe("/mentorship");
    expect(findNavItem("/market-research/days/2026-08-10")?.href).toBe("/market-research");
  });

  it("does not match on a shared prefix that is not a path boundary", () => {
    // "/trade-log" must not be matched by an unrelated "/trade-logbook".
    const item = findNavItem("/trade-logbook");
    expect(item?.href).not.toBe("/trade-log");
  });

  it("returns undefined for unknown routes", () => {
    expect(findNavItem("/definitely-not-a-route")).toBeUndefined();
  });
});

describe("nav configuration integrity", () => {
  it("has no duplicate hrefs", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("only uses declared group names", () => {
    for (const item of NAV_ITEMS) {
      if (item.group) expect(NAV_GROUP_ORDER).toContain(item.group);
    }
  });

  it("points every quick-add at a real sub-route of its section", () => {
    for (const item of NAV_ITEMS) {
      if (item.quickAdd) {
        expect(item.quickAdd.href.startsWith(item.href + "/")).toBe(true);
      }
    }
  });
});

describe("getNavGroups", () => {
  it("returns groups in declared order", () => {
    const labels = getNavGroups().map((g) => g.label);
    const expectedOrder = NAV_GROUP_ORDER.filter((l) => labels.includes(l));
    expect(labels).toEqual(expectedOrder);
  });

  it("omits groups that have no items", () => {
    expect(getNavGroups().every((g) => g.items.length > 0)).toBe(true);
  });

  it("excludes deliberately hidden routes from the sidebar", () => {
    const visible = getNavGroups().flatMap((g) => g.items.map((i) => i.href));
    for (const hidden of ["/levels", "/setups", "/playbook", "/knowledge", "/goals", "/weekly-review", "/notion"]) {
      expect(visible).not.toContain(hidden);
    }
  });

  it("still resolves a title for hidden routes", () => {
    expect(findNavItem("/playbook")?.label).toBe("Playbook");
    expect(findNavItem("/goals")?.label).toBe("Goals");
  });
});
