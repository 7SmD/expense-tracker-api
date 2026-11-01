export function parseId(value: string): number | undefined {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return undefined;
  }

  return id;
}
