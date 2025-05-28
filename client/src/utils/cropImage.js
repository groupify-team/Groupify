/**
 * Crop a portion of the given image based on pixelCrop coordinates,
 * and return both a Blob (for uploading) and a local preview URL.
 */
export default async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return both the blob for uploading and preview URL for display
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const fileUrl = URL.createObjectURL(blob);
      resolve({ blob, fileUrl });
    }, 'image/jpeg');
  });
}

/**
 * Create an HTMLImageElement from a given URL,
 * and ensure it can be used cross-origin.
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Needed for external URLs
    image.src = url;
  });
}
