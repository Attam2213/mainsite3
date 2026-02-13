import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Seo from './Seo';

const Layout = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Seo />
      <Header />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
