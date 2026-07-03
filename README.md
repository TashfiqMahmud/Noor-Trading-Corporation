# Noor Trading Corporation - Online Marketplace

An e-commerce application with a full-featured shopping cart, checkout system, and admin product management dashboard.

## Features

### Customer Features
- 🛍️ **Product Browsing** - Browse products with detailed information and images
- 🛒 **Shopping Cart** - Add/remove items, manage quantities
- 💳 **Checkout System** - Streamlined checkout process with order confirmation
- 👤 **Customer Pages** - Home, Shop, Product Details, About, Contact
- 📱 **Responsive Design** - Works on desktop and mobile devices

### Admin Features
- 🔐 **Admin Authentication** - Secure login system for admin users
- 📦 **Product Management** - Create, edit, and delete products
- 📊 **Order Management** - View and track customer orders
- 🖼️ **Product Images** - Upload and manage product images
- 📈 **Dashboard** - Admin dashboard for overview and management

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite
- **Authentication**: bcryptjs for password hashing
- **Session Management**: express-session
- **File Upload**: multer
- **Frontend**: HTML5, CSS3, JavaScript
- **Environment**: Node.js >=22.5.0

## Project Structure

```
noor-trading-corp/
├── server.js                 # Main server file
├── package.json              # Project dependencies
├── config/
│   ├── database.js          # Database configuration
│   └── helpers.js           # Helper functions
├── database/
│   ├── generate-placeholders.js  # Generate placeholder data
│   ├── schema.sql           # Database schema
│   └── seed.js              # Seed database with initial data
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── upload.js            # File upload middleware
├── routes/
│   ├── admin-auth.js        # Admin authentication routes
│   ├── admin-catalog.js     # Admin product management routes
│   ├── admin-orders.js      # Admin order routes
│   ├── orders.js            # Customer order routes
│   └── products.js          # Product routes
└── public/
    ├── index.html           # Home page
    ├── shop.html            # Shop page
    ├── product.html         # Product detail page
    ├── cart.html            # Shopping cart page
    ├── checkout.html        # Checkout page
    ├── order-success.html   # Order confirmation page
    ├── about.html           # About page
    ├── contact.html         # Contact page
    ├── css/
    │   ├── style.css        # Main styles
    │   └── admin.css        # Admin dashboard styles
    ├── js/
    │   ├── main.js          # Main JavaScript
    │   ├── cart.js          # Shopping cart logic
    │   ├── admin.js         # Admin dashboard logic
    │   └── admin/           # Additional admin scripts
    ├── admin/
    │   ├── index.html       # Admin login page
    │   ├── dashboard.html   # Admin dashboard
    │   ├── products.html    # Product management page
    │   └── orders.html      # Order management page
    ├── images/
    │   └── products/        # Product images
    └── uploads/             # Uploaded files
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TashfiqMahmud/Noor-Trading-Corporation.git
   cd Noor-Trading-Corporation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   Create a `.env` file in the root directory:
   ```
   SESSION_SECRET=your_secret_key_here
   DB_PATH=./database/noor.db
   ```

4. **Initialize the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## Usage

### Customer Access
- **Home**: http://localhost:3000
- **Shop**: http://localhost:3000/shop.html
- **Cart**: http://localhost:3000/cart.html
- **Checkout**: http://localhost:3000/checkout.html

### Admin Access
- **Admin Login**: http://localhost:3000/admin
- **Dashboard**: http://localhost:3000/admin/dashboard.html
- **Product Management**: http://localhost:3000/admin/products.html
- **Order Management**: http://localhost:3000/admin/orders.html

### Default Admin Credentials
Check the seed file for default admin credentials.

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:id` - Get order details

### Admin Auth
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/check-auth` - Check authentication status

## Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start server (alternative)
- `npm run seed` - Initialize database with seed data

## Security Notes

⚠️ **Important**: Before deploying to production:
1. Set a strong `SESSION_SECRET` in your `.env` file
2. Use HTTPS instead of HTTP
3. Configure proper CORS settings
4. Implement rate limiting
5. Add input validation and sanitization
6. Set up proper error handling and logging
7. Use environment-specific database configurations

## Database

The application uses SQLite for data storage. The database schema includes:
- Products table with details and images
- Orders table with customer information
- Admin users table with hashed passwords
- Order items table for line items

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

UNLICENSED - This project is proprietary.

## Support

For issues or questions, please open an issue on GitHub.

---

**Version**: 1.0.0  
**Last Updated**: 2026-07-03
