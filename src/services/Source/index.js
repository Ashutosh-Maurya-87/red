import { API_URLS } from '../../configs/api';
import { httpPost } from '../../utils/http';

/**
 * Upload Imported / Reload File
 *
 * @return {String}
 */
export const uploadFiles = async (file, setuploadPercentage) => {
  try {
    setuploadPercentage(0);

    const onUploadProgress = ({ loaded = 0, total = 1 }) => {
      const uploadPercentage = Math.floor((loaded / total) * 100);
      setuploadPercentage(uploadPercentage);
    };

    const formData = new FormData();
    formData.append('file', file);

    const { url = '' } = await httpPost(API_URLS.UPLOAD_FILE, formData, {
      onUploadProgress,
    });

    return url;
  } catch (e) {
    setuploadPercentage(null);
    return '';
  }
};
