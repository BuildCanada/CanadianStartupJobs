export const dedupeArray = (arr: string[]): string[] => {
  return Array.from(new Set(arr));
};
