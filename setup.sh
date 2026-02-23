#!/bin/bash

echo "🚀 Setting up Rentals.ph project..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v php &> /dev/null; then
    echo -e "${YELLOW}⚠️  PHP is not installed. Please install PHP 8.1 or higher.${NC}"
    exit 1
fi

if ! command -v composer &> /dev/null; then
    echo -e "${YELLOW}⚠️  Composer is not installed. Please install Composer first.${NC}"
    echo "   Visit: https://getcomposer.org/download/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met!${NC}"
echo ""

# Backend setup
echo -e "${BLUE}Setting up Laravel backend...${NC}"
cd backend

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

if [ ! -d vendor ]; then
    echo "Installing PHP dependencies..."
    composer install --no-interaction
    echo -e "${GREEN}✓ PHP dependencies installed${NC}"
else
    echo -e "${GREEN}✓ PHP dependencies already installed${NC}"
fi

# Generate app key if not set
php artisan key:generate --no-interaction 2>/dev/null || echo -e "${YELLOW}⚠️  Could not generate app key (may need to run manually)${NC}"

echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "   1. Update backend/.env with your database credentials"
echo "   2. Run: cd backend && php artisan migrate && php artisan db:seed"
echo ""

# Frontend setup
echo -e "${BLUE}Setting up React frontend...${NC}"
cd ../frontend

if [ ! -d node_modules ]; then
    echo "Installing Node dependencies..."
    npm install
    echo -e "${GREEN}✓ Node dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Node dependencies already installed${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure database in backend/.env"
echo "2. Run migrations: cd backend && php artisan migrate && php artisan db:seed"
echo "3. Start backend: cd backend && php artisan serve"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""

