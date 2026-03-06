# Listing Creation Summary

## Overview
The Rental.ph platform supports two methods for creating property listings:
1. **Manual Listing** - Traditional form-based approach
2. **AI Listing Assistant** - Conversational AI-guided approach

---

## 1. Manual Listing Creation

### Flow
- **Entry Point**: `/agent/create-listing/manual` or `/broker/create-listing/basic-info`
- **Form Structure**: Single-page form with 7 sections displayed sequentially
- **Progress Tracking**: Visual progress indicator showing completion percentage

### Sections
1. **Category** - Select property type (Apartment/Condo, House, Townhouse, Studio, Bedspace, Commercial, Office, Warehouse)
2. **Details** - Title, description, bedrooms, bathrooms, garage, floor area, lot area
   - Includes AI description generation button (optional)
3. **Location** - Country, state/province, city, street address with map integration
   - Auto-geocoding from street address
   - Interactive map for location selection
4. **Property Images** - Upload multiple images (minimum 5 recommended)
   - Drag-and-drop or file picker
   - Thumbnail previews
   - Optional video URL
5. **Pricing** - Price amount and type (Monthly, Weekly, Daily, Yearly)
6. **Attributes** - Amenities selection (checkboxes)
7. **Review & Publish** - Summary view with edit links, save draft, and publish button

### Key Features
- **Data Persistence**: Uses React Context (`CreateListingContext`) to maintain form state
- **Image Processing**: Automatic compression (max 1920x1920px, 2MB) before upload
- **Upload Progress**: Real-time progress bar during submission
- **Validation**: Requires category, title, price, and minimum 5 images to publish
- **AI Description**: Optional AI-generated description using property details

### Detailed Process Flow

#### Initialization
1. User navigates to `/agent/create-listing/manual`
2. `CreateListingPage` component renders `CreateListingChoice`
3. User selects "Manual Listing" option
4. `ManualListingForm` component loads
5. `CreateListingContext` initializes with default empty values
6. Form state synced to context on mount

#### Data Entry Process
1. **Category Selection**
   - User selects from dropdown (8 property types)
   - State updates: `setCategory(value)`
   - Context sync: `updateData({ category })`

2. **Property Details Entry**
   - User fills title, description, bedrooms, bathrooms, garage, floor area, lot area
   - Each field updates local state immediately
   - Optional: Click "AI Generate" button for description
     - API call: `POST /api/generate-property-description`
     - Returns AI-generated description
     - Updates description field

3. **Location Selection**
   - User selects country (default: Philippines)
   - User selects state/province from dropdown
   - City dropdown populates based on selected state
   - User enters street address
   - **Auto-geocoding Process** (when street address > 10 chars):
     - API call: `GET https://nominatim.openstreetmap.org/search`
     - Extracts latitude, longitude, state, city from response
     - Updates location fields automatically
   - User can also use interactive map (`LocationMap` component)
     - Click on map sets coordinates
     - Reverse geocoding populates address fields

4. **Image Upload**
   - User drags/drops or selects files via file picker
   - Files filtered to image types only
   - **Thumbnail Generation Process**:
     - Each image processed: `createThumbnail(file, 200)`
     - Thumbnails stored in component state
   - Images stored in state array
   - User can remove images (revokes blob URLs)

5. **Pricing Entry**
   - User enters price amount
   - User selects price type (Monthly/Weekly/Daily/Yearly)
   - Both values stored in state

6. **Amenities Selection**
   - User checks/unchecks amenity checkboxes
   - Amenities array updated: `setAmenities(prev => [...prev, amenity])`

#### Submission Process
1. **Pre-submission Validation**
   - Check: `category`, `title`, `price` are filled
   - Check: At least 5 images uploaded
   - Disable publish button if validation fails

2. **Image Compression**
   - Set `isCompressing = true`
   - Compress first image: `compressImage(images[0], { maxWidth: 1920, maxHeight: 1920, quality: 0.85, maxSizeMB: 2 })`
   - If compression fails, use original image
   - Set `isCompressing = false`

3. **FormData Construction**
   - Create new `FormData` object
   - Append all property fields:
     - `title`, `description`, `type`, `location`, `price`, `price_type`
     - `bedrooms`, `bathrooms`, `garage`, `area`, `lot_area`, `floor_area_unit`
     - `amenities` (JSON stringified)
     - Location data: `latitude`, `longitude`, `country`, `state_province`, `city`, `street_address`
     - `video_url` (if provided)
     - `image` (compressed first image)

