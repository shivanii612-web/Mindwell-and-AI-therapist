import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ChatPage from './pages/Chat/ChatPage';
import MoodPage from './pages/Mood/MoodPage';
import JournalPage from './pages/Journal/JournalPage';
import NewJournalPage from './pages/Journal/NewJournalPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import CommunityPage from './pages/Community/CommunityPage';
import PaymentsPage from './pages/Payments/PaymentsPage';
import PricingPage from './pages/Payments/PricingPage';
import SettingsPage from './pages/Settings/SettingsPage';
import TherapistDashboard from './pages/Therapist/TherapistDashboard';
import AdminPanel from './pages/Admin/AdminPanel';
import ConsultationRoom from './pages/Consultation/ConsultationRoom';

import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TherapistApplyPage from './pages/auth/TherapistApplyPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/terms',
    element: <TermsOfService />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />,
  },
  {
    // Standalone page — has its own nav/layout, NOT inside AuthLayout or DashboardLayout
    path: '/therapist-apply',
    element: <TherapistApplyPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password/:token',
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'mood',
        element: <MoodPage />,
      },
      {
        path: 'journal',
        element: <JournalPage />,
      },
      {
        path: 'journal/new',
        element: <NewJournalPage />,
      },
      {
        path: 'appointments',
        element: <AppointmentsPage />,
      },
      {
        path: 'community',
        element: <CommunityPage />,
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/pricing',
        element: <PricingPage />,
      },
      {
        path: '/therapist',
        element: <TherapistDashboard />,
      },
      {
        path: '/admin',
        element: <AdminPanel />,
      },
      {
        path: '/consultation',
        element: <ConsultationRoom />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
