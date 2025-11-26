export const dedupeArray = (arr: string[]): string[] => {
  return Array.from(new Set(arr));
};

export const chunkStrings = (
  input: string[],
  chunkLength: number
): string[][] => {
  const result: string[][] = [];

  for (let i = 0; i < input.length; i += chunkLength) {
    result.push(input.slice(i, i + chunkLength));
  }

  return result;
};