4. **Upload with Progress**
   - Get auth token from localStorage
   - Call `uploadWithProgress()` utility:
     - Uses XMLHttpRequest for progress tracking
     - Uploads to: `${API_BASE_URL}/properties`
     - Progress callback updates `uploadProgress` state
     - Returns response object

5. **Response Handling**
   - Parse JSON response
   - If success:
     - Reset context data: `resetData()`
     - Set upload progress to 100%
     - Show success alert
     - Redirect to `/agent/listings`
   - If error:
     - Display error message
     - Reset upload progress to 0

6. **Cleanup**
   - Revoke all blob URLs for thumbnails
   - Clear form state

---

## 2. AI Listing Assistant

### Flow
- **Entry Point**: `/agent/listing-assistant` or `/broker/listing-assistant`
- **Interface**: Chat-based conversational UI with step-by-step guidance
- **Conversation Management**: Each session creates a unique conversation ID for state persistence

### Step-by-Step Process

#### Required Fields (Guided Flow)
1. **Property Name** - User provides listing title
2. **Property Type** - Button selection (house, condo, apartment, townhouse, studio, bedspace, warehouse, office, lot, commercial)
3. **Location** - Text input or map selection with "Use current position" option
4. **Price** - Numeric input (supports shorthand: "7.5M", "25k")
5. **Price Type** - Button selection (Monthly, Weekly, Daily, Yearly)
6. **Bedrooms** - Button selection (Studio, 1, 2, 3, 4, 5+)
7. **Bathrooms** - Button selection (1, 2, 3, 4+)
8. **Area (sqm)** - Optional numeric input (can skip)

#### Optional Fields (After Required Fields)
- User can choose to add more details or skip
- Optional fields include: address, lot area, parking slots, amenities, furnishing status, HOA fee, property age, floor level, title type, listing status
- Multi-select amenities with custom input option
- Guided through each selected optional field

#### Images & Description
- **Images**: Upload step with file picker (max 30 images, 10MB each)
- **Description**: 
  - Optional text input for agent context
  - AI-generated descriptions with 5 template styles:
    - Narrative (flowing paragraphs)
    - Bulleted (feature-focused list)
    - Short (punchy 2-3 sentences)
    - Luxury (sophisticated high-end)
    - Storytelling (emotional narrative)
  - Can switch templates to preview different styles

#### Review & Submit
- Final review of all collected data
- Submit button creates actual property listing
- Success popup with options to create another or view listings

### Key Features
- **AI-Powered Extraction**: Uses AI (Gemini/Groq/OpenAI) to extract property data from natural language
- **Context Awareness**: AI understands conversation context and doesn't re-ask filled fields
- **Auto-Save**: Automatically saves progress after each step (debounced)
- **Button-Driven Flow**: Quick selection buttons for common choices (property type, bedrooms, etc.)
- **Progress Tracking**: Visual progress bar showing completion percentage
- **Data Validation**: Real-time validation with warnings for unusual values
- **Conversation History**: Maintains full message history for context
- **Resume Capability**: Can resume previous conversations using conversation ID

### Backend Architecture
- **Service Layer**: `ListingAssistantService` handles AI communication and data extraction
- **Controller**: `ListingAssistantController` manages API endpoints
- **Model**: `ListingAssistantConversation` stores conversation state in database
- **AI Integration**: Supports multiple providers (Gemini, Groq, OpenAI) via unified interface

### Detailed Process Flow

#### Initialization Process
1. User navigates to `/agent/listing-assistant`
2. `ConversationalListingAssistant` component mounts
3. **Conversation Initialization**:
   - If `initialConversationId` provided:
     - API call: `GET /listing/assistant/{conversationId}`
     - Load existing conversation state
     - Restore messages, extracted data, current step
   - If no conversation ID:
     - API call: `POST /listing/assistant/new`
     - Backend creates new `ListingAssistantConversation` record
     - Returns: `conversation_id`, welcome message, empty `extracted_data`
   - Set state: `conversationId`, `messages`, `extractedData`, `currentStep`

