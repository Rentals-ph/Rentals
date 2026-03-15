# Rentals.ph - Codebase Structure Overview

## 📋 Project Overview
- **Frontend**: Next.js 16 (TypeScript/React)
- **Backend**: Laravel 10 (PHP 8.2+)
- **Architecture**: Full-stack application with separate frontend and backend

---

## 🎨 FRONTEND STRUCTURE

### Root Configuration Files
```
├── package.json              # Next.js dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
└── next-env.d.ts            # Next.js TypeScript definitions
```

### 📁 `/src` - Main Source Directory

#### **`/src/app`** - Next.js App Router Pages
```
app/
├── layout.tsx                # Root layout
├── loading.tsx               # Global loading component
├── not-found.tsx             # 404 page
├── robots.ts                 # SEO robots.txt
├── sitemap.ts                # SEO sitemap generation
├── ROUTES.md                 # Route documentation
│
├── (auth)/                   # Auth route group
│   └── verify-email/
│       └── page.tsx
│
├── (dashboard)/              # Protected dashboard routes
│   ├── admin/                # Admin dashboard
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── agents/
│   │   ├── blogs/
│   │   │   ├── create/
│   │   │   ├── edit/[id]/
│   │   │   └── page.tsx
│   │   ├── contact-inquiries/
│   │   ├── downloadables/
│   │   └── properties/
│   │
│   ├── agent/                # Agent dashboard
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── account/
│   │   ├── change-password/
│   │   ├── create-listing/   # Multi-step listing creation
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── attributes/
│   │   │   ├── basic-info/
│   │   │   ├── category/
│   │   │   ├── details/
│   │   │   ├── location/
│   │   │   ├── manual/
│   │   │   ├── owner-review/
│   │   │   ├── pricing/
│   │   │   ├── property-images/
│   │   │   ├── publish/
│   │   │   └── visuals-features/
│   │   ├── digital-card/
│   │   ├── downloadables/
│   │   ├── edit-profile/
│   │   ├── inbox/
│   │   ├── listing-assistant/
│   │   ├── listings/
│   │   ├── page-builder/
│   │   └── profile/
│   │
│   └── broker/               # Broker dashboard
│       ├── layout.tsx
│       ├── page.tsx
│       ├── account/
│       ├── agents/
│       │   └── create/
│       ├── approvals/
│       ├── company-profile/
│       ├── create-listing/
│       ├── digital-card/
│       ├── downloadables/
│       ├── inbox/
│       ├── listing-assistant/
│       ├── listings/
│       ├── page-builder/
│       ├── reports/
│       ├── settings/
│       └── team/
│
├── (public)/                 # Public-facing routes
│   ├── layout.tsx
│   ├── page.tsx              # Homepage
│   ├── about/
│   ├── agents/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Agents listing
│   │   └── [id]/             # Agent profile
│   ├── blog/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Blog listing
│   │   └── [id]/             # Blog post
│   ├── contact/
│   ├── inquiries/
│   ├── news/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # News listing
│   │   └── [id]/             # News article
│   ├── properties/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Properties listing
│   │   └── [id]/             # Property details
│   ├── property/
│   │   └── [id]/             # Alternative property route
│   └── saved-listings/
│
└── page/
    └── [slug]/               # Dynamic page builder pages
```

