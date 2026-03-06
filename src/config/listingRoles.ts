/**
 * Listing Role Configuration
 *
 * Maps each user role to its role-specific settings for the unified listing form.
 * To add a new role (e.g. developer, owner), add one entry here — no component changes needed.
 */

export interface ListingRoleConfig {
  /** Success redirect path after a listing is submitted */
  successRedirect: string
  /** Path to the listings overview page */
  listingsPath: string
  /** Page title shown in the header */
  headerTitle: string
  /** Page subtitle shown in the header */
  headerSubtitle: string
  /** Breadcrumb / back-link label */
  createListingLabel: string
  /** Optional: restrict which property categories are shown for this role */
  allowedCategories?: string[]
}

export const LISTING_ROLE_CONFIG: Record<string, ListingRoleConfig> = {
  agent: {
    successRedirect: '/agent/listings',
    listingsPath: '/agent/listings',
    headerTitle: 'Create Listing',
    headerSubtitle: 'Add a new property to your portfolio.',
    createListingLabel: 'Create Listing',
  },
  broker: {
    successRedirect: '/broker/listings',
    listingsPath: '/broker/listings',
    headerTitle: 'Create Listing',
    headerSubtitle: 'Add a new property to your portfolio.',
    createListingLabel: 'Create Listing',
  },
  // Extend with future roles here, e.g.:
  // developer: {
  //   successRedirect: '/developer/listings',
  //   listingsPath: '/developer/listings',
  //   headerTitle: 'Create Development Listing',
  //   headerSubtitle: 'List a new development project.',
  //   createListingLabel: 'Create Listing',
  //   allowedCategories: ['House', 'Townhouse', 'Commercial'],
  // },
}

