export type BrandingAlign = 'left' | 'center' | 'right';

export interface PrintBrandingSettings {
  logoSize: number;       // Pixel height: 32px to 160px, default 60px
  logoAlign: BrandingAlign;
  signatureSize: number;  // Pixel width: 40px to 180px, default 120px
  signatureAlign?: BrandingAlign; // Permanently 'right' in UI; kept optional for backward compatibility
}

export const DEFAULT_PRINT_BRANDING: PrintBrandingSettings = {
  logoSize: 60,
  logoAlign: 'left',
  signatureSize: 120,
  signatureAlign: 'right',
};

export const LOGO_SIZE_BOUNDS = { min: 32, max: 160, step: 4, default: 60 };
export const SIGNATURE_SIZE_BOUNDS = { min: 40, max: 180, step: 5, default: 120 };

const BRANDING_PREFIX = 'KRAVY_PRINT_CFG:';

/**
 * Normalizes legacy presets ('small' | 'medium' | 'large') or arbitrary numbers into valid bounds.
 */
export function normalizeLogoSize(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) {
    return Math.max(LOGO_SIZE_BOUNDS.min, Math.min(LOGO_SIZE_BOUNDS.max, Math.round(val)));
  }
  if (typeof val === 'string') {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return Math.max(LOGO_SIZE_BOUNDS.min, Math.min(LOGO_SIZE_BOUNDS.max, Math.round(num)));
    }
    if (val === 'small') return 44;
    if (val === 'large') return 90;
    if (val === 'medium') return 60;
  }
  return DEFAULT_PRINT_BRANDING.logoSize;
}

export function normalizeSignatureSize(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) {
    return Math.max(SIGNATURE_SIZE_BOUNDS.min, Math.min(SIGNATURE_SIZE_BOUNDS.max, Math.round(val)));
  }
  if (typeof val === 'string') {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return Math.max(SIGNATURE_SIZE_BOUNDS.min, Math.min(SIGNATURE_SIZE_BOUNDS.max, Math.round(num)));
    }
    if (val === 'small') return 80;
    if (val === 'large') return 160;
    if (val === 'medium') return 120;
  }
  return DEFAULT_PRINT_BRANDING.signatureSize;
}

export function normalizeLogoAlign(val: any): BrandingAlign {
  if (val === 'left' || val === 'center' || val === 'right') return val;
  return DEFAULT_PRINT_BRANDING.logoAlign;
}

/**
 * Serializes branding settings into the existing servedStatusLabel string field
 * in BusinessProfile, preserving zero schema migrations.
 */
export function serializePrintBranding(settings: Partial<PrintBrandingSettings>): string {
  const merged: PrintBrandingSettings = {
    logoSize: normalizeLogoSize(settings.logoSize),
    logoAlign: normalizeLogoAlign(settings.logoAlign),
    signatureSize: normalizeSignatureSize(settings.signatureSize),
    signatureAlign: 'right', // Permanently right
  };
  return `${BRANDING_PREFIX}${JSON.stringify(merged)}`;
}

/**
 * Parses branding settings from the servedStatusLabel string field.
 * Handles both legacy preset strings ('small', 'medium', 'large') and numeric values.
 */
export function parsePrintBranding(raw?: string | null): PrintBrandingSettings {
  if (!raw || !raw.startsWith(BRANDING_PREFIX)) {
    return { ...DEFAULT_PRINT_BRANDING };
  }
  try {
    const jsonStr = raw.slice(BRANDING_PREFIX.length);
    const parsed = JSON.parse(jsonStr);
    return {
      logoSize: normalizeLogoSize(parsed.logoSize),
      logoAlign: normalizeLogoAlign(parsed.logoAlign),
      signatureSize: normalizeSignatureSize(parsed.signatureSize),
      signatureAlign: 'right',
    };
  } catch {
    return { ...DEFAULT_PRINT_BRANDING };
  }
}

/**
 * Print & Preview dimension calculators.
 * Translates pixel settings to print-safe dimensions with upper bounds for paper widths.
 */
export function getLogoDimensions(logoSizePx: number) {
  const px = normalizeLogoSize(logoSizePx);
  return {
    a4: {
      maxHeight: `${px}px`,
      maxWidth: `${Math.round(px * 3.5)}px`,
    },
    thermal80mm: {
      // 80mm printable width is approx 68mm-72mm (~250px-270px)
      maxHeight: `${Math.min(32, Math.round(px * 0.28))}mm`,
      maxWidth: '65mm',
    },
    thermal58mm: {
      // 58mm printable width is approx 48mm (~180px)
      maxHeight: `${Math.min(22, Math.round(px * 0.20))}mm`,
      maxWidth: '46mm',
    },
    preview: {
      maxHeight: `${Math.min(28, Math.round(px * 0.24))}mm`,
      maxWidth: '55mm',
    },
  };
}

export function getSignatureDimensions(signatureSizePx: number) {
  const px = normalizeSignatureSize(signatureSizePx);
  return {
    a4: {
      maxWidth: `${px}px`,
      maxHeight: `${Math.round(px * 0.45)}px`,
    },
    thermal80mm: {
      maxWidth: `${Math.min(55, Math.round(px * 0.32))}mm`,
      maxHeight: '18mm',
    },
    thermal58mm: {
      maxWidth: `${Math.min(42, Math.round(px * 0.24))}mm`,
      maxHeight: '14mm',
    },
    preview: {
      maxWidth: `${Math.min(130, Math.round(px * 0.75))}px`,
      maxHeight: '34px',
    },
  };
}

export function getAlignmentClasses(align: BrandingAlign) {
  switch (align) {
    case 'center':
      return {
        container: 'flex justify-center text-center',
        image: 'mx-auto',
        text: 'text-center',
      };
    case 'right':
      return {
        container: 'flex justify-end text-right',
        image: 'ml-auto mr-0',
        text: 'text-right',
      };
    case 'left':
    default:
      return {
        container: 'flex justify-start text-left',
        image: 'mr-auto ml-0',
        text: 'text-left',
      };
  }
}
