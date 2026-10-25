﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Wexa.su — игровой хостинг и хостинг сайтов</h3>
            <p className="text-gray-600 mb-4 max-w-xl mx-auto">
              Аренда игровых серверов Minecraft, CS2 и CS 1.6 и хостинг сайтов на Node.js. Быстрые NVMe-ноды, защита от DDoS, бесплатный SSL, SFTP-доступ и панель управления. Запуск за 60 секунд.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="mb-4 md:mb-0">
            © {new Date().getFullYear()} Wexa.su. Все права защищены.
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors">
              Политика конфиденциальности
            </Link>
            <Link to="/terms-of-service" className="hover:text-indigo-600 transition-colors">
              Пользовательское соглашение
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
