import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass, Box, ShoppingCart, Sparkles, Home } from 'lucide-react'
import { useCartWishlist } from '../../context/CartWishlistContext'
import { useShilpa } from '../../context/ShilpaContext'
import logoImg from '../../assets/logo.jpg'

export const MobileBottomNav: React.FC = () => {
  const location = useLocation()
  const { cartCount } = useCartWishlist()
  const { openShilpa } = useShilpa()

  // Hide mobile bottom nav on admin or artisan portals to avoid cluttering operational forms
  const isPortal = location.pathname.startsWith('/admin') || location.pathname.startsWith('/artisan')
  if (isPortal) return null

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#E5DED3] safe-pb md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isActive('/') ? 'text-[#B85C38]' : 'text-[#6B6A63] hover:text-[#252722]'
          }`}
          aria-label="Go to Homepage"
        >
          <Home className={`w-5 h-5 ${isActive('/') ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-1 tracking-tight ${isActive('/') ? 'font-bold text-[#244C3A]' : 'font-medium'}`}>
            Home
          </span>
        </Link>

        {/* 2. Marketplace */}
        <Link
          to="/marketplace"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isActive('/marketplace') ? 'text-[#B85C38]' : 'text-[#6B6A63] hover:text-[#252722]'
          }`}
          aria-label="Browse Odisha Crafts Marketplace"
        >
          <Compass className={`w-5 h-5 ${isActive('/marketplace') ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-1 tracking-tight ${isActive('/marketplace') ? 'font-bold text-[#244C3A]' : 'font-medium'}`}>
            Crafts
          </span>
        </Link>

        {/* 3. Center CTA: Ask SHILPA AI Guide */}
        <button
          onClick={() => openShilpa()}
          className="flex-1 flex flex-col items-center justify-center py-1 group active:scale-95 transition-transform"
          aria-label="Ask SHILPA AI Craft Guide"
        >
          <div className="relative -mt-4 w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#B85C38] via-[#D4A373] to-[#244C3A] shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5 border border-white">
              <img
                src={logoImg}
                alt="SHILPA AI Guide"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
              <Sparkles className="w-2 h-2 text-white" />
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#244C3A] mt-0.5 tracking-tight group-hover:text-[#B85C38]">
            Ask SHILPA
          </span>
        </button>

        {/* 4. 3D Showroom */}
        <Link
          to="/showroom"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isActive('/showroom') ? 'text-[#B85C38]' : 'text-[#6B6A63] hover:text-[#252722]'
          }`}
          aria-label="Open 3D Virtual Showroom"
        >
          <div className="relative">
            <Box className={`w-5 h-5 ${isActive('/showroom') ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
            <span className="absolute -top-1.5 -right-2 bg-[#244C3A] text-white text-[8px] font-bold px-1 rounded-sm">
              3D
            </span>
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isActive('/showroom') ? 'font-bold text-[#244C3A]' : 'font-medium'}`}>
            Showroom
          </span>
        </Link>

        {/* 5. Bag / Cart */}
        <Link
          to="/cart"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isActive('/cart') ? 'text-[#B85C38]' : 'text-[#6B6A63] hover:text-[#252722]'
          }`}
          aria-label={`Shopping Bag with ${cartCount} items`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${isActive('/cart') ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#B85C38] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                {cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isActive('/cart') ? 'font-bold text-[#244C3A]' : 'font-medium'}`}>
            Bag
          </span>
        </Link>

      </div>
    </nav>
  )
}
