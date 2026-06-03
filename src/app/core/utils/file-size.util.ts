export function formatFileSize(
  fileSize?: number | null,
  fileSizeFormatted?: string | null
): string {

  if (fileSizeFormatted?.trim()) {
    return fileSizeFormatted;
  }

  const bytes =
    Number(fileSize ?? 0);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = [
    'B',
    'KB',
    'MB',
    'GB'
  ];

  let size =
    bytes;

  let unitIndex =
    0;

  while (
    size >= 1024 &&
    unitIndex < units.length - 1
  ) {
    size /= 1024;
    unitIndex += 1;
  }

  const maximumFractionDigits =
    unitIndex === 0 ? 0 : 1;

  const formatted =
    size.toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits
      }
    );

  return `${formatted} ${units[unitIndex]}`;
}
