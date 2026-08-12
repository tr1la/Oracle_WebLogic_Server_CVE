import { useEffect, useState } from 'react';
import { getProtectedUpload } from '../services/api';
import { isProtectedUploadUrl } from './useProtectedUploadUrl';

const useProtectedUploadHtml = (html) => {
  const [protectedHtml, setProtectedHtml] = useState('');

  useEffect(() => {
    if (!html) {
      setProtectedHtml('');
      return undefined;
    }

    let isMounted = true;
    const createdObjectUrls = [];

    const replaceProtectedImages = async () => {
      const document = new DOMParser().parseFromString(html, 'text/html');
      const uploadImages = Array.from(document.querySelectorAll('img[src]'))
        .filter((image) => isProtectedUploadUrl(image.getAttribute('src') || ''));

      await Promise.all(uploadImages.map(async (image) => {
        const source = image.getAttribute('src') || '';
        try {
          const response = await getProtectedUpload(source);
          const objectUrl = URL.createObjectURL(response.data);
          createdObjectUrls.push(objectUrl);
          image.setAttribute('src', objectUrl);
        } catch {
          image.removeAttribute('src');
          image.setAttribute('alt', image.getAttribute('alt') || 'Protected upload');
        }
      }));

      if (isMounted) {
        setProtectedHtml(document.body.innerHTML);
      }
    };

    replaceProtectedImages();

    return () => {
      isMounted = false;
      createdObjectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [html]);

  return protectedHtml;
};

export default useProtectedUploadHtml;
