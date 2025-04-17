import fs from 'fs';
import path from 'path';

interface Annotation {
  bookId: string;
  page: string;
  state: string;
  category: string;
}

interface LabelUsage {
  [category: string]: Set<string>;
}

export function extractUsedLabelsFromAnnotations(
  annotationsCsvPath: string
): Record<string, string[]> {
  if (!fs.existsSync(annotationsCsvPath)) return {};

  const raw = fs.readFileSync(annotationsCsvPath, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);

  if (lines.length < 1) return {};

  const header = lines[0].split(',').map((s) => s.trim());
  const dataRows = lines.slice(1).map((line) => line.split(',').map((s) => s.trim()));

  const usage: LabelUsage = {};

  for (const row of dataRows) {
    for (let i = 1; i < header.length; i++) {
      const category = header[i];
      const cell = row[i];
      const labels = cell.split(';').map((l) => l.trim()).filter(Boolean);
      for (const label of labels) {
        if (!usage[category]) usage[category] = new Set();
        usage[category].add(label);
      }
    }
  }

  const cleaned: Record<string, string[]> = {};
  for (const category in usage) {
    cleaned[category] = Array.from(usage[category]).sort();
  }

  return cleaned;
}
