'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { CategoryField, CategoryFieldCreate, CategoryFieldUpdate } from '@/lib/api/categoryFields';

function parseOptionsJson(fieldOptions: string | undefined): string[] {
  if (!fieldOptions?.trim()) return [];
  try {
    const arr = JSON.parse(fieldOptions);
    return Array.isArray(arr) ? arr.map((x: unknown) => String(x ?? '')) : [];
  } catch {
    return [];
  }
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'boolean', label: 'Boolean (Checkbox)' },
] as const;

type FormState = {
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'number' | 'decimal' | 'select' | 'boolean';
  is_required: boolean;
  is_variant_dimension: boolean;
};

export function CategoryFieldForm({
  categoryId,
  initialField,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  categoryId: number;
  initialField?: CategoryField;
  onSubmit: (data: CategoryFieldCreate | CategoryFieldUpdate) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const isEdit = !!initialField;
  const [formData, setFormData] = useState<FormState>({
    field_name: initialField?.field_name ?? '',
    field_label: initialField?.field_label ?? '',
    field_type: initialField?.field_type ?? 'text',
    is_required: initialField?.is_required ?? false,
    is_variant_dimension: initialField?.is_variant_dimension ?? false,
  });
  const [optionValues, setOptionValues] = useState<string[]>(() =>
    parseOptionsJson(initialField?.field_options)
  );

  useEffect(() => {
    if (initialField?.field_options) {
      setOptionValues(parseOptionsJson(initialField.field_options));
    }
  }, [initialField?.field_options]);

  const addOption = () => setOptionValues((prev) => [...prev, '']);
  const removeOption = (index: number) =>
    setOptionValues((prev) => prev.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) =>
    setOptionValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

  const validateOptions = (): boolean => {
    if (formData.field_type !== 'select') return true;
    const filled = optionValues.map((v) => v.trim()).filter(Boolean);
    if (filled.length === 0) {
      toast.error('Add at least one option. Each option is a choice customers can pick (e.g. 20, Gold, Small).');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.field_type === 'select' && !validateOptions()) return;
    const optionsJson =
      formData.field_type === 'select'
        ? JSON.stringify(optionValues.map((v) => v.trim()).filter(Boolean))
        : undefined;
    if (isEdit && initialField) {
      const data: CategoryFieldUpdate = {
        field_name: formData.field_name,
        field_label: formData.field_label,
        field_type: formData.field_type,
        is_required: formData.is_required,
        field_options: optionsJson,
        is_variant_dimension: formData.is_variant_dimension,
        variant_order: formData.is_variant_dimension ? (initialField.variant_order ?? undefined) : undefined,
      };
      await onSubmit(data);
    } else {
      const data: CategoryFieldCreate = {
        category: categoryId,
        field_name: formData.field_name,
        field_label: formData.field_label,
        field_type: formData.field_type,
        is_required: formData.is_required,
        field_options: optionsJson,
        is_variant_dimension: formData.is_variant_dimension,
      };
      await onSubmit(data as CategoryFieldCreate);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="field_name">Field Name *</Label>
          <Input
            id="field_name"
            value={formData.field_name}
            onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
            placeholder="e.g., material_type"
            required
          />
          <p className="text-xs text-muted-foreground">Internal name (snake_case)</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="field_label">Field Label *</Label>
          <Input
            id="field_label"
            value={formData.field_label}
            onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
            placeholder="e.g., Size or Material Type"
            required
          />
          <p className="text-xs text-muted-foreground">Display label (e.g. variant name like Size, Karat)</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field_type">Field Type *</Label>
        <Select
          value={formData.field_type}
          onValueChange={(value: FormState['field_type']) =>
            setFormData({
              ...formData,
              field_type: value,
              is_variant_dimension: value === 'select' ? formData.is_variant_dimension : false,
            })
          }
        >
          <SelectTrigger id="field_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_required"
          checked={formData.is_required}
          onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked as boolean })}
        />
        <Label htmlFor="is_required">Required Field</Label>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_variant_dimension"
            checked={formData.is_variant_dimension}
            onCheckedChange={(checked) => {
              const on = checked as boolean;
              setFormData({
                ...formData,
                is_variant_dimension: on,
                field_type: on ? 'select' : formData.field_type,
              });
            }}
          />
          <Label htmlFor="is_variant_dimension">Use as variant dimension</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          The variant name is the Field Label (e.g. Size). Add the available choices below (e.g. 20, 21, 22). You can add as many variant dimensions per category as you need.
        </p>
      </div>

      {formData.field_type === 'select' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Options *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-1" />
              Add option
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add each choice customers can pick. You can use numbers (e.g. 20, 21, 22) or text (e.g. Gold, Silver, Small).
          </p>
          <div className="space-y-2">
            {optionValues.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 border border-dashed rounded-md px-3">
                No options yet. Click &quot;Add option&quot; to add choices.
              </p>
            ) : (
              optionValues.map((value, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={value}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
