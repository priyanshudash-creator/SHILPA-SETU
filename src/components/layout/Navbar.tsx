import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  Box,
  Compass,
  BookOpen,
  Users,
  Scale,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { useCartWishlist } from '../../context/CartWishlistContext'
import { useShilpa } from '../../context/ShilpaContext'
import { MOCK_PRODUCTS } from '../../data/mockData'
import logoImg from '../../assets/logo.jpg'
import { getUserSession, getInitials, UserProfile } from '../../utils/userAuth'

export const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { cartCount, wishlistCount, compareCount } = useCartWishlist()
  const { openShilpa } = useShilpa()

  const [user, setUser] = useState<UserProfile | null>(() => getUserSession())

  React.useEffect(() => {
    const handleAuthChange = () => {
      setUser(getUserSession())
    }
    window.addEventListener('shilpa_auth_change', handleAuthChange)
    return () => window.removeEventListener('shilpa_auth_change', handleAuthChange)
  }, [])

  // Strictly identify if viewing admin or artisan portal routes
  const isPortalRoute = Boolean(
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/artisan')
  )

  // Only display cart/wishlist numbers when an actual patron user is signed in and not inside admin/artisan portal routes
  const isPatronUser = Boolean(user && user.isLoggedIn && !isPortalRoute)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const searchResults = searchQuery.trim()
    ? MOCK_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.materials.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchModalOpen(false)
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const closeMenu = () => setMobileMenuOpen(false)

  const isNavActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F8F5EF]/95 backdrop-blur-md border-b border-[#E5DED3] transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          
          {/* Brand Wordmark & Konark Wheel Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 group py-1 shrink-0 min-w-0"
            aria-label="SHILPA SETU — Odisha Craft Heritage"
          >
            <img
              src={logoImg}
              alt="SHILPA SETU Konark Wheel Logo"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover shadow-xs border border-[#B85C38]/30 group-hover:rotate-12 transition-transform duration-300 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline tracking-tight">
                <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#244C3A] tracking-tight group-hover:opacity-90 transition-opacity">
                  SHILPA
                </span>
                <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#B85C38] ml-1 sm:ml-1.5 tracking-tight">
                  SETU
                </span>
              </div>
              <span className="text-[8px] sm:text-[10px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-[#6B6A63] uppercase -mt-0.5 truncate">
                ODISHA CRAFTS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on Large Screens) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold text-[#252722]">
            <Link
              to="/marketplace"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isNavActive('/marketplace') ? 'text-[#B85C38] bg-[#FAF8F5] font-bold' : 'hover:text-[#B85C38] hover:bg-[#FAF8F5]'
              }`}
            >
              Crafts Catalog
            </Link>
            <Link
              to="/showroom"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                isNavActive('/showroom') ? 'text-[#B85C38] bg-[#FAF8F5] font-bold' : 'hover:text-[#B85C38] hover:bg-[#FAF8F5]'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-[#B85C38]" />
              <span>3D Showroom</span>
            </Link>
            <Link
              to="/craft-stories"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isNavActive('/craft-stories') ? 'text-[#B85C38] bg-[#FAF8F5] font-bold' : 'hover:text-[#B85C38] hover:bg-[#FAF8F5]'
              }`}
            >
              Stories
            </Link>
            <Link
              to="/artisans"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isNavActive('/artisans') ? 'text-[#B85C38] bg-[#FAF8F5] font-bold' : 'hover:text-[#B85C38] hover:bg-[#FAF8F5]'
              }`}
            >
              Artisans
            </Link>
            <Link
              to="/compare"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isNavActive('/compare') ? 'text-[#B85C38] bg-[#FAF8F5] font-bold' : 'hover:text-[#B85C38] hover:bg-[#FAF8F5]'
              }`}
            >
              Compare {compareCount > 0 && `(${compareCount})`}
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isNavActive('/about') ? 'text-[#B85C38] bg-[#FAF8F5] font-bold' : 'hover:text-[#B85C38] hover:bg-[#FAF8F5]'
              }`}
            >
              About
            </Link>
          </nav>

          {/* Utility Controls & CTA (Right Side) */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            {/* Ask SHILPA AI Craft Guide Button (Desktop / Tablet) */}
            <button
              onClick={() => openShilpa()}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#B85C38]/60 bg-[#FAF8F5] hover:bg-[#B85C38] hover:text-white text-[#244C3A] text-xs font-semibold shadow-2xs transition-all group shrink-0 cursor-pointer"
              title="Consult SHILPA (AI Craft Guide)"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-[#B85C38]/40 shrink-0">
                <img src={logoImg} alt="SHILPA" className="w-full h-full object-cover" />
              </div>
              <span className="hidden xl:inline">Ask SHILPA</span>
              <Sparkles className="w-3.5 h-3.5 text-[#B85C38] group-hover:text-white" />
            </button>

            {/* Search Icon Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 text-[#252722] hover:text-[#B85C38] transition-colors rounded-full hover:bg-[#E5DED3]/40 cursor-pointer"
              aria-label="Search crafts and artisans"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
            </button>

            {/* Wishlist Heart Icon (Hidden on tiny phone screens, accessible via bottom nav/drawer) */}
            <Link
              to={isPatronUser ? "/account/wishlist" : "/login?redirect=/account/wishlist"}
              className="p-2 text-[#252722] hover:text-[#B85C38] transition-colors rounded-full hover:bg-[#E5DED3]/40 relative hidden xs:flex items-center justify-center"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
              {isPatronUser && wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#B85C38] text-white text-[10px] font-semibold rounded-full flex items-center justify-center animate-scale-in">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Cart Icon */}
            <Link
              to={isPatronUser ? "/cart" : "/login?redirect=/cart"}
              className="p-2 text-[#252722] hover:text-[#B85C38] transition-colors rounded-full hover:bg-[#E5DED3]/40 relative flex items-center justify-center"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
              {isPatronUser && cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#244C3A] text-white text-[10px] font-semibold rounded-full flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account Profile / Sign In (Desktop / Tablet) */}
            {user ? (
              <Link
                to="/account"
                className="px-2.5 py-1.5 text-[#252722] hover:text-[#B85C38] transition-colors rounded-full hover:bg-[#E5DED3]/40 hidden md:flex items-center gap-2 border border-[#E5DED3]"
                title={`Signed in as ${user.fullName} (${user.email})`}
                aria-label="Customer Account Profile"
              >
                <div className="w-6 h-6 rounded-full bg-[#244C3A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {getInitials(user.fullName)}
                </div>
                <span className="text-xs font-semibold text-[#244C3A] max-w-[80px] truncate">
                  {user.fullName.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="p-2 text-[#252722] hover:text-[#B85C38] transition-colors rounded-full hover:bg-[#E5DED3]/40 hidden md:flex items-center gap-1.5 text-xs font-semibold"
                aria-label="Sign In"
                title="Sign In to Shilpa Setu"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Terracotta "Become an Artisan" Button (Hidden on Mobile < sm to prevent header overflow) */}
            <Link
              to="/become-an-artisan"
              className="hidden sm:inline-flex bg-[#B85C38] hover:bg-[#9E4928] text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-xs transition-all items-center gap-1.5 whitespace-nowrap"
            >
              <span>Become an Artisan</span>
            </Link>

            {/* Hamburger Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-[#252722] hover:text-[#B85C38] transition-colors rounded-full hover:bg-[#E5DED3]/40 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
            </button>
          </div>

        </div>
      </header>

      {/* Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-8 sm:pt-16 px-3 sm:px-4 animate-fadeIn">
          <div className="bg-[#F8F5EF] border border-[#E5DED3] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <form onSubmit={handleSearchSubmit} className="p-3.5 sm:p-4 border-b border-[#E5DED3] flex items-center gap-3 shrink-0">
              <Search className="w-5 h-5 text-[#B85C38] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crafts (Sambalpuri, Pattachitra, Dhokra, Filigree)..."
                className="w-full bg-transparent text-base text-[#252722] focus:outline-hidden placeholder:text-[#6B6A63]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1.5 text-[#6B6A63] hover:text-[#252722] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            <div className="p-4 overflow-y-auto flex-1">
              {searchQuery.trim() === '' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6A63] mb-3">
                    Popular Craft Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Sambalpuri Handloom',
                      'Pattachitra Painting',
                      'Dhokra Metal Craft',
                      'Silver Filigree',
                      'Pipili Appliqué',
                      'Stone Carving',
                      'Puri',
                      'Sambalpur'
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchModalOpen(false)
                          navigate(`/marketplace?search=${encodeURIComponent(term)}`)
                        }}
                        className="px-3 py-1.5 bg-white border border-[#E5DED3] rounded-full text-xs text-[#252722] hover:border-[#B85C38] hover:text-[#B85C38] transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-[#6B6A63] mb-2">
                    Found {searchResults.length} matching handcrafted products:
                  </p>
                  {searchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSearchModalOpen(false)
                        navigate(`/products/${prod.slug}`)
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer border border-transparent hover:border-[#E5DED3] transition-all"
                    >
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-12 h-12 rounded object-cover border border-[#E5DED3] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#244C3A] truncate">{prod.name}</h4>
                        <p className="text-xs text-[#6B6A63]">{prod.categoryId} • {prod.district}</p>
                      </div>
                      <span className="font-serif font-bold text-sm text-[#252722] shrink-0">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[#6B6A63]">
                  No crafts found matching "{searchQuery}". Try searching for Sambalpuri, Dhokra, or Puri.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={closeMenu}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <div className="w-[88vw] sm:w-96 max-w-md bg-[#F8F5EF] border-l border-[#E5DED3] p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto safe-pb">
              
              <div>
                {/* Header inside drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E5DED3]">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={logoImg}
                      alt="SHILPA SETU Logo"
                      className="w-8 h-8 rounded-full object-cover border border-[#B85C38]/30"
                    />
                    <div className="flex items-baseline">
                      <span className="font-serif text-lg font-bold text-[#244C3A]">SHILPA</span>
                      <span className="font-serif text-lg font-bold text-[#B85C38] ml-1">SETU</span>
                    </div>
                  </div>
                  <button
                    onClick={closeMenu}
                    className="p-2 text-[#6B6A63] hover:text-[#252722] rounded-full hover:bg-[#E5DED3]/50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary Craft Navigation */}
                <div className="py-4 border-b border-[#E5DED3]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6A63] block mb-2.5">
                    Craft Discovery
                  </span>
                  <nav className="space-y-1">
                    {/* Ask SHILPA button in mobile menu */}
                    <button
                      onClick={() => {
                        closeMenu();
                        openShilpa();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-[#244C3A] bg-[#FAF8F5] border border-[#B85C38]/40 hover:bg-[#B85C38] hover:text-white transition-all group mb-1.5 cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-[#B85C38]/40 shrink-0">
                          <img src={logoImg} alt="SHILPA" className="w-full h-full object-cover" />
                        </div>
                        <span>Ask SHILPA (AI Guide)</span>
                      </span>
                      <Sparkles className="w-4 h-4 text-[#B85C38] group-hover:text-white" />
                    </button>

                    <Link
                      to="/"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/' ? 'bg-[#244C3A] text-white' : 'text-[#252722] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-[#B85C38]" /> Homepage
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>

                    <Link
                      to="/marketplace"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/marketplace' ? 'bg-[#244C3A] text-white' : 'text-[#252722] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-[#B85C38]" /> Craft Marketplace
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>

                    <Link
                      to="/showroom"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/showroom' ? 'bg-[#244C3A] text-white' : 'text-[#252722] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Box className="w-4 h-4 text-[#B85C38]" /> 3D Digital Showroom
                      </span>
                      <span className="text-[10px] bg-[#E8DCCB] text-[#244C3A] px-1.5 py-0.5 rounded font-semibold">
                        Interactive
                      </span>
                    </Link>

                    <Link
                      to="/craft-stories"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/craft-stories' ? 'bg-[#244C3A] text-white' : 'text-[#252722] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-[#B85C38]" /> Craft Stories & Processes
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>

                    <Link
                      to="/artisans"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/artisans' ? 'bg-[#244C3A] text-white' : 'text-[#252722] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#B85C38]" /> Meet the Artisans
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>

                    <Link
                      to="/compare"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/compare' ? 'bg-[#244C3A] text-white' : 'text-[#252722] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Scale className="w-4 h-4 text-[#B85C38]" /> Product Comparison
                      </span>
                      {compareCount > 0 && (
                        <span className="text-[11px] bg-[#B85C38] text-white px-1.5 py-0.2 rounded-full">
                          {compareCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/passport/prod-001"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname.startsWith('/passport') ? 'bg-[#244C3A] text-white' : 'text-[#252722] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#B85C38]" /> Digital Craft Passport
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>

                    <Link
                      to="/about"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[#252722] hover:bg-white"
                    >
                      <span>About Gaon to Growth</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  </nav>
                </div>

                {/* Customer Section */}
                <div className="py-4 border-b border-[#E5DED3]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6A63] block mb-2">
                    Customer Experience
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to={isPatronUser ? "/cart" : "/login?redirect=/cart"}
                      onClick={closeMenu}
                      className="p-2.5 bg-white border border-[#E5DED3] rounded-lg hover:border-[#B85C38] flex items-center justify-between"
                    >
                      <span>Shopping Bag</span>
                      {isPatronUser && cartCount > 0 && (
                        <span className="font-bold text-[#244C3A]">{cartCount}</span>
                      )}
                    </Link>
                    <Link
                      to={isPatronUser ? "/account/wishlist" : "/login?redirect=/account/wishlist"}
                      onClick={closeMenu}
                      className="p-2.5 bg-white border border-[#E5DED3] rounded-lg hover:border-[#B85C38] flex items-center justify-between"
                    >
                      <span>Wishlist</span>
                      {isPatronUser && wishlistCount > 0 && (
                        <span className="font-bold text-[#B85C38]">{wishlistCount}</span>
                      )}
                    </Link>
                    <Link
                      to={user ? "/account/orders" : "/login?redirect=/account/orders"}
                      onClick={closeMenu}
                      className="p-2.5 bg-white border border-[#E5DED3] rounded-lg hover:border-[#B85C38] col-span-2 flex items-center justify-between"
                    >
                      <span>My Orders & Tracking</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6B6A63]" />
                    </Link>
                  </div>
                </div>

                {/* Platform Portals (Artisan & Admin) */}
                <div className="py-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6A63] block mb-2">
                    Platform Dashboards
                  </span>
                  <div className="space-y-2">
                    <Link
                      to="/artisan/login"
                      onClick={closeMenu}
                      className="block p-3 bg-white border border-[#E5DED3] rounded-lg hover:border-[#244C3A] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#244C3A]">Artisan Studio Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#6B6A63]" />
                      </div>
                      <p className="text-[11px] text-[#6B6A63] mt-0.5">
                        Manage products, inventory, verification & pricing tool
                      </p>
                    </Link>

                    <Link
                      to="/admin/login"
                      onClick={closeMenu}
                      className="block p-3 bg-white border border-[#E5DED3] rounded-lg hover:border-[#B85C38] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#B85C38]">Admin Moderation Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#6B6A63]" />
                      </div>
                      <p className="text-[11px] text-[#6B6A63] mt-0.5">
                        Secure login, review artisan applications & curation
                      </p>
                    </Link>
                  </div>
                </div>

              </div>

              {/* Drawer Footer CTA */}
              <div className="pt-4 border-t border-[#E5DED3]">
                <Link
                  to="/become-an-artisan"
                  onClick={closeMenu}
                  className="w-full bg-[#B85C38] hover:bg-[#9E4928] text-white py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>Become an Artisan Today</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-center text-[#6B6A63] mt-2">
                  ArtisanAR/VR • Gaon to Growth • Odisha Heritage
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
