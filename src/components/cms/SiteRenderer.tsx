import React from 'react';
import { 
  Phone,
  Mail,
  CheckCircle,
  Menu,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';

export interface SiteButton {
  id: string;
  text: string;
  url: string;
  style: 'primary' | 'secondary' | 'outline';
  linkType?: 'url' | 'block' | 'phone' | 'email';
  target?: string;
}

export interface Section {
  id: string;
  type: 'header' | 'hero' | 'features' | 'text' | 'contact' | 'gallery' | 'footer' | 'reviews' | 'news' | 'about' | 'pricing' | 'faq' | 'map' | 'video' | 'partners' | 'banner' | 'steps';
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
  onUpdateSection?: (id: string, updates: Partial<Section>) => void;
}

// --- Helper Components ---

const DragDeviceContext = React.createContext<'desktop' | 'mobile'>('desktop');

const RenderButtons = ({ buttons, settings, section }: { buttons?: SiteButton[], settings: SiteSettings, section?: Section }) => {
  if (!buttons || buttons.length === 0) return null;
  const typographyFont = section?.settings?.typography?.buttonFont;
  
  return (
    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-3">
      {buttons.map((btn) => {
        const href =
          btn.linkType === 'block' && btn.target ? `#${btn.target}` :
          btn.linkType === 'phone' && btn.target ? `tel:${btn.target}` :
          btn.linkType === 'email' && btn.target ? `mailto:${btn.target}` :
          btn.url;
        const baseClass = "w-full flex items-center justify-center px-8 py-3 border text-base font-semibold rounded-xl md:py-4 md:text-lg md:px-10 transition-all shadow-sm ring-1 ring-black/5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2";
        let style: React.CSSProperties = { borderRadius: settings.borderRadius || '0.375rem' }; // Default md (6px)
        let className = baseClass;
        if (typographyFont) style.fontFamily = typographyFont;
        
        if (btn.style === 'primary') {
          className += " text-white border-transparent hover:opacity-95";
          style.backgroundColor = settings.primaryColor;
        } else if (btn.style === 'secondary') {
          className += " text-indigo-700 bg-white/70 backdrop-blur hover:bg-white border-transparent";
          style.color = settings.primaryColor;
          style.backgroundColor = `${settings.primaryColor}20`;
        } else {
          className += " text-indigo-700 bg-white/70 backdrop-blur border-indigo-200 hover:bg-white";
          style.color = settings.primaryColor;
          style.borderColor = settings.primaryColor;
        }
        
        return (
          <div key={btn.id} className="mt-3 sm:mt-0">
            <a href={href} className={className} style={style}>
              {btn.text}
            </a>
          </div>
        );
      })}
    </div>
  );
};

const SectionWrapper = ({ children, section, settings, className = "" }: { children: React.ReactNode, section: Section, settings: SiteSettings, className?: string }) => {
  const style: React.CSSProperties = { fontFamily: section.settings?.typography?.textFont || settings.fontFamily };
  
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

const getSectionEffectsClassName = (section: Section) => {
  const effects = section.settings?.effects;
  if (effects?.enabled === false) return '';
  let className = '';
  if (effects?.animation === 'fade') className += ' cms-anim-fade';
  if (effects?.animation === 'fade-up') className += ' cms-anim-fade-up';
  if (effects?.hoverLift) className += ' cms-hover-lift';
  return className.trim();
};

const getTitleFontFamily = (section: Section, settings: SiteSettings) => {
  return section.settings?.typography?.titleFont || section.settings?.typography?.textFont || settings.fontFamily;
};

const DraggableElement = ({
  section,
  isSelected,
  elementKey,
  onUpdateSection,
  children,
  className,
  style: styleProp
}: {
  section: Section;
  isSelected?: boolean;
  elementKey: string;
  onUpdateSection?: (id: string, updates: Partial<Section>) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const device = React.useContext(DragDeviceContext);
  const canEdit = !!onUpdateSection && !!isSelected;
  const layout = section.settings?.layout || {};
  const positionsByDevice = (layout as any).positionsByDevice || {};
  const devicePositions = positionsByDevice[device];
  const pos =
    (devicePositions && typeof devicePositions === 'object' ? devicePositions[elementKey] : undefined) ||
    (layout as any).positions?.[elementKey] ||
    { x: 0, y: 0 };
  const hasPos = pos.x !== 0 || pos.y !== 0;
  const shouldTransform = hasPos || canEdit;

  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    pointerId: number;
    raf: number | null;
    nextX: number;
    nextY: number;
    moved: boolean;
  } | null>(null);

  const applyUpdate = (x: number, y: number) => {
    if (!onUpdateSection) return;
    const prevLayout = section.settings?.layout || {};
    const prevPositionsByDevice = (prevLayout as any).positionsByDevice || {};
    const prevDevicePositions = prevPositionsByDevice[device] && typeof prevPositionsByDevice[device] === 'object' ? prevPositionsByDevice[device] : {};
    onUpdateSection(section.id, {
      settings: {
        ...(section.settings || {}),
        layout: {
          ...prevLayout,
          positionsByDevice: {
            ...prevPositionsByDevice,
            [device]: {
              ...prevDevicePositions,
              [elementKey]: { x, y }
            }
          },
          positions: device === 'desktop' ? { ...((prevLayout as any).positions || {}), [elementKey]: { x, y } } : (prevLayout as any).positions
        }
      }
    });
  };

  return (
    <div
      className={className}
      draggable={false}
      style={
        shouldTransform
          ? {
              ...(styleProp || {}),
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              cursor: canEdit ? 'grab' : undefined,
              touchAction: canEdit ? 'none' : undefined,
              userSelect: canEdit ? 'none' : undefined,
            }
          : (styleProp || undefined)
      }
      onDragStart={(e) => {
        if (!canEdit) return;
        e.preventDefault();
      }}
      onClickCapture={(e) => {
        const state = dragRef.current;
        if (!canEdit || !state?.moved) return;
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = null;
      }}
      onPointerDown={(e) => {
        if (!canEdit) return;
        e.stopPropagation();
        const current = section.settings?.layout?.positions?.[elementKey] || { x: 0, y: 0 };
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          originX: current.x,
          originY: current.y,
          pointerId: e.pointerId,
          raf: null,
          nextX: current.x,
          nextY: current.y,
          moved: false
        };
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const state = dragRef.current;
        if (!canEdit || !state || state.pointerId !== e.pointerId) return;
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        if (!state.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) state.moved = true;
        state.nextX = Math.round(state.originX + dx);
        state.nextY = Math.round(state.originY + dy);
        if (state.raf) return;
        state.raf = requestAnimationFrame(() => {
          const s = dragRef.current;
          if (!s) return;
          s.raf = null;
          applyUpdate(s.nextX, s.nextY);
        });
      }}
      onPointerUp={(e) => {
        const state = dragRef.current;
        if (!canEdit || !state || state.pointerId !== e.pointerId) return;
        e.stopPropagation();
        if (!state.moved) {
          dragRef.current = null;
        }
      }}
      onPointerCancel={(e) => {
        const state = dragRef.current;
        if (!canEdit || !state || state.pointerId !== e.pointerId) return;
        e.stopPropagation();
        dragRef.current = null;
      }}
    >
      {children}
    </div>
  );
};

// --- Header Sections ---

const HeaderSimple = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <header className="bg-white/80 backdrop-blur border-b border-gray-200/60" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex-shrink-0 flex items-center">
          {section.showTitle !== false && (
            <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
              <span className="font-bold text-xl" style={{ color: settings.primaryColor, fontFamily: getTitleFontFamily(section, settings) }}>{section.title || settings.title}</span>
            </DraggableElement>
          )}
        </div>
        <DraggableElement section={section} isSelected={isSelected} elementKey="nav" onUpdateSection={onUpdateSection} className="hidden md:flex space-x-8">
          {(section.items || []).map((item, i) => (
            <a key={i} href={item.url || '#'} className="text-gray-500 hover:text-gray-900">{item.text || `Menu ${i+1}`}</a>
          ))}
        </DraggableElement>
        <div className="md:hidden">
          <Menu className="h-6 w-6 text-gray-500" />
        </div>
      </div>
    </div>
  </header>
);

