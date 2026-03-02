const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Wexa.su</h3>
            <p className="text-gray-600 mb-4 max-w-sm mx-auto">
              Создаем сайты, которые продают. Профессиональная веб-разработка, дизайн и продвижение.
            </p>
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
