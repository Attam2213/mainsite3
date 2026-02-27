import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEO = ({ 
  title, 
  description = 'Wexa - профессиональная веб-разработка сайтов под ключ. Создание современных, быстрых и адаптивных сайтов для вашего бизнеса.', 
  keywords = 'веб-разработка, создание сайтов, заказать сайт, лендинг, интернет-магазин, корпоративный сайт, разработка под ключ',
  image = '/og-image.jpg',
  url 
}: SEOProps) => {
  const siteTitle = 'Wexa';
  const fullTitle = `${title} | ${siteTitle}`;
  const currentUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  );
};

export default SEO;