const HeaderCentered = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <header className="bg-white/80 backdrop-blur border-b border-gray-200/60" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col items-center">
        {section.showTitle !== false && (
          <div className="flex-shrink-0 mb-4">
            <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
              <span className="font-bold text-2xl" style={{ color: settings.primaryColor, fontFamily: getTitleFontFamily(section, settings) }}>{section.title || settings.title}</span>
            </DraggableElement>
          </div>
        )}
        <DraggableElement section={section} isSelected={isSelected} elementKey="nav" onUpdateSection={onUpdateSection} className="flex space-x-8">
          {(section.items || []).map((item, i) => (
            <a key={i} href={item.url || '#'} className="text-gray-500 hover:text-gray-900 font-medium">{item.text || `Menu ${i+1}`}</a>
          ))}
        </DraggableElement>
      </div>
    </div>
  </header>
);

const HeaderDouble = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur" style={{ fontFamily: settings.fontFamily }}>
    {/* Top Bar */}
    <div className="bg-gray-950 text-white py-2 text-sm">
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
              <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
                <span className="font-bold text-2xl" style={{ color: settings.primaryColor, fontFamily: getTitleFontFamily(section, settings) }}>{section.title || settings.title}</span>
              </DraggableElement>
            )}
          </div>
          <DraggableElement section={section} isSelected={isSelected} elementKey="nav" onUpdateSection={onUpdateSection} className="hidden md:flex space-x-8">
            {(section.items || []).map((item, i) => (
              <a key={i} href={item.url || '#'} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">{item.text || `Menu ${i+1}`}</a>
            ))}
          </DraggableElement>
          <div className="md:hidden">
            <Menu className="h-6 w-6 text-gray-700" />
          </div>
        </div>
      </div>
    </div>
  </header>
);

const HeaderMinimal = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <header className="bg-white/80 backdrop-blur border-b border-gray-200/60" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-14">
        <div className="flex-shrink-0">
           {section.showTitle !== false && (
             <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
               <span className="font-bold text-lg tracking-tighter" style={{ color: settings.primaryColor, fontFamily: getTitleFontFamily(section, settings) }}>{section.title || settings.title}</span>
             </DraggableElement>
           )}
        </div>
        <DraggableElement section={section} isSelected={isSelected} elementKey="nav" onUpdateSection={onUpdateSection} className="hidden md:flex space-x-6">
          {(section.items || []).map((item, i) => (
            <a key={i} href={item.url || '#'} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">{item.text || `Link ${i+1}`}</a>
          ))}
        </DraggableElement>
        <div className="md:hidden">
          <Menu className="h-5 w-5 text-gray-500" />
        </div>
      </div>
    </div>
  </header>
);

// --- Hero Sections ---

const HeroSplit = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-gradient-to-b from-white to-gray-50 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
        <main className="mt-12 mx-auto max-w-7xl px-4 sm:mt-16 sm:px-6 md:mt-20 lg:mt-24 lg:px-8 xl:mt-28">
          <div className="sm:text-center lg:text-left">
            {section.showTitle !== false && (
              <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
                  <span className={`block xl:inline ${section.backgroundImage ? 'text-white' : ''}`}>{section.title || 'Добро пожаловать'}</span>{' '}
                  {section.showSubtitle !== false && (
                    <span className="block text-indigo-600 xl:inline" style={{ color: settings.primaryColor }}>
                      {section.subtitle || 'Создайте что-то удивительное'}
                    </span>
                  )}
                </h1>
              </DraggableElement>
            )}
            {section.showContent !== false && (
              <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
                <p className={`mt-5 text-base sm:text-lg sm:max-w-xl sm:mx-auto md:text-xl lg:mx-0 ${section.backgroundImage ? 'text-gray-100' : 'text-gray-600'}`}>
                  {section.content || 'Начните создавать сайт своей мечты уже сегодня.'}
                </p>
              </DraggableElement>
            )}
            <DraggableElement section={section} isSelected={isSelected} elementKey="buttons" onUpdateSection={onUpdateSection}>
              <RenderButtons buttons={section.buttons} settings={settings} section={section} />
            </DraggableElement>
          </div>
        </main>
      </div>
    </div>
    {!section.backgroundImage && section.showImage !== false && (
      <DraggableElement section={section} isSelected={isSelected} elementKey="image" onUpdateSection={onUpdateSection} className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src={section.image || "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"}
          alt=""
        />
      </DraggableElement>
    )}
  </SectionWrapper>
);