#### **`/src/components`** - React Components
```
components/
├── index.ts                  # Component exports
│
├── agent/                    # Agent-specific components
│   ├── EditPropertyModal.tsx
│   ├── EditPropertyModal.css
│   ├── LocationMap.tsx
│   ├── PropertiesMap.tsx
│   └── index.ts
│
├── broker/                   # Broker-specific components
│   └── index.ts
│
├── common/                   # Shared/common components
│   ├── index.ts
│   ├── AccountSettings.tsx
│   ├── AppSidebar.tsx
│   ├── BlogCard.tsx
│   ├── BlogCardSkeleton.tsx
│   ├── DashboardHeader.tsx
│   ├── DigitalBusinessCard.tsx
│   ├── DigitalProfileCard.tsx
│   ├── FadeInOnView.tsx
│   ├── HorizontalPropertyCard.tsx
│   ├── HorizontalPropertyCardSkeleton.tsx
│   ├── ImageUploader.tsx
│   ├── LoginModal.tsx
│   ├── NewsArticleSkeleton.tsx
│   ├── Pagination.tsx
│   ├── Partners.tsx
│   ├── PropertyLocationMap.tsx
│   ├── PropertyMapPopupCard.tsx
│   ├── ProtectedRoute.tsx
│   ├── PublicPropertiesMap.tsx
│   ├── RegisterModal.tsx
│   ├── RentManagerCardSkeleton.tsx
│   ├── SharePopup.tsx
│   ├── SimplePropertyCard.tsx
│   ├── SimplePropertyCardSkeleton.tsx
│   ├── TestimonialCard.tsx
│   ├── TestimonialCardSkeleton.tsx
│   ├── VerticalPropertyCard.tsx
│   ├── VerticalPropertyCardSkeleton.tsx
│   │
│   ├── cards/                # Card components
│   │   └── index.ts
│   │
│   ├── dashboard/            # Dashboard components
│   │   ├── AccountSettings.tsx
│   │   └── index.ts
│   │
│   ├── digital/              # Digital card components
│   │   └── index.ts
│   │
│   ├── maps/                 # Map components
│   │   └── index.ts
│   │
│   ├── misc/                 # Miscellaneous components
│   │   └── index.ts
│   │
│   └── modals/               # Modal components
│       └── index.ts
│
├── create-listing/           # Listing creation components
│   ├── index.ts
│   ├── BasicInfoStepContent.tsx
│   ├── CreateListingChoice.tsx
│   ├── CreateListingPage.tsx
│   ├── CreateListingStepLayout.tsx
│   ├── ManualListingForm.tsx
│   ├── OwnerReviewStepContent.tsx
│   ├── PricingStepContent.tsx
│   └── VisualsFeaturesStepContent.tsx
│
├── home/                     # Homepage components
│   ├── index.ts
│   ├── AgentsShowcase.tsx
│   ├── Blogs.tsx
│   ├── FeaturedProperties.tsx
│   ├── Hero.tsx
│   ├── HeroBanner.tsx
│   ├── HeroSkeleton.tsx
│   ├── PopularExplore.tsx
│   ├── PopularSearches.tsx
│   ├── PropertiesForRent.tsx
│   └── Testimonials.tsx
│
├── layout/                   # Layout components
│   ├── index.ts
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   └── PublicLayoutClient.tsx
│
├── listing/                  # Listing components
│   └── UnifiedListingForm.tsx
│
├── listing-assistant/        # AI listing assistant
│   ├── index.ts
│   ├── ConversationalListingAssistant.tsx
│   ├── CreateListingBanner.tsx
│   ├── FieldStatusBadge.tsx
│   ├── InlineLocationMap.tsx
│   ├── ListingAssistantChat.tsx
│   ├── LocationPicker.tsx
│   ├── MessageBubble.tsx
│   └── PropertyFormPreview.tsx
│
├── page-builder/             # Page builder components
│   ├── index.ts
│   └── PageBuilder.tsx
│
├── properties/                # Property components
│   └── FloatingPropertyChat.tsx
│
└── rent-managers/            # Rent manager components
    ├── index.ts
    └── PopularRentManagers.tsx
```

