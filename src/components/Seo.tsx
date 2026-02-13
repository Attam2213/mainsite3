import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';

const Seo = () => {
  const { seoSettings } = useSettings();

  return (
    <Helmet>
      <title>{seoSettings.title}</title>
      <meta name="description" content={seoSettings.description} />
      <meta name="keywords" content={seoSettings.keywords} />
    </Helmet>
  );
};

export default Seo;
