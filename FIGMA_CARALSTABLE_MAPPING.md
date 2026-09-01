# Guía de Mapeo: Componentes de Figma (Caral) a Código React (`caralstable` & `iconcaral2`)

Este documento sirve como puente de referencia técnica entre el archivo de diseño **CRESTONE (Sistema de Diseño Caral)** en Figma y la biblioteca de componentes reactivos **`caralstable`** y **`iconcaral2`** instalada en este proyecto.

El objetivo es acelerar las implementaciones, reducir discrepancias visuales y asegurar la consistencia del diseño a código.

---

## 📌 1. Reglas Generales de Traducción (Diseño a Código)

Basado en las [Consideraciones de Desarrollo](file:///app/consideraciones/page.tsx):

### 📐 Estructura & Grid (Auto Layout vs. Absoluto)
* **Regla de Figma:** Diseñar siempre usando **Auto Layout** (en filas o columnas con paddings y espaciados fijos).
* **Traducción a Código:** El Auto Layout de Figma se traduce 1:1 en clases de flexbox o grid de **Tailwind CSS**.
  * **Auto Layout Horizontal:** Equivale a `flex flex-row items-center gap-[Xpx]`.
  * **Auto Layout Vertical:** Equivale a `flex flex-col gap-[Ypx]`.
  * **Padding Interno:** El padding horizontal/vertical en Figma equivale a `px-[X]` y `py-[Y]`.

### 🎨 Design Tokens & Colores
* **Nomenclatura en Figma:** Los colores deben provenir de la paleta semántica estricta del Design System.
* **Mapeo a Variables CSS / Tailwind v4:**
  | Elemento en Figma | Variable de Token en Figma | Equivalente Tailwind CSS |
  | :--- | :--- | :--- |
  | Fondo Principal | `background/main` | `bg-zinc-950` / `var(--color-neutral-950)` |
  | Contenedores / Tarjetas | `surface/card` | `bg-zinc-900/60 backdrop-blur-md border border-zinc-800` |
  | Color Primario Accent | `brand/primary/500` | `text-purple-600` / `bg-purple-600` |
  | Espaciado Base | `spacing/16` | `p-4` (1rem) |
  | Radio de Bordes (MD) | `radius/md` (8px) | `rounded-lg` |

### ⚡ Iconos y Vectores
* **Regla de Figma:** Todos los iconos de la marca deben exportarse como trazos vectorizados (`Ctrl + Shift + O` en Figma) y con relleno (`fill`) asignado a `currentColor`.
* **Implementación:** Usar el componente `<CaralIcon />` o `<Brand />` de la librería `iconcaral2` para mantener el peso visual y el comportamiento responsivo de color en hovers.

---

## 🔗 2. Enlaces Rápidos y Demos Activos

A continuación se asocian las pantallas clave de Figma con sus páginas de demostración interactiva en este repositorio:

1. **Crear Nueva Conexión (Crestone)**
   - 🎨 **Figma Node:** [Figma Node 6668:1117](https://www.figma.com/design/NON2BgLh9uvDcLWIyHTnmF/CRESTONE?node-id=6668-1117&t=OWvY6a6V94XPvg1D-4)
   - 💻 **Código React:** [app/demo/crestone-connection/page.tsx](file:///app/demo/crestone-connection/page.tsx)
2. **Administrar Conexiones (Crestone)**
   - 🎨 **Figma Node:** [Figma Node 5749:27044](https://www.figma.com/design/NON2BgLh9uvDcLWIyHTnmF/CRESTONE?node-id=5749-27044&t=bGQtPm9Lr2HN5qt0-11)
   - 💻 **Código React:** [app/demo/crestone-connections/page.tsx](file:///app/demo/crestone-connections/page.tsx)
3. **Asistente de Onboarding Dinámico (Crestone)**
   - 🎨 **Figma Node:** [Figma Node 6842:14147 / 6856:2085](https://www.figma.com/design/NON2BgLh9uvDcLWIyHTnmF/CRESTONE?node-id=6842-14147&t=bk1PputYf2LBSzTV-11)
   - 💻 **Código React:** [app/demo/onboarding/page.tsx](file:///app/demo/onboarding/page.tsx)
4. **Administrar Nodos (Crestone)**
   - 🎨 **Figma Node:** [Figma Node 5745:24670 / 6888:70917](https://www.figma.com/design/NON2BgLh9uvDcLWIyHTnmF/CRESTONE?node-id=5745-24670&t=bk1PputYf2LBSzTV-11)
   - 💻 **Código React:** [app/demo/crestone-nodos/page.tsx](file:///app/demo/crestone-nodos/page.tsx)

---

## 🛠️ 3. Catálogo de Componentes Mapeados

### 1. Button (Botones)
* **Nombre en Figma:** `Button` (con variantes Primary, Secondary, Ghost, etc.)
* **Componente React:** `<Button>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `variant`: Mapea a la variante cromática del botón.
    * Opciones: `'default' | 'info' | 'success' | 'warning' | 'danger' | 'indido' | 'sakura' | 'light' | 'carbon' | 'ghost' | 'tab'`
  * `size`: Tamaño. Opciones: `'sm' | 'md' | 'lg'`
  * `iconName`: Nombre del icono a renderizar al lado del texto. (Ver sección de iconos).
  * `isIconButton`: `true` si es un botón circular/cuadrado con solo un icono.
  * `isLoading`: Renderiza un spinner animado en lugar del estado normal.
  * `isDropdown`: Agrega una flecha indicadora de menú desplegable.
  * `isOpen`: Si está abierto (específico para botones tipo menú dropdown).
  * `isPill`: Esquinas completamente redondeadas.
  * `hasBorder`: Borde explícito para variantes ligeras o fantasma.

> [!IMPORTANT]
> **Consideración de Proyecto: Botones de Solo Icono**
> Cuando el diseño requiera un botón que contenga **únicamente un icono** (sin texto), **SIEMPRE** debes usar la propiedad `isIconButton={true}` de `caralstable`. 
> **NO** utilices un botón común ni pases clases personalizadas de Tailwind (como `w-[42px] h-[42px] p-2 flex items-center justify-center`) para intentar simular el comportamiento de un botón de icono. Usar `isIconButton` garantiza que los márgenes, rellenos y la geometría del botón sigan el estándar estricto del sistema de diseño.

#### 💡 Ejemplo de Código:
```tsx
import { Button } from "caralstable";

// Botón de acción principal con icono
<Button 
  variant="default" 
  size="md" 
  iconName="plus"
  onClick={() => console.log("Creando...")}
>
  Nuevo Elemento
</Button>

// Botón de icono circular para acciones rápidas
<Button 
  variant="ghost" 
  isIconButton 
  iconName="trash" 
  onClick={handleDelete} 
/>
```

---

### 2. Chip / Badge (Etiquetas de Estado)
* **Nombre en Figma:** `Badge` o `Chip` (con indicador de estado circular opcional)
* **Componente React:** `<Chip>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `variant`: Define el color de fondo y texto.
    * Opciones: `'default' | 'info' | 'success' | 'warning' | 'danger' | 'indido' | 'sakura' | 'light' | 'alwayslight' | 'outlight'`
  * `status`: Agrega un indicador de punto luminoso (LED) a la izquierda.
    * Opciones: `'none' | 'success' | 'warning' | 'danger' | 'waiting'`
  * `iconName`: Nombre de un icono opcional que se muestra a la izquierda del texto.
  * `label`: Texto a mostrar.
  * `showInfo` / `infoMessage`: Agrega una burbuja explicativa (Tooltip) al hacer hover.
  * `justIcon`: `true` para Chips que solo muestran un icono decorativo o de estado.

#### 💡 Ejemplo de Código:
```tsx
import { Chip } from "caralstable";

// Chip de estado de conexión activa
<Chip 
  variant="success" 
  status="success" 
  label="Activo" 
/>

// Chip informativo con icono
<Chip 
  variant="info" 
  iconName="circleInfo" 
  label="Producción" 
  showInfo 
  infoMessage="Esta base de datos apunta al entorno de producción" 
/>
```

---

### 3. Stepper (Pasos de Proceso)
* **Nombre en Figma:** `Steps` / `Stepper`
* **Componente React:** `<Steps>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `steps`: Arreglo de pasos. Cada elemento (`StepItem`) tiene:
    * `label` (string)
    * `description` (string opcional)
    * `status`: Estado del paso (`'default' | 'disabled' | 'done'`)
    * `hideConnector`: Ocultar la línea de conexión al siguiente paso.
  * `onStepClick`: Callback para cuando se presiona un paso específico (si es navegable).

#### 💡 Ejemplo de Código:
```tsx
import { Steps } from "caralstable";

const stepsItems = [
  { label: "Información Básica", status: "done", description: "Configuración inicial" },
  { label: "Seleccionar Origen", status: "default", description: "Base de datos destino" },
  { label: "Credenciales", status: "disabled" }
];

<Steps steps={stepsItems} onStepClick={(index) => gotoStep(index)} />
```

---

### 4. Tabs (Pestañas de Navegación)
* **Nombre en Figma:** `Tabs` / `Segmente Control`
* **Componente React:** `<Tabs>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `tabs`: Arreglo de objetos `{ label: string, iconName?: Icons }`.
  * `activeIndex`: Índice del tab seleccionado actualmente.
  * `onChange`: Función callback ejecutada al hacer clic sobre una pestaña.

#### 💡 Ejemplo de Código:
```tsx
import { Tabs } from "caralstable";

const TABS_CONFIG = [
  { label: "Todos", iconName: "list" },
  { label: "Bases de Datos", iconName: "database" },
  { label: "Archivos", iconName: "folder" }
];

<Tabs 
  tabs={TABS_CONFIG} 
  activeIndex={activeTabIndex} 
  onChange={(index) => setActiveTabIndex(index)} 
/>
```

---

### 5. Table (Tabla de Datos)
* **Nombre en Figma:** `Table` / `Data Grid`
* **Componente React:** `<Table>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `data`: Array de objetos con datos (deben contener una propiedad única `id` o similar).
  * `columns`: Array de configuración de columnas (`Column<T>[]`), con:
    * `key`: Llave del objeto de datos.
    * `header`: Título de cabecera de la columna.
    * `width`: Ancho en CSS (ej. `'150px'`, `'20%'`).
    * `align`: Alineación horizontal (`'left' | 'center' | 'right'`).
    * `render`: Función de renderizado personalizado para celdas complejas (botones, chips, etc.).
  * `hasBorder`: Borde exterior decorativo.
  * `onRowClick`: Callback ejecutado al presionar una fila completa.

#### 💡 Ejemplo de Código:
```tsx
import { Table, Column } from "caralstable";

interface ConnectionRow {
  id: string;
  name: string;
  type: string;
  status: string;
}

const columns: Column<ConnectionRow>[] = [
  { key: "name", header: "Nombre de Conexión", width: "40%" },
  { key: "type", header: "Tipo", width: "30%" },
  { 
    key: "status", 
    header: "Estado", 
    width: "30%", 
    render: (item) => (
      <Chip 
        variant={item.status === "active" ? "success" : "danger"} 
        label={item.status} 
      />
    )
  }
];

<Table 
  data={connectionsList} 
  columns={columns} 
  hasBorder 
  onRowClick={(item) => console.log("Seleccionado:", item)} 
/>
```

---

### 6. Modal y ConfirmationModal (Ventanas Emergentes)
* **Nombre en Figma:** `Modal` / `Confirmation Modal`
* **Componentes React:** `<Modal>` y `<ConfirmationModal>` (de `"caralstable"`)
* **Propiedades Mapeadas:**
  * **Modal Base:**
    * `isOpen` / `onClose`: Manejo de estados de apertura y cierre.
    * `title` / `description`: Títulos y cuerpos de texto.
    * `iconName` / `chipVariant`: Icono superior del modal con estilo de color.
    * `alignment`: Alineación del texto y contenido (`'left' | 'center'`).
    * `actions`: `'single'` o `'double'` botones de acción inferior.
    * `primaryActionText` / `onPrimaryAction` / `primaryActionVariant`.
    * `secondaryActionText` / `onSecondaryAction`.
  * **ConfirmationModal (Especializado en procesos con barra de progreso):**
    * `status`: Define el icono superior animado y color general (`'info' | 'success' | 'warning' | 'error'`).
    * `progress`: Número del 0 al 100 para renderizar barra de progreso dinámica.
    * `isCompleted`: Activa pantalla final de éxito.
    * `completionMessage`: Mensaje a mostrar al completar.

#### 💡 Ejemplo de Código:
```tsx
import { ConfirmationModal } from "caralstable";

<ConfirmationModal
  isOpen={isSyncing}
  onClose={() => setIsSyncing(false)}
  title="Sincronizando Entorno"
  description="Se están migrando las credenciales de SAP HANA al entorno de producción..."
  status="info"
  progress={65}
  confirmText="Cancelar Proceso"
  onConfirm={() => console.log("Cancelando...")}
/>
```

---

### 7. Drawer (Panel Lateral Deslizante)
* **Nombre en Figma:** `Drawer` / `Sidebar Flyout`
* **Componente React:** `<Drawer>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `isOpen` / `onClose`: Controla la animación de entrada y salida desde el lado derecho.
  * `title`: Título superior.
  * `size`: Anchura preestablecida del panel (`'sm'` = 15%, `'md'` = 25%, `'lg'` = 50% de la pantalla).

#### 💡 Ejemplo de Código:
```tsx
import { Drawer } from "caralstable";

<Drawer 
  isOpen={isDrawerOpen} 
  onClose={() => setIsDrawerOpen(false)} 
  title="Detalles de Credencial" 
  size="md"
>
  <div className="space-y-4 p-2">
    <p className="text-sm text-zinc-400">Ingrese las llaves SSH de origen:</p>
    {/* Formulario aquí */}
  </div>
</Drawer>
```

---

### 8. Toggle / Switch (Interruptor)
* **Nombre en Figma:** `Switch` / `Toggle`
* **Componente React:** `<Toggle>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `checked`: Boolean que determina si está activo.
  * `onChange`: Callback para cambiar el estado.
  * `label`: Etiqueta de texto descriptivo a la derecha.
  * `disabled`: Desactiva interacciones.

#### 💡 Ejemplo de Código:
```tsx
import { Toggle } from "caralstable";

<Toggle 
  checked={isProdEnv} 
  onChange={(val) => setIsProdEnv(val)} 
  label="¿Es un entorno productivo?" 
/>
```

---

### 9. Accordion (Acordeón de Contenido)
* **Nombre en Figma:** `Accordion` / `Collapsible Panel`
* **Componente React:** `<Accordion>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `title`: Título visible del encabezado.
  * `description`: Texto descriptivo rápido alternativo (si no se pasan children).
  * `variant`: Variante de diseño y fondo. Opciones: `'default' | 'container' | 'info' | 'success' | 'warning' | 'danger' | 'indigo' | 'white'`
  * `defaultOpen`: Si se inicializa abierto por defecto.

#### 💡 Ejemplo de Código:
```tsx
import { Accordion } from "caralstable";

<Accordion title="Ver Parámetros Avanzados de SQL" variant="container">
  <div className="text-xs text-zinc-400 space-y-2 p-2">
    <p>Timeout: 30000ms</p>
    <p>Pool Size: 10</p>
  </div>
</Accordion>
```

---

### 10. Alert (Alertas y Toasts)
* **Nombre en Figma:** `Alert` / `Toast Message`
* **Componente React:** `<Alert>` (de `"caralstable"`)
* **Propiedades y Mapeo:**
  * `variant`: Color de acento de la alerta (`'info' | 'danger' | 'warning' | 'success'`).
  * `type`: `'default'` (alerta incrustada estática) o `'toast'` (flotante).
  * `position`: Posición del toast en pantalla (`'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`).
  * `title` / `description`: Textos descriptivos.
  * `iconName`: Icono decorativo al lado del título.
  * `onClose`: Callback para cerrar o descartar la alerta.
  * `autoClose`: Tiempo en milisegundos para cierre automático (útil en toasts).

#### 💡 Ejemplo de Código:
```tsx
import { Alert } from "caralstable";

<Alert 
  variant="warning" 
  title="Conexión Inestable" 
  description="Se detectó alta latencia en el servidor. Revise la red." 
  iconName="triangleExclamation" 
/>
```

---

## 🎨 4. Iconografía y Marcas (`iconcaral2`)

El paquete **`iconcaral2`** provee los iconos vectoriales y logotipos de base de datos pre-aprobados por diseño.

### `<CaralIcon />` (Iconos Generales)
Se utiliza para renderizar iconos semánticos dentro de botones, inputs y headers.
* **Propiedades:**
  * `name`: Nombre estricto del icono. Tipado mediante `Icons`. (Ej: `'search'`, `'gear'`, `'trash'`, `'check'`, `'badgeSync'`).
  * `size`: Tamaño. Puede ser `'s' | 'm' | 'l' | 'xl'` o un número específico de píxeles (ej. `16`).
  * `color`: Color del relleno (si es estático) o se hereda de CSS mediante clases si se deja por defecto.

```tsx
import { CaralIcon } from "iconcaral2";

// Icono estático gris de búsqueda
<CaralIcon name="search" size={16} color="#64748B" />
```

### `<Brand />` (Marcas de Base de Datos / Proveedores)
Se usa específicamente para logotipos oficiales de tecnologías en las tarjetas de fuentes y conexiones.
* **Propiedades:**
  * `name`: Nombre de la marca. Tipado mediante `CaralBrandName`.
    * Opciones comunes: `'AWS' | 'AzureSql' | 'GoogleStorage' | 'SAP' | 'Saleforce' | 'Snowflake' | 'Redshift' | 'Databricks' | 'SAPHanaC' | 'S3' | 'PostgreSQL' | 'Oracle' | 'Crestone'`
  * `size`: Tamaño de la imagen de marca. Puede ser `'s' | 'm' | 'l' | 'xl'` o un número.

```tsx
import { Brand } from "iconcaral2";

// Logo de PostgreSQL para la tarjeta de origen de datos
<Brand name="PostgreSQL" size="l" />
```

---

## ✍️ 5. Componentes Locales Especializados

### `<TextInput />` (Campos de Entrada de Texto)
Este es un componente local personalizado (`@/app/components/TextInput`) diseñado para ampliar los controles nativos y dar consistencia de formulario Figma.
* **Ubicación:** [TextInput.tsx](file:///app/components/TextInput.tsx)
* **Propiedades y Mapeo:**
  * `label`: Etiqueta superior del input.
  * `helperText`: Mensaje aclaratorio de ayuda inferior.
  * `requiredMessage`: Mensaje de validación en rojo si el campo está incompleto.
  * `iconName`: Nombre de icono (`Icons`) para renderizar dentro del input.
  * `iconPosition`: `'left' | 'right'` para definir la posición del icono.
  * `multiline`: `true` para comportarse como `<textarea>`.
  * `rows`: Número de filas si es multiline.
  * `variant`: Estilo de borde del input (`'default' | 'info' | 'success' | 'warning' | 'danger' | 'light'`).

#### 💡 Ejemplo de Código:
```tsx
import TextInput from "@/app/components/TextInput";

<TextInput
  label="Nombre del Origen"
  placeholder="Ej: Servidor SAP HANA Producción"
  iconName="database"
  iconPosition="left"
  requiredMessage="El nombre es obligatorio para continuar"
  helperText="Asigne un nombre representativo para sus compañeros de equipo."
/>
```

---

*Última actualización: Julio 2026. Mantener actualizado ante cualquier cambio en las versiones de `caralstable` o el archivo de Figma.*