#### **`/src/shared`** - Shared Utilities & Components
```
shared/
├── index.ts                  # Main exports
│
├── api/                      # Shared API utilities
│   ├── index.ts
│   ├── auth.ts
│   ├── messages.ts
│   └── properties.ts
│
├── components/               # Shared reusable components
│   ├── index.ts
│   │
│   ├── cards/                # Card components
│   │   ├── index.ts
│   │   ├── AgentCard.tsx
│   │   ├── AgentCardSkeleton.tsx
│   │   ├── BlogCard.tsx
│   │   ├── BlogCardSkeleton.tsx
│   │   ├── HorizontalPropertyCard.tsx
│   │   ├── HorizontalPropertyCardSkeleton.tsx
│   │   ├── ModernPropertyCard.tsx
│   │   ├── NewsArticleSkeleton.tsx
│   │   ├── SimplePropertyCard.tsx
│   │   ├── SimplePropertyCardSkeleton.tsx
│   │   ├── SimpleVerticalPropertyCard.tsx
│   │   ├── TestimonialCard.tsx
│   │   ├── TestimonialCardSkeleton.tsx
│   │   ├── VerticalPropertyCard.tsx
│   │   └── VerticalPropertyCardSkeleton.tsx
│   │
│   ├── dashboard/            # Dashboard components
│   │   ├── index.ts
│   │   ├── AccountSettings.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── DownloadablesPage.tsx
│   │   ├── InboxPage.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── digital/              # Digital business cards
│   │   ├── index.ts
│   │   ├── DigitalBusinessCard.tsx
│   │   ├── DigitalProfileCard.tsx
│   │   └── FlippableBusinessCard.tsx
│   │
│   ├── forms/                # Form components
│   │
│   ├── maps/                 # Map components
│   │   ├── index.ts
│   │   ├── PropertyLocationMap.tsx
│   │   ├── PropertyMapPopupCard.tsx
│   │   └── PublicPropertiesMap.tsx
│   │
│   ├── misc/                 # Miscellaneous
│   │   ├── index.ts
│   │   ├── EmptyState.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── Pagination.tsx
│   │   ├── Partners.tsx
│   │   └── SharePopup.tsx
│   │
│   ├── modals/               # Modal components
│   │   ├── index.ts
│   │   ├── BlogModal.tsx
│   │   ├── LoginModal.tsx
│   │   └── RegisterModal.tsx
│   │
│   └── ui/                   # UI primitives
│       ├── index.ts
│       ├── FadeInOnView.tsx
│       ├── LoadingSkeleton.tsx
│       ├── LoadingSpinner.tsx
│       ├── PageLoading.tsx
│       ├── PageWrapper.tsx
│       ├── ProgressRing.tsx
│       ├── PublicPageLoading.tsx
│       └── TableRowSkeleton.tsx
│
├── config/                   # Configuration files
│   ├── index.ts
│   ├── api.ts
│   ├── listing.ts
│   └── seo.ts
│
├── constants/                # Application constants
│   ├── index.ts
│   ├── api.ts
│   ├── listing.ts
│   ├── property.ts
│   ├── roles.ts
│   └── validation.ts
│
├── data/                     # Static data
│   ├── index.ts
│   ├── locations/
│   │   ├── index.ts
│   │   └── philippines.ts
│   └── rentManagers.ts
│
├── forms/                    # Form types & schemas
│   └── types/
│       ├── index.ts
│       ├── account.ts
│       ├── agent.ts
│       ├── auth.ts
│       └── property.ts
│
├── hooks/                    # Shared React hooks
│   ├── index.ts
│   ├── useApi.ts
│   └── useAsyncEffect.ts
│
├── schemas/                  # Zod validation schemas
│   ├── index.ts
│   ├── account.ts
│   ├── agent.ts
│   ├── auth.ts
│   ├── common.ts
│   └── property.ts
│
├── types/                    # TypeScript types
│   └── index.ts
│
└── utils/                    # Utility functions
    ├── index.ts
    ├── format.ts
    └── image.ts
```

