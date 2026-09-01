"use client";

import React from 'react';

type LinkProps = {
  link: string;
  title: string;
}

const docsList: LinkProps[] = [
  {
    title: 'Crestone',
    link: 'https://crestone-help.seidoranalytics.com/',
  },
  {
    title: 'Daiana',
    link: 'https://daiana-help.seidoranalytics.com/',
  },
  {
    title: 'Harbinger',
    link: 'https://harbingerdocs.seidoranalytics.com/',
  },
  {
    title: "Doxa",
    link: 'https://doxadocs.seidoranalytics.com/',
  }
];

export default function DocsList() {
  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-h2 font-poppins font-semibold text-neutral-900">
          Documentación oficial de nuestras soluciones
        </h2>
        <p className="text-p font-poppins text-neutral-600">
          Consultá la documentación oficial de cada producto, incluyendo conceptos clave, flujos de uso, configuraciones y casos de aplicación.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-4 p-2">
        {docsList.map((doc, idx) => (
          <a
            key={idx}
            href={doc.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 group transition-transform hover:-translate-y-1"
          >
            <div className="w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden border border-neutral-200/60 shadow-sm group-hover:shadow-lg transition-all bg-white">
              <img
                src={`/img/index/Docs_${doc.title}.png`}
                alt={doc.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <span className="font-poppins font-medium text-neutral-900 dark:text-neutral-200 text-[15px] group-hover:text-blue-600 transition-colors px-1">
              {doc.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
