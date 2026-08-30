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
  const [isLoading, setIsLoading] = useState(true);
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
    price: '',
    image: '',
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

  // Auto-sync with the backend server when the app loads
  useEffect(() => {
    const fetchDepopItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3001/api/products');
        const liveData = await response.json();
        
        if (liveData && liveData.length > 0) {
          setProducts(liveData);
        } else {
          throw new Error("No products found");
        }
      } catch (error) {
        console.log("Backend offline, using fallback data.");
        setProducts((currentProducts) => currentProducts.length ? currentProducts : mockProducts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepopItems();
  }, []);

  // Helper to show a temporary notification (Toast)
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Share functionality
  const handleShare = () => {
    const url = window.location.href;
    
    // Attempt modern clipboard API, fallback to execCommand for iframes
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
    // Prevent scrolling to bottom of page in MS Edge.
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

  const keepInputFocused = (inputId) => {
    if (typeof document === 'undefined') return;

    requestAnimationFrame(() => {
      const field = document.getElementById(inputId);
      if (field && document.activeElement !== field) {
        field.focus();
      }
    });
  };

  // --- COMPONENTS ---

  const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigateTo('home')}>
            <h1 className="text-2xl font-bold tracking-tighter text-gray-900">PUNTER<span className="text-red-500">HORTER</span></h1>
          </div>

          {/* Desktop Nav */}
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

          {/* Mobile menu button */}
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

      {/* Mobile Nav */}
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
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Camera size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Send size={20} /></a>
            </div>
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
              <li><button className="hover:text-red-500 transition-colors">Shipping Info</button></li>
              <li><button className="hover:text-red-500 transition-colors">Returns</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 Punterhorter. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
             Powered by <Heart size={14} className="text-red-500 fill-current" /> Depop
          </div>
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

  // --- PAGES ---

  const Home = () => (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
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

      {/* Featured Products */}
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
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader className="animate-spin mb-4" size={32} />
            <p>Syncing live with Depop...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 3).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        <button 
          onClick={() => navigateTo('shop')}
          className="md:hidden mt-10 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-4 rounded-xl font-medium"
        >
          View All Items <ArrowRight size={20} />
        </button>
      </div>
      
      {/* Promo Banner */}
      <div className="bg-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Loved a piece?</h2>
          <p className="text-red-100 mb-8 max-w-xl mx-auto text-lg">Purchase securely through our Depop platform with buyer protection and verified shipping.</p>
          <a 
            href="https://www.depop.com/punterhorter/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-white text-red-500 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Visit Our Depop Shop
          </a>
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
      
      {/* Filter placeholder - functional visually */}
      <div className="flex overflow-x-auto pb-6 mb-6 gap-3 no-scrollbar">
        {['All', 'Outerwear', 'Tops', 'Bottoms', 'Shoes', 'Accessories'].map(cat => (
          <button key={cat} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors ${cat === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader className="animate-spin mb-4" size={48} />
          <p className="text-lg">Loading your Depop closet...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );

  const About = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About Our Store</h1>
        <div className="w-24 h-1 bg-red-500 mx-auto rounded-full"></div>
      </div>
      
      <div className="prose prose-lg prose-gray mx-auto">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
          alt="Store aesthetic" 
          className="w-full h-80 object-cover rounded-3xl shadow-xl mb-12"
        />
        <p className="text-xl text-gray-700 leading-relaxed mb-6">
          Welcome to <strong className="text-gray-900">Punterhorter</strong>. We specialize in sourcing high-quality vintage, rare streetwear, and unique contemporary pieces that you won't find on standard retail shelves.
        </p>
        <p className="text-gray-600 mb-10">
          What started as a small personal collection on Depop has grown into a curated destination for fashion enthusiasts. We believe in sustainable fashion, giving clothes a second life, and helping our customers express their unique style.
        </p>
        
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Why shop with us?</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-red-500 shrink-0 mt-1" />
              <span className="text-gray-700"><strong>Verified Seller:</strong> Proudly selling on Depop with consistent positive reviews.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-red-500 shrink-0 mt-1" />
              <span className="text-gray-700"><strong>Secure Checkout:</strong> All purchases are handled through Depop's secure buyer protection program.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-red-500 shrink-0 mt-1" />
              <span className="text-gray-700"><strong>Fast Shipping:</strong> We package with care and ship out quickly so you can rock your new gear ASAP.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_18px_40px_rgba(28,25,23,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">Welcome</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">{authMode === 'login' ? 'Log In' : 'Sign Up'}</h1>
        <p className="mt-2 text-sm text-gray-500">{authMode === 'login' ? 'Sign in to your account.' : 'Create a new account.'}</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input
              id="login-username"
              value={loginForm.username}
              onFocus={() => keepInputFocused('login-username')}
              onChange={(e) => {
                setLoginForm({ ...loginForm, username: e.target.value });
                keepInputFocused('login-username');
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="your username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              id="login-password"
              type="password"
              value={loginForm.password}
              onFocus={() => keepInputFocused('login-password')}
              onChange={(e) => {
                setLoginForm({ ...loginForm, password: e.target.value });
                keepInputFocused('login-password');
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="••••••••"
            />
          </div>

          {loginError && <p className="text-sm text-red-600">{loginError}</p>}

          <button type="submit" className="w-full rounded-full bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors">
            {authMode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => {
            setAuthMode(authMode === 'login' ? 'signup' : 'login');
            setLoginError('');
            setLoginForm({ username: '', password: '' });
          }}
          className="mt-5 w-full text-center text-sm font-medium text-gray-600 hover:text-red-500"
        >
          {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
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
              onClick={() => setProducts(mockProducts)}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Reset list
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
          <h2 className="mb-2 text-xl font-bold text-gray-900">{editingId ? 'Edit item' : 'Add new item'}</h2>
          <p className="mb-5 text-sm text-gray-500">Change anything you want: name, price, image, category, or Depop link.</p>

          <div className="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
            <img
              src={draft.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900'}
              alt={draft.name || 'Product preview'}
              className="h-48 w-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input id="draft-name" value={draft.name} onFocus={() => keepInputFocused('draft-name')} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); keepInputFocused('draft-name'); }} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="Example: Vintage hoodie" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
              <input id="draft-price" value={draft.price} onFocus={() => keepInputFocused('draft-price')} onChange={(e) => { setDraft({ ...draft, price: e.target.value }); keepInputFocused('draft-price'); }} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="$25.00" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select id="draft-category" value={draft.category} onFocus={() => keepInputFocused('draft-category')} onChange={(e) => { setDraft({ ...draft, category: e.target.value }); keepInputFocused('draft-category'); }} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
                <option>Outerwear</option>
                <option>Tops</option>
                <option>Bottoms</option>
                <option>Shoes</option>
                <option>Accessories</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
              <input id="draft-image" value={draft.image} onFocus={() => keepInputFocused('draft-image')} onChange={(e) => { setDraft({ ...draft, image: e.target.value }); keepInputFocused('draft-image'); }} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="https://images.unsplash.com/..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Depop Link</label>
              <input id="draft-depopUrl" value={draft.depopUrl} onFocus={() => keepInputFocused('draft-depopUrl')} onChange={(e) => { setDraft({ ...draft, depopUrl: e.target.value }); keepInputFocused('draft-depopUrl'); }} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="https://www.depop.com/punterhorter/" />
            </div>
            <button onClick={handleSaveProduct} className="w-full rounded-full bg-red-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-600">
              {editingId ? 'Save changes' : 'Add to shop'}
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  };

  const Contact = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
        <p className="text-xl text-gray-600">Have a question about an item? We're here to help.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 lg:p-12 bg-gray-900 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <p className="text-gray-400 mb-8">
              The fastest way to reach us regarding a specific item is by messaging us directly on Depop!
            </p>
            
            <div className="space-y-6">
              <a href="https://www.depop.com/punterhorter/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:text-red-400 transition-colors">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Depop</p>
                  <p className="font-medium text-lg">@punterhorter</p>
                </div>
              </a>
              
              <a href="mailto:hello@example.com" className="flex items-center gap-4 hover:text-red-400 transition-colors">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="font-medium text-lg">hello@example.com</p>
                </div>
              </a>
            </div>
          </div>
          
          <div className="mt-12">
            <button 
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Share Our Store Link <Share2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-8 lg:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); showToast("Message sent! (Demo)"); }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="Your name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows="4" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none" placeholder="What's on your mind?" required></textarea>
            </div>
            <button type="submit" className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        {currentPage === 'home' && <Home />}
        {currentPage === 'shop' && <Shop />}
        {currentPage === 'about' && <About />}
        {currentPage === 'contact' && <Contact />}
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'manage' && <ManageProducts />}
      </main>

      <Footer />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl font-medium flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}