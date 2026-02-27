const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Wexa.su</h3>
            <p className="text-gray-600 mb-4 max-w-sm">
              Создаем сайты, которые продают. Профессиональная веб-разработка, дизайн и продвижение.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Услуги</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-indigo-600 cursor-pointer">Веб-разработка</li>
              <li className="hover:text-indigo-600 cursor-pointer">UI/UX Дизайн</li>
              <li className="hover:text-indigo-600 cursor-pointer">SEO Оптимизация</li>
              <li className="hover:text-indigo-600 cursor-pointer">Поддержка</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-12 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Wexa.su. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
