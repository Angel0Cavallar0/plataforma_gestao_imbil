"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABELS,
} from "@/lib/constants/marketing-events";
import type { CustomField, CustomFieldType } from "@/types/marketing-events";

interface FieldEditorProps {
  field: CustomField;
  onChange: (field: CustomField) => void;
  onRemove: () => void;
}

export function FieldEditor({ field, onChange, onRemove }: FieldEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.key });

  const needsOptions = field.type === "select" || field.type === "radio";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-card p-3 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab text-muted-foreground"
          aria-label="Reordenar campo"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_11rem]">
          <div>
            <Label>Pergunta (label)</Label>
            <Input
              value={field.label}
              maxLength={120}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select
              value={field.type}
              onChange={(e) =>
                onChange({ ...field, type: e.target.value as CustomFieldType })
              }
            >
              {CUSTOM_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CUSTOM_FIELD_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          {needsOptions && (
            <div className="sm:col-span-2">
              <Label>Opções (separadas por vírgula, mín. 2, máx. 12)</Label>
              <Input
                value={(field.options ?? []).join(", ")}
                onChange={(e) =>
                  onChange({
                    ...field,
                    options: e.target.value
                      .split(",")
                      .map((o) => o.trim())
                      .filter(Boolean)
                      .slice(0, 12),
                  })
                }
              />
            </div>
          )}
          {(field.type === "text" ||
            field.type === "textarea" ||
            field.type === "number") && (
            <div className="sm:col-span-2">
              <Label>Placeholder</Label>
              <Input
                value={field.placeholder ?? ""}
                maxLength={120}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
            />
            Obrigatório
          </label>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRemove}
          aria-label="Remover campo"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
