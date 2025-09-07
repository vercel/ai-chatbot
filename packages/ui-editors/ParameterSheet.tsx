import React, { useState } from 'react';
import { type z, ZodEnum, ZodEffects, ZodNumber, type ZodObject, type ZodRawShape } from 'zod';

export type ParameterSheetProps<T extends ZodObject<ZodRawShape>> = {
  schema: T;
  initialValues: z.infer<T>;
  /**
   * Called when the user clicks "Apply and Re-Run" on a valid form.
   * This can be wired into the Edit & Re-Run flow.
   */
  onApply: (values: z.infer<T>) => void;
};

export function ParameterSheet<T extends ZodObject<ZodRawShape>>({
  schema,
  initialValues,
  onApply,
}: ParameterSheetProps<T>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: unknown) => {
    const partial = schema.pick({ [name]: true } as any);
    const result = partial.safeParse({ [name]: value });
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: result.success ? '' : result.error.issues[0]?.message ?? 'Invalid' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      onApply(result.data);
    } else {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') newErrors[key] = issue.message;
      }
      setErrors(newErrors);
    }
  };

  const shape = (schema as unknown as ZodObject<ZodRawShape>).shape;

  const unwrap = (s: any): any => {
    let current = s;
    while (current instanceof ZodEffects) {
      current = current._def.schema;
    }
    return current;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="parameter-sheet">
      {Object.entries(shape).map(([name, fieldSchema]) => {
        const base = unwrap(fieldSchema);
        if (base instanceof ZodNumber) {
          const min = base._def.checks.find((c: any) => c.kind === 'min')?.value;
          const max = base._def.checks.find((c: any) => c.kind === 'max')?.value;
          return (
            <div key={name} className="flex flex-col gap-1">
              <label htmlFor={name}>{name}</label>
              <input
                id={name}
                type="range"
                min={min}
                max={max}
                value={(values as any)[name] as number}
                onInput={(e) => handleChange(name, Number((e.target as HTMLInputElement).value))}
              />
              <span className="text-xs" data-testid={`${name}-value`}>
                {(values as any)[name]}
              </span>
              {errors[name] && (
                <span className="text-red-500 text-xs" role="alert">
                  {errors[name]}
                </span>
              )}
            </div>
          );
        }
        if (fieldSchema instanceof ZodEnum) {
          return (
            <div key={name} className="flex flex-col gap-1">
              <label htmlFor={name}>{name}</label>
              <select
                id={name}
                value={(values as any)[name] as string}
                onChange={(e) => handleChange(name, e.target.value)}
              >
                {fieldSchema.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors[name] && (
                <span className="text-red-500 text-xs" role="alert">
                  {errors[name]}
                </span>
              )}
            </div>
          );
        }
        return null;
      })}
      <button
        type="submit"
        className="self-start border px-3 py-1 rounded"
        disabled={Object.values(errors).some((e) => e)}
      >
        Apply and Re-Run
      </button>
    </form>
  );
}

export default ParameterSheet;

