import React, { useState } from 'react';
import { MediaItem } from '../../types';
import { Image, Film, Upload, Search, Download, X, Filter } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([
    { id: '1', title: 'Culto Domingo Manhã', type: 'image', url: 'https://picsum.photos/seed/church1/800/600', category: 'Cultos', dateAdded: '2023-10-01' },
    { id: '2', title: 'Batismo 2023', type: 'image', url: 'https://picsum.photos/seed/baptism/800/600', category: 'Eventos', dateAdded: '2023-09-15' },
    { id: '3', title: 'Teaser Conferência', type: 'video', url: 'https://picsum.photos/seed/video/800/600', category: 'Promocional', dateAdded: '2023-10-05' },
    { id: '4', title: 'Worship Night', type: 'image', url: 'https://picsum.photos/seed/worship/800/600', category: 'Cultos', dateAdded: '2023-10-08' },
  ]);

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpload = () => {
    // Simulation of Cloudinary Upload Widget
    const newItem: MediaItem = {
      id: Date.now().toString(),
      title: `Nova Mídia ${items.length + 1}`,
      type: Math.random() > 0.5 ? 'image' : 'video',
      url: `https://picsum.photos/seed/${Date.now()}/800/600`,
      category: 'Geral',
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setItems([newItem, ...items]);
    alert("Simulando Upload para Cloudinary...");
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold text-church-900 tracking-tight">Galeria de Mídia</h2>
            <span className="bg-cyber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">IPMC</span>
          </div>
          <p className="text-gray-500 mt-1">Gerencie e compartilhe os arquivos da igreja.</p>
        </div>
        <button
          onClick={handleUpload}
          className="bg-cyber-500 hover:bg-cyber-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-cyber-500/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap font-medium"
        >
          <Upload size={18} />
          Upload Mídia
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto p-1">
          {['all', 'image', 'video'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all whitespace-nowrap ${filter === type
                ? 'bg-cyber-500 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-cyber-600'
                }`}
            >
              {type === 'all' ? 'Todos' : type === 'image' ? 'Fotos' : 'Vídeos'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar arquivo..."
            className="w-full pl-11 pr-10 py-3 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-church-500 focus:bg-white transition-colors text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <Search size={32} className="text-gray-300" />
          </div>
          <p className="font-medium text-gray-500">Nenhum item encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <button className="w-full py-2 bg-white/90 backdrop-blur text-church-900 rounded-lg font-bold text-sm hover:bg-white flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <Download size={16} /> Baixar
                  </button>
                </div>

                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-medium border border-white/10">
                    {item.type === 'image' ? <Image size={12} /> : <Film size={12} />}
                    <span className="capitalize">{item.type}</span>
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-800 truncate text-sm mb-2" title={item.title}>{item.title}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-church-600 bg-church-50 px-2.5 py-1 rounded-md border border-church-100 uppercase tracking-wide">{item.category}</span>
                  <span className="text-xs text-gray-400 font-medium">{new Date(item.dateAdded).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};