#### Message Processing Flow (Text Input)
1. **User Input**
   - User types message in input field
   - Presses Enter or clicks send button
   - Message added to local messages array (user role)

2. **API Request**
   - API call: `POST /listing/assistant`
   - Payload: `{ message: string, conversation_id: string }`
   - Backend process:
     - Get/create conversation from database
     - Add user message to conversation history
     - **Heuristic Pre-processing** (for simple replies):
       - If property_name missing and last assistant message asked for name → set directly
       - If price missing and last assistant message asked for price → parse and set directly
     - Call `ListingAssistantService->processMessage()`

3. **AI Processing** (Backend)
   - **Data Extraction**:
     - Call `parseAgentMessage()` with message, history, current data
     - AI extraction prompt sent to AI provider (Gemini/Groq/OpenAI)
     - AI returns JSON: `{ extracted_data: {...}, skipped_fields: [...] }`
     - Merge new data with existing data
   - **Missing Fields Identification**:
     - Compare extracted data against required fields
     - Return array of missing field names
   - **AI Response Generation**:
     - Generate conversational response based on:
       - What was just extracted
       - What fields are still missing
       - Conversation context
     - AI returns natural language response
   - **Validation**:
     - Check for unusual values (price too low/high, too many bedrooms, etc.)
     - Generate warnings array
   - **Step Determination**:
     - Calculate next step based on missing fields
     - Update `current_step` in conversation

4. **Response Handling** (Frontend)
   - Receive response: `{ extracted_data, missing_fields, ai_response, form_ready, current_step, warnings }`
   - Update state:
     - `setExtractedData(response.extracted_data)`
     - `setMissingFields(response.missing_fields)`
     - `setCurrentStep(response.current_step)`
     - Add AI message to messages array
   - **Auto-save** (debounced 1 second):
     - API call: `POST /listing/assistant/{id}/auto-save`
     - Saves current step and extracted data

5. **Step Progression**
   - If step changed, call `handleNextStep(newStep)`
   - Display appropriate UI for new step (buttons, input, map, etc.)

#### Button Selection Flow
1. **User Clicks Button** (e.g., "House" for property type)
2. **Field Selection Handler**:
   - Call `handleFieldSelection('property_type', 'house')`
   - Add user message showing selection
   - API call: `POST /listing/assistant/{id}/set-field`
     - Payload: `{ field: 'property_type', value: 'house', next_step: 'location' }`
   - Backend:
     - Update extracted data: `conversation->updateExtractedData([field => value])`
     - Update current step if provided
     - Generate AI confirmation response
     - Identify missing fields
     - Return updated state

3. **Response Handling**:
   - Update extracted data
   - Add AI confirmation message
   - Move to next step after 500ms delay

#### Location Selection Process
1. **Map Selection**:
   - User clicks on map (`InlineLocationMap` component)
   - Map click handler receives lat/lng
   - API call: `POST /listing/assistant/{id}/map-coordinates`
     - Saves coordinates to extracted data
   - User confirms location
   - Reverse geocode to get address string
   - API call: `POST /listing/assistant/{id}/set-field`
     - Field: `location`, Value: address string
   - Move to next step (price)

2. **Current Position**:
   - User clicks "Use current position" button
   - Browser geolocation API called
   - On success:
     - Reverse geocode coordinates to address
     - Save coordinates: `POST /listing/assistant/{id}/map-coordinates`
     - Set location field: `POST /listing/assistant/{id}/set-field`
   - On error: Display error message

#### Optional Fields Flow
1. **Optional Fields Prompt**:
   - After all required fields filled, AI asks: "Would you like to add more details?"
   - User selects "Yes" or "No"
   - If "Yes":
     - Show optional field selection buttons
     - User selects which fields to fill (multi-select)
     - User clicks "Done, continue"

2. **Field-by-Field Collection**:
   - For each selected optional field:
     - Display prompt: "What is the [field name]?"
     - Show buttons if field has predefined options (furnishing_status, status, etc.)
     - User provides value (text input or button)
     - Update extracted data
     - Move to next optional field
   - After all selected fields filled, move to images step

#### Image Upload Process
1. **Upload Initiation**:
   - User clicks "Upload Images" button
   - File input triggered
   - User selects files (max 30 per batch, 10MB each)

