/**
 * Asset Management Utility
 * 
 * This utility provides type-safe access to all assets using unique IDs.
 * All assets are tracked in the asset-manifest.json file for easy management.
 */

// Import asset manifest - using require for JSON in Next.js
const assetManifest = require('../../public/assets/asset-manifest.json');

type AssetCategory = 'logos' | 'icons' | 'images' | 'backgrounds' | 'decorative' | 'vectors' | 'partners' | 'groups' | 'frames';

interface AssetInfo {
  id: string;
  path: string;
  category: string;
  description: string;
  originalName: string;
  subcategory?: string;
}

type AssetId = 
  // Logos
  | 'LOGO_HERO_MAIN' | 'LOGO_HERO_NEW' | 'LOGO_FOOTER' | 'LOGO_FOOTER_NEW' | 'LOGO_ICON'
  | 'LOGO_ICON_PREVIEW_10' | 'LOGO_PREVIEW_10' | 'LOGO_PREVIEW_11' | 'LOGO_PREVIEW_12' | 'LOGO_PREVIEW_13'
  | 'LOGO_PREVIEW_20' | 'LOGO_PREVIEW_21' | 'LOGO_PREVIEW_22' | 'LOGO_PREVIEW_23' | 'LOGO_PREVIEW_24'
  | 'LOGO_AI_BOX' | 'LOGO_AI'
  // Icons
  | 'ICON_QUOTE_1' | 'ICON_QUOTE_2' | 'ICON_PIN_ORANGE'
  | 'ICON_BED_0' | 'ICON_BED_1' | 'ICON_BED_2' | 'ICON_BED_3'
  | 'ICON_SHOWER_0' | 'ICON_SHOWER_1' | 'ICON_SHOWER_2' | 'ICON_SHOWER_3'
  | 'ICON_SIZE_0' | 'ICON_SIZE_1' | 'ICON_SIZE_2' | 'ICON_SIZE_3'
  | 'ICON_HEART_OUTLINE_0' | 'ICON_HEART_OUTLINE_1' | 'ICON_HEART_OUTLINE_2' | 'ICON_HEART_OUTLINE_3'
  | 'ICON_SHARE_0' | 'ICON_SHARE_1' | 'ICON_SHARE_2' | 'ICON_SHARE_3'
  | 'ICON_WHATSAPP_0' | 'ICON_WHATSAPP_1' | 'ICON_WHATSAPP_2' | 'ICON_WHATSAPP_3'
  | 'ICON_SEARCH' | 'ICON_ARROW_UP_0' | 'ICON_ARROW_UP_1' | 'ICON_ARROW_UP_2' | 'ICON_ARROW_UP_3' | 'ICON_ARROW_UP_4' | 'ICON_ARROW_UP_5' | 'ICON_ARROW_UP_6'
  | 'ICON_ARROW_OUTLINED_0' | 'ICON_ARROW_OUTLINED_1' | 'ICON_ARROW_OUTLINED_2' | 'ICON_ARROW_OUTLINED_3'
  | 'ICON_ARROW_OUTLINED_4' | 'ICON_ARROW_OUTLINED_5' | 'ICON_ARROW_OUTLINED_6' | 'ICON_ARROW_OUTLINED_7'
  | 'ICON_SOCIAL_0' | 'ICON_SOCIAL_1'
  // Images - Placeholders
  | 'PLACEHOLDER_PROPERTY_MAIN' | 'PLACEHOLDER_PROPERTY_MAIN_NEW' | 'PLACEHOLDER_PROPERTY' | 'PLACEHOLDER_PROFILE' | 'PLACEHOLDER_TESTIMONIAL_PERSON'
  // Images - Blog
  | 'BLOG_IMAGE_MAIN' | 'BLOG_IMAGE_1' | 'BLOG_IMAGE_2'
  // Images - Testimonials
  | 'TESTIMONIAL_ELAINE' | 'TESTIMONIAL_JAVIE' | 'TESTIMONIAL_RICA'
  | 'TESTIMONIAL_ELAINE_10' | 'TESTIMONIAL_JAVIE_10' | 'TESTIMONIAL_RICA_10'
  // Images - About
  | 'ABOUT_TROPICAL_TRAVEL' | 'ABOUT_RENTPH_CARES' | 'ABOUT_TRUSTED_PARTNER' | 'ABOUT_TRANSFORMING' | 'ABOUT_COMPREHENSIVE'
  | 'ABOUT_BACKGROUND' | 'ABOUT_LANDING_PAGE' | 'ABOUT_ISTOCK_10' | 'ABOUT_ISTOCK_11'
  | 'ABOUT_UNSPLASH_0' | 'ABOUT_UNSPLASH_1' | 'ABOUT_UNSPLASH_2' | 'ABOUT_UNSPLASH_3'
  // Backgrounds
  | 'BG_HERO_LANDING' | 'BG_HERO_LANDING_2' | 'BG_HERO_LANDING_NEW' | 'BG_CONTACT_US' | 'BG_TESTIMONIALS' | 'BG_LOGIN' | 'BG_BLOG' | 'BG_NEWS' | 'BG_CONTACT_HORIZONTAL' | 'BG_CONTACT_VERTICAL' | 'BG_CREATE_LISTING'
  // Images - Contact
  | 'CONTACT_PERSON'
  // Decorative
  | 'DECORATIVE_VECTOR_1' | 'DECORATIVE_VECTOR_2' | 'DECORATIVE_VECTOR_3'
  | 'DECORATIVE_RECTANGLE_320' | 'DECORATIVE_RECTANGLE_340'
  | 'DECORATIVE_RECTANGLE_510' | 'DECORATIVE_RECTANGLE_511' | 'DECORATIVE_RECTANGLE_512' | 'DECORATIVE_RECTANGLE_513'
  // Vectors
  | 'VECTOR_0' | 'VECTOR_1' | 'VECTOR_2' | 'VECTOR_10' | 'VECTOR_20' | 'VECTOR_30'
  // Login Background
  | 'LOGIN_BG'
  | 'VECTOR_WAVE_1' | 'VECTOR_WAVE_2' | 'VECTOR_WAVE_3'
  // Partners
  | 'PARTNER_1' | 'PARTNER_2' | 'PARTNER_3' | 'PARTNER_5'
  // Groups
  | 'GROUP_0' | 'GROUP_1' | 'GROUP_2' | 'GROUP_3' | 'GROUP_4'
  | 'GROUP_18980' | 'GROUP_18981' | 'GROUP_18982' | 'GROUP_18983'
  | 'GROUP_18990' | 'GROUP_18991' | 'GROUP_18992' | 'GROUP_18993'
  | 'GROUP_19000' | 'GROUP_19001' | 'GROUP_19002' | 'GROUP_19003' | 'GROUP_19004' | 'GROUP_19005' | 'GROUP_19006' | 'GROUP_19007'
  | 'GROUP_19700' | 'GROUP_19740' | 'GROUP_19750'
  // Frames
  | 'FRAME_0' | 'FRAME_1';

