
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'القوميون - Al-Qaumiyun',
    short_name: 'Qaumiyun',
    description: 'الجريدة العالمية بأقلام المواطنين السياديين.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: 'https://picsum.photos/seed/qaumiyun/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/qaumiyun/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
