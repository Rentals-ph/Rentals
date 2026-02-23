const http = require('http');
const url = require('url');

// Mock data
const mockProperties = [
  {
    id: 1,
    title: 'Azure Residences - 2BR Corner Suite',
    description: 'Beautiful corner suite with modern amenities',
    type: 'Commercial Spaces',
    location: 'Manila',
    price: 1200,
    bedrooms: 4,
    bathrooms: 2,
    area: 120,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    is_featured: true,
    rent_manager: {
      id: 1,
      name: 'RentalPh Official Rent Manager',
      email: 'official@rentals.ph',
      is_official: true,
    },
    published_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Modern Condo in Makati',
    description: 'Spacious 3-bedroom condo with city views',
    type: 'Condominium',
    location: 'Makati',
    price: 1500,
    bedrooms: 3,
    bathrooms: 2,
    area: 100,
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
    is_featured: true,
    rent_manager: {
      id: 1,
      name: 'RentalPh Official Rent Manager',
      email: 'official@rentals.ph',
      is_official: true,
    },
    published_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Cozy Apartment in Quezon City',
    description: 'Affordable 2-bedroom apartment',
    type: 'Apartment',
    location: 'Quezon City',
    price: 800,
    bedrooms: 2,
    bathrooms: 1,
    area: 60,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    is_featured: true,
    rent_manager: {
      id: 1,
      name: 'RentalPh Official Rent Manager',
      email: 'official@rentals.ph',
      is_official: true,
    },
    published_at: new Date().toISOString(),
  },
];

const mockTestimonials = [
  {
    id: 1,
    name: 'Elaine Mae Ofiaza',
    role: 'Lessee',
    content: 'Rentals.ph made finding my perfect home so easy! The platform is user-friendly and the properties are all verified. Highly recommended!',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 2,
    name: 'Rica Grate',
    role: 'Rent Manager',
    content: 'As a rent manager, Rentals.ph has been instrumental in helping me connect with quality tenants. The platform is professional and efficient.',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 3,
    name: 'John Dela Cruz',
    role: 'Lessee',
    content: 'Found my dream apartment in just a week! The search filters are excellent and the customer service is top-notch.',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 4,
    name: 'Maria Santos',
    role: 'Property Owner',
    content: 'Listing my property was straightforward and I got quality inquiries within days. Great platform!',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: 5,
    name: 'Carlos Rodriguez',
    role: 'Lessee',
    content: 'The verification process gives me confidence. I know all properties are legitimate and well-maintained.',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

const mockBlogs = [
  {
    id: 1,
    title: 'Understanding Your Rental Contract: A Complete Guide',
    content: 'Full content here...',
    excerpt: 'Learn everything you need to know about rental contracts in the Philippines, including your rights and responsibilities as a tenant.',
    category: 'Legal',
    read_time: 7,
    author: 'Maria Santos',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    published_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: 2,
    title: 'Top 10 Neighborhoods to Rent in Metro Manila',
    content: 'Full content here...',
    excerpt: 'Discover the best areas to rent in Metro Manila, from budget-friendly options to premium locations.',
    category: 'Location Guide',
    read_time: 5,
    author: 'Juan Dela Cruz',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    published_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 3,
    title: 'How to Negotiate Your Rent: Tips from Experts',
    content: 'Full content here...',
    excerpt: 'Learn proven strategies for negotiating better rental rates and terms with property owners.',
    category: 'Tips',
    read_time: 6,
    author: 'Anna Garcia',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    published_at: new Date('2026-01-05').toISOString(),
  },
];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Routes
  if (path === '/api/properties/featured' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(mockProperties.filter(p => p.is_featured)));
    return;
  }

  if (path === '/api/properties' && method === 'GET') {
    let filtered = [...mockProperties];
    
    if (parsedUrl.query.type) {
      filtered = filtered.filter(p => p.type === parsedUrl.query.type);
    }
    
    if (parsedUrl.query.location) {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(parsedUrl.query.location.toLowerCase())
      );
    }
    
    if (parsedUrl.query.search) {
      const search = parsedUrl.query.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }

    res.writeHead(200);
    res.end(JSON.stringify({ data: filtered }));
    return;
  }

  if (path.startsWith('/api/properties/') && method === 'GET') {
    const id = parseInt(path.split('/').pop());
    const property = mockProperties.find(p => p.id === id);
    
    if (property) {
      res.writeHead(200);
      res.end(JSON.stringify(property));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Property not found' }));
    }
    return;
  }

  if (path === '/api/testimonials' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(mockTestimonials));
    return;
  }

  if (path === '/api/blogs' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(mockBlogs));
    return;
  }

  if (path.startsWith('/api/blogs/') && method === 'GET') {
    const id = parseInt(path.split('/').pop());
    const blog = mockBlogs.find(b => b.id === id);
    
    if (blog) {
      res.writeHead(200);
      res.end(JSON.stringify(blog));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Blog not found' }));
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log(`   Available endpoints:`);
  console.log(`   - GET /api/properties/featured`);
  console.log(`   - GET /api/properties`);
  console.log(`   - GET /api/testimonials`);
  console.log(`   - GET /api/blogs`);
});