2. **File Validation**:
   - Check file types: JPEG, PNG, GIF, WebP only
   - Check file sizes: max 10MB per file
   - Filter valid files

3. **Upload Request**:
   - API call: `POST /listing/assistant/{id}/upload-images`
   - FormData with `images[]` array
   - Backend:
     - Validate files
     - Store in: `storage/app/public/listing-assistant/{conversationId}/`
     - Generate unique filenames: `listing_{uniqid}_{timestamp}.{ext}`
     - Create image metadata objects:
       ```json
       {
         "path": "listing-assistant/.../filename.jpg",
         "url": "https://.../storage/.../filename.jpg",
         "original_name": "photo.jpg",
         "size": 1234567,
         "mime_type": "image/jpeg"
       }
       ```
     - Merge with existing images in extracted_data
     - Save conversation

4. **Response Handling**:
   - Update extracted data with new images array
   - Display success message
   - Show image thumbnails in grid

#### Description Generation Process
1. **Description Step**:
   - User reaches description step after images
   - Optional textarea for agent context/notes

2. **Template Selection**:
   - User selects description template (Narrative, Bulleted, Short, Luxury, Storytelling)
   - API call: `POST /listing/assistant/{id}/generate-description`
     - Payload: `{ template: 'narrative', agent_context: '...' }`
   - Backend validation:
     - Check minimum required fields: property_type, location, price, price_type, bedrooms
     - If insufficient, return error

3. **AI Description Generation** (Backend):
   - Build prompt with:
     - Property data (JSON)
     - Agent context (if provided)
     - Template-specific instructions
   - Call AI provider with description generation prompt
   - AI returns generated description text
   - Save to extracted_data:
     - `description`: Generated text
     - `description_template`: Selected template
     - `ai_generated_description`: Generated text

4. **Response Handling**:
   - Display generated description in preview box
   - User can switch templates to regenerate
   - User clicks "Continue to Review" when satisfied

#### Review & Submit Process
1. **Review Step**:
   - All required fields validated
   - `form_ready = true`
   - Display review UI with submit button

2. **Submit Request**:
   - API call: `POST /listing/assistant/{id}/submit`
   - Backend validation:
     - Check `conversation->isFormReady()`
     - If not ready, return error with missing fields

3. **Property Creation** (Backend):
   - Extract image paths from `extracted_data.images[]`
   - Map extracted data to Property model fields:
     - `title` ← `property_name`
     - `type` ← `property_type` (mapped to database format)
     - `price`, `price_type` ← mapped values
     - `bedrooms`, `bathrooms` ← integer values
     - `garage` ← `parking_slots`
     - `area` ← `area_sqm`
     - `amenities` ← array
     - `furnishing` ← `furnishing_status` (mapped)
     - Location fields: `city`, `street_address`, `latitude`, `longitude`
     - `image_path` ← first image path
     - `images` ← all image paths array
     - `agent_id` ← authenticated user ID
     - `published_at` ← current timestamp
     - `draft_status` ← 'published'
   - Create Property record in database
   - Update conversation status to 'submitted'
   - Return: `{ success: true, property_id: 123 }`

4. **Success Handling**:
   - Display success popup with property name
   - Options:
     - "Create another listing" → Start new conversation
     - "Go to listings" → Navigate to listings page

#### Auto-Save Process
1. **Trigger**:
   - After any data change in `extractedData`
   - Debounced with 1 second delay
   - Only if conversation ID exists

2. **Auto-Save Request**:
   - API call: `POST /listing/assistant/{id}/auto-save`
   - Payload: `{ current_step: 'price', data: {...extractedData} }`
   - Backend:
     - Update conversation's `current_step`
     - Merge provided data with existing extracted_data
     - Save conversation record
   - No UI feedback (silent save)

### API Endpoints
- `POST /listing/assistant/new` - Start new conversation
- `POST /listing/assistant` - Process user message
- `POST /listing/assistant/{id}/set-field` - Set field via button
- `POST /listing/assistant/{id}/upload-images` - Upload images
- `POST /listing/assistant/{id}/generate-description` - Generate AI description
- `POST /listing/assistant/{id}/submit` - Submit listing
- `GET /listing/assistant/{id}` - Get conversation state
- `POST /listing/assistant/{id}/auto-save` - Save draft progress
- `POST /listing/assistant/{id}/map-coordinates` - Save map coordinates