#### **`/src/api`** - API Client & Endpoints
```
api/
├── index.ts                  # Main API exports
├── client.ts                 # Axios client configuration
│
├── endpoints/                # API endpoint definitions
│   ├── admin.ts
│   ├── agents.ts
│   ├── auth.ts
│   ├── blogs.ts
│   ├── broker.ts
│   ├── contact.ts
│   ├── downloadables.ts
│   ├── listingAssistant.ts
│   ├── messages.ts
│   ├── news.ts
│   ├── pageBuilder.ts
│   ├── properties.ts
│   └── testimonials.ts
│
└── types/                    # API type definitions
    ├── (6 TypeScript files)
```

#### **`/src/contexts`** - React Context Providers
```
contexts/
├── CreateListingContext.tsx
└── PublicSidebarContext.tsx
```

#### **`/src/hooks`** - Custom React Hooks
```
hooks/
├── index.ts
├── useApi.ts
├── useAsyncEffect.ts
├── useListingConversation.ts
└── useSavedProperties.ts
```

#### **`/src/types`** - TypeScript Type Definitions
```
types/
├── index.ts
└── listingAssistant.ts
```

#### **`/src/utils`** - Utility Functions
```
utils/
├── index.ts
├── assets.ts
└── toast.tsx
```

### 📁 `/public` - Static Assets
```
public/
└── assets/
    ├── asset-manifest.json
    ├── backgrounds/          # 15 PNG files
    ├── decorative/           # 9 SVG files
    ├── frames/               # 2 SVG files
    ├── groups/               # 24 SVG files
    ├── icons/                # 49 SVG files
    ├── images/               # 45 PNG, 1 JPG
    ├── logos/                # 16 PNG, 3 SVG
    ├── partners/             # 4 PNG files
    └── vectors/              # 9 SVG files
```

### 📁 `/scripts` - Utility Scripts
```
scripts/
├── migrate-assets-to-storage.js
├── organize-assets.js
└── test-grok-api.mjs
```

---

## ⚙️ BACKEND STRUCTURE

### Root Configuration Files
```
├── composer.json             # PHP dependencies
├── composer.lock             # Dependency lock file
├── artisan                   # Laravel CLI
├── nixpacks.toml            # Deployment config
├── Procfile                  # Process file
├── railway.json              # Railway deployment config
└── railwayignore            # Railway ignore file
```

### 📁 `/backend/app` - Application Core

#### **`/app/Http/Controllers`** - API Controllers
```
Controllers/
├── Controller.php            # Base controller
├── GroqChatController.php    # AI chat controller
├── ListingAssistantController.php
├── PropertySearchController.php
├── StorageController.php
│
├── Api/
│   ├── Admin/
│   │   └── AdminController.php
│   │
│   ├── Agent/
│   │   └── AgentController.php
│   │
│   ├── Analytics/            # Analytics controllers
│   │   ├── BlogCommentController.php
│   │   ├── BlogCommentLikeController.php
│   │   ├── BlogLikeController.php
│   │   ├── BlogViewController.php
│   │   ├── NewsCommentController.php
│   │   ├── NewsLikeController.php
│   │   ├── NewsViewController.php
│   │   ├── ProfileViewController.php
│   │   └── PropertyViewController.php
│   │
│   ├── Broker/
│   │   └── BrokerController.php
│   │
│   ├── Shared/               # Shared/public endpoints
│   │   ├── AuthController.php
│   │   ├── BlogController.php
│   │   ├── ContactController.php
│   │   ├── DownloadableController.php
│   │   ├── MessageController.php
│   │   ├── NewsController.php
│   │   ├── PageBuilderController.php
│   │   ├── PropertyController.php
│   │   ├── TestimonialController.php
│   │   └── UploadController.php
│   │
│   └── Tenant/               # Tenant-specific endpoints
│       ├── ChatRoomController.php
│       ├── NotificationController.php
│       ├── ReviewController.php
│       ├── SavedPropertyController.php
│       └── TenantAuthController.php
│
└── Concerns/                 # Controller traits
    ├── FormatsValidationErrors.php
    └── RequiresBroker.php
```

