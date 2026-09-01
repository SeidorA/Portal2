# Guía de Migración a Supabase Local

En el futuro, si decides volver a ejecutar Supabase de forma local (mediante Docker) en lugar de utilizar el servicio en la nube (Cloud), deberás seguir estos pasos para asegurar que la aplicación siga funcionando correctamente con todas las funcionalidades (Roles, Perfiles, Gestión de Usuarios y Políticas).

## 1. Configuración de Entorno (`.env.local`)
Actualmente, el proyecto apunta a tu proyecto en la nube. Deberás cambiar estas variables para que apunten a tu instancia local:

```env
# Cambiar por las credenciales que te arroje el comando `npx supabase start`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh... (tu anon key local)

# IMPORTANTE: La llave maestra de servicio también debe actualizarse a la versión local
SUPABASE_SERVICE_ROLE_KEY=eyJh... (tu service_role key local)
```

## 2. Inicialización Local
Debes asegurarte de tener Docker corriendo y levantar Supabase:
```bash
npx supabase start
```

## 3. Sincronización de Base de Datos (Esquema)
A lo largo del desarrollo agregamos tablas y columnas importantes directamente en la nube. Al volver a local, la base de datos estará vacía por defecto. Debes recrear la siguiente estructura o usar `supabase db pull` para bajar los cambios de la nube a una migración local.

### Estructura Mínima Requerida:
1. **Tabla `roles`**: `id`, `name`, `created_at`.
2. **Tabla `profiles`**: 
   - Debe tener una llave foránea a `auth.users(id)`.
   - Campos: `id`, `email`, `last_activity_at`, `updated_at`.
3. **Tabla `user_roles`**: 
   - Relación muchos a muchos (o 1 a 1 como lo usamos) entre `profiles` y `roles`.
   - Campos: `profile_id`, `role_id`.
4. **Tabla `products`**:
   - Campos base: `id`, `title`, `description`, `link`, `category`, `light_image`, `dark_image`, `order_index`, `is_super`, etc.
   - **Campos agregados recientemente**:
     - `allowed_roles` (Array de Texto `text[]`): Para la matriz de roles.
     - `hide_in_bento` (Booleano `boolean` default `false`): Para ocultar del inicio.

### Triggers y RLS
- Recuerda que creamos un **Trigger** en la base de datos de la nube para que cuando un usuario inicie sesión (Microsoft o Email), se inserte/actualice automáticamente su fila en `public.profiles`. Este trigger debe existir en local.
- Las políticas RLS (`Row Level Security`) deben permitir lectura/escritura según corresponda (en nuestro caso tuvimos que deshabilitar temporalmente el RLS en `profiles` para la creación de usuarios desde el dashboard).

## 4. Migración de Datos (Opcional)
Si deseas conservar los usuarios reales que se hayan registrado en la nube:
1. **Usuarios (Auth):** Supabase Auth no se exporta fácilmente con simples queries SQL. Deberás exportar los usuarios de `auth.users` usando un script de migración o las herramientas del CLI de Supabase.
2. **Metadata:** Recuerda que los nombres, teléfonos y empresas se guardan en el objeto `raw_user_meta_data` dentro de `auth.users`, **no en la tabla perfiles**.
3. **Productos y Roles:** Deberás hacer un volcado (dump) de las tablas públicas (`products`, `roles`, etc.) e insertarlas en tu base local.

## 5. Login de Microsoft (Azure AD)
Si vas a probar el login de Microsoft en local, recuerda que el `Redirect URI` configurado en tu portal de Azure debe incluir el de tu Supabase local (generalmente `http://127.0.0.1:54321/auth/v1/callback`).

---
> **Nota:** La ventaja de mantenerlo en Cloud como está ahora es que te ahorras todo este mantenimiento de infraestructura, además de tener el Login de Microsoft funcionando nativamente con URLs públicas.
