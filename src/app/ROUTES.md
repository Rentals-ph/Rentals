# Route → Page Mapping

Quick reference to find which `page.tsx` renders each URL. Route groups (in parentheses) don't affect URLs.

## Public Pages `(public)/`

| URL | Page File | Main Components |
|-----|-----------|-----------------|
| `/` | `(public)/page.tsx` | Hero, FeaturedProperties, Testimonials, Blogs, PopularSearches |
| `/about` | `(public)/about/page.tsx` | Navbar, Testimonials, Partners |
| `/blog` | `(public)/blog/page.tsx` | Navbar, Footer, Pagination, BlogCard |
| `/blog/[id]` | `(public)/blog/[id]/page.tsx` | Navbar, Footer, PageHeader |
| `/contact` | `(public)/contact/page.tsx` | Navbar, Footer |
| `/news` | `(public)/news/page.tsx` | Navbar, Footer, NewsArticleSkeleton |
| `/news/[id]` | `(public)/news/[id]/page.tsx` | Navbar, Footer |
| `/properties` | `(public)/properties/page.tsx` | VerticalPropertyCard, PublicPropertiesMap, PopularSearches |
| `/property/[id]` | `(public)/property/[id]/page.tsx` | VerticalPropertyCard, SharePopup, PropertyLocationMap |
| `/rent-managers` | `(public)/rent-managers/page.tsx` | PopularRentManagers |
| `/rent-managers/[id]` | `(public)/rent-managers/[id]/page.tsx` | DigitalProfileCard, HorizontalPropertyCard |

## Auth Pages `(auth)/`

| URL | Page File | Main Components |
|-----|-----------|-----------------|
| `/verify-email` | `(auth)/verify-email/page.tsx` | (inline UI) |

## Dashboard Pages `(dashboard)/`

| URL | Page File | Main Components |
|-----|-----------|-----------------|
| `/admin` | `(dashboard)/admin/page.tsx` | AppSidebar, DashboardHeader |
| `/admin/agents` | `(dashboard)/admin/agents/page.tsx` | AppSidebar, DashboardHeader |
| `/admin/properties` | `(dashboard)/admin/properties/page.tsx` | AppSidebar, DashboardHeader |
| `/agent` | `(dashboard)/agent/page.tsx` | AppSidebar, AgentHeader, EditPropertyModal |
| `/agent/account` | `(dashboard)/agent/account/page.tsx` | AppSidebar, AgentHeader, AccountSettings |
| `/agent/change-password` | `(dashboard)/agent/change-password/page.tsx` | — |
| `/agent/digital-card` | `(dashboard)/agent/digital-card/page.tsx` | AppSidebar, AgentHeader, DigitalBusinessCard |
| `/agent/downloadables` | `(dashboard)/agent/downloadables/page.tsx` | AppSidebar, AgentHeader |
| `/agent/edit-profile` | `(dashboard)/agent/edit-profile/page.tsx` | — |
| `/agent/inbox` | `(dashboard)/agent/inbox/page.tsx` | AppSidebar, AgentHeader |
| `/agent/listing-assistant` | `(dashboard)/agent/listing-assistant/page.tsx` | ConversationalListingAssistant |
| `/agent/listings` | `(dashboard)/agent/listings/page.tsx` | AppSidebar, AgentHeader, PropertiesMap |
| `/agent/page-builder` | `(dashboard)/agent/page-builder/page.tsx` | PageBuilder |
| `/agent/profile` | `(dashboard)/agent/profile/page.tsx` | AppSidebar, AgentHeader |
| `/agent/create-listing` | `(dashboard)/agent/create-listing/page.tsx` | CreateListingPage |
| `/agent/create-listing/*` | `(dashboard)/agent/create-listing/*/page.tsx` | CreateListingStepLayout, AgentHeader |
| `/broker` | `(dashboard)/broker/page.tsx` | AppSidebar, BrokerHeader, CreateListingBanner |
| `/broker/account` | `(dashboard)/broker/account/page.tsx` | AppSidebar, AccountSettings |
| `/broker/approvals` | `(dashboard)/broker/approvals/page.tsx` | AppSidebar |
| `/broker/company-profile` | `(dashboard)/broker/company-profile/page.tsx` | AppSidebar, BrokerHeader |
| `/broker/create-listing` | `(dashboard)/broker/create-listing/page.tsx` | CreateListingPage |
| `/broker/digital-card` | `(dashboard)/broker/digital-card/page.tsx` | AppSidebar, DigitalBusinessCard |
| `/broker/downloadables` | `(dashboard)/broker/downloadables/page.tsx` | AppSidebar, AgentHeader |
| `/broker/inbox` | `(dashboard)/broker/inbox/page.tsx` | AppSidebar |
| `/broker/listing-assistant` | `(dashboard)/broker/listing-assistant/page.tsx` | ConversationalListingAssistant |
| `/broker/listings` | `(dashboard)/broker/listings/page.tsx` | AppSidebar, BrokerHeader, PropertiesMap |
| `/broker/page-builder` | `(dashboard)/broker/page-builder/page.tsx` | PageBuilder |
| `/broker/reports` | `(dashboard)/broker/reports/page.tsx` | AppSidebar, BrokerHeader |
| `/broker/settings` | `(dashboard)/broker/settings/page.tsx` | AppSidebar, AccountSettings |
| `/broker/team` | `(dashboard)/broker/team/page.tsx` | AppSidebar, BrokerHeader |

## CMS

| URL | Page File | Main Components |
|-----|-----------|-----------------|
| `/page/[slug]` | `page/[slug]/page.tsx` | (dynamic CMS content) |
