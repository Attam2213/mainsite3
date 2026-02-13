import { ExternalLink } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

const Portfolio = () => {
  const { items: projects } = usePortfolio();

  return (
    <div className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Наши работы</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Примеры реализованных проектов. Мы гордимся каждым созданным сайтом.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <a 
                    href={project.projectUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Посмотреть <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="p-6">
                <p className="text-indigo-400 text-sm font-medium mb-2">{project.category}</p>
                <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                <p className="text-zinc-400 text-sm">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
