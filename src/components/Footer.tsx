import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Footer = () => {
  const { contactInfo } = useSettings();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-2xl font-bold text-white tracking-tighter">WEXA</span>
            <p className="mt-2 text-sm text-zinc-400">
              Разработка современных веб-решений
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">Контакты</h3>
            <div className="space-y-2 text-zinc-400">
              {contactInfo.showEmail && <p>{contactInfo.email}</p>}
              {contactInfo.showPhone && <p>{contactInfo.phone}</p>}
              {contactInfo.showAddress && <p>{contactInfo.address}</p>}
            </div>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-zinc-400 hover:text-indigo-400 transition-colors">
              <Github className="h-6 w-6" />
            </a>
            <a href="#" className="text-zinc-400 hover:text-indigo-400 transition-colors">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-zinc-400 hover:text-indigo-400 transition-colors">
              <Linkedin className="h-6 w-6" />
            </a>
            <a href="#" className="text-zinc-400 hover:text-indigo-400 transition-colors">
              <Mail className="h-6 w-6" />
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-900 pt-8 text-center">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} WEXA. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
