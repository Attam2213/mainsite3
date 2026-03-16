export const cmsTemplates = {
  empty: {
    title: 'Пустой сайт',
    description: 'Начните с чистого листа',
    primaryColor: '#4f46e5',
    fontFamily: 'Inter',
    sections: [
      {
        id: 'header-1',
        type: 'header',
        variant: 'simple',
        title: 'Мой сайт',
        showTitle: true,
        items: [
          { id: 'nav-1', text: 'Главная', url: '#' },
          { id: 'nav-2', text: 'О нас', url: '#about' },
          { id: 'nav-3', text: 'Контакты', url: '#contact' }
        ]
      },
      {
        id: 'footer-1',
        type: 'footer',
        variant: 'simple',
        content: '© 2026 Мой сайт. Все права защищены.',
        showContent: true
      }
    ]
  },
  landing: {
    title: 'Лендинг',
    description: 'Продающая страница с высокой конверсией',
    primaryColor: '#2563eb',
    fontFamily: 'Roboto',
    sections: [
      {
        id: 'header-landing',
        type: 'header',
        variant: 'centered',
        title: 'Лендинг',
        showTitle: true,
        items: [
          { id: 'nav-1', text: 'Преимущества', url: '#features' },
          { id: 'nav-2', text: 'Отзывы', url: '#reviews' },
          { id: 'nav-3', text: 'Цены', url: '#pricing' }
        ]
      },
      {
        id: 'hero-landing',
        type: 'hero',
        variant: 'split',
        title: 'Развивайте свой бизнес быстрее',
        showTitle: true,
        subtitle: 'Лучшая платформа для запуска вашего присутствия в интернете за считанные минуты.',
        showSubtitle: true,
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80',
        showImage: true,
        buttons: [
          { id: 'btn-1', text: 'Начать сейчас', url: '#signup', style: 'primary' },
          { id: 'btn-2', text: 'Узнать больше', url: '#features', style: 'outline' }
        ]
      },
      {
        id: 'features-landing',
        type: 'features',
        variant: 'grid',
        title: 'Почему выбирают нас',
        showTitle: true,
        subtitle: 'Всё необходимое для успеха',
        showSubtitle: true,
        items: [
          { id: 'feat-1', title: 'Высокая скорость', content: 'Оптимизировано для максимальной производительности.' },
          { id: 'feat-2', title: 'Безопасность', content: 'Защита корпоративного уровня встроена по умолчанию.' },
          { id: 'feat-3', title: 'Простота использования', content: 'Никакого программирования не требуется.' }
        ]
      },
      {
        id: 'cta-landing',
        type: 'text', // Using text/banner as CTA
        variant: 'centered',
        title: 'Готовы начать?',
        showTitle: true,
        content: 'Присоединяйтесь к тысячам довольных клиентов уже сегодня.',
        showContent: true,
        buttons: [
          { id: 'btn-cta', text: 'Зарегистрироваться', url: '#signup', style: 'primary' }
        ],
        settings: { backgroundColor: '#f3f4f6' }
      },
      {
        id: 'footer-landing',
        type: 'footer',
        variant: 'columns',
        content: '© 2026 Лендинг. Все права защищены.',
        showContent: true
      }
    ]
  },
  business: {
    title: 'Корпоративный сайт',
    description: 'Профессиональный сайт для вашего бизнеса',
    primaryColor: '#0f172a', // Slate-900
    fontFamily: 'Open Sans',
    sections: [
      {
        id: 'header-biz',
        type: 'header',
        variant: 'simple',
        title: 'Компания',
        showTitle: true,
        items: [
          { id: 'nav-1', text: 'Главная', url: '#' },
          { id: 'nav-2', text: 'Услуги', url: '#services' },
          { id: 'nav-3', text: 'О нас', url: '#about' },
          { id: 'nav-4', text: 'Контакты', url: '#contact' }
        ]
      },
      {
        id: 'hero-biz',
        type: 'hero',
        variant: 'centered',
        title: 'Профессиональные решения для вашего бизнеса',
        showTitle: true,
        subtitle: 'Мы предоставляем первоклассные услуги консалтинга и разработки.',
        showSubtitle: true,
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80',
        showImage: true,
        buttons: [
          { id: 'btn-1', text: 'Наши услуги', url: '#services', style: 'primary' }
        ]
      },
      {
        id: 'about-biz',
        type: 'about',
        variant: 'split',
        title: 'О нас',
        showTitle: true,
        content: 'Мы команда опытных профессионалов, стремящихся предоставлять высококачественные решения. С более чем 10-летним опытом работы в отрасли, мы помогаем бизнесу расти и добиваться успеха в цифровую эпоху.',
        showContent: true,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80',
        showImage: true
      },
      {
        id: 'services-biz',
        type: 'features',
        variant: 'cards',
        title: 'Наши услуги',
        showTitle: true,
        items: [
          { id: 'srv-1', title: 'Консалтинг', content: 'Стратегические советы для роста вашего бизнеса.' },
          { id: 'srv-2', title: 'Разработка', content: 'Индивидуальные программные решения.' },
          { id: 'srv-3', title: 'Маркетинг', content: 'Эффективное привлечение целевой аудитории.' }
        ]
      },
      {
        id: 'contact-biz',
        type: 'contact',
        variant: 'split',
        title: 'Свяжитесь с нами',
        showTitle: true,
        subtitle: 'Напишите нашей команде',
        showSubtitle: true,
        content: 'ул. Деловая, 123, Москва\ninfo@company.ru\n+7 (999) 123-45-67',
        showContent: true
      },
      {
        id: 'footer-biz',
        type: 'footer',
        variant: 'simple',
        content: '© 2026 Компания. Все права защищены.',
        showContent: true
      }
    ]
  },
  portfolio: {
    title: 'Портфолио',
    description: 'Для фотографов, дизайнеров и художников',
    primaryColor: '#000000',
    fontFamily: 'Montserrat',
    sections: [
      {
        id: 'header-port',
        type: 'header',
        variant: 'simple',
        title: 'Алексей Дизайнер',
        showTitle: true,
        items: [
          { id: 'nav-1', text: 'Работы', url: '#gallery' },
          { id: 'nav-2', text: 'Обо мне', url: '#about' },
          { id: 'nav-3', text: 'Контакты', url: '#contact' }
        ]
      },
      {
        id: 'hero-port',
        type: 'hero',
        variant: 'centered',
        title: 'Создаю визуальные истории',
        showTitle: true,
        subtitle: 'Фотография, Дизайн, Искусство',
        showSubtitle: true,
        image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80',
        showImage: true,
        buttons: [
          { id: 'btn-1', text: 'Смотреть работы', url: '#gallery', style: 'outline' }
        ]
      },
      {
        id: 'gallery-port',
        type: 'gallery',
        variant: 'grid',
        title: 'Мои работы',
        showTitle: true,
        items: [
          { id: 'img-1', url: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', caption: 'Проект 1' },
          { id: 'img-2', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', caption: 'Проект 2' },
          { id: 'img-3', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', caption: 'Проект 3' },
          { id: 'img-4', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', caption: 'Проект 4' }
        ]
      },
      {
        id: 'about-port',
        type: 'text',
        variant: 'centered',
        title: 'Обо мне',
        showTitle: true,
        content: 'Я увлеченный творец с 5-летним опытом работы в индустрии дизайна. Моя цель - создавать проекты, которые вдохновляют и решают задачи.',
        showContent: true
      },
      {
        id: 'contact-port',
        type: 'contact',
        variant: 'simple',
        title: 'Сотрудничество',
        showTitle: true,
        content: 'Открыт для новых проектов.\nemail@alexdesign.ru',
        showContent: true
      },
      {
        id: 'footer-port',
        type: 'footer',
        variant: 'simple',
        content: '© 2026 Алексей Дизайнер.',
        showContent: true
      }
    ]
  },
  restaurant: {
    title: 'Ресторан',
    description: 'Вкусная еда и уютная атмосфера',
    primaryColor: '#d97706', // Amber-600
    fontFamily: 'Playfair Display',
    sections: [
      {
        id: 'header-rest',
        type: 'header',
        variant: 'centered',
        title: 'La Trattoria',
        showTitle: true,
        items: [
          { id: 'nav-1', text: 'Меню', url: '#menu' },
          { id: 'nav-2', text: 'О нас', url: '#about' },
          { id: 'nav-3', text: 'Бронь', url: '#contact' }
        ]
      },
      {
        id: 'hero-rest',
        type: 'hero',
        variant: 'centered',
        title: 'Истинный вкус Италии',
        showTitle: true,
        subtitle: 'Лучшая паста и пицца в городе',
        showSubtitle: true,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80',
        showImage: true,
        buttons: [
          { id: 'btn-1', text: 'Забронировать столик', url: '#contact', style: 'primary' }
        ]
      },
      {
        id: 'menu-rest',
        type: 'features', // Using features as menu items
        variant: 'cards',
        title: 'Наше меню',
        showTitle: true,
        items: [
          { id: 'menu-1', title: 'Паста Карбонара', content: 'Спагетти, гуанчиале, сыр пекорино, яйцо.' },
          { id: 'menu-2', title: 'Пицца Маргарита', content: 'Томатный соус, моцарелла, базилик.' },
          { id: 'menu-3', title: 'Тирамису', content: 'Классический итальянский десерт.' }
        ]
      },
      {
        id: 'reviews-rest',
        type: 'reviews',
        variant: 'slider',
        title: 'Отзывы гостей',
        showTitle: true,
        items: [
          { id: 'rev-1', author: 'Анна К.', content: 'Потрясающая атмосфера и очень вкусная еда!', rating: 5 },
          { id: 'rev-2', author: 'Михаил Д.', content: 'Лучшая пицца в городе, обязательно приду еще.', rating: 5 }
        ]
      },
      {
        id: 'contact-rest',
        type: 'contact',
        variant: 'split',
        title: 'Контакты и Бронь',
        showTitle: true,
        content: 'ул. Гастрономическая, 5\n+7 (999) 000-00-00\nРаботаем ежедневно с 12:00 до 23:00',
        showContent: true
      },
      {
        id: 'footer-rest',
        type: 'footer',
        variant: 'centered',
        content: '© 2026 La Trattoria.',
        showContent: true
      }
    ]
  },
  blog: {
    title: 'Блог',
    description: 'Делитесь своими мыслями и новостями',
    primaryColor: '#059669', // Emerald-600
    fontFamily: 'Merriweather',
    sections: [
      {
        id: 'header-blog',
        type: 'header',
        variant: 'simple',
        title: 'Мой Блог',
        showTitle: true,
        items: [
          { id: 'nav-1', text: 'Статьи', url: '#news' },
          { id: 'nav-2', text: 'Об авторе', url: '#about' },
          { id: 'nav-3', text: 'Подписаться', url: '#subscribe' }
        ]
      },
      {
        id: 'hero-blog',
        type: 'hero',
        variant: 'split',
        title: 'Добро пожаловать в мой блог',
        showTitle: true,
        subtitle: 'Здесь я пишу о технологиях, путешествиях и жизни.',
        showSubtitle: true,
        image: 'https://images.unsplash.com/photo-1499750310159-52f8f6152133?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80',
        showImage: true
      },
      {
        id: 'news-blog',
        type: 'news',
        variant: 'grid',
        title: 'Последние статьи',
        showTitle: true,
        items: [
          { id: 'news-1', title: 'Путешествие в горы', date: '2026-03-01', content: 'Как я провел выходные в Альпах и что увидел.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60' },
          { id: 'news-2', title: 'Обзор нового гаджета', date: '2026-02-25', content: 'Стоит ли покупать новый смартфон? Мои впечатления.', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60' },
          { id: 'news-3', title: 'Секреты продуктивности', date: '2026-02-20', content: '5 советов, как успевать больше за меньшее время.', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60' }
        ]
      },
      {
        id: 'about-blog',
        type: 'text',
        variant: 'centered',
        title: 'Об авторе',
        showTitle: true,
        content: 'Привет! Меня зовут Иван, и я люблю писать тексты. Этот блог - мое личное пространство для творчества.',
        showContent: true,
        settings: { backgroundColor: '#f9fafb' }
      },
      {
        id: 'footer-blog',
        type: 'footer',
        variant: 'simple',
        content: '© 2026 Мой Блог. Подписывайтесь на обновления.',
        showContent: true
      }
    ]
  }
};
