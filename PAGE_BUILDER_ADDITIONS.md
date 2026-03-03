# Page Builder – Additions (from Listed Property Comparison)

Compared **public listed property page** (`/properties/[id]`) with the **page-builder property page** to find what to add.

## Listed property page has (summary)

| Section | Description |
|--------|-------------|
| **Images** | Main + gallery (page-builder has this) |
| **Price + type** | e.g. `₱X /month` with configurable price type (page-builder has price, type is hardcoded "/mo") |
| **Title + location** | Title and address line (page-builder has hero heading + tagline, no dedicated address) |
| **Agent card** | Name, role, View My Page, Inquire (page-builder has profile card) |
| **Property overview** | Description with “Show more” (page-builder has Property Description) |
| **Property details** | Bedrooms, bathrooms, garage (with icons) – **missing in page-builder** |
| **Amenities** | List of amenities (e.g. Air conditioning, Pool) – **missing in page-builder** |
| **Map** | “Nearby Landmark” + map + “Show on map” – **missing in page-builder** |
| **Inquiry form** | Tabs: Property Inquiry / Comments / Review – page-builder has “Ready to view” contact form |
| **Similar properties** | Grid of related listings – page-builder has “Featured listings” (manual) |

## Recommended additions (in order of impact)

1. **Property Details** – Bedrooms, bathrooms, garage, area (sqm/sqft). Matches “Property Details” on the listing page.
2. **Amenities** – Editable list of amenities (tags/pills). Matches “Amenities” on the listing page.
3. **Price type** – Optional label (e.g. “month”, “year”) so hero CTA can show “/month” or “/year”.
4. **Location / address** – Single line for address or location text (no map yet).
5. **Map section** (later) – Optional “Location” block with map if `latitude`/`longitude` (or address) are stored; reuse `PropertyLocationMap` or similar.

## Implemented in this pass

- **Property Details** section: bedrooms, bathrooms, garage, area (with visibility toggle and layout order).
- **Amenities** section: editable list of amenities (add/remove), with visibility toggle and layout order.
- **Persistence**: New fields saved/loaded in page builder data and section visibility.

## Not implemented (for later)

- **Map section** – Requires map component and lat/lng or geocode; can add when backend supports it.
- **Price type** – Hero still shows “/mo”; can add `propertyPriceType` and use it in hero CTA.
- **Video** – `Property` has `video_url`; could add optional “Property video” section.
