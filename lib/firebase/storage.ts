import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';
import { nanoid } from 'nanoid';
import path from 'path';

/**
 * Uploads a file to Firebase Storage and returns the download URL
 */
export async function uploadFile(file: File): Promise<{
  url: string;
  pathname: string;
  contentType: string;
}> {
  try {
    // Create a unique filename
    const uniqueId = nanoid();
    const fileExtension = path.extname(file.name);
    const fileName = `uploads/${uniqueId}${fileExtension}`;

    // Create a storage reference
    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const url = await getDownloadURL(snapshot.ref);

    // Return file details
    return {
      url,
      pathname: file.name,
      contentType: file.type,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Utility function to convert a base64 string to a File object
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Uploads a base64 data URL to Firebase Storage
 */
export async function uploadDataURL(
  dataUrl: string,
  filename: string,
): Promise<{
  url: string;
  pathname: string;
  contentType: string;
}> {
  const file = dataURLtoFile(dataUrl, filename);
  return uploadFile(file);
}
