# TestPrep Pro 🚀

An AI-powered test preparation platform designed for JEE and NEET aspirants. Upload your PDFs, generate custom tests, and track your performance with detailed analytics.

## ✨ Features

- 📄 **PDF Upload add Processing**: Upload previous year question papers
- 🤖 **AI Question Extraction**: Automatically extract questions from PDFs
- 📝 **Custom Test Generation**: Create tests with adjustable difficulty levels
- 📊 **Performance Analytics**: Track your progress across subjects and topics
- 🎯 **Subject-wise Analysis**: Get insights into Physics, Chemistry, Math, and Biology
- 📈 **Detailed Reports**: Download comprehensive performance reports

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **PDF Processing**: pdf-parse
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: Zustand
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/testprep-pro.git
   cd testprep-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase SQL Editor (found in `/database/schema.sql`)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard and main app pages
│   ├── test/              # Test-related pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── test/             # Test-related components
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── store/                # State management
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **profiles**: User profile information
- **pdfs**: Uploaded PDF documents
- **subjects**: Available subjects (Physics, Chemistry, Math, Biology)
- **questions**: Extracted questions from PDFs
- **tests**: Generated test papers
- **test_attempts**: User test sessions
- **test_responses**: Individual question responses
- **performance_analytics**: User progress tracking

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing Database Connection

Visit `/test-db` to verify your database connection is working properly.

Visit `/check-env` to verify your environment variables are set correctly.

## 🚀 Deployment

The application is ready to deploy on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🤝 Contributing

This project is being developed as a learning exercise. Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is for educational purposes.

## 👨‍💻 Developer

Built with ❤️ by a 10th standard student learning full-stack development!

---

**Note**: This project is under active development. More features coming soon! 🚧
