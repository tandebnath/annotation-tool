export const handleAddCategory = (
  newCategory: string,
  labelCategories: any[],
  setLabelCategories: (cats: any[]) => void,
  setNewCategory: (val: string) => void,
) => {
  if (
    !newCategory.trim() ||
    labelCategories.some((c) => c.name === newCategory)
  )
    return;
  setLabelCategories([...labelCategories, { name: newCategory, labels: [] }]);
  setNewCategory('');
};

export const handleDeleteCategory = (
  categoryName: string,
  labelCategories: any[],
  setLabelCategories: (cats: any[]) => void,
  setSelectedCategory: (val: string) => void,
  selectedCategory: string,
) => {
  setLabelCategories(
    labelCategories.filter((cat) => cat.name !== categoryName),
  );
  if (selectedCategory === categoryName) setSelectedCategory('');
};

export const handleAddLabel = (
  selectedCategory: string,
  newLabel: string,
  labelCategories: any[],
  isBatchMode: boolean,
  setLabelCategories: (cats: any[]) => void,
  setNewLabel: (val: string) => void,
) => {
  if (!selectedCategory || !newLabel.trim()) return;
  const labelsToAdd = isBatchMode
    ? newLabel
        .split(/[\n,]+/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [newLabel.trim()];
  setLabelCategories(
    labelCategories.map((cat) =>
      cat.name === selectedCategory
        ? {
            ...cat,
            labels: [
              ...cat.labels,
              ...labelsToAdd.filter((l) => !cat.labels.includes(l)),
            ],
          }
        : cat,
    ),
  );
  setNewLabel('');
};

export const handleDeleteLabel = (
  categoryName: string,
  label: string,
  labelCategories: any[],
  setLabelCategories: (cats: any[]) => void,
) => {
  setLabelCategories(
    labelCategories.map((cat) =>
      cat.name === categoryName
        ? { ...cat, labels: cat.labels.filter((l: any) => l !== label) }
        : cat,
    ),
  );
};
