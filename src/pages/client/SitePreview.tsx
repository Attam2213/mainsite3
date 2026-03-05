import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SiteRenderer, SiteSettings } from '../../components/cms/SiteRenderer';

const SitePreview = () => {
  const { siteId } = useParams();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSite();
  }, [siteId]);

  useEffect(() => {
    if (settings) {
      // Set Title
      if (settings.title) {
        document.title = settings.title;
      }

      // Set Favicon
      if (settings.icon) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.icon;
      }

      // Set Meta Description
      if (settings.description) {
        let meta = document.querySelector("meta[name='description']") as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'description';
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
        meta.content = settings.description;
      }

      // Set Meta Keywords
      if (settings.metaKeywords) {
        let meta = document.querySelector("meta[name='keywords']") as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'keywords';
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
        meta.content = settings.metaKeywords;
      }

      // Set OG Image
      if (settings.ogImage) {
        let meta = document.querySelector("meta[property='og:image']") as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', 'og:image');
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
        meta.content = settings.ogImage;
      }

      // Inject Header Code
      if (settings.headerCode) {
        // Caution: Executing arbitrary scripts is risky. In a real production environment, sanitize or use specific integrations.
        // For this demo, we append it to head.
        try {
            const range = document.createRange();
            const fragment = range.createContextualFragment(settings.headerCode);
            document.head.appendChild(fragment);
        } catch (e) {
            console.error("Failed to inject header code", e);
        }
      }

      // Inject Footer Code
      if (settings.footerCode) {
         try {
            const range = document.createRange();
            const fragment = range.createContextualFragment(settings.footerCode);
            document.body.appendChild(fragment);
        } catch (e) {
            console.error("Failed to inject footer code", e);
        }
      }
    }
  }, [settings]);

  const fetchSite = async () => {
    try {
      // Note: For a public preview, we might need a public API endpoint.
      // For now, assuming the user is logged in or we use a public endpoint if available.
      // If this is strictly for the owner, they should be logged in.
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/sites/${siteId}`, {
        headers
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
            setSettings({ ...data.settings, id: data.id });
        }
      } else {
        setError('Сайт не найден или доступ запрещен');
      }
    } catch (error) {
      console.error('Error fetching site:', error);
      setError('Ошибка загрузки сайта');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Предпросмотр недоступен</h1>
            <p className="text-gray-600">{error || 'Настройки сайта не найдены.'}</p>
        </div>
      </div>
    );
  }

  return <SiteRenderer settings={settings} />;
};

export default SitePreview;
