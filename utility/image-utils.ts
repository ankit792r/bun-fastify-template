

import Sharp from 'sharp';

export type ImageSizeVariant = 'tiny' | 'small' | 'medium' | 'large' | 'full';
export type ImageCategory = 'thumbnail' | 'low' | 'medium' | 'high';
export type ExportAs = 'jpeg' | 'png' | 'webp';
export const IMAGE_QUALITY = {
  low: 60,
  medium: 80,
  high: 95,
};

export type ImageConversionQuality = keyof typeof IMAGE_QUALITY;

export const IMAGE_SIZES: Record<
  ImageCategory,
  Record<ImageSizeVariant, { width: number; height: number }>
> = {
  thumbnail: {
    // square sizes, multiples of 96x96
    tiny: { width: 96, height: 96 },
    small: { width: 192, height: 192 },
    medium: { width: 384, height: 384 },
    large: { width: 768, height: 768 },
    full: { width: 1536, height: 1536 },
  },
  low: {
    // 16:9 aspect ratio sizes, common video thumbnail sizes
    tiny: { width: 160, height: 90 },
    small: { width: 320, height: 180 },
    medium: { width: 640, height: 360 },
    large: { width: 1280, height: 720 },
    full: { width: 1920, height: 1080 },
  },
  medium: {
    tiny: { width: 160, height: 90 },
    small: { width: 320, height: 180 },
    medium: { width: 640, height: 360 },
    large: { width: 1280, height: 720 },
    full: { width: 1920, height: 1080 },
  },
  high: {
    tiny: { width: 160, height: 90 },
    small: { width: 320, height: 180 },
    medium: { width: 640, height: 360 },
    large: { width: 1280, height: 720 },
    full: { width: 1920, height: 1080 },
  },
} as const;

export type ImageProcessingOptions = {
  imageCategory: ImageCategory;
  sizeVariant: ImageSizeVariant;
  imageQuality?: keyof typeof IMAGE_QUALITY;
  exportAs?: ExportAs;
}

export type ProcessedImage = {
  buffer: Buffer;
  extension: string;
  mimeType: string;
};


export async function processImage(
  input: string | Buffer,
  option: ImageProcessingOptions,
): Promise<ProcessedImage> {
  const {
    imageCategory = 'thumbnail',
    sizeVariant = 'medium',
    imageQuality = 'medium',
    exportAs = 'webp',
  } = option;

  let mimeType = 'image/webp';
  let sharpInstance = Sharp(input);
  const size = IMAGE_SIZES[imageCategory][sizeVariant];
  const quality = IMAGE_QUALITY[imageQuality];

  sharpInstance = sharpInstance
    .resize({
      width: size.width,
      height: size.height,
      fit: 'cover',
      position: 'center',
    })
    .withMetadata({ exif: {} });

  switch (exportAs) {
    case 'png':
      sharpInstance = sharpInstance.png({
        quality,
        compressionLevel: 9,
      });
      mimeType = 'image/png';
      break;

    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({
        quality,
        mozjpeg: true, // cSpell: ignore mozjpeg
      });
      mimeType = 'image/jpeg';
      break;

    case 'webp':
    default:
      sharpInstance = sharpInstance.webp({
        quality,
      });
      mimeType = 'image/webp';
      break;
  }

  return {
    buffer: await sharpInstance.toBuffer(),
    extension: `.${exportAs}`,
    mimeType,
  };
}


export type ImageDimensions = {
  width: number;
  height: number;
};

export async function getImageDimensions(
  input: string | Buffer,
): Promise<ImageDimensions> {
  const metadata = await Sharp(input).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}
