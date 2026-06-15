# Trello Clone

A full-stack collaborative task management application built with modern web technologies. Manage projects, organize tasks into boards and lists, and collaborate with team members in real-time.

## 🎯 Features

- **Board Management** - Create, edit, and delete boards to organize your projects
- **List Organization** - Structure tasks within lists for better workflow management
- **Card Management** - Add, update, and delete cards with descriptions and metadata
- **Drag & Drop** - Intuitive drag-and-drop interface powered by dnd-kit
- **User Authentication** - Secure JWT-based authentication with bcrypt password hashing
- **Real-time Updates** - React Query for efficient data synchronization 
- **Responsive Design** - Mobile-friendly UI built with Tailwind CSS
- **Dark Mode Support** - Theme switching with next-themes
- **Type Safety** - Full TypeScript implementation across frontend and backend

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **TanStack Router** - Type-safe routing
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first CSS framework
- **dnd-kit** - Drag and drop library
- **Zod** - TypeScript-first schema validation
- **Zustand** - Lightweight state management
- **Shadcn UI** - High-quality component library

### Backend
- **Node.js + Express** - Server runtime and framework
- **TypeScript** - Type-safe backend code
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **JWT** - Token-based authentication
- **Bcryptjs** - Password hashing
- **Zod** - Request validation

## 📁 Project Structure

```
trello-clone/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── routes/          # TanStack Router route definitions
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # Zustand state stores
│   │   └── lib/             # Utility functions and helpers
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Express TypeScript server
│   ├── src/
│   │   ├── modules/         # Feature modules (auth, boards, lists, cards)
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   ├── db/              # Database utilities
│   │   └── shared/          # Shared utilities and types
│   ├── prisma/              # Database schema
│   ├── package.json
│   └── server.ts
│
└── docs/                    # Documentation files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sai-krishna-dandu/trello-clone.git
cd trello-clone
```

2. **Setup Backend**
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run db:migrate
npm run db:seed  # Optional: populate with sample data

# Start development server
npm run dev
```

3. **Setup Frontend**
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📦 Build for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🔧 Development Commands

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with sample data
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Passwords are hashed using bcryptjs
- Tokens are stored securely in HTTP-only cookies
- Authentication middleware protects private routes and API endpoints

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/trello_db
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=3000
```

### Frontend
Configure API endpoint in your environment or code:
```
VITE_API_URL=http://localhost:3000
```

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use TypeScript for type safety
- Follow existing code style and patterns
- Write meaningful commit messages
- Add tests for new features when applicable

## 📄 License

ISC License - See LICENSE file for details

## 👨‍💻 Author

sai Krishna dandu

## 📞 Support

For issues and questions, please open a GitHub issue in the repository.

---
