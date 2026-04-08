import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom';
import { APP_CONFIG, ROUTES } from '../utils/constants';
import { FaVideo } from 'react-icons/fa';

const Header = () => {
    const {isAuthenticated,user,logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.HOME , {replace:true})
    }

  return (
    <header className='fixed top-0 left-0 right-0 premium-glass z-50 shadow-sm border-b border-white/30'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex justify-between items-center h-16'>
                    <Link
                     to={'/'}
                     className='flex items-center space-x-3'
                    >
                    <div className='w-10 h-10 premium-btn-primary rounded-xl flex items-center justify-center'>
                        <FaVideo className='w-6 h-6 text-white'/>
                        </div>
                        <h1 className='text-xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight'>
                            {APP_CONFIG.APP_NAME}
                        </h1>
                        </Link>

                        <nav className='flex items-center space-x-4'>
                            {isAuthenticated ? (
                                <>
                                 <Link to={ROUTES.DASHBOARD} className='text-gray-700 hover:text-blue-600 font-medium transition-colors'>
                                 Dashboard</Link>
                                 <div className='flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/70 border border-slate-200/80'>
                                    <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center'>
                                        <span className='text-white text-sm font-semibold'>
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className='text-gray-700 font-medium text-sm hidden sm:inline'>
                                        {user?.name}
                                    </span>

                                 </div>
                                 <button
                                  onClick={handleLogout}
                                  className='px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm'
                                 >
                                    Logout
                                 </button>
                                </>
                            ): (
                                <>
                                <Link to={ROUTES.LOGIN} className='text-gray-700 hover:text-blue-600 font-medium transition-colors'>
                                    Sign In
                                </Link>
                                              <Link
                                 to={ROUTES.REGISTER}
                                  className='px-4 py-2 text-sm font-semibold text-white rounded-xl premium-btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm'
                                 >
                                    Sign Up
                                 </Link>
                                </>
                            )}

                        </nav>

                </div>

            </div>
    </header>
  )
}

export default Header