#### **`/app/Models`** - Eloquent Models (34 models)
```
Models/
├── Admin.php
├── Agent.php
├── Blog.php
├── BlogComment.php
├── BlogCommentLike.php
├── BlogLike.php
├── BlogView.php
├── BrokerPlan.php
├── BrokerSubscription.php
├── ChatMessage.php
├── ChatRoom.php
├── Company.php
├── ContactInquiry.php
├── Conversation.php
├── ConversationContext.php
├── ConversationMessage.php
├── Downloadable.php
├── GuestSession.php
├── InquiryConversation.php
├── ListingAssistantConversation.php
├── Media.php
├── Message.php
├── News.php
├── NewsComment.php
├── NewsLike.php
├── NewsView.php
├── PageBuilder.php
├── ProfileView.php
├── Property.php
├── PropertyView.php
├── Review.php
├── SavedProperty.php
├── Team.php
├── TeamMember.php
├── TenantProfile.php
├── Testimonial.php
├── User.php
└── UserNotification.php
```

#### **`/app/Http/Middleware`** - HTTP Middleware
```
Middleware/
├── Authenticate.php
├── Cors.php
├── EncryptCookies.php
├── GuestSessionMiddleware.php
├── PreventRequestsDuringMaintenance.php
├── TrimStrings.php
├── TrustProxies.php
└── VerifyCsrfToken.php
```

#### **`/app/Services`** - Business Logic Services
```
Services/
├── ConversationService.php
├── GroqService.php              # AI/Groq integration
├── ImageService.php
└── ListingAssistantService.php
```

#### **`/app/Traits`** - Reusable Traits
```
Traits/
├── HasMedia.php
└── HasSlug.php
```

#### **`/app/Observers`** - Model Observers
```
Observers/
└── (8 observer files)
```

#### **`/app/Providers`** - Service Providers
```
Providers/
├── AppServiceProvider.php
└── RouteServiceProvider.php
```

#### **`/app/Console/Commands`** - Artisan Commands
```
Commands/
└── (1 command file)
```

#### **`/app/Mail`** - Email Classes
```
Mail/
└── EmailVerificationMail.php
```

### 📁 `/backend/routes` - Route Definitions
```
routes/
├── api.php                   # API routes
├── web.php                   # Web routes
├── console.php               # Console routes
└── api/                      # Additional API route files
```

### 📁 `/backend/database` - Database

#### **`/database/migrations`** - Database Migrations (83 files)
```
migrations/
├── Core Tables:
│   ├── create_users_table.php
│   ├── create_properties_table.php
│   ├── create_agents_table.php
│   ├── create_admins_table.php
│   ├── create_companies_table.php
│   ├── create_teams_table.php
│   └── create_team_members_table.php
│
├── Content Tables:
│   ├── create_blogs_table.php
│   ├── create_news_table.php
│   ├── create_testimonials_table.php
│   └── create_downloadables_table.php
│
├── Engagement Tables:
│   ├── create_blog_views_table.php
│   ├── create_blog_likes_table.php
│   ├── create_blog_comments_table.php
│   ├── create_blog_comment_likes_table.php
│   ├── create_news_views_table.php
│   ├── create_news_likes_table.php
│   ├── create_news_comments_table.php
│   ├── create_property_views_table.php
│   └── create_profile_views_table.php
│
├── Communication Tables:
│   ├── create_conversations_table.php
│   ├── create_conversation_messages_table.php
│   ├── create_conversation_contexts_table.php
│   ├── create_messages_table.php
│   ├── create_chat_rooms_table.php
│   └── create_chat_messages_table.php
│
├── Listing & Assistant:
│   ├── create_listing_assistant_conversations_table.php
│   └── (conversational listing fields)
│
├── Tenant Features:
│   ├── create_tenant_profiles_table.php
│   ├── create_guest_sessions_table.php
│   ├── create_reviews_table.php
│   ├── create_saved_properties_table.php
│   └── create_user_notifications_table.php
│
├── Broker Features:
│   ├── create_broker_plans_table.php
│   ├── create_broker_subscriptions_table.php
│   └── create_broker_reports_table.php
│
├── Other:
│   ├── create_page_builders_table.php
│   ├── create_media_table.php
│   ├── create_contact_inquiries_table.php
│   ├── create_inquiry_conversations_table.php
│   └── create_email_verification_tokens_table.php
│
└── (Many additional migration files for schema updates)
```

