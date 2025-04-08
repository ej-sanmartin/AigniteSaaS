import axios from 'axios';

/**
 * Downloads an image from a URL and returns it as a Buffer
 * @param url - The URL of the image to download
 * @returns Promise<Buffer> - The image data as a Buffer
 */
export async function downloadImageBuffer(url: string): Promise<Buffer> {
  try {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download image');
  }
} 