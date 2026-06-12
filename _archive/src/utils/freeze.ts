export function deepFreeze<T>(obj: T): Readonly<T> {
  const seen = new WeakSet<object>();

  const freezeObject = (value: unknown): void => {
    if (value === null || typeof value !== "object") {
      return;
    }

    const asObject = value as object;
    if (seen.has(asObject)) {
      return;
    }

    seen.add(asObject);

    for (const key of Reflect.ownKeys(asObject)) {
      const child = Reflect.get(asObject, key);
      freezeObject(child);
    }

    Object.freeze(asObject);
  };

  freezeObject(obj);
  return obj as Readonly<T>;
}
