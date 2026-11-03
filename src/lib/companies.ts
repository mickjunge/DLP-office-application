// The companies a booking can be made for. The code is what's stored in the
// database (and checked there); the name is what's shown in the agenda.
export const COMPANIES = [
  { code: "DLP", name: "David Lewis Productions" },
  { code: "BTB", name: "Buddha to Buddha" },
  { code: "PIXEL", name: "Pixel Artist Management" },
  { code: "EM", name: "Entertainment Matters" },
] as const;

export function companyName(code: string | null | undefined) {
  return COMPANIES.find(c => c.code === code)?.name;
}
