import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
}

interface SettingsContextType {
  contactInfo: ContactInfo;
  telegramConfig: TelegramConfig;
  seoSettings: SeoSettings;
  updateContactInfo: (info: ContactInfo) => Promise<void>;
  updateTelegramConfig: (config: TelegramConfig) => Promise<void>;
  updateSeoSettings: (settings: SeoSettings) => Promise<void>;
  loading: boolean;
}

const defaultContactInfo: ContactInfo = {
  email: 'hello@wexa.dev',
  phone: '+7 (999) 123-45-67',
  address: 'Москва, Россия',
  showEmail: true,
  showPhone: true,
  showAddress: true
};

const defaultTelegramConfig: TelegramConfig = {
  botToken: '',
  chatId: '',
  isEnabled: false
};

const defaultSeoSettings: SeoSettings = {
  title: 'WEXA - Разработка сайтов и веб-приложений',
  description: 'Профессиональная разработка сайтов, веб-приложений и поддержка. Качественный код, современный дизайн и внимание к деталям.',
  keywords: 'разработка сайтов, веб-приложения, react, typescript, создание сайтов'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(defaultTelegramConfig);
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(defaultSeoSettings);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.contact_info) {
            setContactInfo(prev => ({ ...prev, ...data.contact_info }));
          }
          if (data.telegram_config) {
            setTelegramConfig(prev => ({ ...prev, ...data.telegram_config }));
          }
          if (data.seo_settings) {
            setSeoSettings(prev => ({ ...prev, ...data.seo_settings }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateContactInfo = async (info: ContactInfo) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ key: 'contact_info', value: info })
    });

    if (res.ok) {
      setContactInfo(info);
    } else {
      throw new Error('Failed to update contact info');
    }
  };

  const updateTelegramConfig = async (config: TelegramConfig) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ key: 'telegram_config', value: config })
    });

    if (res.ok) {
      setTelegramConfig(config);
    } else {
      throw new Error('Failed to update telegram config');
    }
  };

  const updateSeoSettings = async (settings: SeoSettings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ key: 'seo_settings', value: settings })
    });

    if (res.ok) {
      setSeoSettings(settings);
    } else {
      throw new Error('Failed to update SEO settings');
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      contactInfo, 
      telegramConfig, 
      seoSettings, 
      updateContactInfo, 
      updateTelegramConfig, 
      updateSeoSettings,
      loading
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
