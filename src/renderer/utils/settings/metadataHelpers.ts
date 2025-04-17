export const handleUploadMetadataFile = async (
  setMetadataFilePath: (val: string) => void,
  setCsvColumns: (cols: string[]) => void,
  setIsMetadataAvailable: (val: boolean) => void,
) => {
  const filePath = await window.electron.ipcRenderer.invoke('dialog:openFile');
  if (!filePath) return;

  try {
    const columns = await window.electron.ipcRenderer.invoke(
      'getCsvColumns',
      filePath,
    );
    setMetadataFilePath(filePath);
    setCsvColumns(columns);
  } catch {
    const proceed = window.confirm(
      'Could not extract columns. Proceed without metadata?',
    );
    if (proceed) {
      setMetadataFilePath('');
      setIsMetadataAvailable(false);
    }
  }
};

export const handleAddMetadataField = (
  metadataFields: any[],
  setMetadataFields: (fields: any[]) => void,
) => {
  const hasEmpty = metadataFields.some((f) => !f.column || !f.label);
  if (hasEmpty) return alert('Please fill all metadata fields first.');
  setMetadataFields([
    ...metadataFields,
    { column: '', label: '', displayOnCover: false },
  ]);
};

export const handleRemoveMetadataField = (
  index: number,
  metadataFields: any[],
  setMetadataFields: (fields: any[]) => void,
) => {
  const updated = [...metadataFields];
  updated.splice(index, 1);
  setMetadataFields(updated);
};

export const handleMetadataFieldChange = (
  index: number,
  field: string,
  value: any,
  metadataFields: any[],
  setMetadataFields: (fields: any[]) => void,
) => {
  const updated = [...metadataFields];

  if (field === 'displayOnCover' && value) {
    const count = updated.filter((f) => f.displayOnCover).length;
    if (count >= 2) {
      alert('You can only display up to 2 fields on the cover.');
      return;
    }
  }

  updated[index][field] = value;
  setMetadataFields(updated);
};
