/**
 * Shape checking for organiser-edited content.
 *
 * No hand-written schema per section: the shape is derived from the shipped
 * defaults (plus optional extra samples for fields no default happens to use),
 * so the check can never drift from the types the pages actually read. An
 * override must use known keys, with the same kinds of values, and include
 * every key that all of the samples have.
 */

type Kind = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export type Shape = {
  kinds: Set<Kind>;
  fields?: Map<string, { shape: Shape; required: boolean }>;
  items?: Shape;
};

function kindOf(value: unknown): Kind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  return 'object';
}

function merge(a: Shape | undefined, b: Shape): Shape {
  if (!a) return b;
  const kinds = new Set([...a.kinds, ...b.kinds]);
  let fields = a.fields ?? b.fields;
  if (a.fields && b.fields) {
    fields = new Map();
    for (const key of new Set([...a.fields.keys(), ...b.fields.keys()])) {
      const fa = a.fields.get(key);
      const fb = b.fields.get(key);
      fields.set(key, {
        shape: fb ? merge(fa?.shape, fb.shape) : fa!.shape,
        required: Boolean(fa?.required && fb?.required),
      });
    }
  }
  const items = a.items && b.items ? merge(a.items, b.items) : (a.items ?? b.items);
  return { kinds, fields, items };
}

/** Derive a shape from one or more sample values. */
export function shapeOf(...samples: unknown[]): Shape {
  let shape: Shape | undefined;
  for (const sample of samples) {
    const kind = kindOf(sample);
    let next: Shape = { kinds: new Set([kind]) };
    if (kind === 'object') {
      next.fields = new Map(
        Object.entries(sample as Record<string, unknown>).map(([k, v]) => [
          k,
          { shape: shapeOf(v), required: true },
        ]),
      );
    } else if (kind === 'array') {
      const items = sample as unknown[];
      next = { ...next, items: items.length ? shapeOf(...items) : undefined };
    }
    shape = merge(shape, next);
  }
  return shape ?? { kinds: new Set() };
}

/** Problems with `value`, as readable paths. Empty means it conforms. */
export function check(value: unknown, shape: Shape, path = 'value'): string[] {
  const kind = kindOf(value);
  if (!shape.kinds.has(kind)) {
    return [`${path} should be ${[...shape.kinds].join(' or ')}, not ${kind}`];
  }
  const errors: string[] = [];
  if (kind === 'object' && shape.fields) {
    const record = value as Record<string, unknown>;
    for (const [key, field] of shape.fields) {
      if (field.required && !(key in record)) errors.push(`${path}.${key} is missing`);
    }
    for (const [key, v] of Object.entries(record)) {
      const field = shape.fields.get(key);
      if (!field) {
        errors.push(`${path}.${key} is not a known field`);
        continue;
      }
      // An explicit null for an optional field is the same as leaving it out.
      if (v === null && !field.required && !field.shape.kinds.has('null')) continue;
      errors.push(...check(v, field.shape, `${path}.${key}`));
    }
  }
  if (kind === 'array' && shape.items) {
    (value as unknown[]).forEach((item, i) => {
      errors.push(...check(item, shape.items!, `${path}[${i}]`));
    });
  }
  return errors.slice(0, 20);
}
