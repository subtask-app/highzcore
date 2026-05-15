'use client';

// VariantUploader — manages 2–4 variants for an ABTest wizard. For thumbnail
// tests it uploads images to Supabase Storage; for title tests it captures
// text. Variants are reorderable and removable down to a minimum of 2.

import Image from 'next/image';
import { useState, type ChangeEvent } from 'react';
import { ImageUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { uploadImage, BUCKET_ABTEST_THUMBS } from '@/lib/storage/upload';
import type { AbtestKind, AbtestVariant } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const LABELS = ['A', 'B', 'C', 'D'];

function genId(): string {
  return `v${Math.random().toString(36).slice(2, 8)}`;
}

export function makeBlankVariants(kind: AbtestKind): AbtestVariant[] {
  return [
    { id: genId(), label: 'Variant A', image_url: null, text: kind === 'title' ? '' : null },
    { id: genId(), label: 'Variant B', image_url: null, text: kind === 'title' ? '' : null },
  ];
}

export interface VariantUploaderProps {
  kind: AbtestKind;
  value: AbtestVariant[];
  onChange: (next: AbtestVariant[]) => void;
}

export function VariantUploader({ kind, value, onChange }: VariantUploaderProps) {
  const add = () => {
    if (value.length >= 4) return;
    const i = value.length;
    onChange([
      ...value,
      { id: genId(), label: `Variant ${LABELS[i]}`, image_url: null, text: kind === 'title' ? '' : null },
    ]);
  };
  const remove = (idx: number) => {
    if (value.length <= 2) return;
    onChange(value.filter((_, i) => i !== idx));
  };
  const update = (idx: number, patch: Partial<AbtestVariant>) => {
    onChange(value.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  return (
    <div className="space-y-3">
      {value.map((v, i) => (
        <VariantRow
          key={v.id}
          kind={kind}
          index={i}
          variant={v}
          canRemove={value.length > 2}
          onUpdate={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
        />
      ))}
      {value.length < 4 && (
        <Button type="button" variant="secondary" onClick={add} leftIcon={<Plus className="h-4 w-4" />}>
          Add variant (max 4)
        </Button>
      )}
    </div>
  );
}

function VariantRow({
  kind, index, variant, canRemove, onUpdate, onRemove,
}: {
  kind: AbtestKind;
  index: number;
  variant: AbtestVariant;
  canRemove: boolean;
  onUpdate: (patch: Partial<AbtestVariant>) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const result = await uploadImage(file, BUCKET_ABTEST_THUMBS);
    setUploading(false);
    if (!result.ok) {
      setUploadError(humanise(result.error));
      return;
    }
    onUpdate({ image_url: result.url });
  };

  return (
    <Card padding="md">
      <div className="flex items-start gap-4">
        <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-brand-fg text-xs font-bold shrink-0">
          {LABELS[index]}
        </span>
        <div className="flex-1 min-w-0 space-y-3">
          {kind === 'thumbnail' ? (
            <>
              <div className="flex items-stretch gap-4">
                <div className={cn(
                  'relative aspect-video shrink-0 w-48 rounded-md overflow-hidden bg-surface-active border border-border',
                )}>
                  {variant.image_url ? (
                    <Image
                      src={variant.image_url}
                      alt={variant.label}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-fg-subtle">
                      <ImageUp className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-fg hover:bg-surface-hover">
                    {uploading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <ImageUp className="h-4 w-4" />}
                    {variant.image_url ? 'Replace image' : 'Upload thumbnail'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={onFile}
                    />
                  </label>
                  <Input
                    value={variant.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="Variant label"
                    aria-label="Variant label"
                  />
                  {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Input
                value={variant.text ?? ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                placeholder="Type the title variant"
                maxLength={100}
                helper={`${(variant.text ?? '').length}/100`}
              />
              <Input
                value={variant.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Variant label (internal)"
              />
            </div>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove variant"
            className="mt-1 text-fg-subtle hover:text-danger transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

function humanise(code: string): string {
  switch (code) {
    case 'unsupported_type':   return 'PNG, JPG, or WebP only.';
    case 'file_too_large':     return 'Max 10MB.';
    case 'not_authenticated':  return 'Your session expired. Log in again.';
    default:                   return code;
  }
}
