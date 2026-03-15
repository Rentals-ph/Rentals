// Layout
export { Navbar, Footer } from './layout'

// Home
export {
  Hero,
  HeroSkeleton,
  HeroBanner,
  FeaturedProperties,
  Testimonials,
  Blogs,
  PopularSearches,
  PropertiesForRent,
  Partners,
} from './home'

// Common components moved to @/shared/components
// Use @/shared/components instead

// Agent
export {
  EditPropertyModal,
  LocationMap,
  PropertiesMap,
} from './agent'

// Create listing (agent + broker flows)
export {
  CreateListingChoice,
  CreateListingPage,
  CreateListingStepLayout,
  BasicInfoStepContent,
  VisualsFeaturesStepContent,
  PricingStepContent,
  OwnerReviewStepContent,
} from './create-listing'

// Listing assistant
export {
  ConversationalListingAssistant,
  CreateListingBanner,
  ListingAssistantChat,
  PropertyFormPreview,
  LocationPicker,
  InlineLocationMap,
  FieldStatusBadge,
  MessageBubble,
} from './listing-assistant'

// Page builder
export { PageBuilder } from './page-builder'

// Rent managers
export { PopularRentManagers } from './rent-managers'

// UI (loading, skeletons, wrappers) - re-exported from shared
/**
 * @deprecated UI components are now in @/shared/components/ui
 * Please use @/shared/components/ui instead.
 */
export {
  PageWrapper,
  LoadingSpinner,
  PageLoading,
  LoadingSkeleton,
  PublicPageLoading,
  TableRowSkeleton,
  TableSkeleton,
} from '@/shared/components/ui'