/**
 * Flattened asset map for quick lookup
 */
const assetMap: Record<string, AssetInfo> = {};

// Build flattened asset map from manifest
Object.values(assetManifest.assets).forEach((category) => {
  if (typeof category === 'object' && category !== null) {
    Object.values(category).forEach((item: any) => {
      // Handle nested structure (like images.placeholders, images.blog, etc.)
      if (item && typeof item === 'object') {
        // Check if this item has an 'id' property (it's a direct asset)
        if (item.id) {
          assetMap[item.id] = item;
        } else {
          // This is a subcategory (like placeholders, blog, etc.), iterate through its assets
          Object.values(item).forEach((asset: any) => {
            if (asset && asset.id) {
              assetMap[asset.id] = asset;
            }
          });
        }
      }
    });
  }
});

/**
 * Get asset path by ID
 * @param id - Asset ID from the manifest
 * @returns Asset path or undefined if not found
 */
export function getAsset(id: AssetId): string | undefined {
  const asset = assetMap[id];
  return asset?.path;
}

/**
 * Get asset info by ID
 * @param id - Asset ID from the manifest
 * @returns Asset info object or undefined if not found
 */
export function getAssetInfo(id: AssetId): AssetInfo | undefined {
  return assetMap[id];
}

/**
 * Get all assets by category
 * @param category - Asset category
 * @returns Array of asset info objects
 */
export function getAssetsByCategory(category: AssetCategory): AssetInfo[] {
  const categoryAssets = (assetManifest.assets as any)[category];
  if (!categoryAssets) return [];
  
  return Object.values(categoryAssets) as AssetInfo[];
}

/**
 * Get all assets by subcategory (for images)
 * @param category - Main category (usually 'images')
 * @param subcategory - Subcategory name
 * @returns Array of asset info objects
 */