const HeroCenter = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-gradient-to-b from-gray-50 to-white py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      {section.showTitle !== false && (
        <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
            <span className={`block ${section.backgroundImage ? 'text-white' : ''}`}>{section.title || 'Добро пожаловать'}</span>
            {section.showSubtitle !== false && (
              <span className="block text-indigo-600 mt-2" style={{ color: settings.primaryColor }}>
                {section.subtitle || 'Создайте что-то удивительное'}
              </span>
            )}
          </h1>
        </DraggableElement>
      )}
      {section.showContent !== false && (
        <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
          <p className={`mt-6 max-w-2xl mx-auto text-xl ${section.backgroundImage ? 'text-gray-100' : 'text-gray-600'}`}>
            {section.content || 'Начните создавать сайт своей мечты уже сегодня.'}
          </p>
        </DraggableElement>
      )}
      <div className="mt-8 flex justify-center">
        <DraggableElement section={section} isSelected={isSelected} elementKey="buttons" onUpdateSection={onUpdateSection}>
          <RenderButtons buttons={section.buttons} settings={settings} section={section} />
        </DraggableElement>
      </div>
      {!section.backgroundImage && section.image && section.showImage !== false && (
        <DraggableElement section={section} isSelected={isSelected} elementKey="image" onUpdateSection={onUpdateSection} className="mt-12 relative">
          <img
            className="rounded-3xl shadow-2xl ring-1 ring-black/10 mx-auto"
            src={section.image}
            alt="App screenshot"
          />
        </DraggableElement>
      )}
    </div>
  </SectionWrapper>
);

// --- Features Sections ---

