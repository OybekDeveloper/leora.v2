const clampOpacity = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  if (normalized.length < 6) {
    return null;
  }
  const value = parseInt(normalized.slice(0, 6), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return { r, g, b };
};

export const applyOpacity = (color: string, opacity: number): string => {
  const normalizedOpacity = clampOpacity(opacity);
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (!rgb) {
      return color;
    }
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${normalizedOpacity})`;
  }

  if (color.startsWith('rgb')) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, values) => {
      const [r, g, b] = values.split(',').map((value) => Number.parseFloat(value.trim()));
      if ([r, g, b].some((component) => Number.isNaN(component))) {
        return color;
      }
      return `rgba(${r}, ${g}, ${b}, ${normalizedOpacity})`;
    });
  }

  return color;
};
