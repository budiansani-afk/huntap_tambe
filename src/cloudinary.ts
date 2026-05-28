function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('image/upload/')) return null;
  const parts = url.split('image/upload/');
  if (parts.length < 2) return null;
  let path = parts[1];
  // Remove version prefix if exists (e.g., v1716382173/)
  path = path.replace(/^v\d+\//, '');
  // Remove file extension (e.g., .jpg, .png, etc.)
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex !== -1) {
    path = path.substring(0, dotIndex);
  }
  return path;
}

async function sha1(string: string): Promise<string> {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-1', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Deletes an image from Cloudinary using the browser's crypto library.
 * @param imageUrl The full secure URL of the Cloudinary image
 * @returns Promise<boolean> True if deleted successfully, otherwise false
 */
export const deleteFromCloudinary = async (imageUrl: string): Promise<boolean> => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return false;
  }

  try {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) return false;

    const apiKey = '522531551358338';
    const apiSecret = '17j1h0HMoBTG8LUpX3k7gnjDuH0';
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Alphabetical order of parameters for signing: public_id, timestamp
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1(stringToSign);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const res = await fetch('https://api.cloudinary.com/v1_1/de4prnqa4/image/destroy', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.warn('Gagal menghapus gambar dari Cloudinary:', await res.text());
      return false;
    }

    const json = await res.json();
    return json.result === 'ok';
  } catch (err) {
    console.error('Error deleting from Cloudinary:', err);
    return false;
  }
};