---

## Data Flow & State Management

### Manual Listing - Data Flow

```
User Input → Component State → Context API → FormData → API Endpoint → Database
     ↓              ↓               ↓            ↓            ↓           ↓
  Form Fields   Local State    Global State   Serialized   Backend    Property
  (Category,    (useState)     (Context)      (FormData)   (Laravel)  Record
   Title, etc.)                                                         Created
```

**State Management:**
- **Local State**: Each form field uses `useState` for immediate UI updates
- **Context State**: `CreateListingContext` maintains form data across components
- **Sync Process**: `syncToContext()` called before submission to ensure latest data
- **Persistence**: Session-based (lost on page refresh unless saved to backend)

**Data Transformation:**
1. User input → String/Number/Array types
2. Location data → Geocoded coordinates (lat/lng)
3. Images → File objects → Compressed File → FormData
4. Amenities → Array → JSON stringified
5. All fields → FormData object → Multipart request

### AI Listing Assistant - Data Flow

```
User Message → API Request → AI Processing → Database → Response → UI Update
     ↓              ↓              ↓            ↓          ↓          ↓
  Text Input    POST /assistant   Extract Data  Save to    Return    Update
  or Button     with message     via AI        DB         State     Messages
```

**State Management:**
- **Component State**: React hooks (`useState`) for UI state
- **Server State**: Conversation data stored in database
- **Sync Process**: 
  - Real-time: Updates on each API response
  - Auto-save: Debounced saves every 1 second after data changes
  - Resume: Can reload conversation state from database

**Data Transformation:**
1. **User Input** → Natural language text or button value
2. **AI Extraction** → JSON structure with extracted fields
3. **Data Merging** → Merge new data with existing extracted_data
4. **Field Mapping** → Map AI field names to database schema
5. **Property Creation** → Transform extracted_data to Property model

**Conversation State Structure:**
```json
{
  "conversation_id": "listing_abc123_1234567890",
  "user_id": 1,
  "extracted_data": {
    "property_name": "Beautiful House",
    "property_type": "house",
    "location": "Quezon City",
    "price": 5000000,
    "price_type": "Monthly",
    "bedrooms": 3,
    "bathrooms": 2,
    "images": [...],
    "description": "..."
  },
  "skipped_fields": [],
  "messages": [
    {"role": "assistant", "content": "...", "timestamp": "..."},
    {"role": "user", "content": "...", "timestamp": "..."}
  ],
  "current_step": "images",
  "status": "in_progress"
}
```

### AI Processing Pipeline

```
User Message
    ↓
[Heuristic Pre-processing]
    ↓ (if simple reply to specific question)
Direct Field Setting
    ↓
[AI Extraction]
    ↓
JSON Extraction Result
    ↓
[Merge with Existing Data]
    ↓
[Identify Missing Fields]
    ↓
[Generate AI Response]
    ↓
[Validate Data]
    ↓
[Determine Next Step]
    ↓
Response to Frontend
```

**AI Provider Flow:**
1. **Request Construction**:
   - Build system prompt with context
   - Include conversation history (last 4-6 messages)
   - Include current extracted data
   - Include missing fields list

2. **AI Call**:
   - Provider: Gemini / Groq / OpenAI
   - Model: Configured via environment variables
   - Temperature: 0.1-0.7 (lower for extraction, higher for responses)
   - Max Tokens: 300-1000 depending on task

3. **Response Parsing**:
   - Extract JSON from response (for data extraction)
   - Parse natural language (for conversational responses)
   - Handle errors and fallbacks

---

## Comparison

| Feature | Manual Listing | AI Listing Assistant |
|---------|---------------|---------------------|
| **User Experience** | Form-based, all fields visible | Conversational, step-by-step |
| **Speed** | Faster for experienced users | Guided for new users |
| **Flexibility** | Full control over all fields | Guided flow with optional fields |
| **AI Features** | Optional description generation | Full AI extraction & generation |
| **Learning Curve** | Requires knowledge of all fields | Beginner-friendly, guided |
| **Data Entry** | Manual typing/selection | Natural language + buttons |
| **Progress Saving** | Context-based (session) | Database-backed (persistent) |
| **Image Upload** | Single batch upload | Step-by-step upload |
| **Description** | Manual or AI-generated | Multiple AI template styles |

