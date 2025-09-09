import BlurImage from '@/components/blur-image';
import { abstractImages } from '@/lib/images';
import { unstable_cache } from 'next/cache';
import React from 'react';

const getImage = unstable_cache(
  async () => {
    const idx = Math.floor(Math.random() * abstractImages.length);
    // Return a plain serializable object
    const img = abstractImages[idx];
    return {
        name: img.name,
        url: img.url,
    };
  },
  ['auth-bg'],
  { revalidate: 60 * 60 * 24, tags: ['auth-bg'] },
);

export async function AbstractImage() {
  const image = await getImage();

  return (
    <>
      <BlurImage
        imageClassName="object-cover size-full rounded-3xl"
        className="relative size-full rounded-3xl"
        src={image.url}
        fill
        alt="Abstract background"
      />
      {/* <div className="absolute bottom-6 left-7 text-primary-foreground text-sm">
        <a
          href={image.author.url}
          className="underline-offset-4 hover:underline"
        >
          {image.author.name}
        </a>
      </div> */}
    </>
  );
}
