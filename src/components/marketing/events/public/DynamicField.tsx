"use client";

import type { CustomField } from "@/types/marketing-events";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";

interface DynamicFieldProps {
  field: CustomField;
  value: string;
  onChange: (value: string) => void;
}

export function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const label = (
    <label
      htmlFor={`cf-${field.key}`}
      className="mb-1 block text-sm font-medium text-slate-700"
    >
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  );

  switch (field.type) {
    case "textarea":
      return (
        <div>
          {label}
          <textarea
            id={`cf-${field.key}`}
            className={inputClass}
            rows={3}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "select":
      return (
        <div>
          {label}
          <select
            id={`cf-${field.key}`}
            className={inputClass}
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Selecione...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    case "radio":
      return (
        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </legend>
          <div className="space-y-2">
            {(field.options ?? []).map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-base text-slate-800"
              >
                <input
                  type="radio"
                  name={`cf-${field.key}`}
                  className="h-4 w-4"
                  required={field.required}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-base text-slate-800">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={value === "sim"}
            onChange={(e) => onChange(e.target.checked ? "sim" : "")}
          />
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
      );
    case "number":
      return (
        <div>
          {label}
          <input
            id={`cf-${field.key}`}
            type="number"
            className={inputClass}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "date":
      return (
        <div>
          {label}
          <input
            id={`cf-${field.key}`}
            type="date"
            className={inputClass}
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    default:
      return (
        <div>
          {label}
          <input
            id={`cf-${field.key}`}
            type="text"
            className={inputClass}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}
