import Constants from 'expo-constants';
import { SERVER_BASE_URL } from './api';

const getDefaultMinioPublicUrl = () => {
    const host = String(SERVER_BASE_URL || '').replace(/^https?:\/\//i, '').replace(/:\d+$/, '').replace(/\/+$/, '');
    if (!host) return '';
    return `http://${host}:9000`;
};

const configuredMinioPublicUrl =
    (Constants?.expoConfig as any)?.extra?.MINIO_PUBLIC_URL ||
    (Constants as any)?.manifest?.extra?.MINIO_PUBLIC_URL ||
    getDefaultMinioPublicUrl();

const encodePath = (value: string) =>
    String(value)
        .split('/')
        .map((s) => encodeURIComponent(s))
        .join('/');

export const getPublicMinioFileUrl = (bucket: string, keyOrUrl?: string | null) => {
    const value = String(keyOrUrl || '').trim();
    if (!value) return '';
    if (value.startsWith('data:')) return value;

    const base = String(configuredMinioPublicUrl || '').replace(/\/+$/, '');
    if (value.startsWith('http://') || value.startsWith('https://')) {
        if (!base) return value;
        try {
            const url = new URL(value);
            const baseUrl = new URL(base);
            const isMinioPort = String(url.port || '') === '9000';

            // If backend returned a MinIO absolute URL with a different host (common on LAN),
            // force it to use the configured public base so the device can load it.
            if (isMinioPort) {
                url.protocol = baseUrl.protocol;
                url.hostname = baseUrl.hostname;
                url.port = baseUrl.port;
                return url.toString();
            }
        } catch {
            // ignore
        }
        return value;
    }

    if (!base) return value;
    
    // Remove bucket name from key if it's already there
    const normalizedKey = value.replace(/^\/+/, '').replace(new RegExp(`^${bucket}/`, 'i'), '');
    
    return `${base}/${encodePath(bucket)}/${encodePath(normalizedKey)}`;
};

export const getUserAvatarUrl = (keyOrUrl?: string | null) => getPublicMinioFileUrl('images', keyOrUrl);
