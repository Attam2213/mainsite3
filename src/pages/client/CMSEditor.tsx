import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Save, 
  ArrowLeft, 
  Monitor, 
  Layout, 
  Type, 
  Image as ImageIcon,
  Plus,
  Trash2,
  Settings,
  Palette,
  Layers,
  MessageSquare,
  Grid,
  GripVertical,
  Eye,
  EyeOff,
  MapPin
} from 'lucide-react';
import { SiteRenderer, SiteSettings, Section, SiteButton } from '../../components/cms/SiteRenderer';
import { FileUpload } from '../../components/common/FileUpload';

const SectionPreview = ({ type, variant, label }: { type: any, variant: string, label: string }) => {
  // Create dummy section for preview
  const dummySection: Section = {
    id: 'preview',
    type,
    variant,
    title: label,
    subtitle: 'Предпросмотр секции',
    content: 'Это пример того, как будет выглядеть данная секция на вашем сайте.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
    buttons: [{ id: 'btn-prev', text: 'Действие', url: '#', style: 'primary' }],
    items: [
       { title: 'Элемент 1', description: 'Описание элемента', author: 'Имя', text: 'Текст отзыва', rating: 5, image: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&w=100&q=80', date: '01.01.2024', label: 'Инфо', value: '100' },
       { title: 'Элемент 2', description: 'Описание элемента', author: 'Имя', text: 'Текст отзыва', rating: 5, image: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&w=100&q=80', date: '01.01.2024', label: 'Инфо', value: '100' },
       { title: 'Элемент 3', description: 'Описание элемента', author: 'Имя', text: 'Текст отзыва', rating: 5, image: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&w=100&q=80', date: '01.01.2024', label: 'Инфо', value: '100' }
    ]
  };

  const dummySettings: SiteSettings = {
    title: 'Preview',
    description: '',
    primaryColor: '#4F46E5',
    fontFamily: 'sans-serif',
    sections: [dummySection]
  };

  return (
    <div className="w-full aspect-video bg-white overflow-hidden relative border border-gray-200 rounded-lg group hover:border-indigo-500 hover:shadow-md transition-all">
      <div className="absolute inset-0 pointer-events-none transform origin-top-left scale-[0.25] w-[400%] h-[400%] bg-white">
         <SiteRenderer settings={dummySettings} />
      </div>
      {/* Overlay to catch clicks but allow seeing content */}
      <div className="absolute inset-0 bg-transparent" />
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-2 border-t border-gray-100 backdrop-blur-sm z-10">
        <span className="text-xs font-medium text-gray-700 block text-center truncate">{label}</span>
      </div>
    </div>
  );
};

// Define available section templates
const SECTION_TEMPLATES = [
  {
    category: 'Шапка',
    items: [
      { type: 'header', variant: 'simple', label: 'Простая шапка', icon: Layout },
      { type: 'header', variant: 'centered', label: 'По центру', icon: Layout },
      { type: 'header', variant: 'double', label: 'Двойная шапка', icon: Layout },
      { type: 'header', variant: 'minimal', label: 'Минималистичная', icon: Layout },
    ]
  },
  {
    category: 'Главный экран',
    items: [
      { type: 'hero', variant: 'split', label: 'С изображением сбоку', icon: ImageIcon },
      { type: 'hero', variant: 'center', label: 'По центру', icon: ImageIcon },
    ]
  },
  {
    category: 'Преимущества',
    items: [
      { type: 'features', variant: 'grid', label: 'Сетка', icon: Grid },
      { type: 'features', variant: 'cards', label: 'Карточки', icon: Grid },
      { type: 'features', variant: 'zigzag', label: 'Шахматный порядок', icon: Grid },
    ]
  },
  {
    category: 'Контент',
    items: [
      { type: 'text', variant: 'simple', label: 'Текст', icon: Type },
      { type: 'text', variant: 'cta', label: 'Призыв к действию', icon: MessageSquare },
      { type: 'about', variant: 'simple', label: 'О компании', icon: MessageSquare },
      { type: 'about', variant: 'stats', label: 'Статистика', icon: Grid },
      { type: 'about', variant: 'team', label: 'Команда', icon: Grid },
    ]
  },
  {
    category: 'Галерея',
    items: [
      { type: 'gallery', variant: 'grid', label: 'Сетка', icon: ImageIcon },
      { type: 'gallery', variant: 'masonry', label: 'Masonry', icon: ImageIcon },
    ]
  },
  {
    category: 'Отзывы',
    items: [
      { type: 'reviews', variant: 'grid', label: 'Сетка отзывов', icon: MessageSquare },
      { type: 'reviews', variant: 'slider', label: 'Слайдер отзывов', icon: MessageSquare },
    ]
  },
  {
    category: 'Новости',
    items: [
      { type: 'news', variant: 'list', label: 'Список новостей', icon: Layout },
      { type: 'news', variant: 'cards', label: 'Карточки новостей', icon: Layout },
    ]
  },
  {
    category: 'Цены',
    items: [
      { type: 'pricing', variant: 'three-col', label: '3 колонки', icon: Grid },
    ]
  },
  {
    category: 'FAQ',
    items: [
      { type: 'faq', variant: 'accordion', label: 'Аккордеон', icon: Layout },
    ]
  },
  {
    category: 'Медиа',
    items: [
      { type: 'video', variant: 'simple', label: 'Видео', icon: Monitor },
      { type: 'map', variant: 'simple', label: 'Карта', icon: MapPin },
      { type: 'partners', variant: 'simple', label: 'Логотипы', icon: Grid },
    ]
  },
  {
    category: 'Контакты',
    items: [
      { type: 'contact', variant: 'split', label: 'С формой', icon: MessageSquare },
    ]
  },
  {
    category: 'Подвал',
    items: [
      { type: 'footer', variant: 'simple', label: 'Простой подвал', icon: Layout },
      { type: 'footer', variant: 'columns', label: 'Колонки', icon: Layout },
    ]
  }
];

const CMSEditor = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'sections' | 'design' | 'settings'>('sections');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>({
    title: 'Мой сайт',
    description: '',
    primaryColor: '#4F46E5',
    fontFamily: 'sans-serif',
    sections: []
  });

  useEffect(() => {
    fetchSite();
  }, [siteId]);

  const fetchSite = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        let newSettings: SiteSettings = { ...settings };
        
        if (data.settings) {
          if (data.settings.sections && Array.isArray(data.settings.sections)) {
            // Ensure all items have IDs for DnD
            const sectionsWithIds = data.settings.sections.map((s: any) => ({
              ...s,
              items: (s.items || []).map((item: any, idx: number) => ({
                ...item,
                id: item.id || `item-${s.id}-${idx}-${Date.now()}`
              }))
            }));
            newSettings = { ...newSettings, ...data.settings, sections: sectionsWithIds, id: data.id };
          } else {
            // Migration logic for old format
            const migratedSections: Section[] = [];
            
            if (data.settings.heroTitle) {
              migratedSections.push({
                id: 'hero-1',
                type: 'hero',
                variant: 'split',
                title: data.settings.heroTitle,
                subtitle: data.settings.heroSubtitle,
                content: 'Создайте сайт своей мечты уже сегодня.'
              });
            }
            
            // Add default features if migration
            migratedSections.push({
              id: 'features-1',
              type: 'features',
              variant: 'grid',
              title: 'Наши преимущества',
              content: 'Узнайте, что делает нас особенными.',
              items: [
                { id: 'item-mig-1', title: 'Быстро', description: 'Молниеносная скорость работы' },
                { id: 'item-mig-2', title: 'Безопасно', description: 'Высокий уровень защиты' },
                { id: 'item-mig-3', title: 'Надежно', description: 'Гарантия аптайма 99.9%' }
              ]
            });
            
            newSettings = {
              ...newSettings,
              title: data.settings.title || data.domain || 'Мой сайт',
              primaryColor: data.settings.primaryColor || '#4F46E5',
              sections: migratedSections,
              id: data.id
            };
          }
        }
        setSettings(newSettings);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching site:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });

      if (res.ok) {
        alert('Изменения успешно сохранены!');
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: any, variant: string) => {
    const id = `section-${Date.now()}`;
    let newSection: Section = {
      id,
      type,
      variant,
      title: 'Новая секция',
      content: 'Редактируйте этот контент в боковой панели.'
    };

    if (type === 'features') {
      newSection.items = [
        { title: 'Преимущество 1', description: 'Описание 1' },
        { title: 'Преимущество 2', description: 'Описание 2' },
        { title: 'Преимущество 3', description: 'Описание 3' }
      ];
    }
    
    if (type === 'reviews') {
        newSection.title = 'Отзывы клиентов';
        newSection.items = [
            { author: 'Иван Иванов', text: 'Отличный сервис, всем рекомендую!', rating: 5 },
            { author: 'Петр Петров', text: 'Быстро и качественно.', rating: 5 },
            { author: 'Мария Сидорова', text: 'Профессиональный подход.', rating: 4 }
        ];
    }

    if (type === 'gallery') {
        newSection.title = 'Наша Галерея';
        newSection.items = [
            { image: 'https://source.unsplash.com/random/800x600?sig=1' },
            { image: 'https://source.unsplash.com/random/800x600?sig=2' },
            { image: 'https://source.unsplash.com/random/800x600?sig=3' },
            { image: 'https://source.unsplash.com/random/800x600?sig=4' },
        ];
    }

    if (type === 'news') {
        newSection.title = 'Новости';
        newSection.items = [
            { title: 'Запуск нового продукта', excerpt: 'Мы рады сообщить о запуске...', date: '01.01.2024', image: 'https://source.unsplash.com/random/800x600?sig=5', category: 'Новости' },
            { title: 'Обновление сервиса', excerpt: 'Теперь мы работаем быстрее...', date: '15.01.2024', image: 'https://source.unsplash.com/random/800x600?sig=6', category: 'Обновления' }
        ];
    }

    if (type === 'about' && variant === 'stats') {
        newSection.title = 'Мы в цифрах';
        newSection.items = [
            { label: 'Клиентов', value: '1000+' },
            { label: 'Проектов', value: '500+' },
            { label: 'Лет опыта', value: '10+' }
        ];
    }
    
    if (type === 'header') {
        newSection.title = settings.title;
        newSection.items = [
            { text: 'Главная', url: '#' },
            { text: 'О нас', url: '#' },
            { text: 'Контакты', url: '#' }
        ];
    }
    
    if (type === 'footer') {
        newSection.title = settings.title;
    }

    if (type === 'pricing') {
      newSection.title = 'Наши цены';
      newSection.items = [
        { title: 'Базовый', price: '1000 ₽', features: 'Опция 1, Опция 2, Опция 3', buttonText: 'Выбрать' },
        { title: 'Стандарт', price: '2500 ₽', features: 'Все из Базового, Опция 4, Опция 5', buttonText: 'Выбрать', isPopular: true },
        { title: 'Премиум', price: '5000 ₽', features: 'Все включено, Поддержка 24/7', buttonText: 'Выбрать' }
      ];
    }

    if (type === 'faq') {
      newSection.title = 'Частые вопросы';
      newSection.items = [
        { question: 'Как это работает?', answer: 'Очень просто! Мы делаем все за вас.' },
        { question: 'Сколько это стоит?', answer: 'У нас гибкие тарифы под любой бюджет.' },
        { question: 'Есть ли гарантии?', answer: 'Да, мы гарантируем качество наших услуг.' }
      ];
    }

    if (type === 'about' && variant === 'team') {
      newSection.title = 'Наша команда';
      newSection.items = [
        { name: 'Алексей', role: 'CEO', image: 'https://source.unsplash.com/random/200x200?sig=team1' },
        { name: 'Мария', role: 'Дизайнер', image: 'https://source.unsplash.com/random/200x200?sig=team2' },
        { name: 'Дмитрий', role: 'Разработчик', image: 'https://source.unsplash.com/random/200x200?sig=team3' }
      ];
    }
    
    if (type === 'text' && variant === 'cta') {
      newSection.title = 'Готовы начать?';
      newSection.content = 'Свяжитесь с нами сегодня и получите бесплатную консультацию.';
      newSection.buttons = [{ id: 'cta-btn', text: 'Связаться', url: '#', style: 'primary' }];
    }

    if (type === 'video') {
      newSection.title = 'Видео презентация';
      newSection.content = 'Посмотрите короткое видео о наших возможностях.';
      newSection.image = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Default Rick Roll as placeholder :)
    }

    if (type === 'map') {
      newSection.title = 'Как нас найти';
      newSection.content = 'https://www.google.com/maps/embed?pb=...';
    }

    if (type === 'partners') {
      newSection.title = 'Нам доверяют';
      newSection.items = [
        { title: 'Partner 1', image: '' },
        { title: 'Partner 2', image: '' },
        { title: 'Partner 3', image: '' },
        { title: 'Partner 4', image: '' },
        { title: 'Partner 5', image: '' }
      ];
    }

    // Ensure IDs for all items
    if (newSection.items) {
      newSection.items = newSection.items.map((item, idx) => ({
        ...item,
        id: `item-${id}-${idx}-${Date.now()}`
      }));
    }

    setSettings({
      ...settings,
      sections: [...settings.sections, newSection]
    });
    setSelectedSectionId(id);
    setShowAddSection(false);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const removeSection = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту секцию?')) {
      setSettings({
        ...settings,
        sections: settings.sections.filter(s => s.id !== id)
      });
      if (selectedSectionId === id) setSelectedSectionId(null);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(settings.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSettings({
      ...settings,
      sections: items
    });
  };

  const onDragEndItems = (result: DropResult) => {
    if (!result.destination || !selectedSectionId) return;

    const section = settings.sections.find(s => s.id === selectedSectionId);
    if (!section || !section.items) return;

    const items = Array.from(section.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateSection(selectedSectionId, { items });
  };

  // Button management helpers
  const addButton = (sectionId: string) => {
    const section = settings.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newButtons = [
      ...(section.buttons || []),
      { id: `btn-${Date.now()}`, text: 'Кнопка', url: '#', style: 'primary' as const }
    ];
    updateSection(sectionId, { buttons: newButtons });
  };

  const updateButton = (sectionId: string, buttonId: string, updates: Partial<SiteButton>) => {
    const section = settings.sections.find(s => s.id === sectionId);
    if (!section || !section.buttons) return;

    const newButtons = section.buttons.map(b => b.id === buttonId ? { ...b, ...updates } : b);
    updateSection(sectionId, { buttons: newButtons });
  };

  const removeButton = (sectionId: string, buttonId: string) => {
    const section = settings.sections.find(s => s.id === sectionId);
    if (!section || !section.buttons) return;

    const newButtons = section.buttons.filter(b => b.id !== buttonId);
    updateSection(sectionId, { buttons: newButtons });
  };

  // Item management helpers
  const addItem = (sectionId: string) => {
    const section = settings.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const id = `item-${Date.now()}`;
    let newItem: any = { id };
    
    if (section.type === 'header') newItem = { ...newItem, text: 'Новая ссылка', url: '#' };
    if (section.type === 'features') newItem = { ...newItem, title: 'Преимущество', description: 'Описание' };
    if (section.type === 'contact') newItem = { ...newItem, text: '+7 (999) 000-00-00', type: 'phone' };
    if (section.type === 'reviews') newItem = { ...newItem, author: 'Имя Клиента', text: 'Отзыв...', rating: 5 };
    if (section.type === 'gallery') newItem = { ...newItem, image: 'https://source.unsplash.com/random/800x600?sig=' + Date.now() };
    if (section.type === 'news') newItem = { ...newItem, title: 'Новость', excerpt: 'Описание', date: new Date().toLocaleDateString(), category: 'Новости', image: 'https://source.unsplash.com/random/800x600?sig=' + Date.now() };
    if (section.type === 'about' && section.variant === 'stats') newItem = { ...newItem, label: 'Показатель', value: '100' };
    if (section.type === 'about' && section.variant === 'team') newItem = { ...newItem, name: 'Имя', role: 'Должность', image: 'https://source.unsplash.com/random/200x200?sig=' + Date.now() };
    if (section.type === 'pricing') newItem = { ...newItem, title: 'Тариф', price: '0 ₽', features: 'Опции', buttonText: 'Выбрать' };
    if (section.type === 'faq') newItem = { ...newItem, question: 'Вопрос', answer: 'Ответ' };
    
    const newItems = [...(section.items || []), newItem];
    updateSection(sectionId, { items: newItems });
  };

  const updateItem = (sectionId: string, index: number, updates: any) => {
    const section = settings.sections.find(s => s.id === sectionId);
    if (!section || !section.items) return;

    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateSection(sectionId, { items: newItems });
  };

  const removeItem = (sectionId: string, index: number) => {
    const section = settings.sections.find(s => s.id === sectionId);
    if (!section || !section.items) return;

    const newItems = section.items.filter((_, i) => i !== index);
    updateSection(sectionId, { items: newItems });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedSection = settings.sections.find(s => s.id === selectedSectionId);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col border-r border-gray-200 z-10 flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-indigo-700 text-white">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-semibold">Назад в панель</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sections')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              activeTab === 'sections' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="h-4 w-4 mx-auto mb-1" />
            Секции
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              activeTab === 'design' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Palette className="h-4 w-4 mx-auto mb-1" />
            Дизайн
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 mx-auto mb-1" />
            Настройки
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'sections' && (
            <div className="space-y-4">
              {showAddSection ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <button onClick={() => setShowAddSection(false)} className="text-sm text-indigo-600 flex items-center">
                      <ArrowLeft className="h-3 w-3 mr-1" /> Назад
                    </button>
                    <span className="text-sm font-semibold text-gray-700">Добавить секцию</span>
                  </div>
                  
                  <div className="space-y-6">
                    {SECTION_TEMPLATES.map((category, idx) => (
                      <div key={idx}>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category.category}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {category.items.map((item, itemIdx) => (
                            <div 
                              key={itemIdx}
                              onClick={() => addSection(item.type, item.variant)}
                              className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
                            >
                              <SectionPreview type={item.type} variant={item.variant} label={item.label} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedSection ? (
                // Edit Selected Section
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <button onClick={() => setSelectedSectionId(null)} className="text-sm text-indigo-600 flex items-center">
                      <ArrowLeft className="h-3 w-3 mr-1" /> Назад к списку
                    </button>
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                       Редактирование
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Заголовок</label>
                      <button
                        onClick={() => updateSection(selectedSection.id, { showTitle: selectedSection.showTitle === false ? true : false })}
                        className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                        title={selectedSection.showTitle === false ? "Показать" : "Скрыть"}
                      >
                        {selectedSection.showTitle === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={selectedSection.title || ''}
                      onChange={(e) => updateSection(selectedSection.id, { title: e.target.value })}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border ${selectedSection.showTitle === false ? 'opacity-50 bg-gray-50' : ''}`}
                    />
                  </div>
                  
                  {['hero', 'header', 'gallery', 'features', 'reviews', 'news'].includes(selectedSection.type) && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Подзаголовок</label>
                        <button
                          onClick={() => updateSection(selectedSection.id, { showSubtitle: selectedSection.showSubtitle === false ? true : false })}
                          className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                          title={selectedSection.showSubtitle === false ? "Показать" : "Скрыть"}
                        >
                          {selectedSection.showSubtitle === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={selectedSection.subtitle || ''}
                        onChange={(e) => updateSection(selectedSection.id, { subtitle: e.target.value })}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border ${selectedSection.showSubtitle === false ? 'opacity-50 bg-gray-50' : ''}`}
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Содержание</label>
                      <button
                        onClick={() => updateSection(selectedSection.id, { showContent: selectedSection.showContent === false ? true : false })}
                        className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                        title={selectedSection.showContent === false ? "Показать" : "Скрыть"}
                      >
                        {selectedSection.showContent === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={selectedSection.content || ''}
                      onChange={(e) => updateSection(selectedSection.id, { content: e.target.value })}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border ${selectedSection.showContent === false ? 'opacity-50 bg-gray-50' : ''}`}
                    />
                  </div>

                  {/* Main Image */}
                  {['hero', 'about'].includes(selectedSection.type) && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="block text-sm font-medium text-gray-700">Изображение</span>
                        <button
                          onClick={() => updateSection(selectedSection.id, { showImage: selectedSection.showImage === false ? true : false })}
                          className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                          title={selectedSection.showImage === false ? "Показать" : "Скрыть"}
                        >
                          {selectedSection.showImage === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className={selectedSection.showImage === false ? 'opacity-50 grayscale' : ''}>
                        <FileUpload
                          label=""
                          value={selectedSection.image}
                          onChange={(url) => updateSection(selectedSection.id, { image: url })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Video URL */}
                  {selectedSection.type === 'video' && (
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на видео (Embed URL)</label>
                      <input
                        type="text"
                        value={selectedSection.image || ''}
                        onChange={(e) => updateSection(selectedSection.id, { image: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm p-2 border"
                        placeholder="https://www.youtube.com/embed/..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Используйте ссылку для встраивания (Embed), а не обычную ссылку на видео.</p>
                    </div>
                  )}

                  {/* Map URL */}
                  {selectedSection.type === 'map' && (
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на карту (Embed URL)</label>
                      <textarea
                        rows={3}
                        value={selectedSection.content || ''}
                        onChange={(e) => updateSection(selectedSection.id, { content: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm p-2 border"
                        placeholder="https://www.google.com/maps/embed?..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Скопируйте ссылку из Google Maps → Поделиться → Встраивание карт.</p>
                    </div>
                  )}

                  {/* Background Image */}
                  <div className="pt-4 border-t border-gray-100">
                    <FileUpload
                      label="Фоновое изображение"
                      value={selectedSection.backgroundImage}
                      onChange={(url) => updateSection(selectedSection.id, { backgroundImage: url })}
                    />
                  </div>

                  {/* Buttons Editor */}
                  {['hero', 'text', 'about'].includes(selectedSection.type) && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Кнопки</label>
                        <button 
                          onClick={() => addButton(selectedSection.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Добавить
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(selectedSection.buttons || []).map((btn, idx) => (
                          <div key={btn.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                            <div className="flex justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">Кнопка {idx + 1}</span>
                              <button onClick={() => removeButton(selectedSection.id, btn.id)} className="text-red-500">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={btn.text}
                                onChange={(e) => updateButton(selectedSection.id, btn.id, { text: e.target.value })}
                                placeholder="Текст кнопки"
                                className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                              />
                              <input
                                type="text"
                                value={btn.url}
                                onChange={(e) => updateButton(selectedSection.id, btn.id, { url: e.target.value })}
                                placeholder="Ссылка (URL)"
                                className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                              />
                              <select
                                value={btn.style}
                                onChange={(e) => updateButton(selectedSection.id, btn.id, { style: e.target.value as any })}
                                className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                              >
                                <option value="primary">Основная</option>
                                <option value="secondary">Вторичная</option>
                                <option value="outline">Контур</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items Editor */}
                  {['header', 'features', 'contact', 'reviews', 'gallery', 'news', 'about', 'pricing', 'faq'].includes(selectedSection.type) && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Элементы секции
                        </label>
                        <button 
                          onClick={() => addItem(selectedSection.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Добавить
                        </button>
                      </div>
                      
                      <DragDropContext onDragEnd={onDragEndItems}>
                        <Droppable droppableId="items-list">
                          {(provided) => (
                            <div 
                              className="space-y-3"
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              {(selectedSection.items || []).map((item: any, idx: number) => (
                                <Draggable key={item.id || idx} draggableId={item.id || `item-${idx}`} index={idx}>
                                  {(provided, snapshot) => (
                                    <div 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`bg-gray-50 p-3 rounded border ${snapshot.isDragging ? 'border-indigo-500 shadow-lg' : 'border-gray-200'}`}
                                      style={{ ...provided.draggableProps.style }}
                                    >
                                      <div className="flex justify-between mb-2">
                                        <div className="flex items-center">
                                          <div {...provided.dragHandleProps} className="mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                                            <GripVertical className="h-4 w-4" />
                                          </div>
                                          <span className="text-xs font-medium text-gray-500">Элемент {idx + 1}</span>
                                        </div>
                                        <button onClick={() => removeItem(selectedSection.id, idx)} className="text-red-500">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-2">
                              {selectedSection.type === 'header' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { text: e.target.value })}
                                    placeholder="Текст ссылки"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <input
                                    type="text"
                                    value={item.url}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { url: e.target.value })}
                                    placeholder="URL (например, /about)"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                </>
                              )}

                              {selectedSection.type === 'features' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { title: e.target.value })}
                                    placeholder="Заголовок"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.description}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { description: e.target.value })}
                                    placeholder="Описание"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                </>
                              )}

                              {selectedSection.type === 'contact' && (
                                <>
                                  <select
                                     value={item.type}
                                     onChange={(e) => updateItem(selectedSection.id, idx, { type: e.target.value })}
                                     className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  >
                                    <option value="phone">Телефон</option>
                                    <option value="mail">Email</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { text: e.target.value })}
                                    placeholder="Значение"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                </>
                              )}

                              {selectedSection.type === 'reviews' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.author}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { author: e.target.value })}
                                    placeholder="Имя автора"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={item.rating || 5}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { rating: parseInt(e.target.value) })}
                                    placeholder="Рейтинг (1-5)"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.text}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { text: e.target.value })}
                                    placeholder="Текст отзыва"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                </>
                              )}

                              {(selectedSection.type === 'gallery' || selectedSection.type === 'news' || selectedSection.type === 'about' || selectedSection.type === 'reviews' || selectedSection.type === 'partners') && (
                                <div>
                                  <FileUpload
                                    label={selectedSection.type === 'partners' ? 'Логотип' : 'Изображение'}
                                    value={item.image}
                                    onChange={(url) => updateItem(selectedSection.id, idx, { image: url })}
                                  />
                                </div>
                              )}

                              {selectedSection.type === 'news' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { title: e.target.value })}
                                    placeholder="Заголовок новости"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <input
                                    type="text"
                                    value={item.date}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { date: e.target.value })}
                                    placeholder="Дата"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.excerpt}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { excerpt: e.target.value })}
                                    placeholder="Краткое содержание"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                </>
                              )}

                              {selectedSection.type === 'about' && selectedSection.variant === 'stats' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { label: e.target.value })}
                                    placeholder="Подпись (например, Клиентов)"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <input
                                    type="text"
                                    value={item.value}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { value: e.target.value })}
                                    placeholder="Значение (например, 100+)"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                </>
                              )}

                              {selectedSection.type === 'pricing' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { title: e.target.value })}
                                    placeholder="Название тарифа"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <input
                                    type="text"
                                    value={item.price}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { price: e.target.value })}
                                    placeholder="Цена"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.features}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { features: e.target.value })}
                                    placeholder="Особенности (через запятую)"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <input
                                    type="text"
                                    value={item.buttonText}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { buttonText: e.target.value })}
                                    placeholder="Текст кнопки"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <div className="flex items-center mt-1">
                                    <input
                                      type="checkbox"
                                      id={`popular-${idx}`}
                                      checked={item.isPopular || false}
                                      onChange={(e) => updateItem(selectedSection.id, idx, { isPopular: e.target.checked })}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`popular-${idx}`} className="ml-2 block text-xs text-gray-900">
                                      Популярный тариф
                                    </label>
                                  </div>
                                </>
                              )}

                              {selectedSection.type === 'faq' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.question}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { question: e.target.value })}
                                    placeholder="Вопрос"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.answer}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { answer: e.target.value })}
                                    placeholder="Ответ"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                </>
                              )}

                              {selectedSection.type === 'about' && selectedSection.variant === 'team' && (
                                <>
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { name: e.target.value })}
                                    placeholder="Имя"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <input
                                    type="text"
                                    value={item.role}
                                    onChange={(e) => updateItem(selectedSection.id, idx, { role: e.target.value })}
                                    placeholder="Должность"
                                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-xs p-1 border"
                                  />
                                  <div className="mt-2">
                                     <FileUpload
                                       label="Фото"
                                       value={item.image}
                                       onChange={(url) => updateItem(selectedSection.id, idx, { image: url })}
                                     />
                                  </div>
                                </>
                              )}
                            </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => removeSection(selectedSection.id)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить секцию
                    </button>
                  </div>
                </div>
              ) : (
                // List Sections with Drag and Drop
                <>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {settings.sections.map((section, index) => (
                            <Draggable key={section.id} draggableId={section.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center justify-between p-3 bg-white rounded-lg border ${snapshot.isDragging ? 'border-indigo-500 shadow-lg' : 'border-gray-200 hover:border-indigo-300'} cursor-pointer group`}
                                  onClick={() => setSelectedSectionId(section.id)}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  <div className="flex items-center">
                                    <div {...provided.dragHandleProps} className="mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex items-center">
                                      {section.type === 'hero' && <ImageIcon className="h-4 w-4 text-gray-500 mr-2" />}
                                      {section.type === 'text' && <Type className="h-4 w-4 text-gray-500 mr-2" />}
                                      {section.type === 'features' && <Layout className="h-4 w-4 text-gray-500 mr-2" />}
                                      {section.type === 'contact' && <MessageSquare className="h-4 w-4 text-gray-500 mr-2" />}
                                      {section.type === 'header' && <Layout className="h-4 w-4 text-gray-500 mr-2" />}
                                      {section.type === 'footer' && <Layout className="h-4 w-4 text-gray-500 mr-2" />}
                                      <span className="text-sm font-medium text-gray-700 truncate w-32">
                                        {section.title || section.type}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  <div className="pt-4 mt-4">
                    <button 
                      onClick={() => setShowAddSection(true)}
                      className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors text-gray-500"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      <span className="font-medium">Добавить секцию</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Основной цвет</label>
                <div className="grid grid-cols-5 gap-2">
                  {['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#000000'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSettings({ ...settings, primaryColor: color })}
                      className={`w-8 h-8 rounded-full border-2 ${settings.primaryColor === color ? 'border-gray-900 ring-2 ring-gray-300' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input 
                   type="color" 
                   value={settings.primaryColor}
                   onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                   className="mt-2 w-full h-8 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Шрифт</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Скругление углов</label>
                <select
                  value={settings.borderRadius || '0.375rem'}
                  onChange={(e) => setSettings({ ...settings, borderRadius: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="0">Без скругления</option>
                  <option value="0.125rem">Маленькое (2px)</option>
                  <option value="0.375rem">Среднее (6px)</option>
                  <option value="0.75rem">Большое (12px)</option>
                  <option value="1.5rem">Очень большое (24px)</option>
                  <option value="9999px">Полное (круг)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <FileUpload
                  label="Иконка сайта (Favicon)"
                  value={settings.icon}
                  onChange={(url) => setSettings({ ...settings, icon: url })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Название сайта</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Описание (Meta Description)</label>
                <textarea
                  rows={3}
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ключевые слова (Meta Keywords)</label>
                <input
                  type="text"
                  value={settings.metaKeywords || ''}
                  onChange={(e) => setSettings({ ...settings, metaKeywords: e.target.value })}
                  placeholder="сайт, бизнес, услуги"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <FileUpload
                  label="Картинка для соцсетей (OG Image)"
                  value={settings.ogImage}
                  onChange={(url) => setSettings({ ...settings, ogImage: url })}
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Продвинутые настройки</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Код в Header (например, Google Analytics)</label>
                    <textarea
                      rows={4}
                      value={settings.headerCode || ''}
                      onChange={(e) => setSettings({ ...settings, headerCode: e.target.value })}
                      placeholder="<script>...</script>"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Код в Footer (например, чат поддержки)</label>
                    <textarea
                      rows={4}
                      value={settings.footerCode || ''}
                      onChange={(e) => setSettings({ ...settings, footerCode: e.target.value })}
                      placeholder="<script>...</script>"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-200 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center text-sm text-gray-500">
            <Monitor className="h-4 w-4 mr-2" />
            <span>Предпросмотр (ПК)</span>
          </div>
          <a href={`/preview/${siteId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Открыть в новой вкладке
          </a>
        </div>
        
        <div className="flex-1 p-8 flex justify-center">
          <div className="w-full max-w-[1200px] bg-white shadow-2xl overflow-hidden rounded-lg min-h-[calc(100vh-100px)]">
             <SiteRenderer 
               settings={settings} 
               selectedSectionId={selectedSectionId}
               onSelectSection={setSelectedSectionId}
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSEditor;
