export interface AnnotationSettings {
  collectionsDir?: string;
  annotationsCsv?: string;
  notesCsv?: string;
  itemsPerPage?: string;
  volumesPerPage?: string;
  labelCategories?: { name: string; labels: string[] }[];
}

export function validateSettings(settings: AnnotationSettings): boolean {
  if (!settings || typeof settings !== 'object') return false;
  const {
    collectionsDir,
    annotationsCsv,
    notesCsv,
    itemsPerPage,
    volumesPerPage,
    labelCategories,
  } = settings;

  const hasLabels =
    Array.isArray(labelCategories) &&
    labelCategories.length > 0 &&
    labelCategories.some(
      (cat) => Array.isArray(cat.labels) && cat.labels.length > 0,
    );

  return (
    !!collectionsDir &&
    !!annotationsCsv &&
    !!notesCsv &&
    !!itemsPerPage &&
    parseInt(itemsPerPage) > 0 &&
    !!volumesPerPage &&
    parseInt(volumesPerPage) > 0 &&
    hasLabels
  );
}
