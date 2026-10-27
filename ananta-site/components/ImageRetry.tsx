'use client';

import { useEffect } from 'react';

const MAX_RETRIES = 2;

/**
 * Retries an image that failed to load, twice, with a short backoff.
 *
 * A dropped connection on campus Wi-Fi or mobile data used to leave a blank
 * frame until the visitor reloaded. One capturing listener covers every <img>
 * on the page, including ones inside <picture>; it renders nothing.
 */
export function ImageRetry() {
  useEffect(() => {
    const onError = (event: Event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement)) return;

      const tries = Number(img.dataset.retries ?? 0);
      if (tries >= MAX_RETRIES) return;
      img.dataset.retries = String(tries + 1);

      window.setTimeout(
        () => {
          const bust = (url: string) =>
            url.replace(/([?&])retry=\d+/, '').replace(/[?&]$/, '') +
            `${url.includes('?') ? '&' : '?'}retry=${tries + 1}`;

          const picture = img.parentElement;
          if (picture instanceof HTMLPictureElement) {
            picture.querySelectorAll('source').forEach((source) => {
              source.srcset = source.srcset
                .split(',')
                .map((entry) => {
                  const [url, descriptor] = entry.trim().split(/\s+/);
                  return descriptor ? `${bust(url)} ${descriptor}` : bust(url);
                })
                .join(', ');
            });
          }
          if (img.srcset) img.srcset = '';
          img.src = bust(img.currentSrc || img.src);
        },
        800 * (tries + 1),
      );
    };

    document.addEventListener('error', onError, true);
    return () => document.removeEventListener('error', onError, true);
  }, []);

  return null;
}
