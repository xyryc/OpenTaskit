import type { ImageProps } from 'expo-image';

export const LOCAL_IMAGES: Record<string, number> = {
  '/6a841ba1-8fc6-4b01-a607-4adb387cf9da.jpg': require('../../assets/images/6a841ba1-8fc6-4b01-a607-4adb387cf9da.jpg'),
  '6a841ba1-8fc6-4b01-a607-4adb387cf9da.jpg': require('../../assets/images/6a841ba1-8fc6-4b01-a607-4adb387cf9da.jpg'),
  '/8cbdb637-4cc5-4c07-8c25-834788ef6d44.jpg': require('../../assets/images/8cbdb637-4cc5-4c07-8c25-834788ef6d44.jpg'),
  '8cbdb637-4cc5-4c07-8c25-834788ef6d44.jpg': require('../../assets/images/8cbdb637-4cc5-4c07-8c25-834788ef6d44.jpg'),
  '/d183c680-8ddb-4216-bbea-8cc2609442ab.jpg': require('../../assets/images/d183c680-8ddb-4216-bbea-8cc2609442ab.jpg'),
  'd183c680-8ddb-4216-bbea-8cc2609442ab.jpg': require('../../assets/images/d183c680-8ddb-4216-bbea-8cc2609442ab.jpg'),
  '/ecb7f488-08b1-4275-b360-9e627ee91dcc.jpg': require('../../assets/images/ecb7f488-08b1-4275-b360-9e627ee91dcc.jpg'),
  'ecb7f488-08b1-4275-b360-9e627ee91dcc.jpg': require('../../assets/images/ecb7f488-08b1-4275-b360-9e627ee91dcc.jpg'),
  '/df7760d8-efbf-49cc-be92-3aaccc99e481.jpg': require('../../assets/images/df7760d8-efbf-49cc-be92-3aaccc99e481.jpg'),
  'df7760d8-efbf-49cc-be92-3aaccc99e481.jpg': require('../../assets/images/df7760d8-efbf-49cc-be92-3aaccc99e481.jpg'),
};

/**
 * Universal image source resolver. Handles:
 * 1. Required asset numbers (from require('...'))
 * 2. Static mock path strings (e.g. "/d183c680-8ddb-4216-bbea-8cc2609442ab.jpg")
 * 3. Remote HTTP/HTTPS URLs and local device file/content URIs
 */
export function resolveImageSource(source: any): ImageProps['source'] {
  if (!source) return undefined;
  if (typeof source === 'number') {
    return source;
  }
  if (typeof source === 'object' && source !== null) {
    return source;
  }
  if (typeof source === 'string') {
    if (LOCAL_IMAGES[source]) {
      return LOCAL_IMAGES[source];
    }
    const clean = source.startsWith('/') ? source.slice(1) : source;
    if (LOCAL_IMAGES[clean]) {
      return LOCAL_IMAGES[clean];
    }
    const withSlash = source.startsWith('/') ? source : `/${source}`;
    if (LOCAL_IMAGES[withSlash]) {
      return LOCAL_IMAGES[withSlash];
    }
    return { uri: source };
  }
  return source;
}
