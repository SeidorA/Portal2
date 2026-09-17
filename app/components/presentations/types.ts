export type SlideType = 'empty' | 'blank' | 'resource' | 'columns';

export type CrestoneResourceType = 'cover' | 'connections' | 'deployment' | 'deck' | 'origins-destinations';

export interface TextStyle {
  fontWeight?: string; // '400', '500', '600', '700', '800', '900'
  fontSize?: number; // px e.g. 14, 16, 18, 24, 28, 32, 40, etc.
  color?: string; // hex color
  backgroundColor?: string; // hex color or 'transparent'
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  listStyle?: 'none' | 'bullet' | 'number';
  script?: 'none' | 'superscript' | 'subscript';
}

export const CARAL_COLORS = [
  { name: 'Seidor Main', hex: '#07153A', role: 'Principal' },
  { name: 'Seidor Hard', hex: '#1F3A70', role: 'Secundario' },
  { name: 'Caral Blue', hex: '#0085FF', role: 'Acento' },
  { name: 'Caral Cyan', hex: '#00D2FF', role: 'Cyan' },
  { name: 'Caral Indigo', hex: '#6366F1', role: 'Indigo' },
  { name: 'Caral Violet', hex: '#8B5CF6', role: 'Violet' },
  { name: 'Caral Emerald', hex: '#10B981', role: 'Éxito' },
  { name: 'Caral Amber', hex: '#F59E0B', role: 'Aviso' },
  { name: 'Caral Rose', hex: '#F43F5E', role: 'Error' },
  { name: 'Neutral 900', hex: '#18181B', role: 'Oscuro' },
  { name: 'Neutral 700', hex: '#3F3F46', role: 'Gris Oscuro' },
  { name: 'Neutral 500', hex: '#71717A', role: 'Gris Medio' },
  { name: 'Neutral 300', hex: '#D4D4D8', role: 'Gris Claro' },
  { name: 'Neutral 100', hex: '#F4F4F5', role: 'Fondo Claro' },
  { name: 'Blanco', hex: '#FFFFFF', role: 'Blanco' },
];

export interface SlideBlock {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'image' | 'haz' | 'explicativo';
  content?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imageSize?: '25' | '50' | '75' | '100';
  imageAlign?: 'left' | 'center' | 'right';
  imagePadding?: '0' | '10' | '25';
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  style?: TextStyle;
}

export interface ColumnData {
  id: string;
  type: 'text' | 'image';
  title?: string;
  content?: string;
  imageUrl?: string;
  isFullBleedImage?: boolean;
  verticalAlign?: 'top' | 'center' | 'bottom';
  heightMode?: 'full' | 'auto';
  padding?: '0' | '10' | '25' | '40';
  glassEffect?: boolean;
  blocks?: SlideBlock[];
}

export type HazPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top'
  | 'bottom';

export const HAZ_PRESETS = [
  { id: 1, name: 'Haz 1', src: '/img/haz/1.png' },
  { id: 2, name: 'Haz 2', src: '/img/haz/2.png' },
  { id: 3, name: 'Haz 3', src: '/img/haz/3.png' },
  { id: 4, name: 'Haz 4', src: '/img/haz/4.png' },
  { id: 5, name: 'Haz 5', src: '/img/haz/5.png' },
  { id: 6, name: 'Haz 6', src: '/img/haz/6.png' },
  { id: 7, name: 'Haz 7', src: '/img/haz/7.png' },
  { id: 8, name: 'Haz 8', src: '/img/haz/8.png' },
  { id: 9, name: 'Haz 9', src: '/img/haz/9.png' },
  { id: 10, name: 'Haz 10', src: '/img/haz/10.png' },
];

