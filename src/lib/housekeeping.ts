import { Prisma } from '@prisma/client';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export const STANDARD_CHECKLIST: ChecklistItem[] = [
  { id: 'linen', label: 'Bed linen & pillow covers replaced', completed: false },
  { id: 'bathroom', label: 'Bathroom scrubbed & sanitized', completed: false },
  { id: 'toiletries', label: 'Fresh towels & toiletries restocked', completed: false },
  { id: 'dusting', label: 'Surfaces dusted & electronics checked', completed: false },
  { id: 'trash', label: 'Trash bins emptied & sanitized', completed: false },
  { id: 'floor', label: 'Floors swept, vacuumed & mopped', completed: false },
];

/**
 * Returns a fresh clone of the standard 6-item housekeeping checklist.
 */
export function getStandardChecklist(): ChecklistItem[] {
  return STANDARD_CHECKLIST.map((item) => ({ ...item, completed: false }));
}

/**
 * Returns a fresh clone of the standard checklist formatted for Prisma JSON fields.
 */
export function getStandardChecklistJson(): Prisma.InputJsonValue {
  return STANDARD_CHECKLIST.map((item) => ({ ...item, completed: false })) as unknown as Prisma.InputJsonValue;
}

/**
 * Checks whether a checklist is null, undefined, not an array, or empty (0 items).
 */
export function isChecklistEmpty(checklist: unknown): boolean {
  if (!checklist) return true;
  if (!Array.isArray(checklist)) return true;
  return checklist.length === 0;
}

/**
 * Normalizes a checklist from the database or payload.
 * If empty or missing, returns standard checklist.
 * If existing items are present, preserves them without overwriting progress.
 */
export function resolveChecklist(checklist: unknown): ChecklistItem[] {
  if (isChecklistEmpty(checklist)) {
    return getStandardChecklist();
  }
  return checklist as ChecklistItem[];
}
