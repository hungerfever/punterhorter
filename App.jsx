import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Share2, 
  Menu, 
  X, 
  ExternalLink, 
  Camera,
  Send,
  Mail,
  ArrowRight,
  CheckCircle2,
  Heart,
  Loader
} from 'lucide-react';
import { mockProducts } from './productData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('punterhorter-products');
    return savedProducts ? JSON.parse(savedProducts) : mockProducts;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('punterhorter-admin') === 'true');
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('punterhorter-current-user') || null);
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem('punterhorter-users');
    if (savedUsers) return JSON.parse(savedUsers);
    return [{ username: 'punterhorter', password: 'Hunterash' }];
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    id: 1,
    name: '',
    price: '$0.00',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900',
    category: 'Tops',
    depopUrl: 'https://www.depop.com/punterhorter/'
  });

  useEffect(() => {
    localStorage.setItem('punterhorter-products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('punterhorter-admin', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('punterhorter-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('punterhorter-current-user', currentUser);
    } else {
      localStorage.removeItem('punterhorter-current-user');
    }
  }, [currentUser]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url)
        .then(() => showToast("Store link copied to clipboard!"))
        .catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("Store link copied to clipboard!");
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    textArea.remove();
  };

  const navigateTo = (page) => {
    if (page === currentPage) {
      setIsMobileMenuOpen(false);
      return;
    }
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const resetDraft = (product = null) => {
    setDraft(product ? { ...product } : {
      id: Date.now(),
      name: '',
      price: '$0.00',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900',
      category: 'Tops',
      depopUrl: 'https://www.depop.com/punterhorter/'
    });
  };

  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setDraft({ ...product });
    navigateTo('manage');
  };

  const handleSaveProduct = () => {
    if (!draft.name.trim()) {
      showToast('Please add a product name.');
      return;
    }

    if (editingId) {
      setProducts(prev => prev.map(product => product.id === editingId ? { ...draft, id: editingId } : product));
    } else {
      const newProduct = { ...draft, id: Date.now() };
      setProducts(prev => [newProduct, ...prev]);
    }

    setEditingId(null);
    resetDraft();
    navigateTo('shop');
    showToast('Product saved!');
  };

  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
    if (editingId === id) {
      setEditingId(null);
      resetDraft();
    }
    showToast('Product removed.');
  };

  const handleNewProduct = () => {
    setEditingId(null);
    resetDraft();
    navigateTo('manage');
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const username = loginForm.username.trim();
    const password = loginForm.password;

    if (!username || !password) {
      setLoginError('Please fill in both username and password.');
      return;
    }

    const cleanedUsername = username.toLowerCase();

    if (authMode === 'signup') {
      const exists = users.some((user) => user.username.toLowerCase() === cleanedUsername);
      if (exists) {
        setLoginError('That username already exists. Try logging in instead.');
        return;
      }

      const newUser = { username: cleanedUsername, password };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(cleanedUsername);
      setIsLoggedIn(true);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
      if (cleanedUsername === 'punterhorter') {
        navigateTo('manage');
      } else {
        navigateTo('shop');
      }
      showToast('Account created!');
      return;
    }

    const foundUser = users.find((user) => user.username.toLowerCase() === cleanedUsername && user.password === password);
    if (foundUser) {
      setCurrentUser(foundUser.username);
      setIsLoggedIn(true);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
      if (foundUser.username.toLowerCase() === 'punterhorter') {
        navigateTo('manage');
      } else {
        navigateTo('shop');
      }
      showToast(foundUser.username.toLowerCase() === 'punterhorter' ? 'Logged in as admin' : 'Logged in successfully');
      return;
    }

    setLoginError('Wrong username or password.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginError('');
    setAuthMode('login');
    setCurrentPage('home');
    showToast('Logged out');
  };

  const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigateTo('home')}>
            <h1 className="text-2xl font-bold tracking-tighter text-gray-900">PUNTER<span className="text-red-500">HORTER</span></h1>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button type="button" onClick={() => navigateTo('home')} className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-red-500' : 'text-gray-600 hover:text-black'}`}>Home</button>
            <button type="button" onClick={() => navigateTo('shop')} className={`text-sm font-medium transition-colors ${currentPage === 'shop' ? 'text-red-500' : 'text-gray-600 hover:text-black'}`}>Shop All</button>
            <button type="button" onClick={() => navigateTo('about')} className={`text-sm font-medium transition-colors ${currentPage === 'about' ? 'text-red-500' : 'text-gray-600 hover:text-black'}`}>About</button>
            <button type="button" onClick={() => navigateTo('contact')} className={`text-sm font-medium transition-colors ${currentPage === 'contact' ? 'text-red-500' : 'text-gray-600 hover:text-black'}`}>Contact</button>
            {isLoggedIn && currentUser && currentUser.toLowerCase() === 'punterhorter' ? (
              <button type="button" onClick={() => navigateTo('manage')} className={`text-sm font-medium transition-colors ${currentPage === 'manage' ? 'text-red-500' : 'text-gray-600 hover:text-black'}`}>
                Edit Products
              </button>
            ) : (
              <button type="button" onClick={() => navigateTo('login')} className={`text-sm font-medium transition-colors ${currentPage === 'login' ? 'text-red-500' : 'text-gray-600 hover:text-black'}`}>
                Log In
              </button>
            )}
            
            <div className="h-4 w-px bg-gray-200"></div>
            
            <button 
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <Share2 size={18} />
              Share
            </button>
            
            <a 
              href="https://www.depop.com/punterhorter/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Heart size={16} className="fill-current text-red-500" />
              Depop Shop
            </a>
          </div>

          <div className="md:hidden flex items-center gap-4">
             <button onClick={handleShare} className="text-gray-600">
               <Share2 size={24} />
             </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-black focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 absolute w-full left-0 shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <button type="button" onClick={() => navigateTo('home')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">Home</button>
            <button type="button" onClick={() => navigateTo('shop')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">Shop</button>
            <button type="button" onClick={() => navigateTo('about')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">About</button>
            <button type="button" onClick={() => navigateTo('contact')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">Contact</button>
            {isLoggedIn && currentUser && currentUser.toLowerCase() === 'punterhorter' ? (
              <button type="button" onClick={() => navigateTo('manage')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">
                Edit Products
              </button>
            ) : (
              <button type="button" onClick={() => navigateTo('login')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">
                Log In
              </button>
            )}
            <a 
              href="https://www.depop.com/punterhorter/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-red-500 text-white px-4 py-3 rounded-xl font-medium"
            >
              View on Depop <ExternalLink size={18} />
            </a>
          </div>
        </div>
      )}
    </nav>
  );

  const Footer = () => (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-bold tracking-tighter text-gray-900 mb-4">PUNTER<span className="text-red-500">HORTER</span></h2>
            <p className="text-gray-600 text-sm mb-4 max-w-xs">
              Curated vintage, streetwear, and unique pieces. Synced with our official Depop store.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><button onClick={() => navigateTo('shop')} className="hover:text-red-500 transition-colors">Shop All</button></li>
              <li><button onClick={() => navigateTo('about')} className="hover:text-red-500 transition-colors">About Us</button></li>
              <li><button onClick={() => navigateTo('contact')} className="hover:text-red-500 transition-colors">Contact</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="https://www.depop.com/punterhorter/" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center gap-1">Depop Policies <ExternalLink size={14}/></a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 Punterhorter. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  const ProductCard = ({ product }) => (
    <div className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_18px_40px_rgba(28,25,23,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(28,25,23,0.10)]">
      <div className="relative overflow-hidden bg-stone-100">
        <img 
          src={product.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900"} 
          alt={product.name} 
          className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm backdrop-blur-sm">
          {product.category}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">Curated drop</p>
        <h3 className="mt-2 text-xl font-semibold text-stone-900">{product.name}</h3>
        <p className="mt-2 text-2xl font-bold text-stone-900">{product.price}</p>
        
        <div className="mt-auto pt-5">
          <a 
            href={product.depopUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Buy on Depop <ExternalLink size={16} />
          </a>
          {isLoggedIn && (
            <button
              onClick={() => handleEditProduct(product)}
              className="mt-3 w-full rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:border-red-300 hover:text-red-600"
            >
              Edit item
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const Home = () => (
    <div className="animate-in fade-in duration-500">
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1528991435120-e73e05a58897?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 flex flex-col items-center text-center">
          <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium border border-white/20 mb-6 uppercase tracking-widest text-gray-200">
            Fresh Drops Weekly
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
            Curated vintage & contemporary pieces.
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10">
            Explore our latest collection of hand-picked apparel, synced directly from our Depop store to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigateTo('shop')}
              className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-transform hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2"
            >
              Shop Collection <ArrowRight size={20} />
            </button>
            <a 
              href="https://www.depop.com/punterhorter/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-red-500/10 backdrop-blur-md text-white border border-red-500/50 px-8 py-4 rounded-full font-bold text-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
              Follow on Depop
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Items</h2>
            <p className="text-gray-500 mt-2">Latest additions from our Depop inventory.</p>
          </div>
          <button 
            onClick={() => navigateTo('shop')}
            className="hidden md:flex items-center gap-1 text-red-500 font-medium hover:text-red-600 transition-colors"
          >
            View All <ArrowRight size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.slice(0, 3).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );

  const Shop = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <div className="border-b border-gray-200 pb-8 mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">All Items</h1>
        <p className="text-gray-600 max-w-2xl text-lg">
          Browse our complete collection. All transactions are securely processed through our official Depop page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );

  const About = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About Our Store</h1>
        <div className="w-24 h-1 bg-red-500 mx-auto rounded-full"></div>
      </div>
      <p className="text-xl text-gray-700 leading-relaxed mb-6">
        Welcome to <strong className="text-gray-900">Punterhorter</strong>. We specialize in sourcing high-quality vintage, rare streetwear, and unique contemporary pieces.
      </p>
    </div>
  );

  const Contact = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-500 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
      <p className="text-gray-600 text-lg">Reach out to us via our official Depop page for all inquiries.</p>
      <a 
        href="https://www.depop.com/punterhorter/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-6 inline-block bg-red-500 text-white px-8 py-3 rounded-full font-bold hover:bg-red-600 transition-colors"
      >
        Message on Depop
      </a>
    </div>
  );

  const LoginPage = () => (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_18px_40px_rgba(28,25,23,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">Welcome</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">{authMode === 'login' ? 'Log In' : 'Sign Up'}</h1>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="your username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="••••••••"
            />
          </div>

          {loginError && <p className="text-sm text-red-600">{loginError}</p>}

          <button type="submit" className="w-full rounded-full bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors">
            {authMode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );

  const ManageProducts = () => {
    if (!isLoggedIn) {
      return <LoginPage />;
    }

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">Easy edit mode</p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">Manage Products</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={handleNewProduct}
              className="rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-red-500 transition-colors"
            >
              + Add new item
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_40px_rgba(28,25,23,0.05)]">
            <h2 className="mb-5 text-xl font-bold text-gray-900">Your product list</h2>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-4 rounded-2xl border border-stone-200 p-3">
                  <img src={product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900'} alt={product.name} className="h-20 w-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category} • {product.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditProduct(product)} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-medium text-stone-900 hover:bg-stone-200">Edit</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_40px_rgba(28,25,23,0.05)]">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{editingId ? 'Edit Item' : 'Add Item'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="text"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input
                  type="text"
                  value={draft.image}
                  onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 outline-none focus:border-red-500"
                />
              </div>
              <button
                onClick={handleSaveProduct}
                className="w-full rounded-full bg-red-500 py-3 font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-2xl bg-stone-900 px-5 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
      <Navbar />
      {currentPage === 'home' && <Home />}
      {currentPage === 'shop' && <Shop />}
      {currentPage === 'about' && <About />}
      {currentPage === 'contact' && <Contact />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'manage' && <ManageProducts />}
      <Footer />
    </div>
  );
}