export function getAssetsBySubcategory(category: string, subcategory: string): AssetInfo[] {
  const categoryAssets = (assetManifest.assets as any)[category];
  if (!categoryAssets) return [];
  
  const subcategoryAssets = categoryAssets[subcategory];
  if (!subcategoryAssets) return [];
  
  return Object.values(subcategoryAssets) as AssetInfo[];
}

/**
 * Search assets by description or original name
 * @param query - Search query
 * @returns Array of matching asset info objects
 */
export function searchAssets(query: string): AssetInfo[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(assetMap).filter(
    (asset) =>
      asset.description.toLowerCase().includes(lowerQuery) ||
      asset.originalName.toLowerCase().includes(lowerQuery) ||
      asset.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all asset IDs
 * @returns Array of all asset IDs
 */
export function getAllAssetIds(): string[] {
  return Object.keys(assetMap);
}

/**
 * Asset constants for commonly used assets
 */
export const ASSETS = {
  // Logos
  LOGO_HERO_MAIN: getAsset('LOGO_HERO_MAIN')!,
  LOGO_FOOTER: getAsset('LOGO_FOOTER')!,
  LOGO_ICON: getAsset('LOGO_ICON')!,
  
  // Placeholders
  PLACEHOLDER_PROPERTY_MAIN: getAsset('PLACEHOLDER_PROPERTY_MAIN')!,
  PLACEHOLDER_PROFILE: getAsset('PLACEHOLDER_PROFILE')!,
  PLACEHOLDER_TESTIMONIAL_PERSON: getAsset('PLACEHOLDER_TESTIMONIAL_PERSON')!,
  
  // Icons
  ICON_QUOTE_1: getAsset('ICON_QUOTE_1')!,
  ICON_QUOTE_2: getAsset('ICON_QUOTE_2')!,
  
  // Backgrounds
  BG_HERO_LANDING: getAsset('BG_HERO_LANDING')!,
  BG_CONTACT_US: getAsset('BG_CONTACT_US')!,
  BG_TESTIMONIALS: getAsset('BG_TESTIMONIALS')!,
  BG_LOGIN: getAsset('BG_LOGIN')!,
  BG_BLOG: getAsset('BG_BLOG')!,
  BG_NEWS: getAsset('BG_NEWS')!,
  BG_CONTACT_HORIZONTAL: getAsset('BG_CONTACT_HORIZONTAL')!,
  BG_CONTACT_VERTICAL: getAsset('BG_CONTACT_VERTICAL')!,
  BG_CREATE_LISTING: getAsset('BG_CREATE_LISTING')!,
  // Contact Images
  CONTACT_PERSON: getAsset('CONTACT_PERSON')!,
  
  // Partners
  PARTNER_1: getAsset('PARTNER_1')!,
  PARTNER_2: getAsset('PARTNER_2')!,
  PARTNER_3: getAsset('PARTNER_3')!,
  PARTNER_5: getAsset('PARTNER_5')!,
  // Blog Images
  BLOG_IMAGE_MAIN: getAsset('BLOG_IMAGE_MAIN')!,
  BLOG_IMAGE_1: getAsset('BLOG_IMAGE_1')!,
  BLOG_IMAGE_2: getAsset('BLOG_IMAGE_2')!,
  // About Images
  ABOUT_TROPICAL_TRAVEL: getAsset('ABOUT_TROPICAL_TRAVEL')!,
  ABOUT_RENTPH_CARES: getAsset('ABOUT_RENTPH_CARES')!,
  ABOUT_TRUSTED_PARTNER: getAsset('ABOUT_TRUSTED_PARTNER')!,
  ABOUT_TRANSFORMING: getAsset('ABOUT_TRANSFORMING')!,
  ABOUT_COMPREHENSIVE: getAsset('ABOUT_COMPREHENSIVE')!,
  ABOUT_BACKGROUND: getAsset('ABOUT_BACKGROUND')!,
  // Placeholders
  PLACEHOLDER_PROPERTY_MAIN_NEW: getAsset('PLACEHOLDER_PROPERTY_MAIN_NEW')!,
  PLACEHOLDER_PROPERTY: getAsset('PLACEHOLDER_PROPERTY')!,
    LOGO_FOOTER_WHITE: '/assets/logos/rentals-logo-white.png',
} as const;

export default {
  getAsset,
  getAssetInfo,
  getAssetsByCategory,
  getAssetsBySubcategory,
  searchAssets,
  getAllAssetIds,
  ASSETS,
};

