import React from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Layout, 
  MessageSquare, 
  Grid,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  ArrowRight,
  Menu,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github
} from 'lucide-react';

export interface SiteButton {
  id: string;
  text: string;
  url: string;
  style: 'primary' | 'secondary' | 'outline';
}

export interface Section {
  id: string;
  type: 'header' | 'hero' | 'features' | 'text' | 'contact' | 'gallery' | 'footer' | 'reviews' | 'news' | 'about' | 'pricing' | 'faq' | 'map' | 'video' | 'partners';
  variant: string;
  title?: string;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  content?: string;
  showContent?: boolean;
  image?: string;
  showImage?: boolean;
  backgroundImage?: string;
  buttons?: SiteButton[];
  items?: any[];
  settings?: any;
}

export interface SiteSettings {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  primaryColor: string;
  secondaryColor?: string;
  fontFamily: string;
  borderRadius?: string;
  metaKeywords?: string;
  ogImage?: string;
  headerCode?: string;
  footerCode?: string;
  sections: Section[];
}

interface SectionProps {
  section: Section;
  settings: SiteSettings;
  isSelected?: boolean;
  onClick?: () => void;
}

// --- Helper Components ---

const RenderButtons = ({ buttons, settings }: { buttons?: SiteButton[], settings: SiteSettings }) => {
  if (!buttons || buttons.length === 0) return null;
  
  return (
    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-3">
      {buttons.map((btn) => {
        const baseClass = "w-full flex items-center justify-center px-8 py-3 border text-base font-medium rounded-md md:py-4 md:text-lg md:px-10 transition-colors";
        let style: React.CSSProperties = { borderRadius: settings.borderRadius || '0.375rem' }; // Default md (6px)
        let className = baseClass;
        
        if (btn.style === 'primary') {
          className += " text-white border-transparent hover:opacity-90";
          style.backgroundColor = settings.primaryColor;
        } else if (btn.style === 'secondary') {
          className += " text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border-transparent";
          style.color = settings.primaryColor;
          style.backgroundColor = `${settings.primaryColor}20`; // 20 hex = 12% opacity
        } else {
          className += " text-indigo-700 bg-white border-indigo-200 hover:bg-gray-50";
          style.color = settings.primaryColor;
          style.borderColor = settings.primaryColor;
        }
        
        return (
          <div key={btn.id} className="mt-3 sm:mt-0">
            <a href={btn.url} className={className} style={style}>
              {btn.text}
            </a>
          </div>
        );
      })}
    </div>
  );
};