#### **`/database/seeders`** - Database Seeders
```
seeders/
└── (2 seeder files)
```

### 📁 `/backend/config` - Configuration Files
```
config/
├── app.php
├── auth.php
├── cors.php
├── database.php
├── filesystems.php
├── l5-swagger.php           # API documentation
├── logging.php
├── mail.php
├── session.php
└── view.php
```

### 📁 `/backend/resources` - Resources
```
resources/
└── views/
    ├── emails/              # Email templates
    │   └── (2 PHP files)
    └── vendor/              # Vendor views
        └── (18 files)
```

### 📁 `/backend/public` - Public Directory
```
public/
├── index.php                # Entry point
└── storage/                  # Storage symlink
```

### 📁 `/backend/storage` - Storage
```
storage/
├── api-docs/                # API documentation
│   └── api-docs.json
├── app/
│   └── public/              # Public storage
├── framework/               # Framework files
└── logs/                    # Application logs
```

### 📁 `/backend/bootstrap` - Bootstrap Files
```
bootstrap/
├── app.php
└── cache/
    ├── packages.php
    └── services.php
```

---

## 🔑 Key Features & Modules

### Frontend Features
- ✅ **Multi-role Dashboard** (Admin, Agent, Broker, Tenant)
- ✅ **Property Listing Management** (Multi-step creation flow)
- ✅ **AI Listing Assistant** (Conversational listing creation)
- ✅ **Page Builder** (Dynamic page creation)
- ✅ **Digital Business Cards**
- ✅ **Property Search & Filtering**
- ✅ **Blog & News System**
- ✅ **Messaging/Chat System**
- ✅ **Map Integration** (Leaflet/MapLibre)
- ✅ **Authentication & Authorization**
- ✅ **Saved Properties**
- ✅ **Reviews & Ratings**

### Backend Features
- ✅ **RESTful API** (Laravel)
- ✅ **Multi-role Authentication** (Sanctum)
- ✅ **AI Integration** (Groq/OpenAI)
- ✅ **File Upload & Media Management**
- ✅ **Analytics Tracking** (Views, Likes, Comments)
- ✅ **Email System**
- ✅ **API Documentation** (Swagger/L5-Swagger)
- ✅ **Database Migrations** (83 migrations)
- ✅ **Model Observers**
- ✅ **Service Layer Architecture**

---

## 📊 Technology Stack Summary

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Maps**: Leaflet, MapLibre GL
- **Forms**: Zod validation
- **HTTP Client**: Axios
- **Drag & Drop**: @dnd-kit
- **Rich Text**: @puckeditor/core

### Backend
- **Framework**: Laravel 10
- **Language**: PHP 8.2+
- **API**: RESTful API
- **Auth**: Laravel Sanctum
- **Database**: MySQL/PostgreSQL (via migrations)
- **AI**: OpenAI PHP Client, Groq
- **Documentation**: L5-Swagger
- **File Storage**: Laravel Filesystem

---

## 📈 Statistics

- **Frontend Components**: ~150+ React components
- **Backend Controllers**: 34+ controllers
- **Backend Models**: 34+ Eloquent models
- **Database Migrations**: 83 migrations
- **API Endpoints**: 13+ endpoint modules
- **Routes**: Multiple route groups (admin, agent, broker, tenant, public)

---

*Generated: Codebase Structure Analysis*
*Last Updated: 2024*

