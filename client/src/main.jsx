import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Get Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    throw new Error('Missing Clerk Publishable Key');
}

// Dark appearance for Clerk components
const clerkAppearance = {
    baseTheme: undefined,
    variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#1e293b',
        colorText: '#f1f5f9',
        colorTextSecondary: '#94a3b8',
        colorInputBackground: '#0f172a',
        colorInputText: '#f1f5f9',
        borderRadius: '0.75rem',
    },
    elements: {
        card: 'bg-dark-800 border border-dark-700',
        headerTitle: 'text-white',
        headerSubtitle: 'text-dark-400',
        formButtonPrimary: 'bg-primary-600 hover:bg-primary-700',
        footerActionLink: 'text-primary-400 hover:text-primary-300',
    },
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={clerkPubKey} appearance={clerkAppearance}>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ThemeProvider>
                    <UserProvider>
                        <App />
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#1e293b',
                                    color: '#f1f5f9',
                                    border: '1px solid #334155',
                                },
                                success: {
                                    iconTheme: {
                                        primary: '#10b981',
                                        secondary: '#f1f5f9',
                                    },
                                },
                                error: {
                                    iconTheme: {
                                        primary: '#ef4444',
                                        secondary: '#f1f5f9',
                                    },
                                },
                            }}
                        />
                    </UserProvider>
                </ThemeProvider>
            </BrowserRouter>
        </ClerkProvider>
    </React.StrictMode>
);

