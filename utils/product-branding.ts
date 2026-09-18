export interface ProductBrandColors {
  primary: string;
  secondary: string;
  accent: string;
  text_main: string;
  bg_light: string;
  bg_dark: string;
  [key: string]: string;
}

export interface ProductBrandIsologos {
  positive_bw: string | null;
  negative_bw: string | null;
  safety_zone_image: string | null;
  isotype_info: string | null;
  safety_zone_info: string | null;
  positive_negative_info: string | null;
}

export interface ProductIconCaral {
  using_icon_caral: boolean;
  name: string | null;
  is_color: boolean;
  icon_dark: string | null;
}

export interface FormattedProductBrand {
  id: string;
  title: string;
  slug: string;
  version: string | null;
  description: string | null;
  icon_name: string | null;
  logo_light: string | null;
  logo_dark: string | null;
  favicon: string | null;
  icon_caral: ProductIconCaral;
  colors: ProductBrandColors;
  color_tokens: Record<string, string>;
  isologos: ProductBrandIsologos;
  typography_info: string | null;
  brand_info: string | null;
  cover_images: string[];
  downloadable_assets: any[];
  enable_graphic_module: boolean;
}

export function formatProductDocumentationBrand(product: any): FormattedProductBrand {
  if (!product) {
    return {
      id: '',
      title: '',
      slug: '',
      version: null,
      description: null,
      icon_name: null,
      logo_light: null,
      logo_dark: null,
      favicon: null,
      icon_caral: {
        using_icon_caral: false,
        name: null,
        is_color: true,
        icon_dark: null,
      },
      colors: {
        primary: '#07153A',
        secondary: '#1F3A70',
        accent: '#0085FF',
        text_main: '#18181B',
        bg_light: '#F4F4F5',
        bg_dark: '#0F172A',
      },
      color_tokens: {},
      isologos: {
        positive_bw: null,
        negative_bw: null,
        safety_zone_image: null,
        isotype_info: null,
        safety_zone_info: null,
        positive_negative_info: null,
      },
      typography_info: null,
      brand_info: null,
      cover_images: [],
      downloadable_assets: [],
      enable_graphic_module: true,
    };
  }

  const assets = product.assets || {};

  const isCaralIcon =
    assets.logo_type === 'brand' ||
    (!assets.custom_logo && !assets.logo_light && !!product.icon_name);

  const brandIconName = assets.brand_icon || product.icon_name || null;

  const logoLight =
    assets.logo_light ||
    assets.custom_logo ||
    product.light_image ||
    null;

  const logoDark =
    assets.logo_dark ||
    assets.custom_logo_dark ||
    product.dark_image ||
    logoLight ||
    null;

  const favicon = assets.favicon || null;

  const colors: ProductBrandColors = {
    primary: '#07153A',
    secondary: '#1F3A70',
    accent: '#0085FF',
    text_main: '#18181B',
    bg_light: '#F4F4F5',
    bg_dark: '#0F172A',
    ...(assets.colors || {}),
  };

  const colorTokens: Record<string, string> = {
    primary: 'Seidor Main',
    secondary: 'Seidor Hard',
    accent: 'Info main',
    bg_light: 'Neutral 100',
    text_main: 'Neutral 900',
    ...(assets.color_tokens || {}),
  };

  const isologos: ProductBrandIsologos = {
    positive_bw: assets.logo_positive_bw || null,
    negative_bw: assets.logo_negative_bw || null,
    safety_zone_image: assets.safety_zone_image || null,
    isotype_info: assets.isotype_info || null,
    safety_zone_info: assets.safety_zone_info || null,
    positive_negative_info: assets.positive_negative_info || null,
  };

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    version: product.version || '1.0.0',
    description: product.description || null,
    icon_name: product.icon_name || null,
    logo_light: logoLight,
    logo_dark: logoDark,
    favicon: favicon,
    icon_caral: {
      using_icon_caral: Boolean(isCaralIcon),
      name: isCaralIcon ? brandIconName : null,
      is_color: assets.brand_is_color ?? true,
      icon_dark: assets.icon_dark || null,
    },
    colors: colors,
    color_tokens: colorTokens,
    isologos: isologos,
    typography_info: assets.typography_info || null,
    brand_info: assets.brand_info || null,
    cover_images: assets.cover_images || [],
    downloadable_assets: assets.downloadable_assets || [],
    enable_graphic_module: assets.enable_graphic_module ?? true,
  };
}