---

## Technical Stack

### Frontend
- **Framework**: Next.js with React
- **State Management**: React Context API (Manual), Component State + API (AI Assistant)
- **UI Components**: Custom components with Tailwind CSS
- **Maps**: Leaflet.js for location selection
- **Image Processing**: Client-side compression utilities

### Backend
- **Framework**: Laravel (PHP)
- **AI Integration**: OpenAI-compatible client (supports Gemini, Groq, OpenAI)
- **Storage**: Laravel Storage for images
- **Database**: MySQL/PostgreSQL for conversation persistence
- **API**: RESTful endpoints with OpenAPI documentation

---

## Process Comparison

### Step-by-Step Comparison

| Step | Manual Listing | AI Listing Assistant |
|------|---------------|---------------------|
| **1. Initiation** | Navigate to form page | Start conversation (auto or manual) |
| **2. Property Type** | Select from dropdown | Button selection or text input |
| **3. Basic Info** | Fill all fields at once | Guided one-by-one (name, type, location) |
| **4. Location** | Select + map + geocoding | Text input OR map OR current position |
| **5. Pricing** | Enter amount + select type | Enter amount → AI asks for type |
| **6. Details** | Fill bedrooms, bathrooms, etc. | Guided questions with buttons |
| **7. Optional Fields** | All visible, fill as needed | Choose which to add, guided flow |
| **8. Images** | Upload all at once (min 5) | Upload step-by-step (optional) |
| **9. Description** | Manual write OR AI generate | AI generate with 5 template styles |
| **10. Review** | Scroll through all sections | Review extracted data summary |
| **11. Submit** | Single submit action | Submit when form_ready = true |
| **12. Success** | Redirect to listings | Popup with create another option |

### Key Process Differences

**Manual Listing:**
- **Parallel Processing**: User can fill multiple fields simultaneously
- **Visual Overview**: All sections visible, can jump between sections
- **Batch Operations**: Upload all images at once
- **Immediate Validation**: See all requirements upfront
- **No Persistence**: Data lost on refresh (unless saved to backend)

**AI Listing Assistant:**
- **Sequential Processing**: One field at a time, guided flow
- **Contextual Guidance**: AI adapts based on what's already filled
- **Incremental Operations**: Upload images as you go
- **Progressive Validation**: Only see what's needed next
- **Full Persistence**: Auto-saved to database, can resume anytime

---

## Quick Reference

### Manual Listing - Required Fields
- ✅ Category (property type)
- ✅ Title
- ✅ Price
- ✅ Price Type
- ✅ Location (country, state, city, street)
- ✅ Minimum 5 images
- ⚠️ Description (optional, can use AI)
- ⚠️ Bedrooms, Bathrooms, Garage (optional)
- ⚠️ Amenities (optional)

### AI Listing Assistant - Required Fields
- ✅ Property Name
- ✅ Property Type
- ✅ Location
- ✅ Price
- ✅ Price Type
- ✅ Bedrooms
- ✅ Bathrooms
- ⚠️ Area (sqm) - can skip
- ⚠️ Images - can skip
- ⚠️ Description - can skip (but recommended)

### Validation Rules

**Manual Listing:**
- Category must be selected
- Title must not be empty
- Price must be a valid number
- Minimum 5 images required
- Location must have at least city or state

**AI Listing Assistant:**
- All 7 required fields must be filled
- Price must be positive number
- Bedrooms/Bathrooms must be integers
- Price type must be one of: Monthly, Weekly, Daily, Yearly
- Form ready when `missing_fields.length === 0`

---

## Status
Both listing creation methods are **fully functional** and integrated into the platform. Users can choose their preferred method based on their needs and experience level.

### Current Implementation Status
- ✅ Manual Listing: **Complete** - All features working
- ✅ AI Listing Assistant: **Complete** - All features working
- ✅ Image Upload: **Working** - Both methods support image uploads
- ✅ Location Services: **Working** - Map integration and geocoding functional
- ✅ AI Integration: **Working** - Supports Gemini, Groq, and OpenAI
- ✅ Data Persistence: **Working** - AI Assistant auto-saves, Manual uses context
- ✅ Description Generation: **Working** - Both methods support AI descriptions