const FeaturesGrid = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:text-center mb-12">
        {section.showSubtitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="subtitle" onUpdateSection={onUpdateSection}>
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase" style={{ color: settings.primaryColor }}>
              {section.subtitle || 'Преимущества'}
            </h2>
          </DraggableElement>
        )}
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <p className={`mt-2 text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Наши ключевые преимущества'}
            </p>
          </DraggableElement>
        )}
        {section.showContent !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
            <p className={`mt-4 max-w-2xl text-xl lg:mx-auto ${section.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
              {section.content}
            </p>
          </DraggableElement>
        )}
      </div>

      <div className="mt-10">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(section.items || [1, 2, 3, 4]).map((item, index) => (
            <DraggableElement
              key={item?.id || index}
              section={section}
              isSelected={isSelected}
              elementKey={`item:${item?.id || index}`}
              onUpdateSection={onUpdateSection}
              className="rounded-2xl border border-gray-200/70 bg-white/70 backdrop-blur p-6 shadow-sm"
              style={{ borderRadius: settings.borderRadius || '1rem' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl text-white shadow-sm" style={{ backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius || '0.75rem' }}>
                  <CheckCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className={`text-lg leading-6 font-semibold ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                    {item.title || `Преимущество ${index + 1}`}
                  </p>
                  <p className={`mt-2 text-base ${section.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
                    {item.description || 'Описание преимущества. Здесь вы можете подробно рассказать о том, чем полезен этот пункт.'}
                  </p>
                </div>
              </div>
            </DraggableElement>
          ))}
        </dl>
      </div>
    </div>
  </SectionWrapper>
);

const FeaturesCards = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <div className="text-center mb-12">
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className={`text-3xl font-extrabold ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Почему выбирают нас'}
            </h2>
          </DraggableElement>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {(section.items || [1, 2, 3]).map((item, index) => (
          <DraggableElement
            key={item?.id || index}
            section={section}
            isSelected={isSelected}
            elementKey={`item:${item?.id || index}`}
            onUpdateSection={onUpdateSection}
            className="bg-white/80 backdrop-blur overflow-hidden border border-gray-200/70 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
            style={{ borderRadius: settings.borderRadius || '1rem' }}
          >
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
          </DraggableElement>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

const FeaturesZigZag = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-16 bg-white overflow-hidden">
    <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
      {section.showTitle !== false && (
        <div className="relative mb-12 lg:mb-24 lg:text-center">
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className={`text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Как это работает'}
            </h2>
          </DraggableElement>
          {section.showContent !== false && (
            <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
              <p className={`mt-4 max-w-2xl text-xl lg:mx-auto ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
                {section.content || 'Пошаговый процесс достижения результата.'}
              </p>
            </DraggableElement>
          )}
        </div>
      )}

      <div className="relative">
        {(section.items || [1, 2, 3]).map((item, index) => (
          <div key={item?.id || index} className={`lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:gap-8 lg:items-center ${index > 0 ? 'mt-12 lg:mt-24' : ''}`}>
            <DraggableElement
              section={section}
              isSelected={isSelected}
              elementKey={`item-text:${item?.id || index}`}
              onUpdateSection={onUpdateSection}
              className={index % 2 === 1 ? 'lg:col-start-2' : ''}
            >
              <div>
                <h3 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: getTitleFontFamily(section, settings) }}>
                  {item.title || `Этап ${index + 1}`}
                </h3>
                <p className={`mt-3 text-lg ${section.backgroundImage ? 'text-gray-200' : 'text-gray-500'}`}>
                  {item.description || 'Подробное описание этапа или особенности. Расскажите, как это помогает вашему клиенту.'}
                </p>
              </div>
            </DraggableElement>
            <DraggableElement
              section={section}
              isSelected={isSelected}
              elementKey={`item-image:${item?.id || index}`}
              onUpdateSection={onUpdateSection}
              className={`mt-10 -mx-4 relative lg:mt-0 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}
            >
              <img
                className="relative mx-auto rounded-lg shadow-lg"
                width={490}
                src={item.image || `https://source.unsplash.com/random/490x300?sig=${index}`}
                alt=""
              />
            </DraggableElement>
          </div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- Text Sections ---

const TextSimple = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
    <div className="relative max-w-xl mx-auto">
      <div className="text-center">
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'О нас'}
            </h2>
          </DraggableElement>
        )}
        {section.showContent !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
            <p className={`mt-5 text-lg ${section.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
              {section.content || 'Здесь вы можете разместить любой текстовый контент, статьи или новости вашей компании.'}
            </p>
          </DraggableElement>
        )}
      </div>
      <div className="mt-8 flex justify-center">
        <DraggableElement section={section} isSelected={isSelected} elementKey="buttons" onUpdateSection={onUpdateSection}>
          <RenderButtons buttons={section.buttons} settings={settings} section={section} />
        </DraggableElement>
      </div>
    </div>
  </SectionWrapper>
);

const TextCTA = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between">
      <div
        className="w-full rounded-3xl px-8 py-12 md:px-12 md:py-14 overflow-hidden"
        style={{
          borderRadius: settings.borderRadius || '1.5rem',
          background: `linear-gradient(135deg, ${settings.primaryColor} 0%, #111827 100%)`
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="text-center lg:text-left">
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              <span className="block">{section.title || 'Готовы начать?'}</span>
            </h2>
          </DraggableElement>
        )}
        {section.showContent !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              {section.content || 'Свяжитесь с нами сегодня и получите бесплатную консультацию.'}
            </p>
          </DraggableElement>
        )}
          </div>
          <div className="flex justify-center lg:justify-end">
            <DraggableElement section={section} isSelected={isSelected} elementKey="buttons" onUpdateSection={onUpdateSection}>
              <RenderButtons buttons={section.buttons} settings={settings} section={section} />
            </DraggableElement>
          </div>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

const BannerAnnouncement = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white py-10 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div
        className="rounded-2xl px-6 py-8 md:px-10 md:py-10 overflow-hidden"
        style={{
          borderRadius: settings.borderRadius || '1rem',
          background: `linear-gradient(135deg, ${settings.primaryColor} 0%, #111827 100%)`
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            {section.showTitle !== false && (
              <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
                  {section.title || 'Объявление'}
                </h2>
              </DraggableElement>
            )}
            {section.showContent !== false && (
              <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
                <p className="mt-3 text-base md:text-lg text-white/80">
                  {section.content || 'Добавьте короткое сообщение и кнопку действия.'}
                </p>
              </DraggableElement>
            )}
          </div>
          <div className="md:justify-self-end">
            <DraggableElement section={section} isSelected={isSelected} elementKey="buttons" onUpdateSection={onUpdateSection}>
              <RenderButtons buttons={section.buttons} settings={settings} section={section} />
            </DraggableElement>
          </div>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

const StepsCards = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center">
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-gray-900" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Как это работает'}
            </h2>
          </DraggableElement>
        )}
        {section.showSubtitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="subtitle" onUpdateSection={onUpdateSection}>
            <p className="mt-4 text-lg text-gray-500">
              {section.subtitle || '3 простых шага до результата'}
            </p>
          </DraggableElement>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {((section.items || []).length > 0 ? (section.items || []) : [
          { title: 'Шаг 1', description: 'Опишите, что должен сделать пользователь.' },
          { title: 'Шаг 2', description: 'Добавьте ценность и преимущества.' },
          { title: 'Шаг 3', description: 'Завершите призывом к действию.' }
        ]).map((item: any, idx: number) => (
          <DraggableElement
            key={item.id || idx}
            section={section}
            isSelected={isSelected}
            elementKey={`item:${item.id || idx}`}
            onUpdateSection={onUpdateSection}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            style={{ borderRadius: settings.borderRadius || '1rem' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                style={{
                  borderRadius: settings.borderRadius || '0.75rem',
                  backgroundColor: settings.primaryColor
                }}
              >
                <span className="font-bold">{idx + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title || `Шаг ${idx + 1}`}</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">{item.description || ''}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4" style={{ color: settings.primaryColor }} />
              <span>Готово</span>
            </div>
          </DraggableElement>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <DraggableElement section={section} isSelected={isSelected} elementKey="buttons" onUpdateSection={onUpdateSection}>
          <RenderButtons buttons={section.buttons} settings={settings} section={section} />
        </DraggableElement>
      </div>
    </div>
  </SectionWrapper>
);

// --- Contact Sections ---

const ContactSplit = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => {
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
  <SectionWrapper section={section} settings={settings} className="bg-gradient-to-b from-gray-50 to-white py-20 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      <div>
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${section.backgroundImage ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Свяжитесь с нами'}
            </h2>
          </DraggableElement>
        )}
        {section.showContent !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
            <p className={`mt-5 text-lg ${section.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
              {section.content || 'Мы всегда рады помочь вам. Свяжитесь с нами любым удобным способом.'}
            </p>
          </DraggableElement>
        )}
        <dl className={`mt-10 space-y-4 text-base ${section.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
          {contactItems.map((item: any, idx: number) => (
            <DraggableElement
              key={item?.id || idx}
              section={section}
              isSelected={isSelected}
              elementKey={`item:${item?.id || idx}`}
              onUpdateSection={onUpdateSection}
              className="flex items-center gap-4 rounded-2xl border border-gray-200/70 bg-white/70 backdrop-blur px-5 py-4 shadow-sm"
              style={{ borderRadius: settings.borderRadius || '1rem' }}
            >
              <dt className="sr-only">{item.type === 'phone' ? 'Телефон' : 'Email'}</dt>
              <dd className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ borderRadius: settings.borderRadius || '0.75rem', backgroundColor: settings.primaryColor }}>
                  {item.type === 'phone' ? (
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <span className="font-medium text-gray-900">{item.text}</span>
              </dd>
            </DraggableElement>
          ))}
        </dl>
      </div>
      <DraggableElement
        section={section}
        isSelected={isSelected}
        elementKey="form"
        onUpdateSection={onUpdateSection}
        className="bg-white/80 backdrop-blur py-10 px-6 shadow-sm border border-gray-200/70 sm:px-10"
        style={{ borderRadius: settings.borderRadius || '1rem' }}
      >
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
                    className="block w-full bg-white/70 border border-gray-200 rounded-xl p-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                    style={{ borderRadius: settings.borderRadius || '0.75rem' }} 
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
                    className="block w-full bg-white/70 border border-gray-200 rounded-xl p-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                    style={{ borderRadius: settings.borderRadius || '0.75rem' }} 
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
                    className="block w-full bg-white/70 border border-gray-200 rounded-xl p-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                    style={{ borderRadius: settings.borderRadius || '0.75rem' }}
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
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all" 
                style={{ backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius || '0.75rem' }}
              >
                {status === 'loading' ? 'Отправка...' : 'Отправить сообщение'}
              </button>
            </div>
          </form>
        )}
      </DraggableElement>
    </div>
  </SectionWrapper>
  );
};

// --- Reviews Sections ---

const ReviewsGrid = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <div className="text-center mb-12">
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Отзывы клиентов'}
            </h2>
          </DraggableElement>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {(section.items || [1, 2, 3]).map((item, i) => (
          <DraggableElement
            key={item?.id || i}
            section={section}
            isSelected={isSelected}
            elementKey={`item:${item?.id || i}`}
            onUpdateSection={onUpdateSection}
            className="bg-white/80 backdrop-blur p-7 shadow-sm border border-gray-200/70"
            style={{ borderRadius: settings.borderRadius || '1rem' }}
          >
             <div className="flex items-center mb-4">
               <div className="h-11 w-11 flex items-center justify-center text-gray-600 font-bold overflow-hidden ring-1 ring-black/5" style={{ borderRadius: settings.borderRadius || '0.75rem' }}>
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
             <p className="text-gray-700 italic leading-relaxed">“{item.text || 'Отличный сервис! Очень доволен результатом.'}”</p>
          </DraggableElement>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

const ReviewsSlider = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-white">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-10" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Что говорят о нас'}
            </h2>
          </DraggableElement>
        )}
        <div className="flex overflow-x-auto space-x-6 pb-4 snap-x">
          {(section.items || [1, 2, 3, 4]).map((item, i) => (
            <DraggableElement
              key={item?.id || i}
              section={section}
              isSelected={isSelected}
              elementKey={`item:${item?.id || i}`}
              onUpdateSection={onUpdateSection}
              className="snap-center flex-shrink-0 w-80 bg-white/80 backdrop-blur p-8 rounded-2xl flex flex-col justify-between border border-gray-200/70 shadow-sm"
              style={{ borderRadius: settings.borderRadius || '1rem' }}
            >
               <div>
                 <div className="flex text-yellow-400 mb-4">
                   {[...Array(5)].map((_, star) => (
                     <span key={star} className={star < (item.rating || 5) ? "text-yellow-400" : "text-gray-300"}>★</span>
                   ))}
                 </div>
                 <p className="text-lg text-gray-700 mb-6 italic leading-relaxed">“{item.text || 'Профессиональный подход и качественная работа.'}”</p>
               </div>
               <div className="flex items-center mt-auto">
                 <div className="h-11 w-11 bg-gray-200 flex items-center justify-center text-gray-600 font-bold overflow-hidden mr-3 ring-1 ring-black/5" style={{ borderRadius: settings.borderRadius || '0.75rem' }}>
                   {item.image ? (
                     <img src={item.image} alt={item.author} className="h-full w-full object-cover" />
                   ) : (
                     item.author ? item.author[0] : 'U'
                   )}
                 </div>
                 <p className="font-bold text-gray-900">{item.author || 'Клиент Компании'}</p>
               </div>
            </DraggableElement>
          ))}
        </div>
     </div>
  </SectionWrapper>
);

// --- Gallery Sections ---

const GalleryGrid = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Наша Галерея'}
            </h2>
          </DraggableElement>
        )}
        {section.showSubtitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="subtitle" onUpdateSection={onUpdateSection}>
            <p className="mt-4 text-gray-600">{section.subtitle || 'Посмотрите наши лучшие работы'}</p>
          </DraggableElement>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(section.items || [1, 2, 3, 4, 5, 6]).map((item, i) => (
          <DraggableElement
            key={item?.id || i}
            section={section}
            isSelected={isSelected}
            elementKey={`item:${item?.id || i}`}
            onUpdateSection={onUpdateSection}
            className="relative aspect-w-1 aspect-h-1 group overflow-hidden bg-gray-100 border border-gray-200/70 shadow-sm"
            style={{ borderRadius: settings.borderRadius || '1rem' }}
          >
             <img 
               src={item.image || `https://source.unsplash.com/random/800x600?sig=${i}`} 
               alt="" 
               className="object-cover w-full h-full transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-90"
             />
          </DraggableElement>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

const GalleryMasonry = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       {section.showTitle !== false && (
         <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
           <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-10 text-center" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
             {section.title || 'Портфолио'}
           </h2>
         </DraggableElement>
       )}
       <div className="columns-1 md:columns-3 gap-4 space-y-4">
         {(section.items || [1, 2, 3, 4, 5, 6]).map((item, i) => (
           <DraggableElement
             key={item?.id || i}
             section={section}
             isSelected={isSelected}
             elementKey={`item:${item?.id || i}`}
             onUpdateSection={onUpdateSection}
             className="break-inside-avoid overflow-hidden border border-gray-200/70 bg-white shadow-sm"
             style={{ borderRadius: settings.borderRadius || '1rem' }}
           >
             <img 
               src={item.image || `https://source.unsplash.com/random/600x${400 + (i % 3) * 200}?sig=${i}`} 
               alt="" 
               className="w-full h-auto"
             />
           </DraggableElement>
         ))}
       </div>
    </div>
  </SectionWrapper>
);

// --- News Sections ---

const NewsList = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-white">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       {section.showTitle !== false && (
         <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
           <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-10" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
             {section.title || 'Последние новости'}
           </h2>
         </DraggableElement>
       )}
       <div className="space-y-8">
         {(section.items || [1, 2, 3]).map((item, i) => (
           <DraggableElement
             key={item?.id || i}
             section={section}
             isSelected={isSelected}
             elementKey={`item:${item?.id || i}`}
             onUpdateSection={onUpdateSection}
             className="flex flex-col md:flex-row gap-6 border border-gray-200/70 bg-white/80 backdrop-blur p-5 shadow-sm"
             style={{ borderRadius: settings.borderRadius || '1rem' }}
           >
              <div className="md:w-1/3">
                 <img src={item.image || `https://source.unsplash.com/random/400x300?sig=${i+10}`} className="w-full h-48 object-cover ring-1 ring-black/5" style={{ borderRadius: settings.borderRadius || '0.75rem' }} alt="" />
              </div>
              <div className="md:w-2/3">
                 <span className="text-sm font-semibold" style={{ color: settings.primaryColor }}>{item.date || '01.01.2024'}</span>
                 <h3 className="text-xl font-extrabold text-gray-900 mt-2 tracking-tight">{item.title || 'Заголовок новости'}</h3>
                 <p className="mt-3 text-gray-600">{item.excerpt || 'Краткое описание новости. Здесь можно рассказать о последних событиях вашей компании или индустрии.'}</p>
                 <a href="#" className="mt-4 inline-flex items-center font-semibold" style={{ color: settings.primaryColor }}>Читать далее →</a>
              </div>
           </DraggableElement>
         ))}
       </div>
     </div>
  </SectionWrapper>
);

const NewsCards = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-12 text-center" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
            {section.title || 'Блог'}
          </h2>
        </DraggableElement>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(section.items || [1, 2, 3]).map((item, i) => (
          <DraggableElement
            key={item?.id || i}
            section={section}
            isSelected={isSelected}
            elementKey={`item:${item?.id || i}`}
            onUpdateSection={onUpdateSection}
            className="bg-white/80 backdrop-blur border border-gray-200/70 overflow-hidden shadow-sm hover:shadow-md transition-all"
            style={{ borderRadius: settings.borderRadius || '1rem' }}
          >
             <img src={item.image || `https://source.unsplash.com/random/400x250?sig=${i+20}`} className="w-full h-48 object-cover" alt="" />
             <div className="p-6">
                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: settings.primaryColor }}>{item.category || 'Новости'}</span>
                <h3 className="text-lg font-extrabold text-gray-900 mt-2 tracking-tight">{item.title || 'Интересная статья'}</h3>
                <p className="mt-3 text-gray-600 text-sm line-clamp-3">{item.excerpt || 'Краткое содержание статьи. Полезная информация для ваших клиентов и партнеров.'}</p>
             </div>
          </DraggableElement>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- About Sections ---

const AboutSimple = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div>
             {section.showTitle !== false && (
               <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
                 <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
                   {section.title || 'О нашей компании'}
                 </h2>
               </DraggableElement>
             )}
             {section.showContent !== false && (
               <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
                 <p className="mt-5 text-lg text-gray-600 leading-relaxed">{section.content || 'Мы занимаемся созданием лучших решений для вашего бизнеса уже более 10 лет. Наша миссия - помогать клиентам достигать успеха.'}</p>
               </DraggableElement>
             )}
             <div className="mt-8">
               <DraggableElement section={section} isSelected={isSelected} elementKey="buttons" onUpdateSection={onUpdateSection}>
                 <RenderButtons buttons={section.buttons} settings={settings} section={section} />
               </DraggableElement>
             </div>
          </div>
          {section.showImage !== false && (
            <div className="mt-10 lg:mt-0">
               <DraggableElement section={section} isSelected={isSelected} elementKey="image" onUpdateSection={onUpdateSection}>
                 <img 
                   src={section.image || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"} 
                   className="shadow-2xl ring-1 ring-black/10 object-cover" 
                   style={{ borderRadius: settings.borderRadius || '1.25rem' }}
                   alt="" 
                 />
               </DraggableElement>
            </div>
          )}
       </div>
    </div>
  </SectionWrapper>
);

const AboutStats = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20" >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        className="rounded-3xl px-8 py-14 md:px-12 overflow-hidden"
        style={{
          borderRadius: settings.borderRadius || '1.5rem',
          background: `linear-gradient(135deg, ${settings.primaryColor} 0%, #111827 100%)`
        }}
      >
        {section.showTitle !== false && (
          <div className="text-center mb-10">
            <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
              <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
                {section.title || 'Мы в цифрах'}
              </h2>
            </DraggableElement>
          </div>
        )}
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {(section.items || [
            { label: 'Клиентов', value: '1000+' },
            { label: 'Проектов', value: '500+' },
            { label: 'Лет опыта', value: '10+' }
          ]).map((item, i) => (
            <DraggableElement
              key={item?.id || i}
              section={section}
              isSelected={isSelected}
              elementKey={`item:${item?.id || i}`}
              onUpdateSection={onUpdateSection}
              className="flex flex-col bg-white/10 p-8 text-center backdrop-blur-sm border border-white/10 shadow-sm"
              style={{ borderRadius: settings.borderRadius || '1rem' }}
            >
              <dt className="order-2 mt-3 text-sm font-semibold tracking-wide text-white/70 uppercase">{item.label}</dt>
              <dd className="order-1 text-5xl font-extrabold text-white">{item.value}</dd>
            </DraggableElement>
          ))}
        </dl>
      </div>
    </div>
  </SectionWrapper>
);

const AboutTeam = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="space-y-12">
        {section.showTitle !== false && (
          <div className="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl">
            <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
                {section.title || 'Наша команда'}
              </h2>
            </DraggableElement>
            {section.showContent !== false && (
              <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
                <p className="text-xl text-gray-600">
                  {section.content || 'Познакомьтесь с талантливыми людьми, которые работают над вашим проектом.'}
                </p>
              </DraggableElement>
            )}
          </div>
        )}
        <ul className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:max-w-5xl">
          {(section.items || [1, 2, 3]).map((person, i) => (
            <li key={person?.id || i}>
              <DraggableElement
                section={section}
                isSelected={isSelected}
                elementKey={`item:${person?.id || i}`}
                onUpdateSection={onUpdateSection}
                className="bg-white/80 backdrop-blur border border-gray-200/70 shadow-sm p-7"
                style={{ borderRadius: settings.borderRadius || '1rem' }}
              >
                <div className="space-y-5">
                  <img className="mx-auto h-40 w-40 object-cover ring-1 ring-black/10" style={{ borderRadius: settings.borderRadius || '9999px' }} src={person.image || `https://source.unsplash.com/random/200x200?sig=${i+50}`} alt="" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-gray-900">{person.name || 'Имя Фамилия'}</h3>
                    <p className="font-semibold" style={{ color: settings.primaryColor }}>{person.role || 'Должность'}</p>
                  </div>
                </div>
              </DraggableElement>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </SectionWrapper>
);

// --- Pricing Sections ---

const PricingThreeCol = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:flex-col sm:align-center">
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-center" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Наши тарифы'}
            </h1>
          </DraggableElement>
        )}
        {section.showContent !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
            <p className="mt-5 text-xl text-gray-600 sm:text-center">
              {section.content || 'Выберите план, который подходит именно вам.'}
            </p>
          </DraggableElement>
        )}
      </div>
      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
        {(section.items || [1, 2, 3]).map((item, i) => (
          <DraggableElement
            key={item?.id || i}
            section={section}
            isSelected={isSelected}
            elementKey={`item:${item?.id || i}`}
            onUpdateSection={onUpdateSection}
            className={`border border-gray-200/70 rounded-2xl shadow-sm bg-white/80 backdrop-blur ${item.isPopular ? 'ring-2 relative' : ''}`}
            style={item.isPopular ? { borderRadius: settings.borderRadius || '1rem', borderColor: `${settings.primaryColor}55`, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', outline: 'none', } : { borderRadius: settings.borderRadius || '1rem' }}
          >
            {item.isPopular && (
              <span className="absolute top-0 right-0 -mt-3 mr-3 px-3 py-1 text-xs font-bold text-white rounded-full shadow-sm" style={{ backgroundColor: settings.primaryColor }}>
                Популярный
              </span>
            )}
            <div className="p-6">
              <h2 className="text-lg leading-6 font-extrabold text-gray-900">{item.title || 'Тариф'}</h2>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">{item.price || '0 ₽'}</span>
                <span className="text-base font-medium text-gray-500">/мес</span>
              </p>
              <a
                href="#"
                className="mt-8 block w-full py-3 px-6 border border-transparent rounded-xl text-center font-semibold transition-all shadow-sm hover:shadow-md"
                style={{
                  borderRadius: settings.borderRadius || '0.75rem',
                  backgroundColor: item.isPopular ? settings.primaryColor : `${settings.primaryColor}14`,
                  color: item.isPopular ? '#fff' : settings.primaryColor
                }}
              >
                {item.buttonText || 'Выбрать'}
              </a>
            </div>
            <div className="pt-6 pb-8 px-6 border-t border-gray-200/70">
              <h3 className="text-xs font-extrabold text-gray-900 tracking-wide uppercase">Что включено</h3>
              <ul className="mt-6 space-y-4">
                {(item.features ? item.features.split(',') : ['Опция 1', 'Опция 2', 'Опция 3']).map((feature: string, idx: number) => (
                  <li key={idx} className="flex space-x-3">
                    <CheckCircle className="flex-shrink-0 h-5 w-5" aria-hidden="true" style={{ color: settings.primaryColor }} />
                    <span className="text-sm text-gray-600">{feature.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </DraggableElement>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- FAQ Sections ---

const FAQAccordion = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {section.showTitle !== false && (
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl mb-8" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Частые вопросы'}
            </h2>
          </DraggableElement>
        )}
        <dl className="mt-6 space-y-4">
          {(section.items || [1, 2, 3]).map((item, i) => (
            <DraggableElement
              key={item?.id || i}
              section={section}
              isSelected={isSelected}
              elementKey={`item:${item?.id || i}`}
              onUpdateSection={onUpdateSection}
              className="border border-gray-200/70 bg-white/80 backdrop-blur shadow-sm px-5 py-4"
              style={{ borderRadius: settings.borderRadius || '1rem' }}
            >
              <details className="group">
                <summary className="text-lg font-extrabold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {item.question || 'Какой-то вопрос?'}
                  <span className="ml-6 flex-shrink-0 transition-transform group-open:-rotate-180">
                    <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-base text-gray-600 pr-12 leading-relaxed">
                  {item.answer || 'Ответ на этот вопрос. Здесь может быть подробное объяснение.'}
                </p>
              </details>
            </DraggableElement>
          ))}
        </dl>
      </div>
    </div>
  </SectionWrapper>
);

// --- New Sections (Map, Video, Partners) ---

const MapEmbed = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <DraggableElement
      section={section}
      isSelected={isSelected}
      elementKey="map"
      onUpdateSection={onUpdateSection}
      className="w-full h-96 bg-gray-200 relative overflow-hidden ring-1 ring-black/10"
      style={{ borderRadius: settings.borderRadius || '1rem' }}
    >
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
        <DraggableElement
          section={section}
          isSelected={isSelected}
          elementKey="title"
          onUpdateSection={onUpdateSection}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur p-5 shadow-sm border border-gray-200/70 max-w-xs"
          style={{ borderRadius: settings.borderRadius || '1rem' }}
        >
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: getTitleFontFamily(section, settings) }}>{section.title || 'Наш офис'}</h3>
            {section.subtitle && <p className="text-sm text-gray-600 mt-1">{section.subtitle}</p>}
          </div>
        </DraggableElement>
      )}
    </DraggableElement>
    </div>
  </SectionWrapper>
);

const VideoSection = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      {section.showTitle !== false && (
        <div className="mb-12">
          <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
              {section.title || 'Видео презентация'}
            </h2>
          </DraggableElement>
          {section.showContent !== false && (
            <DraggableElement section={section} isSelected={isSelected} elementKey="content" onUpdateSection={onUpdateSection}>
              <p className="mt-4 text-xl text-gray-600">{section.content || 'Посмотрите короткое видео о наших возможностях.'}</p>
            </DraggableElement>
          )}
        </div>
      )}
      <DraggableElement
        section={section}
        isSelected={isSelected}
        elementKey="video"
        onUpdateSection={onUpdateSection}
        className="relative aspect-w-16 aspect-h-9 overflow-hidden rounded-3xl shadow-2xl bg-black ring-1 ring-black/10"
        style={{ borderRadius: settings.borderRadius || '1.5rem' }}
      >
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
      </DraggableElement>
    </div>
  </SectionWrapper>
);

const PartnersLogoCloud = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <SectionWrapper section={section} settings={settings} className="bg-white py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {section.showTitle !== false && (
        <DraggableElement section={section} isSelected={isSelected} elementKey="title" onUpdateSection={onUpdateSection}>
          <p className="text-center text-base font-extrabold uppercase text-gray-600 tracking-wider mb-10" style={{ fontFamily: getTitleFontFamily(section, settings) }}>
            {section.title || 'Нам доверяют'}
          </p>
        </DraggableElement>
      )}
      <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
        {(section.items && section.items.length > 0 ? section.items : Array(5).fill({})).map((item, i) => (
          <DraggableElement
            key={item?.id || i}
            section={section}
            isSelected={isSelected}
            elementKey={`item:${item?.id || i}`}
            onUpdateSection={onUpdateSection}
            className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            {item.image ? (
              <img className="h-12 object-contain" src={item.image} alt={item.title || "Partner"} />
            ) : (
              <div className="h-12 w-32 bg-gray-100 border border-gray-200/70 rounded-xl flex items-center justify-center text-gray-400 font-extrabold">LOGO</div>
            )}
          </DraggableElement>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

// --- Footer Sections ---

const FooterSimple = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <footer className="bg-gray-950 text-white py-14" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <DraggableElement section={section} isSelected={isSelected} elementKey="social" onUpdateSection={onUpdateSection} className="flex justify-center space-x-6 md:order-2">
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
        </DraggableElement>
        <div className="mt-8 md:mt-0 md:order-1">
          <DraggableElement section={section} isSelected={isSelected} elementKey="copyright" onUpdateSection={onUpdateSection}>
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} {section.showTitle !== false && (section.title || settings.title)}. Все права защищены.
            </p>
          </DraggableElement>
        </div>
      </div>
    </div>
  </footer>
);

const FooterColumns = ({ section, settings, isSelected, onUpdateSection }: SectionProps) => (
  <footer className="bg-gray-950 text-white py-20" style={{ fontFamily: settings.fontFamily }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <DraggableElement section={section} isSelected={isSelected} elementKey="col:company" onUpdateSection={onUpdateSection}>
          <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Компания</h3>
           <ul className="space-y-4">
             <li><a href="#" className="text-base text-gray-300 hover:text-white">О нас</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Блог</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Карьера</a></li>
           </ul>
          </div>
        </DraggableElement>
        <DraggableElement section={section} isSelected={isSelected} elementKey="col:support" onUpdateSection={onUpdateSection}>
          <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Поддержка</h3>
           <ul className="space-y-4">
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Помощь</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Контакты</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">FAQ</a></li>
           </ul>
          </div>
        </DraggableElement>
        <DraggableElement section={section} isSelected={isSelected} elementKey="col:legal" onUpdateSection={onUpdateSection}>
          <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Юридическая инфо</h3>
           <ul className="space-y-4">
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Конфиденциальность</a></li>
             <li><a href="#" className="text-base text-gray-300 hover:text-white">Условия</a></li>
           </ul>
          </div>
        </DraggableElement>
        <DraggableElement section={section} isSelected={isSelected} elementKey="col:subscribe" onUpdateSection={onUpdateSection}>
          <div>
           <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Подписка</h3>
           <p className="text-base text-gray-300 mb-4">Подпишитесь на наши новости.</p>
           <div className="flex">
             <input type="email" placeholder="Email" className="bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none w-full" />
             <button className="bg-indigo-600 px-4 py-2 rounded-r-md hover:bg-indigo-700">OK</button>
           </div>
          </div>
        </DraggableElement>
      </div>
      <div className="mt-12 border-t border-gray-700 pt-8">
        <DraggableElement section={section} isSelected={isSelected} elementKey="copyright" onUpdateSection={onUpdateSection}>
          <p className="text-base text-gray-400 text-center">&copy; {new Date().getFullYear()} {section.showTitle !== false && (section.title || settings.title)}. Все права защищены.</p>
        </DraggableElement>
      </div>
    </div>
  </footer>
);

// --- Main Renderer ---

interface SiteRendererProps {
  settings: SiteSettings;
  selectedSectionId?: string | null;
  onSelectSection?: (id: string) => void;
  onUpdateSection?: (id: string, updates: Partial<Section>) => void;
  device?: 'desktop' | 'mobile';
}

export const SiteRenderer = ({ settings, selectedSectionId, onSelectSection, onUpdateSection, device = 'desktop' }: SiteRendererProps) => {
  if (!settings || !settings.sections) {
    return <div className="p-10 text-center text-gray-500">Нет контента для отображения</div>;
  }

  const renderSection = (section: Section) => {
    const isSelected = selectedSectionId === section.id;
    const commonProps = {
      key: section.id,
      section,
      settings,
      isSelected,
      onClick: () => onSelectSection && onSelectSection(section.id),
      onUpdateSection
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
      case 'banner':
        Component = BannerAnnouncement;
        break;
      case 'steps':
        Component = StepsCards;
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
      banner: 'Баннер',
      steps: 'Шаги',
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
        id={section.id}
        onClick={() => onSelectSection && onSelectSection(section.id)}
        className={`relative transition-all duration-200 border-2 ${isSelected ? 'border-indigo-600 shadow-lg z-10' : 'border-transparent hover:border-indigo-300 hover:border-dashed'} ${getSectionEffectsClassName(section)}`}
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
    <DragDeviceContext.Provider value={device}>
      <div className="min-h-screen bg-white">
        {settings.sections.map((section) => renderSection(section))}
      </div>
    </DragDeviceContext.Provider>
  );
};

export default SiteRenderer;
