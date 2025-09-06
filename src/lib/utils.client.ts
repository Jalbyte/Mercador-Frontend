export function convertFileToBase64(file: Blob | File): Promise<string> {
  if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
    return Promise.reject(new Error('convertFileToBase64 sólo funciona en el navegador'))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}