# 🎯 Habit Tracker

> A modern, gamified, and insightful personal growth application to track habits, visualize progress, and build consistency.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## ✨ Features

- **📊 Comprehensive Tracking**: Track daily habits with flexible schedules (e.g., specific days of the week).
- **📈 Advanced Analytics**:
  - **Heatmaps**: Yearly view of your consistency (GitHub-style).
  - **Trends**: Weekly and monthly success rates.
  - **Stats**: Visualization of best streaks and overall completion.
- **🗺️ Map View**: Visualize your journey (if applicable).
- **🏆 Gamification**: Earn badges and rewards for consistency and milestones.
- **🌗 Dark/Light Mode**: Fully responsive design with theme support.
- **🔒 Secure**: Authentication powered by Supabase.

## 🛠 Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/habit-tracker.git
   cd habit-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory based on the example (or required keys):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8080` (or similar).

## 📂 Project Structure

```bash
src/
├── components/         # Reusable UI components
│   └── ui/             # shadcn/ui primitives
├── hooks/              # Custom React hooks (e.g., usage of React Query)
├── integrations/       # Supabase client and external service config
├── pages/              # Main route components (Index, Stats, Auth, etc.)
├── types/              # TypeScript interfaces and types
├── App.tsx             # Application entry point with Routing
└── main.tsx            # React DOM mounting
```

## 🧠 Development Notes (AI & Contributors)

If you are an AI assistant or a new contributor, please refer to [AI_CONTEXT.md](./AI_CONTEXT.md) for a deep dive into the architecture, data models, and specific business logic rules (like "Soft Deletion").

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
