// What we're raising money for. The /donate page renders these as a
// breakdown alongside the total goal so contributors see exactly where
// their money is going. Edit here, page updates automatically.

export type CostItem = {
  id: string;
  label: string;
  detail: string;
  amount: number; // EUR
};

export const COST_ITEMS: CostItem[] = [
  {
    id: "domain",
    label: "Domain (simedo.work)",
    detail: "One year",
    amount: 2.81,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    detail: "Two months × €22.19",
    amount: 22.19 * 2,
  },
  {
    id: "claude-api",
    label: "Helper AI (Claude API tokens)",
    detail: "API credits for the in-app assistant",
    amount: 22.59,
  },
];

export const GOAL_EUR = COST_ITEMS.reduce((sum, c) => sum + c.amount, 0);

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
