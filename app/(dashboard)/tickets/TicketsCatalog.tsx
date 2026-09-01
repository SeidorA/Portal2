"use client";

import React, { useState } from 'react';
import { mockTickets, ticketCategories, TicketCategory } from './mockData';
import { CaralIcon } from 'iconcaral2';

const getCategoryGradient = (category: TicketCategory) => {
  switch (category) {
    case 'Cybersecurity':
      return 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-500';
    case 'IT Support':
      return 'bg-gradient-to-r from-neutral-900 via-red-900 to-red-700';
    case 'IT Infrastructure':
      return 'bg-gradient-to-r from-slate-900 via-slate-700 to-gray-500';
    case 'People and Culture':
      return 'bg-gradient-to-r from-emerald-900 via-teal-800 to-teal-500';
    default:
      return 'bg-gradient-to-r from-neutral-800 to-neutral-600';
  }
};

export default function TicketsCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesCategory = selectedCategory === 'Todas' || ticket.category === selectedCategory;
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1400px] mx-auto h-[calc(100vh-120px)]">
      
      {/* Sidebar de Categorías */}
      <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 border-r border-neutral-200 dark:border-neutral-800 pr-6 h-full overflow-y-auto hidden md:flex">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Categorías</h2>
        </div>
        
        {ticketCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium ${
                isSelected 
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <CaralIcon name={cat.icon} size={20} className={isSelected ? 'text-info-main' : 'text-neutral-400'} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-20 pr-4">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-neutral-900 dark:text-white font-poppins mb-1">Servicios</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Selecciona el servicio que quieres comenzar. Puedes buscarla por nombre o filtrar por una de las categorías disponibles.
            </p>
          </div>
          <div className="flex gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1">
            <button className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300">
              <CaralIcon name="grid" size={20} />
            </button>
            <button className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300">
              <CaralIcon name="list" size={20} />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <CaralIcon name="search" size={20} className="text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar servicio"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-info-main/50 transition-shadow"
          />
        </div>

        <div className="mb-4">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{selectedCategory}</span>
        </div>

        {/* Grilla de Tarjetas */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className="group flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer h-full"
              >
                {/* Banner Image / Gradient */}
                <div className={`h-28 w-full flex items-center justify-between px-6 ${getCategoryGradient(ticket.category)}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold tracking-widest text-sm">SEIDOR</span>
                    <span className="text-white/80 font-light text-sm">analytics</span>
                  </div>
                  <span className="text-white/90 text-sm font-medium">{ticket.category}</span>
                </div>
                
                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-2 leading-tight group-hover:text-info-main transition-colors">
                    {ticket.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3">
                    {ticket.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CaralIcon name="search" size={48} className="text-neutral-300 dark:text-neutral-700 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No se encontraron servicios</h3>
            <p className="text-neutral-500">Intenta con otros términos de búsqueda o cambia de categoría.</p>
          </div>
        )}

      </main>
    </div>
  );
}
