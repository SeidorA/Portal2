# Portal Seidor

Bienvenido al repositorio del **Portal Seidor**, una plataforma integral desarrollada con [Next.js](https://nextjs.org) (App Router), [Supabase](https://supabase.com) y Tailwind CSS.

Este portal está diseñado para centralizar la gestión de productos, novedades, documentación (Markdown/MDX) y tickets, ofreciendo una experiencia moderna tanto para administradores como para usuarios finales.

## 🚀 Características Principales

- **Gestión de Novedades (Blog)**: Publicación y visualización de artículos y actualizaciones de productos con soporte para Markdown, componentes dinámicos e íconos personalizados.
- **Documentación de Productos**: Base de conocimiento estructurada para distintos productos, con renderizado MDX integrado.
- **Sistema de Tickets**: Creación y seguimiento de tickets de soporte.
- **Autenticación y Roles**: Gestión de usuarios y acceso seguro mediante Supabase Auth y RLS (Row Level Security).
- **Componentes UI Propios**: Uso de librerías de diseño corporativas (`caralstable`, `iconcaral2`).
- **Modo Claro/Oscuro**: Soporte nativo para temas claros y oscuros.

## 🛠️ Stack Tecnológico

- **Framework**: Next.js (React)
- **Estilos**: Tailwind CSS
- **Base de Datos / Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Renderizado Markdown**: `react-markdown`, `remark-gfm`
- **Iconografía y Componentes**: `iconcaral2`, `caralstable`

## 📦 Instalación y Desarrollo Local

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```

2. Configura las variables de entorno. Crea un archivo `.env.local` en la raíz del proyecto y añade las credenciales de tu proyecto de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## 🗄️ Base de Datos

Las migraciones, funciones y políticas RLS se aplican directamente en Supabase. Asegúrate de ejecutar los scripts SQL requeridos para crear las tablas base (como `novedades`, `products`, `tickets`, etc.) y configurar los buckets públicos en Storage (`portal-assets`).
