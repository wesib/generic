/**
 * @internal
 */
export function Field$name(key: string | symbol, name: string | undefined): string | null {
  if (name === '') {
    return null;
  }
  if (name) {
    return name;
  }
  return Field$nameByKey(key);
}

/**
 * @internal
 */
export function Field$nameByKey(key: string | symbol): string | null {
  return typeof key === 'string' ? key : null;
}
