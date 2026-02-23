# Rentals.ph Backend API

Laravel-based REST API for the Rentals.ph platform, providing endpoints for property management, agent registration, blog content, and administrative functions.

## Features

- Property management (CRUD operations, search, filtering)
- Agent registration and approval system
- Blog/News content management
- Testimonials management
- Admin dashboard API
- Authentication using Laravel Sanctum
- API documentation with Swagger/OpenAPI

## Requirements

- PHP >= 8.1
- Composer
- PostgreSQL (or MySQL)
- Laravel 11.x

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Generate application key:
```bash
php artisan key:generate
```

5. Configure your `.env` file with database credentials and other settings.

6. Run migrations:
```bash
php artisan migrate
```

7. Seed the database (optional):
```bash
php artisan db:seed
```

## API Documentation (Swagger)

The API documentation is available via Swagger UI and works automatically in both local and remote environments.

### Accessing Swagger Documentation

#### Local Development
```
http://localhost:8000/api/documentation
```
(Replace `8000` with your local port if different)

#### Remote/Production
```
https://your-domain.com/api/documentation
```

### Generating/Regenerating Documentation

After making changes to API endpoints or annotations, regenerate the Swagger documentation:

```bash
php artisan l5-swagger:generate
```

### Features

- **Interactive API Testing**: Test endpoints directly from the Swagger UI
- **Authentication Support**: Use the "Authorize" button to add Bearer tokens for protected endpoints
- **Auto-generated**: Documentation is automatically generated from OpenAPI annotations in controllers
- **Environment Agnostic**: Works seamlessly in both local and remote environments using relative paths

### Available Endpoints in Swagger

- Properties (GET, POST, bulk operations)
- Blogs/News (GET)
- Testimonials (GET)
- Agent Registration & Authentication
- Admin Functions (agent approval, user management)

## API Endpoints

### Properties
- `GET /api/properties` - List all properties (with pagination and filters)
- `GET /api/properties/featured` - Get featured properties
- `GET /api/properties/{id}` - Get property details
- `POST /api/properties` - Create new property (authenticated)
- `POST /api/properties/bulk` - Bulk create properties (authenticated)

### Blogs/News
- `GET /api/blogs` - List all blogs
- `GET /api/blogs/{id}` - Get blog details
- `GET /api/news` - Alias for blogs
- `GET /api/news/{id}` - Alias for blog details

### Testimonials
- `GET /api/testimonials` - List all testimonials

### Authentication
- `POST /api/register` - Register new agent
- `POST /api/login` - Login (works for both agents and admins)
- `GET /api/agents/me` - Get current agent (authenticated)

### Admin
- `GET /api/admin/agents` - List all agents (authenticated)
- `GET /api/admin/agents/pending` - List pending agents (authenticated)
- `POST /api/admin/agents/{id}/approve` - Approve agent (authenticated)
- `POST /api/admin/agents/{id}/reject` - Reject agent (authenticated)
- `GET /api/admin/users` - List all users (authenticated)
- `POST /api/admin/users` - Create user (authenticated)
- `PUT /api/admin/users/{id}` - Update user (authenticated)
- `DELETE /api/admin/users/{id}` - Delete user (authenticated)

## Authentication

The API uses Laravel Sanctum for authentication. Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {your-token}
```

To get a token:
1. Register as an agent: `POST /api/register`
2. Login: `POST /api/login` (works for both agents and admins)
3. Use the returned token in subsequent requests

## Development

### Running the Development Server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

### Database Seeding

The seeder includes sample data:
- 11 properties (various types and locations)
- 10 blog posts
- 2 testimonials
- 1 rent manager

To seed:
```bash
php artisan db:seed
```

### Code Style

This project uses Laravel Pint for code formatting:

```bash
./vendor/bin/pint
```

## Testing

Run the test suite:

```bash
php artisan test
```

## License

[Your License Here]

## Support

For issues and questions, please contact [your support email/contact].

