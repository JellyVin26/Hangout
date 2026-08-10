import * as ImagePicker from 'expo-image-picker';
import { api } from './api';

export interface PickedImage {
  base64: string;
  uri: string;
  mime: string;
  width?: number;
  height?: number;
  url: string;
}

/** Pick an image from the device library and upload it. Returns the public URL. */
export async function pickAndUploadImage(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Photo permission denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7,
    base64: true,
    selectionLimit: 1,
    exif: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mime = asset.mimeType ?? guessMime(asset.uri);
  const base64 = asset.base64;
  if (!base64) throw new Error('Could not read the selected image');

  const res = await api<{ id: string; url: string; mime: string }>(`/uploads`, {
    method: 'POST',
    body: {
      base64,
      mime,
      width: asset.width,
      height: asset.height,
      kind: 'PHOTO',
    },
  });

  return {
    base64,
    uri: asset.uri,
    mime,
    width: asset.width,
    height: asset.height,
    url: res.url,
  };
}

function guessMime(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}
