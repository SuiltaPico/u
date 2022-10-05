export function create_object_url(
  blob_parts?: BlobPart[],
  options?: BlobPropertyBag
) {
  const url = URL.createObjectURL(new Blob(blob_parts, options));
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  };
}

export function download_url(url: string, file_name?: string) {
  const a = document.createElement("a")
  a.download = file_name ?? ""
  a.href = url
  a.click()
  a.remove()
}