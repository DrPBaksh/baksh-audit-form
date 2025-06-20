import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  HomeIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import config from '../../config/api';

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Company Survey', href: '/company', icon: ChartBarIcon },
    { name: 'Employee Survey', href: '/employee', icon: UserGroupIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
{/* Logo and Title */}
<div className="flex items-center space-x-4">
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center space-x-3"
  >
    <div className="w-10 h-10 flex items-center justify-center">
      <img 
        src="/logo.png" 
        alt="DMGT Logo" 
        className="w-10 h-10 object-contain"
        onError={(e) => {
          // Fallback to gradient cog if logo not found
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      {/* Fallback gradient cog (hidden by default) */}
      <div 
        className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center"
        style={{ display: 'none' }}
      >
        <CogIcon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div>
      <h1 className="text-xl font-bold text-slate-900">
        DMGT Survey
      </h1>
      <p className="text-sm text-slate-500">
        AI & Data Readiness Assessment
      </p>
    </div>
  </motion.div>
</div>

            {/* Navigation */}
            <nav className="flex space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                      ${isActive 
                        ? 'text-blue-700 bg-blue-100' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-4 h-4" />
                      <span className="hidden sm:block">{item.name}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-100 rounded-lg -z-10"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-slate-500">
              <p>
                {config.app.title} v{config.app.version}
              </p>
              <p>Built for DMGT | Powered by AWS</p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>© 2025 DMGT</span>
              {config.isDevelopment && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Development Mode
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
