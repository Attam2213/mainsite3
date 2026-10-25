import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  noindex?: boolean;
}

const SEO = ({ 
  title, 
  description = 'Аренда игровых серверов Minecraft, CS2 и CS 1.6 и хостинг сайтов на Wexa.su. NVMe-ноды, защита от DDoS, запуск за 60 секунд, SFTP и панель управления.', 
  keywords = 'аренда игровых серверов, хостинг Minecraft, сервер CS2, сервер CS 1.6, хостинг сайтов, VDS, Node.js хостинг',
  image,
  url,
  noindex = false,
}: SEOProps) => {
  const siteTitle = 'Wexa';
  const fullTitle = `${title} | ${siteTitle}`;
  const currentUrl = url || window.location.href;
  // og:image должен быть абсолютным URL — иначе соцсети не показывают превью
  const imageUrl = image
    ? (image.startsWith('http') ? image : `${window.location.origin}${image}`)
    : `${window.location.origin}/og-image.jpg`;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Wexa.su" />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  );
};

export default SEO;
