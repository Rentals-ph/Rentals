# Assets Directory

This directory contains all static assets (images, icons, logos, etc.) for the Rental.ph application.

## Organization Structure

Assets are organized into the following categories:

```
assets/
├── logos/              # Brand logos and logo variants
├── icons/              # UI icons (beds, showers, arrows, etc.)
├── images/
│   ├── placeholders/   # Default/fallback images
│   ├── blog/          # Blog post images
│   ├── testimonials/  # Testimonial photos
│   └── about/         # About page images
├── backgrounds/        # Background images
├── decorative/        # Decorative elements
├── vectors/           # Vector graphics
├── partners/          # Partner logos
├── groups/            # Group graphics
├── frames/            # Frame graphics
└── asset-manifest.json # Asset registry with IDs
```

## Asset Management

### Asset Manifest

All assets are tracked in `asset-manifest.json` with:
- **Unique ID**: Identifier for programmatic access
- **Path**: Current location of the asset
- **Category**: Main category (logos, icons, images, etc.)
- **Description**: Human-readable description
- **Original Name**: Original filename for reference

### Using Assets in Code

#### Option 1: Using the Asset Utility (Recommended)

```typescript
import { getAsset, ASSETS } from '@/utils/assets';

// Get asset by ID
const logoPath = getAsset('LOGO_HERO_MAIN');

// Use predefined constants
<img src={ASSETS.LOGO_HERO_MAIN} alt="Logo" />
```

#### Option 2: Direct Path Reference

```typescript
// Direct path (not recommended for production)
<img src="/assets/logos/rentals-logo-hero-13c7b5.png" alt="Logo" />
```

### Adding New Assets

1. **Add the file** to the appropriate category folder
2. **Update `asset-manifest.json`** with:
   - Unique ID (e.g., `LOGO_NEW_BRAND`)
   - Path to the file
   - Category and description
3. **Update `src/utils/assets.ts`**:
   - Add the ID to the `AssetId` type
   - Optionally add to `ASSETS` constants if commonly used
4. **Run the organization script** if needed:
   ```bash
   node scripts/organize-assets.js
   ```

### Asset ID Naming Convention

- **Logos**: `LOGO_[VARIANT]_[DESCRIPTION]`
- **Icons**: `ICON_[TYPE]_[VARIANT]`
- **Images**: `[CATEGORY]_[DESCRIPTION]_[VARIANT]`
- **Backgrounds**: `BG_[PAGE/SECTION]`
- **Decorative**: `DECORATIVE_[TYPE]_[NUMBER]`
- **Vectors**: `VECTOR_[NUMBER]` or `VECTOR_[TYPE]_[NUMBER]`
- **Partners**: `PARTNER_[NUMBER]`

### Benefits of This System

1. **Type Safety**: TypeScript ensures asset IDs are valid
2. **Easy Tracking**: All assets are catalogued in one place
3. **Refactoring**: Change file locations without breaking code
4. **Documentation**: Each asset has a description
5. **Search**: Find assets by description or name
6. **Organization**: Clear folder structure for easy navigation

### Common Asset IDs

#### Logos
- `LOGO_HERO_MAIN` - Main hero logo
- `LOGO_FOOTER` - Footer logo
- `LOGO_ICON` - Icon logo

#### Placeholders
- `PLACEHOLDER_PROPERTY_MAIN` - Default property image
- `PLACEHOLDER_PROFILE` - Default profile image
- `PLACEHOLDER_TESTIMONIAL_PERSON` - Default testimonial avatar

#### Icons
- `ICON_QUOTE_1`, `ICON_QUOTE_2` - Quote icons
- `ICON_BED_0` through `ICON_BED_3` - Bed icons
- `ICON_SHOWER_0` through `ICON_SHOWER_3` - Shower icons

#### Backgrounds
- `BG_HERO_LANDING` - Hero section background
- `BG_CONTACT_US` - Contact page background
- `BG_TESTIMONIALS` - Testimonials section background

## Maintenance

- Keep `asset-manifest.json` in sync with actual files
- Remove unused assets periodically
- Use descriptive IDs that indicate purpose
- Group related assets in the same category

