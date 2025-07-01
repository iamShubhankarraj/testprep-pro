// src/components/dashboard/DashboardLayout.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  CalendarDays,
  FileUp,
  Brain,
  Award,
  Hourglass,
  ListTodo,
  BarChart2,
  BookOpenText,
  CheckCircle,
  Trophy,
  ClipboardList,
} from 'lucide-react'; // Importing icons from lucide-react

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// DashboardLayout component provides the overall structure for the dashboard.
// It includes a sidebar for navigation and a main content area.
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white p-4 shadow-lg md:flex rounded-r-xl my-4 ml-4">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-blue-700 text-lg">
            <BookOpenText className="h-6 w-6" />
            <span>TestPrep Pro</span>
          </Link>
        </div>
        <Separator className="my-4" />
        <nav className="flex-1 space-y-2">
          {/* Navigation Links */}
          <Link href="/dashboard" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/tests" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <CheckCircle className="mr-3 h-5 w-5" />
              Tests
            </Button>
          </Link>
          <Link href="/dashboard/upload" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <FileUp className="mr-3 h-5 w-5" />
              Upload PDF
            </Button>
          </Link>
          <Link href="/dashboard/ai-generator" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <Brain className="mr-3 h-5 w-5" />
              AI Test Generator
            </Button>
          </Link>
          <Link href="/dashboard/achievements" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <Trophy className="mr-3 h-5 w-5" />
              Achievements
            </Button>
          </Link>
          <Link href="/dashboard/analytics" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <BarChart2 className="mr-3 h-5 w-5" />
              Analytics
            </Button>
          </Link>
          <Link href="/dashboard/todo" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <ClipboardList className="mr-3 h-5 w-5" />
              To-Do List
            </Button>
          </Link>
          {/* Calendar link added here */}
          <Link href="/dashboard/calendar" passHref>
            <Button variant="ghost" className="w-full justify-start rounded-lg px-4 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200">
              <CalendarDays className="mr-3 h-5 w-5" />
              Calendar
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col p-4 md:p-8">
        {children} {/* This is where the content of each dashboard page will be rendered */}
      </main>
    </div>
  );
};

export default DashboardLayout;
