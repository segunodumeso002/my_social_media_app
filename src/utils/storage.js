import { getUrl, uploadData } from 'aws-amplify/storage';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const sanitizeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const isAbsoluteHttpUrl = (value) => /^https?:\/\//i.test(value || '');

const isLikelyS3Url = (value) => {
  if (!isAbsoluteHttpUrl(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.hostname.includes('.amazonaws.com') || parsed.hostname.includes('.s3.');
  } catch {
    return false;
  }
};

const extractPathFromS3Url = (value) => {
  try {
    const parsed = new URL(value);
    return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  } catch {
    return '';
  }
};

export const uploadImageToS3 = async (file, folder = 'uploads', onProgress) => {
  if (!file) {
    throw new Error('No file selected');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image must be 5MB or less');
  }

  const safeName = sanitizeFileName(file.name || 'image');
  const path = `${folder}/${Date.now()}-${safeName}`;

  try {
    const uploadTask = uploadData({
      path,
      data: file,
      options: {
        contentType: file.type,
        onProgress: ({ transferredBytes, totalBytes }) => {
          if (!onProgress || !totalBytes) return;
          onProgress(Math.round((transferredBytes / totalBytes) * 100));
        }
      }
    });

    await uploadTask.result;

    const signedUrl = await getUrl({
      path,
      options: { validateObjectExistence: true }
    });

    return {
      path,
      url: signedUrl.url.toString()
    };
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    if (message.includes('credentials') && message.includes('empty')) {
      throw new Error('S3 upload credentials are not configured. Add VITE_IDENTITY_POOL_ID and ensure the Identity Pool has S3 permissions.');
    }
    throw error;
  }
};

export const resolveS3ImageUrl = async (value) => {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  let path = trimmed;

  if (isLikelyS3Url(trimmed)) {
    path = extractPathFromS3Url(trimmed);
    if (!path) return trimmed;
  } else if (isAbsoluteHttpUrl(trimmed)) {
    return trimmed;
  }

  try {
    const signedUrl = await getUrl({
      path,
      options: { validateObjectExistence: true }
    });
    return signedUrl.url.toString();
  } catch {
    return trimmed;
  }
};