const SectionWrapper = ({ children, section, settings, className = "" }: { children: React.ReactNode, section: Section, settings: SiteSettings, className?: string }) => {
  const style: React.CSSProperties = { fontFamily: settings.fontFamily };
  
  if (section.backgroundImage) {
    style.backgroundImage = `url(${section.backgroundImage})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }
  
  return (
    <div className={`relative ${className} ${section.backgroundImage ? 'text-white' : ''}`} style={style}>
      {section.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// --- Header Sections ---

const HeaderSimple = ({ section, settings }: SectionProps) => (
  <header className="bg-white shadow-sm" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex-shrink-0 flex items-center">
          {section.showTitle !== false && (
            <span className="font-bold text-xl" style={{ color: settings.primaryColor }}>{section.title || settings.title}</span>
          )}
        </div>
        <div className="hidden md:flex space-x-8">
          {(section.items || []).map((item, i) => (
            <a key={i} href={item.url || '#'} className="text-gray-500 hover:text-gray-900">{item.text || `Menu ${i+1}`}</a>
          ))}
        </div>
        <div className="md:hidden">
          <Menu className="h-6 w-6 text-gray-500" />
        </div>
      </div>
    </div>
  </header>
);

const HeaderCentered = ({ section, settings }: SectionProps) => (
  <header className="bg-white shadow-sm" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col items-center">
        {section.showTitle !== false && (
          <div className="flex-shrink-0 mb-4">
            <span className="font-bold text-2xl" style={{ color: settings.primaryColor }}>{section.title || settings.title}</span>
          </div>
        )}
        <div className="flex space-x-8">
          {(section.items || []).map((item, i) => (
            <a key={i} href={item.url || '#'} className="text-gray-500 hover:text-gray-900 font-medium">{item.text || `Menu ${i+1}`}</a>
          ))}
        </div>
      </div>
    </div>
  </header>
);

const HeaderDouble = ({ section, settings }: SectionProps) => (
  <header className="shadow-sm" style={{ fontFamily: settings.fontFamily }}>
    {/* Top Bar */}
    <div className="bg-gray-900 text-white py-2 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            <span>+7 (999) 000-00-00</span>
          </div>
          <div className="hidden sm:flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            <span>info@example.com</span>
          </div>
        </div>
        <div className="flex space-x-4">
           <Facebook className="h-4 w-4 hover:text-indigo-400 cursor-pointer" />
           <Twitter className="h-4 w-4 hover:text-indigo-400 cursor-pointer" />
           <Instagram className="h-4 w-4 hover:text-indigo-400 cursor-pointer" />
        </div>
      </div>
    </div>
    {/* Main Bar */}
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
            {section.showTitle !== false && (
              <span className="font-bold text-2xl" style={{ color: settings.primaryColor }}>{section.title || settings.title}</span>
            )}
          </div>
          <div className="hidden md:flex space-x-8">
            {(section.items || []).map((item, i) => (
              <a key={i} href={item.url || '#'} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">{item.text || `Menu ${i+1}`}</a>
            ))}
          </div>
          <div className="md:hidden">
            <Menu className="h-6 w-6 text-gray-700" />
          </div>
        </div>
      </div>
    </div>
  </header>
);

const HeaderMinimal = ({ section, settings }: SectionProps) => (
  <header className="bg-white border-b border-gray-100" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-14">
        <div className="flex-shrink-0">
           {section.showTitle !== false && (
             <span className="font-bold text-lg tracking-tighter" style={{ color: settings.primaryColor }}>{section.title || settings.title}</span>
           )}
        </div>
        <nav className="hidden md:flex space-x-6">
          {(section.items || []).map((item, i) => (
            <a key={i} href={item.url || '#'} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">{item.text || `Link ${i+1}`}</a>
          ))}
        </nav>
        <div className="md:hidden">
          <Menu className="h-5 w-5 text-gray-500" />
        </div>
      </div>
    </div>
  </header>
);

// --- Hero Sections ---

const HeroSplit = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
          <div className="sm:text-center lg:text-left">
            {section.showTitle !== false && (
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className={`block xl:inline ${section.backgroundImage ? 'text-white' : ''}`}>{section.title || 'Добро пожаловать'}</span>{' '}
                {section.showSubtitle !== false && (
                  <span className="block text-indigo-600 xl:inline" style={{ color: settings.primaryColor }}>
                    {section.subtitle || 'Создайте что-то удивительное'}
                  </span>
                )}
              </h1>
            )}
            {section.showContent !== false && (
              <p className={`mt-3 text-base sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 ${section.backgroundImage ? 'text-gray-100' : 'text-gray-500'}`}>
                {section.content || 'Начните создавать сайт своей мечты уже сегодня.'}
              </p>
            )}
            <RenderButtons buttons={section.buttons} settings={settings} />
          </div>
        </main>
      </div>
    </div>
    {!section.backgroundImage && section.showImage !== false && (
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src={section.image || "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"}
          alt=""
        />
      </div>
    )}
  </SectionWrapper>
);

const HeroCenter = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-gray-50 py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      {section.showTitle !== false && (
        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          <span className={`block ${section.backgroundImage ? 'text-white' : ''}`}>{section.title || 'Добро пожаловать'}</span>
          {section.showSubtitle !== false && (
            <span className="block text-indigo-600 mt-2" style={{ color: settings.primaryColor }}>
              {section.subtitle || 'Создайте что-то удивительное'}
            </span>
          )}
        </h1>
      )}
      {section.showContent !== false && (
        <p className={`mt-4 max-w-2xl mx-auto text-xl ${section.backgroundImage ? 'text-gray-100' : 'text-gray-500'}`}>
          {section.content || 'Начните создавать сайт своей мечты уже сегодня.'}
        </p>
      )}
      <div className="mt-8 flex justify-center">
        <RenderButtons buttons={section.buttons} settings={settings} />
      </div>
      {!section.backgroundImage && section.image && section.showImage !== false && (
        <div className="mt-12 relative">
          <img
            className="rounded-lg shadow-xl mx-auto"
            src={section.image}
            alt="App screenshot"
          />
        </div>
      )}
    </div>
  </SectionWrapper>
);

// --- Features Sections ---

const FeaturesGrid = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:text-center mb-12">
        {section.showSubtitle !== false && (
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase" style={{ color: settings.primaryColor }}>
            {section.subtitle || 'Преимущества'}
          </h2>
        )}
        {section.showTitle !== false && (
          <p className={`mt-2 text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
            {section.title || 'Наши ключевые преимущества'}
          </p>
        )}
        {section.showContent !== false && (
          <p className={`mt-4 max-w-2xl text-xl lg:mx-auto ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
            {section.content}
          </p>
        )}
      </div>

      <div className="mt-10">
        <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
          {(section.items || [1, 2, 3, 4]).map((item, index) => (
            <div key={index} className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white" style={{ backgroundColor: settings.primaryColor }}>
                  <CheckCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className={`ml-16 text-lg leading-6 font-medium ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                  {item.title || `Преимущество ${index + 1}`}
                </p>
              </dt>
              <dd className={`mt-2 ml-16 text-base ${section.backgroundImage ? 'text-gray-300' : 'text-gray-500'}`}>
                {item.description || 'Описание преимущества. Здесь вы можете подробно рассказать о том, чем полезен этот пункт.'}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </SectionWrapper>
);

const FeaturesCards = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-extrabold ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
            {section.title || 'Почему выбирают нас'}
          </h2>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {(section.items || [1, 2, 3]).map((item, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4" style={{ backgroundColor: settings.primaryColor }}>
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {item.title || `Карточка ${index + 1}`}
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>{item.description || 'Краткое описание карточки. Добавьте сюда полезную информацию.'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

const FeaturesZigZag = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-white overflow-hidden">
    <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
      {section.showTitle !== false && (
        <div className="relative mb-12 lg:mb-24 lg:text-center">
          <h2 className={`text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
            {section.title || 'Как это работает'}
          </h2>
          {section.showContent !== false && (
             <p className={`mt-4 max-w-2xl text-xl lg:mx-auto ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
               {section.content || 'Пошаговый процесс достижения результата.'}
             </p>
          )}
        </div>
      )}

      <div className="relative">
        {(section.items || [1, 2, 3]).map((item, index) => (
          <div key={index} className={`lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:gap-8 lg:items-center ${index > 0 ? 'mt-12 lg:mt-24' : ''}`}>
            <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
              <h3 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                {item.title || `Этап ${index + 1}`}
              </h3>
              <p className={`mt-3 text-lg ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
                {item.description || 'Подробное описание этапа или особенности. Расскажите, как это помогает вашему клиенту.'}
              </p>
            </div>
            <div className={`mt-10 -mx-4 relative lg:mt-0 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
              <img
                className="relative mx-auto rounded-lg shadow-lg"
                width={490}
                src={item.image || `https://source.unsplash.com/random/490x300?sig=${index}`}
                alt=""
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- Text Sections ---

const TextSimple = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
    <div className="relative max-w-xl mx-auto">
      <div className="text-center">
        {section.showTitle !== false && (
          <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
            {section.title || 'О нас'}
          </h2>
        )}
        {section.showContent !== false && (
          <p className={`mt-4 text-lg ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
            {section.content || 'Здесь вы можете разместить любой текстовый контент, статьи или новости вашей компании.'}
          </p>
        )}
      </div>
      <div className="mt-8 flex justify-center">
        <RenderButtons buttons={section.buttons} settings={settings} />
      </div>
    </div>
  </SectionWrapper>
);

const TextCTA = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-indigo-700 py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between">
      <div className="text-center lg:text-left mb-8 lg:mb-0">
        {section.showTitle !== false && (
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">{section.title || 'Готовы начать?'}</span>
          </h2>
        )}
        {section.showContent !== false && (
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            {section.content || 'Свяжитесь с нами сегодня и получите бесплатную консультацию.'}
          </p>
        )}
      </div>
      <div className="flex justify-center lg:justify-end">
        <RenderButtons buttons={section.buttons} settings={settings} />
      </div>
    </div>
  </SectionWrapper>
);

// --- Contact Sections ---

const ContactSplit = ({ section, settings }: SectionProps) => {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' });

  // Get siteId from URL if possible, or context. 
  // In preview mode, siteId might be in URL params.
  // We need a robust way to pass siteId to SiteRenderer.
  // For now, assuming siteId is available in settings or we parse it from somewhere.
  // Actually, SiteRenderer doesn't receive siteId directly. 
  // We should add siteId to SiteSettings interface or pass it as prop.
  // Let's check SiteSettings interface.
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
        // We need siteId. Let's try to get it from window location if not in props
        // Or better, let's update SiteRenderer to accept siteId prop
        // For this implementation, we will assume /api/leads endpoint handles it.
        // But wait, the server needs siteId.
        // Let's assume settings has siteId attached during fetch.
        
        const siteId = (settings as any).id; 

        if (!siteId) {
            console.error("Site ID not found in settings");
            setStatus('error');
            return;
        }

        const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId,
                ...formData
            })
        });

        if (res.ok) {
            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } else {
            setStatus('error');
        }
    } catch (error) {
        console.error("Error submitting lead:", error);
        setStatus('error');
    }
  };

  const contactItems = section.items || [
    { text: '+7 (999) 000-00-00', type: 'phone' },
    { text: 'info@example.com', type: 'mail' }
  ];

  return (
  <SectionWrapper section={section} settings={settings} className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        {section.showTitle !== false && (
          <h2 className={`text-3xl font-extrabold sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
            {section.title || 'Свяжитесь с нами'}
          </h2>
        )}
        {section.showContent !== false && (
          <p className={`mt-4 text-lg ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
            {section.content || 'Мы всегда рады помочь вам. Свяжитесь с нами любым удобным способом.'}
          </p>
        )}
        <dl className={`mt-8 text-base ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
          {contactItems.map((item: any, idx: number) => (
            <div key={idx} className="mt-6">
              <dt className="sr-only">{item.type === 'phone' ? 'Телефон' : 'Email'}</dt>
              <dd className="flex">
                {item.type === 'phone' ? (
                  <Phone className="flex-shrink-0 h-6 w-6" aria-hidden="true" />
                ) : (
                  <Mail className="flex-shrink-0 h-6 w-6" aria-hidden="true" />
                )}
                <span className="ml-3">{item.text}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="bg-white py-10 px-6 shadow sm:rounded-lg sm:px-10" style={{ borderRadius: settings.borderRadius || '0.5rem' }}>
        {status === 'success' ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Сообщение отправлено!</h3>
            <p className="mt-2 text-sm text-gray-500">Мы свяжемся с вами в ближайшее время.</p>
          </div>
        ) : (
          <form className="mb-0 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Имя</label>
              <div className="mt-1">
                <input 
                    required 
                    type="text" 
                    name="name" 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" 
                    style={{ borderRadius: settings.borderRadius || '0.375rem' }} 
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input 
                    required 
                    type="email" 
                    name="email" 
                    id="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" 
                    style={{ borderRadius: settings.borderRadius || '0.375rem' }} 
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Сообщение</label>
              <div className="mt-1">
                <textarea 
                    required 
                    name="message" 
                    id="message" 
                    rows={4} 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" 
                    style={{ borderRadius: settings.borderRadius || '0.375rem' }}
                ></textarea>
              </div>
            </div>
            {status === 'error' && (
                <div className="text-red-600 text-sm text-center">Ошибка отправки. Попробуйте позже.</div>
            )}
            <div>
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors" 
                style={{ backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius || '0.375rem' }}
              >
                {status === 'loading' ? 'Отправка...' : 'Отправить сообщение'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </SectionWrapper>
  );
};

// --- Reviews Sections ---

const ReviewsGrid = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">{section.title || 'Отзывы клиентов'}</h2>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {(section.items || [1, 2, 3]).map((item, i) => (
          <div key={i} className="bg-white p-6 shadow-sm" style={{ borderRadius: settings.borderRadius || '0.5rem' }}>
             <div className="flex items-center mb-4">
               <div className="h-10 w-10 flex items-center justify-center text-gray-500 font-bold overflow-hidden" style={{ borderRadius: settings.borderRadius ? `calc(${settings.borderRadius} * 0.5)` : '50%' }}>
                 {item.image ? (
                   <img src={item.image} alt={item.author} className="h-full w-full object-cover" />
                 ) : (
                   item.author ? item.author[0] : 'U'
                 )}
               </div>
               <div className="ml-3">
                 <p className="text-sm font-medium text-gray-900">{item.author || 'Имя Клиента'}</p>
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, star) => (
                     <span key={star} className={star < (item.rating || 5) ? "text-yellow-400" : "text-gray-300"}>★</span>
                   ))}
                 </div>
               </div>
             </div>
             <p className="text-gray-500 italic">"{item.text || 'Отличный сервис! Очень доволен результатом.'}"</p>
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

const ReviewsSlider = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-white">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {section.showTitle !== false && (
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">{section.title || 'Что говорят о нас'}</h2>
        )}
        <div className="flex overflow-x-auto space-x-6 pb-4 snap-x">
          {(section.items || [1, 2, 3, 4]).map((item, i) => (
            <div key={i} className="snap-center flex-shrink-0 w-80 bg-gray-50 p-8 rounded-xl flex flex-col justify-between">
               <div>
                 <div className="flex text-yellow-400 mb-4">
                   {[...Array(5)].map((_, star) => (
                     <span key={star} className={star < (item.rating || 5) ? "text-yellow-400" : "text-gray-300"}>★</span>
                   ))}
                 </div>
                 <p className="text-lg text-gray-600 mb-6 italic">"{item.text || 'Профессиональный подход и качественная работа.'}"</p>
               </div>
               <div className="flex items-center mt-auto">
                 <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden mr-3">
                   {item.image ? (
                     <img src={item.image} alt={item.author} className="h-full w-full object-cover" />
                   ) : (
                     item.author ? item.author[0] : 'U'
                   )}
                 </div>
                 <p className="font-bold text-gray-900">{item.author || 'Клиент Компании'}</p>
               </div>
            </div>
          ))}
        </div>
     </div>
  </SectionWrapper>
);

// --- Gallery Sections ---

const GalleryGrid = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        {section.showTitle !== false && (
          <h2 className="text-3xl font-extrabold text-gray-900">{section.title || 'Наша Галерея'}</h2>
        )}
        {section.showSubtitle !== false && (
          <p className="mt-4 text-gray-500">{section.subtitle || 'Посмотрите наши лучшие работы'}</p>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(section.items || [1, 2, 3, 4, 5, 6]).map((item, i) => (
          <div key={i} className="relative aspect-w-1 aspect-h-1 group overflow-hidden bg-gray-100" style={{ borderRadius: settings.borderRadius || '0.5rem' }}>
             <img 
               src={item.image || `https://source.unsplash.com/random/800x600?sig=${i}`} 
               alt="" 
               className="object-cover w-full h-full group-hover:opacity-75 transition-opacity"
             />
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

const GalleryMasonry = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       {section.showTitle !== false && (
         <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">{section.title || 'Портфолио'}</h2>
       )}
       <div className="columns-1 md:columns-3 gap-4 space-y-4">
         {(section.items || [1, 2, 3, 4, 5, 6]).map((item, i) => (
           <div key={i} className="break-inside-avoid overflow-hidden" style={{ borderRadius: settings.borderRadius || '0.5rem' }}>
             <img 
               src={item.image || `https://source.unsplash.com/random/600x${400 + (i % 3) * 200}?sig=${i}`} 
               alt="" 
               className="w-full h-auto"
             />
           </div>
         ))}
       </div>
    </div>
  </SectionWrapper>
);

// --- News Sections ---

const NewsList = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-white">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       {section.showTitle !== false && (
         <h2 className="text-3xl font-extrabold text-gray-900 mb-8">{section.title || 'Последние новости'}</h2>
       )}
       <div className="space-y-8">
         {(section.items || [1, 2, 3]).map((item, i) => (
           <div key={i} className="flex flex-col md:flex-row gap-6 border-b border-gray-100 pb-8 last:border-0">
              <div className="md:w-1/4">
                 <img src={item.image || `https://source.unsplash.com/random/400x300?sig=${i+10}`} className="w-full h-48 object-cover" style={{ borderRadius: settings.borderRadius || '0.5rem' }} alt="" />
              </div>
              <div className="md:w-3/4">
                 <span className="text-sm text-indigo-600 font-semibold">{item.date || '01.01.2024'}</span>
                 <h3 className="text-xl font-bold text-gray-900 mt-2">{item.title || 'Заголовок новости'}</h3>
                 <p className="mt-3 text-gray-500">{item.excerpt || 'Краткое описание новости. Здесь можно рассказать о последних событиях вашей компании или индустрии.'}</p>
                 <a href="#" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">Читать далее &rarr;</a>
              </div>
           </div>
         ))}
       </div>
     </div>
  </SectionWrapper>
);

const NewsCards = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <h2 className="text-3xl font-extrabold text-gray-900 mb-12 text-center">{section.title || 'Блог'}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(section.items || [1, 2, 3]).map((item, i) => (
          <div key={i} className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow" style={{ borderRadius: settings.borderRadius || '0.5rem' }}>
             <img src={item.image || `https://source.unsplash.com/random/400x250?sig=${i+20}`} className="w-full h-48 object-cover" alt="" />
             <div className="p-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.category || 'Новости'}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">{item.title || 'Интересная статья'}</h3>
                <p className="mt-3 text-gray-500 text-sm line-clamp-3">{item.excerpt || 'Краткое содержание статьи. Полезная информация для ваших клиентов и партнеров.'}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- About Sections ---

const AboutSimple = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div>
             {section.showTitle !== false && (
               <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{section.title || 'О нашей компании'}</h2>
             )}
             {section.showContent !== false && (
               <p className="mt-4 text-lg text-gray-500">{section.content || 'Мы занимаемся созданием лучших решений для вашего бизнеса уже более 10 лет. Наша миссия - помогать клиентам достигать успеха.'}</p>
             )}
             <div className="mt-8">
               <RenderButtons buttons={section.buttons} settings={settings} />
             </div>
          </div>
          {section.showImage !== false && (
            <div className="mt-10 lg:mt-0">
               <img 
                 src={section.image || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"} 
                 className="shadow-lg object-cover" 
                 style={{ borderRadius: settings.borderRadius || '0.5rem' }}
                 alt="" 
               />
            </div>
          )}
       </div>
    </div>
  </SectionWrapper>
);

const AboutStats = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-indigo-700" >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       {section.showTitle !== false && (
         <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white">{section.title || 'Мы в цифрах'}</h2>
         </div>
       )}
       <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {(section.items || [
            { label: 'Клиентов', value: '1000+' },
            { label: 'Проектов', value: '500+' },
            { label: 'Лет опыта', value: '10+' }
          ]).map((item, i) => (
             <div key={i} className="flex flex-col bg-white/10 p-8 text-center backdrop-blur-sm" style={{ borderRadius: settings.borderRadius || '0.5rem' }}>
                <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-100">{item.label}</dt>
                <dd className="order-1 text-5xl font-extrabold text-white">{item.value}</dd>
             </div>
          ))}
       </dl>
    </div>
  </SectionWrapper>
);

const AboutTeam = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-12 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="space-y-12">
        {section.showTitle !== false && (
          <div className="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{section.title || 'Наша команда'}</h2>
            {section.showContent !== false && (
              <p className="text-xl text-gray-500">
                {section.content || 'Познакомьтесь с талантливыми людьми, которые работают над вашим проектом.'}
              </p>
            )}
          </div>
        )}
        <ul className="mx-auto space-y-16 sm:grid sm:grid-cols-2 sm:gap-16 sm:space-y-0 lg:grid-cols-3 lg:max-w-5xl">
          {(section.items || [1, 2, 3]).map((person, i) => (
            <li key={i}>
              <div className="space-y-6">
                <img className="mx-auto h-40 w-40 rounded-full xl:w-56 xl:h-56 object-cover" src={person.image || `https://source.unsplash.com/random/200x200?sig=${i+50}`} alt="" />
                <div className="space-y-2">
                  <div className="text-lg leading-6 font-medium space-y-1">
                    <h3>{person.name || 'Имя Фамилия'}</h3>
                    <p className="text-indigo-600">{person.role || 'Должность'}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </SectionWrapper>
);

// --- Pricing Sections ---

const PricingThreeCol = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:flex-col sm:align-center">
        {section.showTitle !== false && (
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-center">{section.title || 'Наши тарифы'}</h1>
        )}
        {section.showContent !== false && (
          <p className="mt-5 text-xl text-gray-500 sm:text-center">
            {section.content || 'Выберите план, который подходит именно вам.'}
          </p>
        )}
      </div>
      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
        {(section.items || [1, 2, 3]).map((item, i) => (
          <div key={i} className={`border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white ${item.isPopular ? 'ring-2 ring-indigo-500 relative' : ''}`}>
            {item.isPopular && (
              <span className="absolute top-0 right-0 -mt-3 mr-3 px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-full shadow-sm">
                Популярный
              </span>
            )}
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">{item.title || 'Тариф'}</h2>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">{item.price || '0 ₽'}</span>
                <span className="text-base font-medium text-gray-500">/мес</span>
              </p>
              <a href="#" className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${item.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                {item.buttonText || 'Выбрать'}
              </a>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">Что включено</h3>
              <ul className="mt-6 space-y-4">
                {(item.features ? item.features.split(',') : ['Опция 1', 'Опция 2', 'Опция 3']).map((feature: string, idx: number) => (
                  <li key={idx} className="flex space-x-3">
                    <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">{feature.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- FAQ Sections ---

const FAQAccordion = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
        {section.showTitle !== false && (
          <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl mb-8">
            {section.title || 'Частые вопросы'}
          </h2>
        )}
        <dl className="mt-6 space-y-6 divide-y divide-gray-200">
          {(section.items || [1, 2, 3]).map((item, i) => (
            <div key={i} className="pt-6">
              <details className="group">
                <summary className="text-lg font-medium text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {item.question || 'Какой-то вопрос?'}
                  <span className="ml-6 flex-shrink-0 transition-transform group-open:-rotate-180">
                    <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-2 text-base text-gray-500 pr-12">
                  {item.answer || 'Ответ на этот вопрос. Здесь может быть подробное объяснение.'}
                </p>
              </details>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </SectionWrapper>
);

// --- New Sections (Map, Video, Partners) ---

const MapEmbed = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white">
    <div className="w-full h-96 bg-gray-200 relative">
      <iframe 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        style={{ border: 0 }} 
        src={section.content || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.584360343727!2d37.61763261604557!3d55.75578638055416!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a50b315e573%3A0xa886bf5a3d9b2e68!2sThe%20Kremlin!5e0!3m2!1sen!2sru!4v1620000000000!5m2!1sen!2sru"} 
        allowFullScreen 
        aria-hidden="false" 
        tabIndex={0}
      ></iframe>
      {section.showTitle !== false && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded shadow-md max-w-xs">
          <h3 className="text-lg font-bold text-gray-900">{section.title || 'Наш офис'}</h3>
          {section.subtitle && <p className="text-sm text-gray-500 mt-1">{section.subtitle}</p>}
        </div>
      )}
    </div>
  </SectionWrapper>
);

const VideoSection = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      {section.showTitle !== false && (
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-white">{section.title || 'Видео презентация'}</h2>
          {section.showContent !== false && (
            <p className="mt-4 text-xl text-gray-300">{section.content || 'Посмотрите короткое видео о наших возможностях.'}</p>
          )}
        </div>
      )}
      <div className="relative aspect-w-16 aspect-h-9 overflow-hidden rounded-xl shadow-2xl bg-black">
        {section.image ? (
           // If it's a YouTube/Vimeo embed URL
           <iframe 
             src={section.image} 
             title={section.title}
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
             className="w-full h-full"
           ></iframe>
        ) : (
           <div className="flex items-center justify-center h-full text-gray-500">
             <p>Вставьте ссылку на видео (Embed URL)</p>
           </div>
        )}
      </div>
    </div>
  </SectionWrapper>
);

const PartnersLogoCloud = ({ section, settings }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <p className="text-center text-base font-semibold uppercase text-gray-600 tracking-wider mb-8">
          {section.title || 'Нам доверяют'}
        </p>
      )}
      <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
        {(section.items && section.items.length > 0 ? section.items : Array(5).fill({})).map((item, i) => (
          <div key={i} className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            {item.image ? (
              <img className="h-12 object-contain" src={item.image} alt={item.title || "Partner"} />
            ) : (
              <div className="h-12 w-32 bg-gray-200 rounded flex items-center justify-center text-gray-400 font-bold">LOGO</div>
            )}
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- Footer Sections ---

const FooterSimple = ({ section, settings }: SectionProps) => (
  <footer className="bg-gray-800 text-white py-12" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex justify-center space-x-6 md:order-2">
          <a href="#" className="text-gray-400 hover:text-gray-300">
            <span className="sr-only">Facebook</span>
            <Facebook className="h-6 w-6" />
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-300">
            <span className="sr-only">Instagram</span>
            <Instagram className="h-6 w-6" />
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-300">
            <span className="sr-only">Twitter</span>
            <Twitter className="h-6 w-6" />
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} {section.showTitle !== false && (section.title || settings.title)}. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

const FooterColumns = ({ section, settings }: SectionProps) => (
  <footer className="bg-gray-900 text-white py-16" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Компания</h3>
           <ul className="space-y-4">
             <li><a href="#" className="text-base text-gray-300 hover:text-white">О нас</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Блог</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Карьера</a></li>
           </ul>
        </div>
        <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Поддержка</h3>
           <ul className="space-y-4">
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Помощь</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Контакты</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">FAQ</a></li>
           </ul>
        </div>
        <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Юридическая инфо</h3>
           <ul className="space-y-4">
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Конфиденциальность</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Условия</a></li>
           </ul>
        </div>
        <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Подписка</h3>
           <p className="text-base text-gray-300 mb-4">Подпишитесь на наши новости.</p>
           <div className="flex">
             <input type="email" placeholder="Email" className="bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none w-full" />
             <button className="bg-indigo-600 px-4 py-2 rounded-r-md hover:bg-indigo-700">OK</button>
           </div>
        </div>
      </div>
      <div className="mt-12 border-t border-gray-700 pt-8">
        <p className="text-base text-gray-400 text-center">&copy; {new Date().getFullYear()} {section.showTitle !== false && (section.title || settings.title)}. Все права защищены.</p>
      </div>
    </div>
  </footer>
);

// --- Main Renderer ---

interface SiteRendererProps {
  settings: SiteSettings;
  selectedSectionId?: string | null;
  onSelectSection?: (id: string) => void;
}

export const SiteRenderer = ({ settings, selectedSectionId, onSelectSection }: SiteRendererProps) => {
  if (!settings || !settings.sections) {
    return <div className="p-10 text-center text-gray-500">Нет контента для отображения</div>;
  }

  const renderSection = (section: Section, index: number) => {
    const isSelected = selectedSectionId === section.id;
    const commonProps = {
      key: section.id,
      section,
      settings,
      isSelected,
      onClick: () => onSelectSection && onSelectSection(section.id)
    };

    let Component: any = null;

    switch (section.type) {
      case 'header':
        if (section.variant === 'centered') Component = HeaderCentered;
        else if (section.variant === 'double') Component = HeaderDouble;
        else if (section.variant === 'minimal') Component = HeaderMinimal;
        else Component = HeaderSimple;
        break;
      case 'hero':
        Component = section.variant === 'center' ? HeroCenter : HeroSplit;
        break;
      case 'features':
        if (section.variant === 'cards') Component = FeaturesCards;
        else if (section.variant === 'zigzag') Component = FeaturesZigZag;
        else Component = FeaturesGrid;
        break;
      case 'text':
        Component = section.variant === 'cta' ? TextCTA : TextSimple;
        break;
      case 'contact':
        Component = ContactSplit;
        break;
      case 'reviews':
        Component = section.variant === 'slider' ? ReviewsSlider : ReviewsGrid;
        break;
      case 'gallery':
        Component = section.variant === 'masonry' ? GalleryMasonry : GalleryGrid;
        break;
      case 'news':
        Component = section.variant === 'cards' ? NewsCards : NewsList;
        break;
      case 'about':
        if (section.variant === 'stats') Component = AboutStats;
        else if (section.variant === 'team') Component = AboutTeam;
        else Component = AboutSimple;
        break;
      case 'pricing':
        Component = PricingThreeCol;
        break;
      case 'faq':
        Component = FAQAccordion;
        break;
      case 'map':
        Component = MapEmbed;
        break;
      case 'video':
        Component = VideoSection;
        break;
      case 'partners':
        Component = PartnersLogoCloud;
        break;
      case 'footer':
        Component = section.variant === 'columns' ? FooterColumns : FooterSimple;
        break;
      default:
        // Fallback for unknown types
        Component = TextSimple;
    }

    const sectionTypeMap: Record<string, string> = {
      header: 'Шапка',
      hero: 'Главный экран',
      features: 'Преимущества',
      text: 'Текст',
      contact: 'Контакты',
      gallery: 'Галерея',
      footer: 'Подвал',
      reviews: 'Отзывы',
      news: 'Новости',
      about: 'О компании',
      pricing: 'Цены',
      faq: 'FAQ',
      map: 'Карта',
      video: 'Видео',
      partners: 'Партнеры'
    };

    return (
      <div 
        key={section.id}
        onClick={() => onSelectSection && onSelectSection(section.id)}
        className={`relative transition-all duration-200 border-2 ${isSelected ? 'border-indigo-600 shadow-lg z-10' : 'border-transparent hover:border-indigo-300 hover:border-dashed'}`}
      >
        <Component {...commonProps} />
        {onSelectSection && isSelected && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow pointer-events-none z-50">
            Редактирование: {sectionTypeMap[section.type] || section.type}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {settings.sections.map((section, index) => renderSection(section, index))}
    </div>
  );
};

export default SiteRenderer;
