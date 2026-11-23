export type Placement =
  | { ok: true; offsetX: number; offsetY: number }
  | { ok: false; reason: 'invalid' | 'smaller' };

/**
 * Computes where to draw an image, at its natural size, centered on a
 * larger canvas. Never scales the image.
 */
export function computePlacement(
  naturalWidth: number,
  naturalHeight: number,
  targetWidth: number,
  targetHeight: number,
): Placement {
  if (
    !Number.isInteger(targetWidth) ||
    !Number.isInteger(targetHeight) ||
    targetWidth < 1 ||
    targetHeight < 1
  ) {
    return { ok: false, reason: 'invalid' };
  }
  if (targetWidth < naturalWidth || targetHeight < naturalHeight) {
    return { ok: false, reason: 'smaller' };
  }
  return {
    ok: true,
    offsetX: Math.floor((targetWidth - naturalWidth) / 2),
    offsetY: Math.floor((targetHeight - naturalHeight) / 2),
  };
}
