import { useEffect, useState } from 'react';
import { getProtectedUpload } from '../services/api';

export const isProtectedUploadUrl = (url) => {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
    return false;
  }
  return url.startsWith('/uploads/') || url.includes('/uploads/');
};

const useProtectedUploadUrl = (url) => {
  const [objectUrl, setObjectUrl] = useState('');

  useEffect(() => {
    if (!url) {
      setObjectUrl('');
      return undefined;
    }
    if (!isProtectedUploadUrl(url)) {
      setObjectUrl(url);
      return undefined;
    }

    let isMounted = true;
    let createdObjectUrl = '';

    getProtectedUpload(url)
      .then((response) => {
        createdObjectUrl = URL.createObjectURL(response.data);
        if (isMounted) {
          setObjectUrl(createdObjectUrl);
        } else {
          URL.revokeObjectURL(createdObjectUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setObjectUrl('');
        }
      });

    return () => {
      isMounted = false;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [url]);

  return objectUrl;
};

export default useProtectedUploadUrl;
