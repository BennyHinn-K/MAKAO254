'use client';

import * as React from 'react';
import { useIntersectionObserver } from './hooks/use-intersection-observer';

interface OptimizedVideoProps {
  src: string;
  poster: string;
  isAboveFold?: boolean;
  className?: string;
  playsInline?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}

export function OptimizedVideo({
  src,
  poster,
  isAboveFold = false,
  className,
  playsInline = true,
  muted = true,
  autoPlay = true,
  loop = true,
}: OptimizedVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const isIntersecting = useIntersectionObserver(videoRef);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || autoPlay === false) return;

    if (isIntersecting) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isIntersecting, autoPlay]);

  const loadingAttr = isAboveFold ? undefined : 'lazy';

  return (
    <video
      ref={videoRef}
      poster={poster}
      className={className}
      preload={isAboveFold ? 'auto' : 'metadata'}
      {...(loadingAttr ? ({ loading: loadingAttr } as React.HTMLAttributes<HTMLVideoElement>) : {})}
      playsInline={playsInline}
      muted={muted}
      autoPlay={autoPlay}
      loop={loop}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
