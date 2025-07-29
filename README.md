# 🏪 Bsale Sync Hub

A modern React application for synchronizing and managing data between your local database and Bsale POS system. Built with TypeScript, React, and Supabase for seamless inventory and sales management.

## ✨ Features

### 🔄 **Bsale Integration**
- **Real-time synchronization** with Bsale API
- **Bidirectional data sync** for products, sales, and clients
- **Connection testing** and status monitoring
- **Automatic token validation**

### 📦 **Inventory Management**
- Product listing and search
- Stock control and monitoring
- Bsale product integration
- Low stock alerts

### 🛒 **Sales Management**
- Sales dashboard with statistics
- Recent sales tracking
- Bsale document integration
- Sales reports and analytics

### 👥 **User Management**
- Role-based access control (Admin, Proveedor, Locatario)
- User authentication with Supabase
- Profile management
- Multi-store support

### 🏪 **Store Management**
- Multi-store architecture
- Store-specific data isolation
- Store analytics and reporting
- Active/inactive store management

### 🚨 **Alert System**
- Low stock notifications
- Sync error alerts
- Sales notifications
- Customizable alert preferences

### ⚙️ **Settings & Configuration**
- Bsale API configuration
- Sync preferences
- Notification settings
- Security management

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Integration**: Bsale REST API
- **Routing**: React Router v6
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Bsale API access token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pnlpz/bsale-sync-hub.git
   cd bsale-sync-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory:
   ```env
   # Bsale API Configuration
   VITE_BSALE_API_URL=https://api.bsale.io/v1
   VITE_BSALE_ACCESS_TOKEN=your_bsale_access_token_here

   # For production, use:
   # VITE_BSALE_API_URL=https://api.bsale.cl/v1

   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**

   Set up your Supabase database with the required tables:
   - `profiles` - User profiles with roles
   - `products` - Product information with Bsale integration
   - `sales` - Sales data with Bsale sync
   - `stores` - Multi-store management
   - `alerts` - System notifications

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui components
│   ├── layout/          # Layout components (Sidebar, Header, etc.)
│   ├── BsaleConnectionTest.tsx
│   └── BsaleIntegration.tsx
├── hooks/               # Custom React hooks
│   ├── useAuth.tsx      # Authentication hook
│   ├── useBsale.ts      # Bsale API hooks
│   └── use-toast.ts     # Toast notifications
├── lib/                 # Utility libraries
│   ├── bsale-client.ts  # Bsale API client
│   └── utils.ts         # General utilities
├── pages/               # Application pages
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Inventory.tsx    # Inventory management
│   ├── Sales.tsx        # Sales management
│   ├── Users.tsx        # User management
│   ├── Stores.tsx       # Store management
│   ├── Alerts.tsx       # Alert management
│   ├── Settings.tsx     # Application settings
│   └── Auth.tsx         # Authentication
├── services/            # Business logic services
│   └── bsale-sync.ts    # Synchronization service
└── integrations/        # External service integrations
    └── supabase/        # Supabase client and types
```

## 🔧 Configuration

### Bsale API Setup

1. **Get your Bsale API token** from your Bsale account
2. **Configure the API URL**:
   - Sandbox: `https://api.bsale.io/v1`
   - Production: `https://api.bsale.cl/v1`
3. **Test the connection** using the built-in connection test component

### Supabase Setup

1. **Create a new Supabase project**
2. **Set up Row Level Security (RLS)** for data isolation
3. **Configure authentication** providers as needed
4. **Update environment variables** with your project credentials

## 🔐 Authentication & Roles

The application supports three user roles:

- **Admin**: Full access to all features including user and store management
- **Proveedor**: Access to inventory and sales management
- **Locatario**: Limited access to assigned store data

## 🔄 Synchronization

### Automatic Sync
- Configurable sync intervals (5 minutes to 24 hours)
- Background synchronization with error handling
- Real-time status updates

### Manual Sync
- On-demand synchronization buttons
- Selective data sync (products, sales, clients)
- Progress indicators and notifications

## 🚨 Alerts & Notifications

- **Low Stock Alerts**: Automatic notifications when inventory is low
- **Sync Errors**: Immediate alerts for synchronization failures
- **Sales Notifications**: Real-time sales updates
- **Email & Push Notifications**: Configurable delivery methods

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

## 🏗️ Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📝 API Documentation

### Bsale API Integration

The application integrates with the following Bsale endpoints:

- `GET /products.json` - Fetch products
- `GET /documents.json` - Fetch sales documents
- `GET /clients.json` - Fetch client data
- `POST /products.json` - Create new products

### Custom Hooks

- `useBsaleProducts()` - Fetch and manage Bsale products
- `useSyncProductsFromBsale()` - Synchronize products
- `useSyncSalesFromBsale()` - Synchronize sales data
- `useCreateProductInBsale()` - Create products in Bsale

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [Bsale API documentation](https://api.bsale.io/v1/docs)
- Review the [Supabase documentation](https://supabase.com/docs)

## 🙏 Acknowledgments

- [Bsale](https://www.bsale.cl/) for providing the POS API
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Lucide](https://lucide.dev/) for the icon library

---

**Built with ❤️ for modern retail management**