export const HAZ_POSITIONS: { id: HazPosition; label: string; shortLabel: string; icon: string }[] = [
  { id: 'top-left', label: 'Superior Izquierda', shortLabel: 'Sup. Izq', icon: '↖' },
  { id: 'top', label: 'Superior Centro', shortLabel: 'Arriba', icon: '↑' },
  { id: 'top-right', label: 'Superior Derecha', shortLabel: 'Sup. Der', icon: '↗' },
  { id: 'center', label: 'Centro', shortLabel: 'Centro', icon: '⊙' },
  { id: 'bottom-left', label: 'Inferior Izquierda', shortLabel: 'Inf. Izq', icon: '↙' },
  { id: 'bottom', label: 'Inferior Centro', shortLabel: 'Abajo', icon: '↓' },
  { id: 'bottom-right', label: 'Inferior Derecha', shortLabel: 'Inf. Der', icon: '↘' },
];

export function getHazStyle(position?: HazPosition): {
  containerClass: string;
  imgClass: string;
  containerStyle?: React.CSSProperties;
} {
  switch (position) {
    case 'top-left':
      return {
        containerClass: 'absolute pointer-events-none overflow-visible flex items-start justify-start',
        imgClass: 'w-[750px] h-[750px] max-w-none object-contain blur-[20px] transition-all duration-500',
        containerStyle: { top: -100, left: -200 },
      };
    case 'top-right':
      return {
        containerClass: 'absolute pointer-events-none overflow-visible flex items-start justify-end',
        imgClass: 'w-[750px] h-[750px] max-w-none object-contain blur-[20px] transition-all duration-500',
        containerStyle: { top: -100, right: -200 },
      };
    case 'bottom-left':
      return {
        containerClass: 'absolute pointer-events-none overflow-visible flex items-end justify-start',
        imgClass: 'w-[750px] h-[750px] max-w-none object-contain blur-[20px] transition-all duration-500',
        containerStyle: { bottom: -100, left: -200 },
      };
    case 'bottom-right':
      return {
        containerClass: 'absolute pointer-events-none overflow-visible flex items-end justify-end',
        imgClass: 'w-[750px] h-[750px] max-w-none object-contain blur-[20px] transition-all duration-500',
        containerStyle: { bottom: -300, right: -200 },
      };
    case 'top':
      return {
        containerClass: 'absolute pointer-events-none overflow-visible left-1/2 -translate-x-1/2 flex items-start justify-center',
        imgClass: 'w-[750px] h-[750px] max-w-none object-contain blur-[20px] transition-all duration-500',
        containerStyle: { top: -300 },
      };
    case 'bottom':
      return {
        containerClass: 'absolute pointer-events-none overflow-visible left-1/2 -translate-x-1/2 flex items-end justify-center',
        imgClass: 'w-[750px] h-[750px] max-w-none object-contain blur-[20px] transition-all duration-500',
        containerStyle: { bottom: -300 },
      };
    case 'center':
    default:
      return {
        containerClass: 'absolute inset-0 m-auto w-[85%] h-[85%] pointer-events-none flex items-center justify-center',
        imgClass: 'w-full h-full object-contain blur-[20px] transition-all duration-500',
      };
  }
}

export interface SlideData {
  id: string;
  type: SlideType;
  title?: string;
  resourceType?: CrestoneResourceType;
  resourceConfig?: Record<string, any>;
  blocks?: SlideBlock[];
  background?: string;
  hazEffect?: number; // 1 to 10
  hazPosition?: HazPosition; // 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom'
  columnCount?: 1 | 2 | 3 | 4;
  distribution?: string; // e.g. '70-30', '50-50', '30-70', '60-40', '40-60', '33-33-33'
  columns?: ColumnData[];
  layout?: 'single' | 'two-columns' | 'three-columns' | 'grid';
  leftContent?: string;
  rightContent?: string;
  imageUrl?: string;
}

export interface PresentationContent {
  slides: SlideData[];
  settings?: {
    theme?: 'light' | 'dark';
    aspectRatio?: '16:9' | '4:3';
    showSlideNumber?: boolean;
    autoAdvance?: boolean;
    [key: string]: any;
  };
  metadata?: {
    tags?: string;
    status?: string;
    restriction?: string;
    language?: string;
    description?: string;
    [key: string]: any;
  };
}
