// ═══════════════════════════════════════════════════════════════════════
// FARRUKH CONSULTANCY — FULL IMMIGRATION MANAGEMENT SYSTEM v2.1
// Fixed: Firebase Vite env vars, dashboard stats, permanent delete,
//        staff doc upload, WhatsApp generator, archive filter,
//        note deletion, report visibility, force-logout, and more.
// Deploy: GitHub → Vercel | Firebase Backend (Firestore + Storage + Auth)
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  onSnapshot, deleteDoc, updateDoc, query, orderBy, where,
  serverTimestamp, writeBatch, limit
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

import {
  ShieldCheck, User, Users, Plus, Trash2, Key, Phone, FileText, LogOut,
  Lock, ChevronRight, Search, Archive, AlertTriangle, CheckCircle2,
  Fingerprint, Settings, X, Edit3, Upload, Download, Eye, EyeOff,
  Bell, Activity, Folder, Globe, Calendar, Clock, Flag, BookOpen,
  Briefcase, Home, ChevronDown, ChevronUp, RefreshCw, CheckSquare,
  Square, FileCheck, FilePlus, Camera, BarChart2, TrendingUp,
  AlertCircle, Info, Mail, MapPin, Shield, Star, Filter, List,
  ArrowLeft, ArrowRight, MoreVertical, ExternalLink, Copy, Check,
  Database, Cloud, Zap, UserCheck, UserX, Power, Layers, Hash,
  Building, FileImage, FileType, Paperclip, MessageSquare, Send,
  Award, Clipboard, ChevronLeft, LayoutDashboard,
  ScrollText, FolderOpen, Newspaper, Tag, SlidersHorizontal,
  Save, RotateCcw, Target, CreditCard, BadgeCheck, Timer,
  Printer, Share2, MessageCircle, PhoneCall, AtSign
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════
// 1. CONFIGURATION & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════

// FIX #1: Use import.meta.env for Vite (process.env is Node.js only)
const getFirebaseConfig = () => {
  // Claude.ai canvas / sandbox environment
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try { return JSON.parse(__firebase_config); } catch {}
  }
  // Vite / Vercel deployment — import.meta.env
  const cfg = {
    apiKey:            import.meta.env?.VITE_FIREBASE_API_KEY            || '',
    authDomain:        import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN        || '',
    projectId:         import.meta.env?.VITE_FIREBASE_PROJECT_ID         || '',
    storageBucket:     import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET     || '',
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             import.meta.env?.VITE_FIREBASE_APP_ID             || '',
  };
  return cfg;
};

const isConfigured = () => {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.projectId && cfg.appId);
};

const APP_ID    = typeof __app_id !== 'undefined' ? __app_id : 'farrukh-immigration-crm-v2';
const MASTER_CODE = '7586373';
const FIRM = {
  name:  'Farrukh Nadeem',
  firm:  'Farrukh Consultancy',
  title: 'Senior Immigration Consultant',
  phone: '+92 309 6136 080',
  email: 'farrukhimmigration@gmail.com',
  city:  'Lahore, Pakistan',
};

const DB_PATH  = (col)           => `artifacts/${APP_ID}/public/data/${col}`;
const SUB_PATH = (col, id, sub)  => `artifacts/${APP_ID}/public/data/${col}/${id}/${sub}`;

const VISA_CATEGORIES = [
  { id:'schengen-visit',     label:'Schengen Visit Visa',                icon:'🇪🇺', group:'Visit/Tourism' },
  { id:'uk-visit',           label:'UK Visit Visa',                       icon:'🇬🇧', group:'Visit/Tourism' },
  { id:'usa-visit',          label:'USA B1/B2 Visa',                      icon:'🇺🇸', group:'Visit/Tourism' },
  { id:'canada-visit',       label:'Canada Visitor Visa (TRV)',           icon:'🇨🇦', group:'Visit/Tourism' },
  { id:'australia-visit',    label:'Australia Subclass 600',              icon:'🇦🇺', group:'Visit/Tourism' },
  { id:'gcc-visit',          label:'GCC Visit/Tourist Visa',              icon:'🌙', group:'Visit/Tourism' },
  { id:'nz-visit',           label:'New Zealand Visitor Visa',            icon:'🇳🇿', group:'Visit/Tourism' },
  { id:'turkey-visit',       label:'Turkey Sticker Visit Visa',           icon:'🇹🇷', group:'Visit/Tourism' },
  { id:'malaysia-visit',     label:'Malaysia Visit Visa',                 icon:'🇲🇾', group:'Visit/Tourism' },
  { id:'business-visa',      label:'Business Visa (Multi-Country)',       icon:'💼', group:'Business' },
  { id:'uk-work',            label:'UK Skilled Worker Visa',              icon:'🇬🇧', group:'Work Permits' },
  { id:'gcc-work',           label:'GCC Work Permit (UAE/Saudi/Qatar)',   icon:'⚙️', group:'Work Permits' },
  { id:'canada-lmia',        label:'Canada LMIA Work Permit (TFWP)',      icon:'🇨🇦', group:'Work Permits' },
  { id:'australia-482',      label:'Australia 482 TSS Visa',              icon:'🇦🇺', group:'Work Permits' },
  { id:'nz-aewv',            label:'New Zealand AEWV',                    icon:'🇳🇿', group:'Work Permits' },
  { id:'germany-work',       label:'Germany Work Permit / Chancenkarte', icon:'🇩🇪', group:'Work Permits' },
  { id:'poland-work',        label:'Poland Work Permit',                  icon:'🇵🇱', group:'Work Permits' },
  { id:'greece-metaklisi',   label:'Greece Metaklisi D-Visa',             icon:'🇬🇷', group:'Work Permits' },
  { id:'spain-dnv',          label:'Spain Digital Nomad Visa',            icon:'🇪🇸', group:'Work Permits' },
  { id:'portugal-work',      label:'Portugal Work Visa',                  icon:'🇵🇹', group:'Work Permits' },
  { id:'canada-blue-collar', label:'Canada Blue-Collar Work Permit',      icon:'🔧', group:'Work Permits' },
  { id:'canada-pr',          label:'Canada Express Entry / PR',           icon:'🇨🇦', group:'PR & Skilled' },
  { id:'australia-pr',       label:'Australia Skilled Migration (189/190/491)', icon:'🇦🇺', group:'PR & Skilled' },
  { id:'nz-skilled',         label:'New Zealand Skilled Migrant',         icon:'🇳🇿', group:'PR & Skilled' },
  { id:'uk-ilr',             label:'UK ILR / Settlement',                 icon:'🇬🇧', group:'PR & Skilled' },
  { id:'eb2-niw',            label:'USA EB-2 NIW (Green Card)',            icon:'🇺🇸', group:'PR & Skilled' },
  { id:'canada-study',       label:'Canada Study Permit',                 icon:'🎓', group:'Study Visas' },
  { id:'uk-study',           label:'UK Student Visa',                     icon:'🎓', group:'Study Visas' },
  { id:'australia-study',    label:'Australia Student Visa (500)',         icon:'🎓', group:'Study Visas' },
  { id:'germany-study',      label:'Germany Student Visa',                icon:'🎓', group:'Study Visas' },
  { id:'family-study',       label:'Family/Couple Study Visa',            icon:'👨‍👩‍👧', group:'Study Visas' },
  { id:'scholarship',        label:'Scholarship Advisory',                icon:'🏆', group:'Study Visas' },
  { id:'uk-spouse',          label:'UK Spouse/Family Visa',               icon:'💍', group:'Family/Spouse' },
  { id:'canada-family',      label:'Canada Family Sponsorship',           icon:'🏡', group:'Family/Spouse' },
  { id:'schengen-spouse',    label:'Schengen Spouse/Dependent',           icon:'💍', group:'Family/Spouse' },
  { id:'uk-ar-jr',           label:'UK AR / Judicial Review',             icon:'⚖️', group:'Appeals' },
  { id:'visa-appeal',        label:'Visa Refusal Appeal (General)',        icon:'⚖️', group:'Appeals' },
  { id:'other',              label:'Other / Custom',                       icon:'📋', group:'Other' },
];

const CASE_STATUSES = [
  { id:'new',             label:'New Case',         color:'bg-slate-100 text-slate-700',   dot:'bg-slate-400'  },
  { id:'docs_collection', label:'Docs Collection',  color:'bg-blue-50 text-blue-700',      dot:'bg-blue-500'   },
  { id:'in_progress',     label:'In Progress',      color:'bg-amber-50 text-amber-700',    dot:'bg-amber-500'  },
  { id:'submitted',       label:'Submitted',        color:'bg-purple-50 text-purple-700',  dot:'bg-purple-500' },
  { id:'pending_embassy', label:'Pending Embassy',  color:'bg-orange-50 text-orange-700',  dot:'bg-orange-500' },
  { id:'approved',        label:'Approved ✓',       color:'bg-green-50 text-green-700',    dot:'bg-green-500'  },
  { id:'rejected',        label:'Rejected',         color:'bg-red-50 text-red-700',        dot:'bg-red-500'    },
  { id:'on_hold',         label:'On Hold',          color:'bg-yellow-50 text-yellow-700',  dot:'bg-yellow-500' },
  { id:'appealing',       label:'Appeal Filed',     color:'bg-indigo-50 text-indigo-700',  dot:'bg-indigo-500' },
  { id:'closed',          label:'Closed',           color:'bg-gray-100 text-gray-600',     dot:'bg-gray-400'   },
];

const DOC_TYPES = [
  'Passport','CNIC','Bank Statement','Salary Slip','Employment Letter / NOC',
  'Business Registration / NTN','Educational Certificate','IELTS / Language Certificate',
  'Refusal Letter','Invitation Letter','Property Documents','Police Clearance (PCC)',
  'Medical Certificate','Cover Letter','Resume / CV','FRC / Marriage Certificate',
  'Previous Visa','Travel Insurance','Report (Client)','Report (Internal)','Other',
];

// ══════════════════════════════════════════════════════════════════════════
// 2. FIREBASE INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════

let app, auth, db, storage;
try {
  const config = getFirebaseConfig();
  if (config.apiKey) {
    app     = getApps().length ? getApps()[0] : initializeApp(config);
    auth    = getAuth(app);
    db      = getFirestore(app);
    storage = getStorage(app);
  }
} catch (e) { console.error('Firebase init error:', e); }

// ══════════════════════════════════════════════════════════════════════════
// 3. UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════

const genId       = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const ts          = () => new Date().toISOString();
const fmtDate     = (iso) => iso ? new Date(iso).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtTime     = (iso) => iso ? new Date(iso).toLocaleString('en-PK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const fmtFileSize = (bytes) => bytes < 1024 ? `${bytes}B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)}KB` : `${(bytes/1048576).toFixed(1)}MB`;
const getVisa     = (id) => VISA_CATEGORIES.find(v => v.id === id) || { label: id || 'Unknown', icon: '📋', group:'Other' };
const getStatus   = (id) => CASE_STATUSES.find(s => s.id === id) || CASE_STATUSES[0];

const logActivity = async (action, details, user) => {
  if (!db || !user) return;
  try {
    const id = genId('act');
    await setDoc(doc(db, DB_PATH('activity_log'), id), {
      id, action, details,
      performedBy: user.name || 'Unknown',
      staffId:     user.id   || 'master',
      role:        user.role || 'Staff',
      timestamp:   ts(),
      sessionId:   user.sessionId || 'unknown',
    });
  } catch { /* silent */ }
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload  = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});

// ══════════════════════════════════════════════════════════════════════════
// 4. SMALL UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════

const Badge = ({ label, color = 'bg-slate-100 text-slate-600', dot, small }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${small ? 'text-[10px]' : 'text-xs'} ${color}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
    {label}
  </span>
);

const Spinner = ({ size = 5 }) => (
  <div className={`w-${size} h-${size} border-2 border-amber-500 border-t-transparent rounded-full animate-spin`} />
);

const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, loading, className = '', type = 'button', icon: Icon }) => {
  const base  = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2.5 text-sm', lg:'px-6 py-3.5 text-sm', xl:'px-8 py-4 text-base' };
  const variants = {
    primary: 'bg-[#1a1a2e] text-white hover:bg-[#16213e] shadow-lg shadow-slate-900/20',
    amber:   'bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20',
    red:     'bg-red-600 text-white hover:bg-red-500',
    green:   'bg-green-600 text-white hover:bg-green-500',
    outline: 'border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    ghost:   'text-slate-600 hover:bg-slate-100',
    danger:  'border-2 border-red-200 text-red-600 hover:bg-red-50',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading ? <Spinner size={4} /> : Icon && <Icon size={14} />}
      {children}
    </button>
  );
};

const Input = ({ label, required, error, icon: Icon, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2.5 rounded-xl border ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'} outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-sm transition ${className}`} {...props} />
    </div>
    {error && <p className="text-red-500 text-[10px] font-semibold">{error}</p>}
  </div>
);

const Select = ({ label, required, options = [], placeholder, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <select className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-sm transition appearance-none cursor-pointer ${className}`} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, required, rows = 4, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <textarea rows={rows} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-sm transition resize-none" {...props} />
  </div>
);

const Modal = ({ open, onClose, title, children, wide }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-black text-slate-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Card = ({ children, className = '', noPad }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${noPad ? '' : 'p-6'} ${className}`}>{children}</div>
);

const StatCard = ({ icon: Icon, label, value, color = 'text-amber-600', bg = 'bg-amber-50', onClick }) => (
  <Card className={`flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition' : ''}`} onClick={onClick}>
    <div className={`p-3 rounded-xl ${bg}`}><Icon size={22} className={color} /></div>
    <div><p className="text-2xl font-black text-slate-900">{value}</p><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</p></div>
  </Card>
);

const EmptyState = ({ icon: Icon = Folder, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-5 bg-slate-100 rounded-2xl mb-4"><Icon size={32} className="text-slate-400" /></div>
    <p className="font-bold text-slate-600 text-lg">{title}</p>
    {desc && <p className="text-slate-400 text-sm mt-1 max-w-xs">{desc}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const SectionHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// 5. FIREBASE SETUP SCREEN (shown when not configured)
// ══════════════════════════════════════════════════════════════════════════

const SetupScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-6">
    <div className="max-w-lg w-full bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-2xl shadow-xl shadow-amber-600/30 mb-4">
          <Database size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">Firebase Setup Required</h1>
        <p className="text-slate-400 text-sm mt-2">The CRM is not connected to Firebase. Follow these steps to deploy.</p>
      </div>
      <div className="space-y-3 text-sm">
        {[
          ['1','Create a Firebase project at console.firebase.google.com'],
          ['2','Enable Firestore, Storage, and Anonymous Authentication'],
          ['3','Copy your Firebase config from Project Settings → Web App'],
          ['4','Add these to Vercel Environment Variables (VITE_FIREBASE_*):'],
        ].map(([n,t]) => (
          <div key={n} className="flex gap-3 p-3 bg-white/5 rounded-xl">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{n}</span>
            <span className="text-slate-300">{t}</span>
          </div>
        ))}
        <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
          {['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID'].map(k => (
            <p key={k}>{k}=your_value_here</p>
          ))}
        </div>
      </div>
      <p className="text-center text-white/40 text-xs">{FIRM.phone} • {FIRM.city}</p>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// 6. LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════

const LoginScreen = ({ staff, onLogin }) => {
  const [mode,    setMode]    = useState('master');
  const [phone,   setPhone]   = useState('');
  const [pin,     setPin]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    if (mode === 'master') {
      if (pin === MASTER_CODE) {
        onLogin({ id:'master', name:FIRM.name, role:'Master', sessionId:genId('sess'), loginTime:ts() });
      } else {
        setError('Incorrect Master Access Code. Please try again.');
      }
    } else {
      const cleanPhone = phone.replace(/[\s-]/g,'');
      const found = staff.find(s =>
        s.phone?.replace(/[\s-]/g,'') === cleanPhone && s.pin === pin && !s.suspended && !s.terminated
      );
      if (found) {
        onLogin({ ...found, sessionId:genId('sess'), loginTime:ts() });
      } else if (staff.find(s => s.phone?.replace(/[\s-]/g,'') === cleanPhone && s.suspended)) {
        setError('Your account has been suspended. Contact Farrukh Nadeem.');
      } else {
        setError('Invalid credentials. Check your phone number and PIN.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_,i) => (
          <div key={i} className="absolute rounded-full opacity-5 bg-amber-500"
            style={{ width:`${150+i*90}px`, height:`${150+i*90}px`, top:`${8+i*18}%`, left:`${4+i*20}%`, animation:`pulse ${3+i}s infinite` }} />
        ))}
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-3xl shadow-2xl shadow-amber-600/30 mb-5">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{FIRM.firm}</h1>
          <p className="text-amber-400/70 text-xs font-bold uppercase tracking-[0.2em] mt-1">Immigration Management Portal</p>
          <p className="text-slate-400 text-xs mt-1">{FIRM.name} • {FIRM.title}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="flex bg-white/5 p-1 m-4 rounded-2xl">
            {[['master','⭐ Master Access'],['staff','👤 Staff Login']].map(([m,lbl]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setPin(''); }}
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${mode===m ? 'bg-amber-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="px-8 pb-8 space-y-5">
            {mode === 'staff' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-white/50 uppercase tracking-wider">Staff Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-3.5 text-white/40" />
                  <input type="tel" placeholder="+92 3XX XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-wider">
                {mode==='master' ? 'Master Access Code' : 'Security PIN'}
              </label>
              <div className="relative">
                <Fingerprint size={16} className="absolute left-4 top-3.5 text-amber-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && handleLogin()}
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm text-center tracking-[0.6em] font-black"
                />
                <button onClick={() => setShowPin(p=>!p)} className="absolute right-4 top-3.5 text-white/40 hover:text-white/70 transition">
                  {showPin ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertTriangle size={14} />{error}
              </div>
            )}
            <button onClick={handleLogin} disabled={loading || !pin || (mode==='staff' && !phone)}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-amber-600/30 transition active:scale-95 disabled:opacity-60 mt-2">
              {loading ? <Spinner /> : <><Lock size={18} /> Access Portal</>}
            </button>
          </div>
        </div>
        <p className="text-center text-white/20 text-[10px] mt-6 font-bold uppercase tracking-wider">
          {FIRM.phone} • {FIRM.city}
        </p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 7. DOCUMENT UPLOAD COMPONENT
// ══════════════════════════════════════════════════════════════════════════

const DocUpload = ({ clientId, currentUser, onUploaded }) => {
  const [file,      setFile]      = useState(null);
  const [docType,   setDocType]   = useState('');
  const [notes,     setNotes]     = useState('');
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const fileRef = useRef();

  const upload = async () => {
    if (!file || !docType) { setError('Please select a document type and file.'); return; }
    setUploading(true); setError('');
    try {
      const docId        = genId('doc');
      const safeFileName = `${docId}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
      let url = null;

      if (storage) {
        try {
          const sRef = storageRef(storage, `clients/${clientId}/documents/${safeFileName}`);
          await new Promise((resolve, reject) => {
            const task = uploadBytesResumable(sRef, file);
            task.on('state_changed',
              snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
              reject,
              async () => { url = await getDownloadURL(task.snapshot.ref); resolve(); }
            );
          });
        } catch (storageErr) {
          // Storage unavailable — fallback to base64 for small files only
          if (file.size < 1.5 * 1024 * 1024) {
            url = await fileToBase64(file);
          } else {
            throw new Error('Firebase Storage is not configured. Files larger than 1.5 MB require Storage to be enabled in your Firebase project.');
          }
        }
      } else if (file.size < 1.5 * 1024 * 1024) {
        url = await fileToBase64(file);
      } else {
        throw new Error('Firebase Storage is required for files larger than 1.5 MB. Enable it in Firebase Console.');
      }

      const docMeta = {
        id: docId, clientId, docType,
        name: file.name, safeFileName,
        size: file.size, mimeType: file.type,
        url: url || null, notes,
        uploadedBy: currentUser.name, uploadedAt: ts(), deleted: false,
      };
      await setDoc(doc(db, SUB_PATH('clients', clientId, 'documents'), docId), docMeta);
      await logActivity('document_uploaded', `${docType}: ${file.name}`, currentUser);
      onUploaded(docMeta);
      setFile(null); setDocType(''); setNotes(''); setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) { setError(e.message || 'Upload failed.'); }
    setUploading(false);
  };

  return (
    <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
      <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2"><Upload size={12} /> Upload Document</p>
      <Select label="Document Type" required value={docType} onChange={e => setDocType(e.target.value)} options={DOC_TYPES} placeholder="Select type..." />
      <div className="space-y-1">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">File <span className="text-red-500">*</span></label>
        <input ref={fileRef} type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.txt,.csv"
          onChange={e => { setFile(e.target.files[0]); setError(''); }}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer" />
        {file && <p className="text-[10px] text-slate-500 mt-1">{file.name} • {fmtFileSize(file.size)}</p>}
      </div>
      <Input label="Notes (optional)" placeholder="e.g., 6 months statement, Jan–Jun 2025" value={notes} onChange={e => setNotes(e.target.value)} />
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{width:`${progress}%`}} />
          </div>
          <p className="text-[10px] text-slate-500 text-center">{progress}% uploaded</p>
        </div>
      )}
      {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertTriangle size={12}/>{error}</p>}
      <Btn icon={Upload} onClick={upload} disabled={uploading || !file || !docType} loading={uploading} className="w-full" variant="amber">Upload Document</Btn>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 8. WHATSAPP MESSAGE GENERATOR
// ══════════════════════════════════════════════════════════════════════════

const WhatsAppGenerator = ({ client, cases }) => {
  const [selectedCase, setSelectedCase] = useState(cases[0] || null);
  const [customMsg,    setCustomMsg]    = useState('');
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    if (!selectedCase) return;
    const visa   = getVisa(selectedCase.visaType);
    const status = getStatus(selectedCase.status);
    const now    = new Date().toLocaleDateString('en-PK', { day:'2-digit', month:'long', year:'numeric' });
    setCustomMsg(
`🇵🇰 *${FIRM.firm.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Case Update — ${client.name}*
📅 Date: ${now}

${visa.icon} *Visa Type:* ${visa.label}
📊 *Status:* ${status.label}
🔖 *Reference:* FC-${selectedCase.id.slice(-8).toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━

✅ *Documents Received:*
→ [List provided documents here]

❌ *Still Required:*
→ [List pending documents here]

📌 *Remarks:*
${selectedCase.notes || '[Add case notes here]'}

📞 *Next Step:* [Action required from client]
━━━━━━━━━━━━━━━━━━━━━━━━━
_${FIRM.name} | ${FIRM.phone}_
_${FIRM.firm} | ${FIRM.city}_`
    );
  }, [selectedCase, client.name]);

  const copy = () => {
    navigator.clipboard.writeText(customMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    const num = client.phone?.replace(/[\s+\-()]/g,'') || '';
    if (!num) { alert('No phone number on file for this client.'); return; }
    const url = `https://wa.me/${num}?text=${encodeURIComponent(customMsg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {cases.length > 1 && (
        <Select label="Select Case" value={selectedCase?.id || ''}
          onChange={e => setSelectedCase(cases.find(c=>c.id===e.target.value))}
          options={cases.map(c=>({ value:c.id, label:`${getVisa(c.visaType).icon} ${getVisa(c.visaType).label}` }))} />
      )}
      <Textarea label="WhatsApp Message (Editable)" value={customMsg}
        onChange={e => setCustomMsg(e.target.value)} rows={20} />
      <div className="flex gap-2">
        <Btn icon={copied ? Check : Copy} variant="outline" onClick={copy} className="flex-1">
          {copied ? 'Copied!' : 'Copy Message'}
        </Btn>
        <Btn icon={MessageCircle} variant="green" onClick={openWhatsApp} className="flex-1"
          disabled={!client.phone}>
          Open in WhatsApp
        </Btn>
      </div>
      {!client.phone && <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">⚠️ Add client phone number in their profile to use "Open in WhatsApp".</p>}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 9. REPORT GENERATOR COMPONENT
// ══════════════════════════════════════════════════════════════════════════

const ReportGenerator = ({ client, caseData, currentUser, onSaved }) => {
  const visa = getVisa(caseData?.visaType || 'other');
  const [reportType, setReportType] = useState('client');
  const [content,    setContent]    = useState('');
  const [saving,     setSaving]     = useState(false);

  const getTemplate = (type) => {
    const now = new Date().toLocaleDateString('en-PK', { day:'2-digit', month:'long', year:'numeric' });
    if (type === 'client') return `FARRUKH CONSULTANCY
${FIRM.name} | ${FIRM.title}
Contact: ${FIRM.phone} | ${FIRM.email}
${FIRM.city}
Date: ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT VISA CASE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prepared For: ${client?.name || '[CLIENT NAME]'}
Case Type: ${visa.label}
Reference: FC-${(caseData?.id || 'NEW').slice(-8).toUpperCase()}

DEAR ${(client?.name || 'Valued Client').toUpperCase()},

We are pleased to present the status and strategic overview of your visa application.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. APPLICATION OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visa Category: ${visa.label}
Application Status: ${getStatus(caseData?.status).label}
Target Country/Embassy: [SPECIFY]
Estimated Processing Time: [SPECIFY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. YOUR PROFILE STRENGTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Paste AI-generated profile analysis here]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. REQUIRED DOCUMENTS STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Documents Received:
→ [List provided documents]

❌ Still Required:
→ [List pending documents]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. RECOMMENDED STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Paste AI-generated strategy here]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. COST ESTIMATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visa Fee: [SPECIFY]
Service Charges: As per agreement
Other Costs: [SPECIFY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [Step 1]
2. [Step 2]
3. [Step 3]

Please do not hesitate to contact us for any clarification.

Regards,
${FIRM.name}
${FIRM.firm}
${FIRM.phone}`;

    return `FARRUKH CONSULTANCY — CONFIDENTIAL INTERNAL FILE
⚠️  FOR OFFICE USE ONLY — DO NOT SHARE WITH CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date: ${now}

CLIENT: ${client?.name || '[CLIENT NAME]'}
CNIC: ${client?.cnic || '[CNIC]'}
PASSPORT: ${client?.passport || '[PASSPORT NO]'}
PHONE: ${client?.phone || '[PHONE]'}
VISA TYPE: ${visa.label}
CASE REF: FC-${(caseData?.id || 'NEW').slice(-8).toUpperCase()}
CASE OFFICER: ${currentUser?.name}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. FORENSIC PROFILE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Paste AI case analysis here — from Claude.ai with immigration skills]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. FINANCIAL FORENSIC ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bank Statement Period: [SPECIFY]
Average Monthly Balance: PKR [AMOUNT]
Income Source: ${client?.occupation || '[SPECIFY]'}
FBR/ATL Status: ${client?.fbrStatus || '[FILER / NON-FILER]'}
NTN: ${client?.ntn || '[SPECIFY]'}

🚩 RED FLAGS IDENTIFIED:
[List any red flags]

✅ STRENGTHS:
[List strengths]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. RISK & WEAKNESS MATRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Refusal Risk: [LOW / MEDIUM / HIGH]

[Paste detailed weakness analysis from Claude here]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. INTERNAL STRATEGY NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Confidential strategic notes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. CONSULTANCY FEES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fee agreed: PKR [AMOUNT]
Advance received: PKR [AMOUNT]
Balance: PKR [AMOUNT]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREPARED BY: ${FIRM.name} | ${FIRM.phone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  useEffect(() => { setContent(getTemplate(reportType)); }, [reportType]);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const reportId   = genId('rep');
      const reportData = {
        id: reportId, clientId: client.id, caseId: caseData?.id || null,
        reportType, content,
        visaType: caseData?.visaType || 'general',
        createdBy: currentUser.name, createdAt: ts(),
        title: `${reportType==='client'?'Client Report':'Internal Report'} — ${visa.label}`,
      };
      await setDoc(doc(db, SUB_PATH('clients', client.id, 'reports'), reportId), reportData);
      await logActivity('report_generated', `${reportType} report for ${client.name}`, currentUser);
      onSaved(reportData);
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const print = () => {
    const win = window.open('','_blank');
    win.document.write(`<html><head><title>Report — ${client.name}</title><style>body{font-family:monospace;font-size:13px;white-space:pre-wrap;padding:2rem;line-height:1.6}</style></head><body>${content}</body></html>`);
    win.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['client','📄 Client Report'],['internal','🔒 Internal Report']].map(([t,l]) => (
          <button key={t} onClick={() => setReportType(t)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition ${reportType===t ? 'bg-[#1a1a2e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 bg-amber-50 p-3 rounded-xl border border-amber-200">
        💡 <strong>Tip:</strong> Generate AI analysis using Claude.ai with all immigration skills, then paste the content into the editor below before saving.
      </p>
      <Textarea
        label={reportType==='client' ? 'Client Report Content' : 'Internal Office Report (Confidential)'}
        value={content} onChange={e => setContent(e.target.value)} rows={18}
      />
      <div className="flex gap-2">
        <Btn icon={RotateCcw} variant="outline" onClick={() => setContent(getTemplate(reportType))}>Reset</Btn>
        <Btn icon={Printer} variant="outline" onClick={print}>Print</Btn>
        <Btn icon={Save} variant="amber" onClick={save} loading={saving} className="flex-1">Save to Cloud</Btn>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 10. CLIENT DETAIL VIEW
// ══════════════════════════════════════════════════════════════════════════

const ClientDetailView = ({ clientId, currentUser, isAdmin, onBack }) => {
  const [client,      setClient]      = useState(null);
  const [cases,       setCases]       = useState([]);
  const [documents,   setDocuments]   = useState([]);
  const [reports,     setReports]     = useState([]);
  const [notes,       setNotes]       = useState([]);
  const [tab,         setTab]         = useState('profile');
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [showAddCase, setShowAddCase] = useState(false);
  const [showUpload,  setShowUpload]  = useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [showWA,      setShowWA]      = useState(false);
  const [newNote,     setNewNote]     = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [newCase,     setNewCase]     = useState({ visaType:'', notes:'', priority:'normal', fee:'' });
  const [statusNote,  setStatusNote]  = useState('');
  const [updatingCase, setUpdatingCase] = useState(null);

  useEffect(() => {
    if (!clientId || !db) return;
    const u1 = onSnapshot(doc(db, DB_PATH('clients'), clientId), d => {
      if (d.exists()) { const data = {id:d.id,...d.data()}; setClient(data); setEditForm(data); }
      setLoading(false);
    });
    const u2 = onSnapshot(collection(db, SUB_PATH('clients', clientId, 'cases')), s =>
      setCases(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt))));
    const u3 = onSnapshot(collection(db, SUB_PATH('clients', clientId, 'documents')), s =>
      setDocuments(s.docs.map(d=>({id:d.id,...d.data()})).filter(d=>!d.deleted).sort((a,b)=>b.uploadedAt?.localeCompare(a.uploadedAt))));
    const u4 = onSnapshot(collection(db, SUB_PATH('clients', clientId, 'reports')), s =>
      setReports(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt))));
    const u5 = onSnapshot(collection(db, SUB_PATH('clients', clientId, 'notes')), s =>
      setNotes(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt))));
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [clientId]);

  useEffect(() => {
    if (client) logActivity('client_viewed', `Viewed: ${client.name}`, currentUser);
  }, [client?.id]);

  const saveEdit = async () => {
    if (!editForm.name?.trim() || !editForm.cnic?.trim()) {
      alert('Full Name and CNIC are required.'); return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, DB_PATH('clients'), clientId), {...editForm, updatedBy:currentUser.name, updatedAt:ts()});
      await logActivity('client_edited', `Edited profile: ${editForm.name}`, currentUser);
      setEditing(false);
    } catch { alert('Save failed. Please try again.'); }
    setSaving(false);
  };

  const addCase = async () => {
    if (!newCase.visaType) return;
    const id = genId('case');
    await setDoc(doc(db, SUB_PATH('clients', clientId, 'cases'), id), {
      id, clientId, ...newCase, status:'new',
      createdBy: currentUser.name, createdAt: ts(), updatedAt: ts(),
      history: [{ status:'new', note:'Case created', by:currentUser.name, at:ts() }],
    });
    await logActivity('case_created', `Created ${newCase.visaType} case for ${client.name}`, currentUser);
    setNewCase({ visaType:'', notes:'', priority:'normal', fee:'' });
    setShowAddCase(false);
  };

  const updateCaseStatus = async (caseId, status, note='') => {
    const c = cases.find(x => x.id === caseId);
    if (!c) return;
    const history = [...(c.history||[]), { status, note, by:currentUser.name, at:ts() }];
    await updateDoc(doc(db, SUB_PATH('clients', clientId, 'cases'), caseId), {
      status, updatedAt:ts(), updatedBy:currentUser.name, history,
    });
    await logActivity('case_status_updated', `Case → ${status} for ${client.name}`, currentUser);
    setUpdatingCase(null); setStatusNote('');
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const id = genId('note');
    await setDoc(doc(db, SUB_PATH('clients', clientId, 'notes'), id), {
      id, content: newNote, addedBy: currentUser.name, createdAt: ts(),
    });
    await logActivity('note_added', `Note added for ${client.name}`, currentUser);
    setNewNote('');
  };

  // FIX #5: Admin note deletion
  const deleteNote = async (noteId) => {
    if (!isAdmin || !window.confirm('Delete this note?')) return;
    await deleteDoc(doc(db, SUB_PATH('clients', clientId, 'notes'), noteId));
    await logActivity('note_deleted', `Note deleted for ${client.name}`, currentUser);
  };

  const softDeleteDoc = async (docId) => {
    if (!isAdmin || !window.confirm('Archive this document?')) return;
    await updateDoc(doc(db, SUB_PATH('clients', clientId, 'documents'), docId), {
      deleted:true, deletedBy:currentUser.name, deletedAt:ts(),
    });
    await logActivity('document_archived', `Document archived for ${client.name}`, currentUser);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={8} /></div>;
  if (!client)  return <div className="text-center py-16 text-slate-500">Client not found</div>;

  const TABS = [
    {id:'profile',   label:'Profile',              icon:User},
    {id:'cases',     label:`Cases (${cases.length})`,        icon:Briefcase},
    {id:'documents', label:`Docs (${documents.length})`,     icon:Folder},
    {id:'reports',   label:`Reports (${reports.length})`,    icon:FileText},
    {id:'notes',     label:`Timeline (${notes.length})`,     icon:MessageSquare},
    {id:'whatsapp',  label:'WhatsApp',             icon:MessageCircle},
  ];

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition flex-shrink-0"><ChevronLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-500/30 flex-shrink-0">
              {client.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 truncate">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">CNIC: {client.cnic}</span>
                {client.passport && <span className="font-mono">PP: {client.passport}</span>}
                {client.phone    && <span>{client.phone}</span>}
              </div>
            </div>
          </div>
        </div>
        {isAdmin && <Btn icon={Edit3} variant="outline" size="sm" onClick={() => setEditing(true)} className="flex-shrink-0">Edit</Btn>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${tab===t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon size={12}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={16}/>Personal Information</h3>
            <div className="space-y-2">
              {[['Full Name',client.name],['CNIC',client.cnic],['Passport No.',client.passport||'—'],['Date of Birth',client.dob||'—'],['Nationality',client.nationality||'Pakistani'],['Phone',client.phone||'—'],['Email',client.email||'—'],['City',client.city||'—'],['Address',client.address||'—']].map(([l,v]) => (
                <div key={l} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-500 font-semibold">{l}</span>
                  <span className="text-sm font-bold text-slate-800 text-right max-w-xs break-words">{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <Card>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={16}/>Employment & Finance</h3>
              <div className="space-y-2">
                {[['Occupation',client.occupation||'—'],['Employer',client.employer||'—'],['Monthly Income',client.income?`PKR ${Number(client.income).toLocaleString()}`:'—'],['FBR/ATL Status',client.fbrStatus||'—'],['NTN',client.ntn||'—']].map(([l,v]) => (
                  <div key={l} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-500 font-semibold">{l}</span>
                    <span className="text-sm font-bold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Globe size={16}/>Travel History</h3>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">{client.travelHistory || 'No travel history recorded.'}</div>
              {client.priorRefusals && <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700"><strong>⚠️ Prior Refusals:</strong> {client.priorRefusals}</div>}
            </Card>
            <Card className="bg-slate-50">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Added By</p>
              <p className="text-sm font-bold text-slate-700 mt-1">{client.addedBy} • {fmtDate(client.createdAt)}</p>
              {client.updatedBy && <p className="text-[10px] text-slate-400 mt-1">Last updated by {client.updatedBy} — {fmtDate(client.updatedAt)}</p>}
            </Card>
          </div>
        </div>
      )}

      {/* ── CASES TAB ── */}
      {tab === 'cases' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {isAdmin && <Btn icon={Plus} variant="amber" onClick={() => setShowAddCase(true)}>New Case</Btn>}
          </div>
          {cases.length === 0
            ? <EmptyState icon={Briefcase} title="No cases yet" desc="Create the first case for this client" action={isAdmin && <Btn icon={Plus} variant="amber" onClick={() => setShowAddCase(true)}>Create Case</Btn>} />
            : cases.map(c => {
              const st = getStatus(c.status); const v = getVisa(c.visaType);
              return (
                <Card key={c.id} className="border-l-4 border-l-amber-500">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-lg">{v.icon}</span>
                        <span className="font-bold text-slate-900">{v.label}</span>
                        <Badge label={st.label} color={st.color} dot={st.dot} />
                        {c.priority==='urgent' && <Badge label="⚡ URGENT" color="bg-red-100 text-red-700" />}
                        {c.priority==='vip'    && <Badge label="⭐ VIP"    color="bg-amber-100 text-amber-700" />}
                      </div>
                      {c.notes && <p className="text-sm text-slate-600 mb-2">{c.notes}</p>}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span>Created: {fmtDate(c.createdAt)}</span>
                        <span>By: {c.createdBy}</span>
                        {c.fee && <span className="font-bold text-slate-600">Fee: PKR {Number(c.fee).toLocaleString()}</span>}
                      </div>
                      {c.history?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {c.history.slice(-3).map((h,i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                              <span className="font-semibold">{getStatus(h.status).label}</span>
                              {h.note && <span>— {h.note}</span>}
                              <span>• {fmtDate(h.at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-2">
                        <Select value={c.status} onChange={e => { setUpdatingCase(c); updateCaseStatus(c.id, e.target.value, statusNote); }}
                          options={CASE_STATUSES.map(s=>({value:s.id, label:s.label}))} className="text-xs py-1.5" />
                        <Btn icon={FileText} size="sm" variant="outline" onClick={() => { setSelectedCase(c); setShowReport(true); }}>Report</Btn>
                        <Btn icon={MessageCircle} size="sm" variant="outline" onClick={() => { setTab('whatsapp'); }}>WhatsApp</Btn>
                      </div>
                    )}
                  </div>
                </Card>
              );
          })}
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          {/* FIX #3: Both admins and staff can upload */}
          <div className="flex gap-2">
            <Btn icon={showUpload ? X : Upload} variant={showUpload?'outline':'amber'} onClick={() => setShowUpload(p=>!p)}>
              {showUpload ? 'Cancel Upload' : 'Upload Document'}
            </Btn>
          </div>
          {showUpload && <DocUpload clientId={clientId} currentUser={currentUser} onUploaded={() => setShowUpload(false)} />}
          {documents.length === 0
            ? <EmptyState icon={Folder} title="No documents yet" desc="Upload passports, bank statements, and other required documents" />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-4 bg-white border rounded-2xl hover:shadow-md transition group">
                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 flex-shrink-0">
                      {d.mimeType?.includes('image') ? <FileImage size={20}/> : d.mimeType?.includes('pdf') ? <FileText size={20} className="text-red-500"/> : <FileCheck size={20}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{d.docType}</p>
                      <p className="text-[10px] text-slate-400 truncate">{d.name} • {fmtFileSize(d.size)}</p>
                      <p className="text-[10px] text-slate-400">{fmtDate(d.uploadedAt)} • {d.uploadedBy}</p>
                      {d.notes && <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{d.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition" title="View"><Eye size={16}/></a>
                      )}
                      {isAdmin && (
                        <button onClick={() => softDeleteDoc(d.id)}
                          className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition" title="Archive"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {/* FIX #4: Admin can generate, all can view */}
          {isAdmin && (
            <div className="flex gap-2">
              <Btn icon={showReport ? X : FilePlus} variant={showReport?'outline':'amber'} onClick={() => setShowReport(p=>!p)}>
                {showReport ? 'Cancel' : 'Generate New Report'}
              </Btn>
            </div>
          )}
          {showReport && isAdmin && (
            <ReportGenerator
              client={client} caseData={selectedCase || cases[0]}
              currentUser={currentUser} onSaved={() => setShowReport(false)}
            />
          )}
          {reports.length === 0
            ? <EmptyState icon={FileText} title={isAdmin ? 'No reports generated yet' : 'No reports available'} desc="Reports will appear here once generated" />
            : reports.map(r => (
              <Card key={r.id} className={`border-l-4 ${r.reportType==='internal'?'border-l-purple-500':'border-l-blue-500'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge label={r.reportType==='client'?'📄 Client Report':'🔒 Internal Report'}
                      color={r.reportType==='client'?'bg-blue-50 text-blue-700':'bg-purple-50 text-purple-700'} />
                    <p className="font-bold text-slate-800 mt-2">{r.title}</p>
                    <p className="text-xs text-slate-400">{fmtTime(r.createdAt)} • {r.createdBy}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => navigator.clipboard.writeText(r.content)} className="p-2 hover:bg-slate-100 rounded-xl transition" title="Copy"><Copy size={16} className="text-slate-400"/></button>
                    <button onClick={() => {
                      const win = window.open('','_blank');
                      win.document.write(`<html><head><title>${r.title}</title><style>body{font-family:monospace;font-size:13px;white-space:pre-wrap;padding:2rem;line-height:1.6}</style></head><body>${r.content}</body></html>`);
                      win.print();
                    }} className="p-2 hover:bg-slate-100 rounded-xl transition" title="Print"><Printer size={16} className="text-slate-400"/></button>
                  </div>
                </div>
                <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">{r.content}</pre>
              </Card>
            ))
          }
        </div>
      )}

      {/* ── TIMELINE/NOTES TAB ── */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input type="text" placeholder="Add a timeline note or progress update..."
              value={newNote} onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key==='Enter' && addNote()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
            <Btn icon={Send} variant="amber" onClick={addNote} disabled={!newNote.trim()}>Add</Btn>
          </div>
          {notes.length === 0
            ? <EmptyState icon={MessageSquare} title="No notes yet" desc="Track case progress with timeline notes" />
            : (
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
                {notes.map(n => (
                  <div key={n.id} className="relative mb-4">
                    <div className="absolute -left-4 top-2.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow" />
                    <div className="bg-white border rounded-2xl p-4 shadow-sm group">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-slate-400">{n.addedBy} • {fmtTime(n.createdAt)}</p>
                        {isAdmin && (
                          <button onClick={() => deleteNote(n.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition" title="Delete note">
                            <Trash2 size={12}/>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── WHATSAPP TAB ── */}
      {tab === 'whatsapp' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageCircle size={16} className="text-green-500"/>Generate WhatsApp Update</h3>
            {cases.length === 0
              ? <EmptyState icon={Briefcase} title="No cases found" desc="Create a case first to generate a WhatsApp update" />
              : <WhatsAppGenerator client={client} cases={cases} />
            }
          </Card>
        </div>
      )}

      {/* ── MODALS ── */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Client Profile" wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" required value={editForm.name||''} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
          <Input label="CNIC (00000-0000000-0)" required value={editForm.cnic||''} onChange={e=>setEditForm({...editForm, cnic:e.target.value})} placeholder="XXXXX-XXXXXXX-X"/>
          <Input label="Passport No." value={editForm.passport||''} onChange={e=>setEditForm({...editForm, passport:e.target.value})} />
          <Input label="Date of Birth" type="date" value={editForm.dob||''} onChange={e=>setEditForm({...editForm, dob:e.target.value})} />
          <Input label="Nationality" value={editForm.nationality||''} onChange={e=>setEditForm({...editForm, nationality:e.target.value})} />
          <Input label="Phone" value={editForm.phone||''} onChange={e=>setEditForm({...editForm, phone:e.target.value})} />
          <Input label="Email" type="email" value={editForm.email||''} onChange={e=>setEditForm({...editForm, email:e.target.value})} />
          <Input label="City" value={editForm.city||''} onChange={e=>setEditForm({...editForm, city:e.target.value})} />
          <div className="md:col-span-2"><Input label="Address" value={editForm.address||''} onChange={e=>setEditForm({...editForm, address:e.target.value})} /></div>
          <Input label="Occupation" value={editForm.occupation||''} onChange={e=>setEditForm({...editForm, occupation:e.target.value})} />
          <Input label="Employer / Business" value={editForm.employer||''} onChange={e=>setEditForm({...editForm, employer:e.target.value})} />
          <Input label="Monthly Income (PKR)" type="number" value={editForm.income||''} onChange={e=>setEditForm({...editForm, income:e.target.value})} />
          <Select label="FBR/ATL Status" value={editForm.fbrStatus||''} onChange={e=>setEditForm({...editForm, fbrStatus:e.target.value})} options={['Active Filer','Non-Filer','Filed - Not on ATL','Unknown']} placeholder="Select..." />
          <Input label="NTN Number" value={editForm.ntn||''} onChange={e=>setEditForm({...editForm, ntn:e.target.value})} />
          <Input label="Passport Expiry" type="date" value={editForm.passportExpiry||''} onChange={e=>setEditForm({...editForm, passportExpiry:e.target.value})} />
          <div className="md:col-span-2"><Textarea label="Travel History" rows={3} value={editForm.travelHistory||''} onChange={e=>setEditForm({...editForm, travelHistory:e.target.value})} placeholder="Previous Schengen, UK, USA visa details..." /></div>
          <div className="md:col-span-2"><Textarea label="Prior Visa Refusals" rows={2} value={editForm.priorRefusals||''} onChange={e=>setEditForm({...editForm, priorRefusals:e.target.value})} /></div>
        </div>
        <div className="flex gap-2 mt-6">
          <Btn variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Btn>
          <Btn icon={Save} variant="amber" onClick={saveEdit} loading={saving} className="flex-1">Save Changes</Btn>
        </div>
      </Modal>

      <Modal open={showAddCase} onClose={() => setShowAddCase(false)} title="Create New Case">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Visa Category <span className="text-red-500">*</span></label>
            <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
              value={newCase.visaType} onChange={e=>setNewCase({...newCase, visaType:e.target.value})}>
              <option value="">Select visa category...</option>
              {Object.entries(VISA_CATEGORIES.reduce((acc,v)=>({...acc,[v.group]:[...(acc[v.group]||[]),v]}),{})).map(([grp,cats])=>(
                <optgroup key={grp} label={grp}>{cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</optgroup>
              ))}
            </select>
          </div>
          <Select label="Priority" value={newCase.priority} onChange={e=>setNewCase({...newCase, priority:e.target.value})}
            options={[{value:'normal',label:'Normal'},{value:'urgent',label:'⚡ Urgent'},{value:'vip',label:'⭐ VIP'}]} />
          <Input label="Agreed Fee (PKR)" type="number" placeholder="0" value={newCase.fee} onChange={e=>setNewCase({...newCase, fee:e.target.value})} />
          <Textarea label="Case Notes" rows={4} placeholder="Target country, special requirements, client notes..." value={newCase.notes} onChange={e=>setNewCase({...newCase, notes:e.target.value})} />
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => setShowAddCase(false)} className="flex-1">Cancel</Btn>
            <Btn icon={Plus} variant="amber" onClick={addCase} disabled={!newCase.visaType} className="flex-1">Create Case</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={showReport && !isAdmin} onClose={() => setShowReport(false)} title="View Report">
        <div className="text-center py-8 text-slate-400">Only admins can generate reports.</div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 11. CLIENTS VIEW (LIST)
// ══════════════════════════════════════════════════════════════════════════

const ClientsView = ({ currentUser, isAdmin, onSelectClient }) => {
  const [clients,   setClients]   = useState([]);
  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({
    name:'', cnic:'', passport:'', phone:'', email:'', nationality:'Pakistani',
    occupation:'', employer:'', income:'', visaInterest:'', dob:'', passportExpiry:'',
    city:'', address:'', travelHistory:'', priorRefusals:'', fbrStatus:'', ntn:'', notes:'',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, DB_PATH('clients')), s => {
      setClients(s.docs.map(d=>({id:d.id,...d.data()})).filter(d=>!d.deleted && !d.permanentlyDeleted).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addClient = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Full Name is required.'); return; }
    if (!form.cnic.trim()) { setFormError('CNIC is required.'); return; }
    setSaving(true);
    const id = genId('cli');
    await setDoc(doc(db, DB_PATH('clients'), id), {
      id, ...form, deleted:false, permanentlyDeleted:false, addedBy:currentUser.name, createdAt:ts(),
    });
    await logActivity('client_created', `Added new client: ${form.name}`, currentUser);
    setForm({ name:'',cnic:'',passport:'',phone:'',email:'',nationality:'Pakistani',occupation:'',employer:'',income:'',visaInterest:'',dob:'',passportExpiry:'',city:'',address:'',travelHistory:'',priorRefusals:'',fbrStatus:'',ntn:'',notes:'' });
    setShowAdd(false); setSaving(false);
  };

  const filtered = useMemo(() => clients.filter(c => {
    const q      = search.toLowerCase();
    const matchQ = !q || c.name?.toLowerCase().includes(q) || c.cnic?.includes(q) || c.passport?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
    const matchC = !filterCat || c.visaInterest === filterCat;
    return matchQ && matchC;
  }), [clients, search, filterCat]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Clients" subtitle={`${clients.length} registered clients`} actions={
        isAdmin && <Btn icon={Plus} variant="amber" onClick={() => setShowAdd(true)}>New Client</Btn>
      }/>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input placeholder="Search name, CNIC, passport, phone..."
            value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-amber-500/20" />
        </div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none">
          <option value="">All Categories</option>
          {VISA_CATEGORIES.map(v=><option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size={8}/></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No clients found"
          desc={search ? 'Try a different search term' : 'Add your first client to get started'}
          action={!search && isAdmin && <Btn icon={Plus} variant="amber" onClick={() => setShowAdd(true)}>Add First Client</Btn>}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <div key={c.id} onClick={() => onSelectClient(c.id)}
              className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-amber-200 transition cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-500/20 flex-shrink-0">
                {c.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900">{c.name}</p>
                  {c.priorRefusals && <Badge label="Prior Refusal" color="bg-red-50 text-red-600" small/>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono">{c.cnic}</span>
                  {c.passport && <span className="font-mono">PP: {c.passport}</span>}
                  {c.phone    && <span>{c.phone}</span>}
                </div>
                {c.visaInterest && (
                  <div className="mt-1">
                    <Badge label={`${getVisa(c.visaInterest).icon} ${getVisa(c.visaInterest).label}`} color="bg-amber-50 text-amber-700" small />
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-slate-400">{fmtDate(c.createdAt)}</p>
                <p className="text-[10px] text-slate-400">{c.addedBy}</p>
                <ChevronRight size={16} className="text-slate-300 mt-1 ml-auto group-hover:text-amber-500 transition" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register New Client" wide>
        <div className="space-y-6">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2"><AlertTriangle size={14}/>{formError}</div>}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-semibold">⭐ Full Name and CNIC are mandatory for all clients.</div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Personal Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" required value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
              <Input label="CNIC (00000-0000000-0)" required value={form.cnic} onChange={e=>setForm({...form, cnic:e.target.value})} placeholder="XXXXX-XXXXXXX-X"/>
              <Input label="Passport No." value={form.passport} onChange={e=>setForm({...form, passport:e.target.value})} />
              <Input label="Passport Expiry" type="date" value={form.passportExpiry} onChange={e=>setForm({...form, passportExpiry:e.target.value})} />
              <Input label="Date of Birth" type="date" value={form.dob} onChange={e=>setForm({...form, dob:e.target.value})} />
              <Input label="Nationality" value={form.nationality} onChange={e=>setForm({...form, nationality:e.target.value})} />
              <Input label="Phone" type="tel" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
              <Input label="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
              <Input label="City" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} />
              <div className="md:col-span-2"><Input label="Address" value={form.address} onChange={e=>setForm({...form, address:e.target.value})} /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Employment & Finance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Occupation" value={form.occupation} onChange={e=>setForm({...form, occupation:e.target.value})} />
              <Input label="Employer / Business" value={form.employer} onChange={e=>setForm({...form, employer:e.target.value})} />
              <Input label="Monthly Income (PKR)" type="number" value={form.income} onChange={e=>setForm({...form, income:e.target.value})} />
              <Select label="FBR/ATL Status" value={form.fbrStatus} onChange={e=>setForm({...form, fbrStatus:e.target.value})} options={['Active Filer','Non-Filer','Filed - Not on ATL','Unknown']} placeholder="Select..." />
              <Input label="NTN Number" value={form.ntn} onChange={e=>setForm({...form, ntn:e.target.value})} />
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Visa Interest</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                  value={form.visaInterest} onChange={e=>setForm({...form, visaInterest:e.target.value})}>
                  <option value="">Select category...</option>
                  {Object.entries(VISA_CATEGORIES.reduce((a,v)=>({...a,[v.group]:[...(a[v.group]||[]),v]}),{})).map(([g,cs])=>(
                    <optgroup key={g} label={g}>{cs.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea label="Travel History" rows={3} placeholder="Prior Schengen/UK/USA visas, countries visited..." value={form.travelHistory} onChange={e=>setForm({...form, travelHistory:e.target.value})} />
            <Textarea label="Prior Visa Refusals" rows={3} placeholder="Any past refusals..." value={form.priorRefusals} onChange={e=>setForm({...form, priorRefusals:e.target.value})} />
            <div className="md:col-span-2"><Textarea label="Internal Intake Notes" rows={2} placeholder="Confidential notes for office use..." value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Btn>
            <Btn icon={Plus} variant="amber" onClick={addClient} loading={saving} disabled={!form.name||!form.cnic} className="flex-1">Register Client</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 12. DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════════════════

// FIX #2: Compute activeCases, approvals, pending from real data
const DashboardView = ({ currentUser, isAdmin, onSelectClient }) => {
  const [stats,          setStats]          = useState({ clients:0, activeCases:0, approvals:0, pending:0 });
  const [recentClients,  setRecentClients]  = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!db) return;
    // Clients listener
    const u1 = onSnapshot(collection(db, DB_PATH('clients')), s => {
      const active = s.docs.filter(d => !d.data().deleted && !d.data().permanentlyDeleted);
      setStats(prev => ({...prev, clients:active.length}));
      setRecentClients(
        active.map(d=>({id:d.id,...d.data()}))
          .sort((a,b)=>b.createdAt?.localeCompare(a.createdAt))
          .slice(0,5)
      );
      // Compute case stats by querying all clients' cases
      let activeCases = 0, approvals = 0, pending = 0;
      const clientIds = active.map(d=>d.id);
      let settled = 0;
      if (clientIds.length === 0) {
        setStats(prev => ({...prev, activeCases:0, approvals:0, pending:0}));
        return;
      }
      clientIds.forEach(clientId => {
        getDocs(collection(db, SUB_PATH('clients', clientId, 'cases'))).then(cs => {
          cs.docs.forEach(cd => {
            const st = cd.data().status;
            if (st === 'approved') approvals++;
            else if (['pending_embassy','submitted'].includes(st)) pending++;
            else if (!['closed','rejected'].includes(st)) activeCases++;
          });
          settled++;
          if (settled === clientIds.length) {
            setStats(prev => ({...prev, activeCases, approvals, pending}));
          }
        }).catch(()=>{ settled++; });
      });
    });
    // Activity listener
    const u2 = onSnapshot(collection(db, DB_PATH('activity_log')), s => {
      setRecentActivity(
        s.docs.map(d=>({id:d.id,...d.data()}))
          .sort((a,b)=>b.timestamp?.localeCompare(a.timestamp))
          .slice(0,8)
      );
    });
    return () => { u1(); u2(); };
  }, []);

  const actionIcon = (action) => {
    const map = { client_created:'🟢', client_edited:'✏️', document_uploaded:'📎', report_generated:'📄', case_created:'📁', case_status_updated:'🔄', staff_added:'👤', login:'🔑', logout:'👋' };
    return map[action] || '•';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Welcome back, <span className="text-amber-600">{currentUser.name}</span></h2>
        <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Clients"   value={stats.clients}    color="text-amber-600"  bg="bg-amber-50"  />
        <StatCard icon={Briefcase}    label="Active Cases"    value={stats.activeCases} color="text-blue-600"   bg="bg-blue-50"   />
        <StatCard icon={CheckCircle2} label="Approvals"       value={stats.approvals}  color="text-green-600"  bg="bg-green-50"  />
        <StatCard icon={Clock}        label="Pending Embassy" value={stats.pending}    color="text-orange-600" bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={16} className="text-amber-500"/>Recent Clients</h3>
          {recentClients.length === 0
            ? <p className="text-slate-400 text-sm">No clients yet</p>
            : (
              <div className="space-y-2">
                {recentClients.map(c => (
                  <div key={c.id} onClick={() => onSelectClient(c.id)}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition group">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.cnic}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">{fmtDate(c.createdAt)}</span>
                      {c.visaInterest && <p className="text-[9px] text-amber-600 font-bold">{getVisa(c.visaInterest).icon}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        <Card>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-blue-500"/>Recent Activity</h3>
          {recentActivity.length === 0
            ? <p className="text-slate-400 text-sm">No activity yet</p>
            : (
              <div className="space-y-2">
                {recentActivity.map(a => (
                  <div key={a.id} className="flex items-start gap-3 py-1.5">
                    <span className="text-sm flex-shrink-0 mt-0.5">{actionIcon(a.action)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700"><span className="font-bold">{a.performedBy}</span> — {a.action.replace(/_/g,' ')}</p>
                      <p className="text-[10px] text-slate-400 truncate">{a.details}</p>
                      <p className="text-[10px] text-slate-400">{fmtTime(a.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white border-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">{FIRM.firm}</p>
            <h3 className="text-xl font-black mt-1">{FIRM.name}</h3>
            <p className="text-slate-400 text-sm">{FIRM.title}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-slate-300 text-xs flex items-center gap-2 justify-end"><PhoneCall size={12}/>{FIRM.phone}</p>
            <p className="text-slate-300 text-xs flex items-center gap-2 justify-end"><AtSign size={12}/>{FIRM.email}</p>
            <p className="text-slate-400 text-xs">{FIRM.city}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 13. STAFF MANAGEMENT VIEW (ADMIN ONLY)
// ══════════════════════════════════════════════════════════════════════════

const StaffView = ({ currentUser }) => {
  const [staff,        setStaff]        = useState([]);
  const [archived,     setArchived]     = useState([]);
  const [showTab,      setShowTab]      = useState('active');
  const [showAdd,      setShowAdd]      = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', email:'', role:'Staff' });
  const [saving,       setSaving]       = useState(false);
  const [newPin,       setNewPin]       = useState(null);

  useEffect(() => {
    if (!db) return;
    const u1 = onSnapshot(collection(db, DB_PATH('staff')), s =>
      setStaff(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name?.localeCompare(b.name))));
    const u2 = onSnapshot(collection(db, DB_PATH('staff_archive')), s =>
      setArchived(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.archivedAt?.localeCompare(a.archivedAt))));
    return () => { u1(); u2(); };
  }, []);

  const addStaff = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    const pin = Math.floor(10000 + Math.random() * 90000).toString();
    const id  = genId('staff');
    await setDoc(doc(db, DB_PATH('staff'), id), {
      id, ...form, pin, suspended:false, status:'active', createdAt:ts(), createdBy:currentUser.name,
    });
    await logActivity('staff_added', `Added staff: ${form.name}`, currentUser);
    setNewPin({ name:form.name, pin });
    setForm({ name:'',phone:'',email:'',role:'Staff' }); setShowAdd(false); setSaving(false);
  };

  const suspendStaff = async (s) => {
    const action = s.suspended ? 'reinstate' : 'suspend';
    if (!window.confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} ${s.name}?`)) return;
    await updateDoc(doc(db, DB_PATH('staff'), s.id), {
      suspended: !s.suspended,
      suspendedAt:  !s.suspended ? ts()  : null,
      suspendedBy:  !s.suspended ? currentUser.name : null,
    });
    await logActivity(`staff_${action}d`, `${action}d staff: ${s.name}`, currentUser);
  };

  const terminateStaff = async (s) => {
    if (!window.confirm(`Terminate ${s.name}? They will be archived and cannot log in.`)) return;
    const archId = genId('arch');
    await setDoc(doc(db, DB_PATH('staff_archive'), archId), {
      ...s, archivedAt:ts(), archivedBy:currentUser.name, status:'terminated', originalId:s.id,
    });
    await deleteDoc(doc(db, DB_PATH('staff'), s.id));
    await logActivity('staff_terminated', `Terminated staff: ${s.name}`, currentUser);
  };

  const resetPin = async (s) => {
    const pin = Math.floor(10000 + Math.random() * 90000).toString();
    await updateDoc(doc(db, DB_PATH('staff'), s.id), { pin, pinResetAt:ts(), pinResetBy:currentUser.name });
    await logActivity('pin_reset', `PIN reset for: ${s.name}`, currentUser);
    setNewPin({ name:s.name, pin });
  };

  const forceLogout = async (s) => {
    await updateDoc(doc(db, DB_PATH('staff'), s.id), { forceLogoutAt:ts(), forceLogoutBy:currentUser.name });
    await logActivity('force_logout', `Force logout: ${s.name}`, currentUser);
    alert(`${s.name} will be logged out on their next action.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Staff Management" subtitle="Add, monitor, and control team access" actions={
        <Btn icon={Plus} variant="amber" onClick={() => setShowAdd(true)}>Add Staff</Btn>
      }/>

      <div className="flex gap-2">
        {[['active',`Active (${staff.length})`],['archived',`Archived (${archived.length})`]].map(([t,l]) => (
          <button key={t} onClick={() => setShowTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${showTab===t ? 'bg-[#1a1a2e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{l}</button>
        ))}
      </div>

      {showTab === 'active' && (
        staff.length === 0
          ? <EmptyState icon={Users} title="No staff members" desc="Add team members to give them access" />
          : (
            <div className="space-y-3">
              {staff.map(s => (
                <Card key={s.id} className={`${s.suspended ? 'border-l-4 border-l-red-400 bg-red-50/30' : 'border-l-4 border-l-green-400'}`}>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${s.suspended ? 'bg-red-400' : 'bg-blue-600'}`}>
                      {s.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <Badge label={s.suspended ? '⛔ SUSPENDED' : '🟢 Active'} color={s.suspended?'bg-red-100 text-red-700':'bg-green-100 text-green-700'} small/>
                        <Badge label={s.role || 'Staff'} color="bg-slate-100 text-slate-600" small/>
                      </div>
                      <p className="text-xs text-slate-500">{s.phone} {s.email && `• ${s.email}`}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>PIN: <span className="font-black text-slate-700 tracking-widest">{s.pin}</span></span>
                        <span>Added: {fmtDate(s.createdAt)}</span>
                        {s.forceLogoutAt && <span className="text-orange-500">⚡ Force logout pending</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => forceLogout(s)} title="Force Logout" className="p-2 hover:bg-orange-50 text-orange-500 rounded-xl transition"><Power size={16}/></button>
                      <button onClick={() => resetPin(s)} title="Reset PIN" className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"><Key size={16}/></button>
                      <button onClick={() => suspendStaff(s)} title={s.suspended?'Reinstate':'Suspend'}
                        className={`p-2 rounded-xl transition ${s.suspended?'hover:bg-green-50 text-green-500':'hover:bg-yellow-50 text-yellow-500'}`}>
                        {s.suspended ? <UserCheck size={16}/> : <UserX size={16}/>}
                      </button>
                      <button onClick={() => terminateStaff(s)} title="Terminate" className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
      )}

      {showTab === 'archived' && (
        archived.length === 0
          ? <EmptyState icon={Archive} title="No archived staff" />
          : (
            <div className="space-y-3">
              {archived.map(s => (
                <Card key={s.id} className="opacity-70 border-l-4 border-l-gray-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-400 flex items-center justify-center text-white font-black text-lg flex-shrink-0">{s.name?.[0]?.toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-700">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.phone}</p>
                      <p className="text-xs text-slate-400">Archived: {fmtDate(s.archivedAt)} • By: {s.archivedBy}</p>
                    </div>
                    <Badge label={s.status || 'Archived'} color="bg-gray-100 text-gray-600" />
                  </div>
                </Card>
              ))}
            </div>
          )
      )}

      {/* PIN Display Modal */}
      <Modal open={!!newPin} onClose={() => setNewPin(null)} title="Staff Credentials">
        {newPin && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-green-600"/>
            </div>
            <div>
              <p className="text-slate-600 text-sm">Account ready for</p>
              <p className="font-black text-slate-900 text-xl mt-1">{newPin.name}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6">
              <p className="text-slate-400 text-xs uppercase font-bold mb-2">Security PIN</p>
              <p className="text-white font-black text-4xl tracking-[0.5em]">{newPin.pin}</p>
            </div>
            <p className="text-xs text-red-500 font-semibold">⚠️ Record this PIN now. It will not be shown again.</p>
            <Btn onClick={() => setNewPin(null)} className="w-full" variant="amber">Done — I have saved it</Btn>
          </div>
        )}
      </Modal>

      {/* Add Staff Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Staff Member">
        <div className="space-y-4">
          <Input label="Full Name" required value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <Input label="Phone Number" required type="tel" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
          <Input label="Email (Optional)" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <Select label="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value})} options={['Staff','Senior Staff','Case Officer','Accounts']} />
          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">A secure 5-digit PIN will be auto-generated and displayed <strong>only once</strong>. Save it before closing the modal.</div>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Btn>
            <Btn icon={UserCheck} variant="amber" onClick={addStaff} loading={saving} disabled={!form.name||!form.phone} className="flex-1">Create Account</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 14. ACTIVITY LOG VIEW
// ══════════════════════════════════════════════════════════════════════════

const ActivityView = ({ currentUser }) => {
  const [logs,         setLogs]         = useState([]);
  const [filterStaff,  setFilterStaff]  = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, DB_PATH('activity_log')), s => {
      setLogs(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.timestamp?.localeCompare(a.timestamp)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => logs.filter(l =>
    (!filterStaff  || l.performedBy === filterStaff) &&
    (!filterAction || l.action.includes(filterAction))
  ), [logs, filterStaff, filterAction]);

  const actionColors = {
    client_created:'text-green-600', client_viewed:'text-blue-500', client_edited:'text-amber-600',
    document_uploaded:'text-purple-600', report_generated:'text-indigo-600', case_created:'text-teal-600',
    case_status_updated:'text-cyan-600', staff_added:'text-pink-600', staff_terminated:'text-red-600',
    note_added:'text-slate-500', login:'text-slate-600', logout:'text-slate-400',
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Activity Monitor" subtitle={`${logs.length} total events recorded`}/>
      <div className="flex gap-3 flex-wrap">
        <select value={filterStaff} onChange={e=>setFilterStaff(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none">
          <option value="">All Staff</option>
          {[...new Set(logs.map(l=>l.performedBy))].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterAction} onChange={e=>setFilterAction(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none">
          <option value="">All Actions</option>
          {['client_created','client_viewed','client_edited','document_uploaded','report_generated','case_created','case_status_updated','staff_added','staff_terminated','force_logout','login','logout'].map(a=>(
            <option key={a} value={a}>{a.replace(/_/g,' ')}</option>
          ))}
        </select>
        <Btn icon={RefreshCw} variant="ghost" size="sm" onClick={() => { setFilterStaff(''); setFilterAction(''); }}>Clear</Btn>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size={8}/></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Activity} title="No activity found" />
      ) : (
        <Card noPad>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Time','Staff Member','Role','Action','Details'].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-[11px] text-slate-400 whitespace-nowrap">{fmtTime(l.timestamp)}</td>
                    <td className="px-5 py-3 font-bold text-slate-800 whitespace-nowrap">{l.performedBy}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge label={l.role||'Staff'} color={l.role==='Master'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'} small/>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-xs font-bold ${actionColors[l.action]||'text-slate-600'}`}>{l.action.replace(/_/g,' ')}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 15. ARCHIVE VIEW
// ══════════════════════════════════════════════════════════════════════════

const ArchiveView = ({ currentUser, isAdmin, onSelectClient }) => {
  const [archived, setArchived] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, DB_PATH('clients')), s => {
      // FIX #6: Exclude permanently deleted from archive view too
      const del = s.docs
        .filter(d => d.data().deleted && !d.data().permanentlyDeleted)
        .map(d=>({id:d.id,...d.data()}))
        .sort((a,b)=>b.deletedAt?.localeCompare(a.deletedAt));
      setArchived(del); setLoading(false);
    });
    return unsub;
  }, []);

  const recover = async (client) => {
    if (!isAdmin) return;
    await updateDoc(doc(db, DB_PATH('clients'), client.id), {
      deleted:false, deletedAt:null, deletedBy:null, recoveredAt:ts(), recoveredBy:currentUser.name,
    });
    await logActivity('client_recovered', `Recovered: ${client.name}`, currentUser);
  };

  // FIX #7: Actually delete from Firestore on permanent delete
  const permanentDelete = async (client) => {
    if (!isAdmin) return;
    if (!window.confirm(`PERMANENTLY DELETE: "${client.name}"?\n\nThis CANNOT be undone. All data will be lost.`)) return;
    if (!window.confirm(`Final confirmation: Delete "${client.name}" forever?`)) return;
    try {
      await deleteDoc(doc(db, DB_PATH('clients'), client.id));
      await logActivity('client_permanently_deleted', `PERMANENT DELETE: ${client.name}`, currentUser);
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  const filtered = archived.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.cnic?.includes(q) || c.passport?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Archive" subtitle="Soft-deleted clients — recoverable by admin"/>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
        <input placeholder="Search by name, CNIC, or passport..."
          value={search} onChange={e=>setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-amber-500/20"/>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size={8}/></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Archive} title="No archived clients" desc={search ? 'No matches found' : 'Deleted clients appear here for recovery'} />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="opacity-80 border-l-4 border-l-red-300">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-400 font-black text-lg flex-shrink-0">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700">{c.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono">CNIC: {c.cnic}</span>
                    {c.passport && <span className="font-mono">PP: {c.passport}</span>}
                  </div>
                  <p className="text-xs text-red-400 mt-1">Archived: {fmtDate(c.deletedAt)} • By: {c.deletedBy}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Btn icon={RotateCcw} size="sm" variant="green" onClick={() => recover(c)}>Recover</Btn>
                    <Btn icon={Trash2} size="sm" variant="danger" onClick={() => permanentDelete(c)}>Delete Forever</Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 16. SETTINGS VIEW
// ══════════════════════════════════════════════════════════════════════════

const SettingsView = ({ currentUser, isAdmin }) => {
  const [categories, setCategories] = useState([]);
  const [newCat,     setNewCat]     = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (!db) return;
    const u = onSnapshot(collection(db, DB_PATH('categories')), s =>
      setCategories(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.label?.localeCompare(b.label))));
    return u;
  }, []);

  const addCat = async () => {
    if (!newCat.trim()) return;
    setSaving(true);
    const id = genId('cat');
    await setDoc(doc(db, DB_PATH('categories'), id), { id, label:newCat.trim(), icon:'📋', group:'Custom', addedBy:currentUser.name, addedAt:ts() });
    setNewCat(''); setSaving(false);
  };

  const delCat = async (id) => {
    if (!isAdmin || !window.confirm('Delete this custom category?')) return;
    await deleteDoc(doc(db, DB_PATH('categories'), id));
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Settings" subtitle="Firm information and system configuration"/>
      <Card>
        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Building size={16} className="text-amber-500"/>Firm Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['Firm Name',FIRM.firm],['Senior Consultant',FIRM.name],['Title',FIRM.title],['Phone',FIRM.phone],['Email',FIRM.email],['City',FIRM.city]].map(([l,v]) => (
            <div key={l} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase">{l}</span>
              <span className="font-bold text-slate-800">{v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Tag size={16} className="text-blue-500"/>Built-in Visa Categories ({VISA_CATEGORIES.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {VISA_CATEGORIES.map(v => (
            <div key={v.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
              <span>{v.icon}</span><span className="font-semibold text-slate-700 truncate">{v.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {isAdmin && (
        <Card>
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Plus size={16} className="text-green-500"/>Custom Visa Categories</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="New custom category..." value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCat()} />
            <Btn icon={Plus} variant="amber" onClick={addCat} loading={saving} disabled={!newCat.trim()}>Add</Btn>
          </div>
          {categories.length === 0 ? (
            <p className="text-slate-400 text-sm">No custom categories yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group">
                  <span className="font-semibold text-slate-700">{c.icon} {c.label}</span>
                  <button onClick={() => delCat(c.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><X size={16}/></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="bg-slate-50">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Database size={16}/>System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[['App Version','2.1.0 (Fixed)'],['App ID',APP_ID],['Firebase Status',db?'Connected ✅':'Not Connected ❌'],['Storage','Firestore + Firebase Storage'],['Deployment','GitHub → Vercel'],['Env Mode',import.meta.env?.MODE || 'unknown']].map(([l,v]) => (
            <div key={l} className="p-2 bg-white rounded-xl">
              <p className="text-slate-400 font-bold uppercase">{l}</p>
              <p className="text-slate-700 font-semibold mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* WhatsApp Quick Template Card */}
      <Card>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageCircle size={16} className="text-green-500"/>WhatsApp Update Format</h3>
        <p className="text-xs text-slate-500 mb-3">Template used when generating WhatsApp updates for clients. Go to any client → WhatsApp tab to generate customized messages.</p>
        <pre className="text-xs bg-slate-50 p-4 rounded-xl font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">{`🇵🇰 *${FIRM.firm.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Case Update — [Client Name]*
📅 Date: [Date]

[Visa Icon] *Visa Type:* [Type]
📊 *Status:* [Status]
🔖 *Reference:* FC-[REF]

✅ *Documents Received:* ...
❌ *Still Required:* ...
📌 *Remarks:* ...
📞 *Next Step:* ...
━━━━━━━━━━━━━━━━━━━━━━━━━
_${FIRM.name} | ${FIRM.phone}_`}</pre>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// 17. MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [currentUser,      setCurrentUser]      = useState(null);
  const [view,             setView]             = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [staffList,        setStaffList]        = useState([]);
  const [fbReady,          setFbReady]          = useState(false);
  // configured is derived once — avoids conditional before hooks
  const configured = isConfigured();

  // All hooks MUST come before any conditional returns (React Rules of Hooks)
  useEffect(() => {
    if (!configured || !auth) return;
    const initFb = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch {
        await signInAnonymously(auth).catch(console.error);
      }
    };
    initFb();
    const unsub = onAuthStateChanged(auth, u => { setFbReady(!!u); });
    return unsub;
  }, [configured]);

  useEffect(() => {
    if (!db || !fbReady) return;
    const unsub = onSnapshot(collection(db, DB_PATH('staff')), s =>
      setStaffList(s.docs.map(d=>({id:d.id,...d.data()}))));
    return unsub;
  }, [fbReady]);

  // Staff force-logout & suspension check
  useEffect(() => {
    if (!currentUser || currentUser.role === 'Master') return;
    const staffDoc = staffList.find(s => s.id === currentUser.id);
    if (!staffDoc) return;
    if (staffDoc.forceLogoutAt && staffDoc.forceLogoutAt > (currentUser.loginTime || '')) {
      alert('Your session has been terminated by the administrator.');
      handleLogout();
    }
    if (staffDoc.suspended) {
      alert('Your account has been suspended. Contact Farrukh Nadeem.');
      handleLogout();
    }
  }, [staffList]);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    if (user.role !== 'Master' && db) {
      await logActivity('login', `Staff logged in: ${user.name}`, user);
    }
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (currentUser && currentUser.role !== 'Master' && db) {
      await logActivity('logout', `Staff logged out: ${currentUser.name}`, currentUser).catch(()=>{});
    }
    setCurrentUser(null); setView('dashboard'); setSelectedClientId(null);
  };

  // Conditional returns AFTER all hooks — safe per React rules
  if (!configured) return React.createElement(SetupScreen, null);

  const isAdmin = currentUser?.role === 'Master';

  const softDeleteClient = async (clientId, clientName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Archive client "${clientName}"? They can be recovered from Archive.`)) return;
    await updateDoc(doc(db, DB_PATH('clients'), clientId), {
      deleted:true, deletedAt:ts(), deletedBy:currentUser.name,
    });
    await logActivity('client_archived', `Archived: ${clientName}`, currentUser);
    setSelectedClientId(null); setView('clients');
  };

  if (!fbReady) return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-amber-600/30">
          <ShieldCheck size={32} className="text-white"/>
        </div>
        <Spinner size={8}/>
        <p className="text-white/50 text-sm">Connecting to Firebase...</p>
        <p className="text-white/30 text-xs">{FIRM.firm}</p>
      </div>
    </div>
  );

  if (!currentUser) return <LoginScreen staff={staffList} onLogin={handleLogin}/>;

  const NAV_ITEMS = [
    { id:'dashboard',  label:'Dashboard',  icon:LayoutDashboard },
    { id:'clients',    label:'Clients',    icon:Users           },
    { id:'intake',     label:'Smart Intake', icon:Zap           },
    { id:'schengen',   label:'Schengen AI', icon:Globe          },
    { id:'docupload',  label:'Doc Upload',  icon:Cloud          },
    ...(isAdmin ? [
      { id:'staff',    label:'Staff',      icon:Shield          },
      { id:'activity', label:'Activity',   icon:Activity        },
    ] : []),
    { id:'archive',    label:'Archive',    icon:Archive         },
    { id:'settings',   label:'Settings',   icon:Settings        },
  ];

  const renderView = () => {
    if (view === 'client-detail' && selectedClientId) {
      return (
        <ClientDetailView
          clientId={selectedClientId} currentUser={currentUser} isAdmin={isAdmin}
          onBack={() => { setView('clients'); setSelectedClientId(null); }}
        />
      );
    }
    switch(view) {
      case 'dashboard':  return <DashboardView currentUser={currentUser} isAdmin={isAdmin} onSelectClient={id => { setSelectedClientId(id); setView('client-detail'); }}/>;
      case 'clients':    return <ClientsView   currentUser={currentUser} isAdmin={isAdmin} onSelectClient={id => { setSelectedClientId(id); setView('client-detail'); }}/>;
      case 'intake':     return <SmartIntakeView currentUser={currentUser} onClientCreated={id=>{ setSelectedClientId(id); setView('client-detail'); }}/>;
      case 'schengen':   return <SchengenEngineView currentUser={currentUser}/>;
      case 'docupload':  return <DocUploadView currentUser={currentUser} isAdmin={isAdmin}/>;
      case 'staff':      return isAdmin ? <StaffView currentUser={currentUser}/> : null;
      case 'activity':   return isAdmin ? <ActivityView currentUser={currentUser}/> : null;
      case 'archive':    return <ArchiveView currentUser={currentUser} isAdmin={isAdmin} onSelectClient={id => { setSelectedClientId(id); setView('client-detail'); }}/>;
      case 'settings':   return <SettingsView currentUser={currentUser} isAdmin={isAdmin}/>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-2 rounded-xl shadow-lg shadow-amber-600/20 flex-shrink-0">
              <ShieldCheck size={20} className="text-white"/>
            </div>
            <div>
              <span className="font-black text-slate-900 text-sm sm:text-base">{FIRM.firm}</span>
              <span className="text-slate-400 text-xs ml-2 hidden sm:inline">{FIRM.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
              <div className={`w-2 h-2 rounded-full ${isAdmin?'bg-amber-500':'bg-green-500'} animate-pulse`}/>
              <span className="text-xs font-bold text-slate-600">{currentUser.name}</span>
              <Badge label={currentUser.role||'Staff'} color={isAdmin?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'} small/>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition text-sm font-bold">
              <LogOut size={16}/><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-slate-100 flex-shrink-0 hidden md:block sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => { setView(n.id); setSelectedClientId(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${(view===n.id || (view==='client-detail'&&n.id==='clients')) ? 'bg-[#1a1a2e] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <n.icon size={16}/>{n.label}
              </button>
            ))}
          </nav>
          <div className="p-4 mt-2">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Helpline</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{FIRM.phone}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{FIRM.email}</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden min-w-0">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around px-2 py-2 z-20 shadow-lg">
        {NAV_ITEMS.slice(0,5).map(n => (
          <button key={n.id} onClick={() => { setView(n.id); setSelectedClientId(null); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition ${(view===n.id||(view==='client-detail'&&n.id==='clients')) ? 'text-amber-600' : 'text-slate-400'}`}>
            <n.icon size={19}/>
            <span className="text-[9px] font-bold">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NEW MODULES: SMART INTAKE + SCHENGEN ENGINE + COVER LETTER GENERATOR
// 100% FREE — No API Key Required — All Intelligence Hardcoded
// ══════════════════════════════════════════════════════════════════════════

// ─── SMART INTAKE DATA PARSER (Pure JavaScript — Zero API Cost) ───────────
const parseClientText = (text) => {
  const t = text.toLowerCase();
  const result = {};
  // Name
  const nameM = text.match(/(?:name[:\s]+|applicant[:\s]+|client[:\s]+)([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i) ||
                text.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/m);
  if (nameM) result.name = nameM[1].trim();
  // Phone
  const phoneM = text.match(/(?:\+92|0092|0)[\s-]?3\d{2}[\s-]?\d{7}/);
  if (phoneM) result.phone = phoneM[0].replace(/\s/g,'');
  // CNIC
  const cnicM = text.match(/\d{5}[\s-]\d{7}[\s-]\d/);
  if (cnicM) result.cnic = cnicM[0].replace(/\s/g,'');
  // Passport
  const passM = text.match(/[A-Z]{2}\d{7}/i) || text.match(/passport[:\s#]+([A-Z0-9]+)/i);
  if (passM) result.passport = (passM[1]||passM[0]).toUpperCase();
  // DOB
  const dobM = text.match(/(?:dob|born|date of birth)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i) ||
               text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/);
  if (dobM) result.dob = dobM[1];
  // Email
  const emailM = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailM) result.email = emailM[0];
  // City
  const cities = ['lahore','karachi','islamabad','rawalpindi','faisalabad','gujranwala','sialkot','multan','peshawar','quetta'];
  for (const c of cities) { if (t.includes(c)) { result.city = c.charAt(0).toUpperCase()+c.slice(1); break; } }
  // Visa category
  if (t.includes('schengen')||t.includes('europe')||t.includes('italy')||t.includes('germany')||t.includes('france')) result.visaCategory = 'schengen-visit';
  else if (t.includes('uk ')||t.includes('united kingdom')||t.includes('britain')) result.visaCategory = 'uk-visit';
  else if (t.includes('canada')) result.visaCategory = 'canada-visit';
  else if (t.includes('usa')||t.includes('america')||t.includes('b1')||t.includes('b2')) result.visaCategory = 'usa-visit';
  else if (t.includes('dubai')||t.includes('uae')||t.includes('saudi')||t.includes('qatar')||t.includes('gcc')) result.visaCategory = 'gcc-work';
  else if (t.includes('australia')) result.visaCategory = 'australia-visit';
  else if (t.includes('turkey')) result.visaCategory = 'turkey-visit';
  // Occupation
  const jobs = ['manager','engineer','doctor','teacher','accountant','director','officer','consultant','driver','supervisor','technician','designer','developer','analyst','agent','executive'];
  for (const j of jobs) { if (t.includes(j)) { result.occupation = j.charAt(0).toUpperCase()+j.slice(1); break; } }
  // Salary
  const salM = text.match(/(?:salary|income|earning)[:\s]+(?:pkr|rs\.?)?[\s]?([\d,]+)/i) ||
               text.match(/([\d,]+)\s*(?:pkr|per month)/i);
  if (salM) result.salary = salM[1].replace(/,/g,'');
  // Employer
  const empM = text.match(/(?:employer|company|working at|works at|employed at)[:\s]+([A-Za-z\s&\.]+?)(?:\.|,|\n|$)/i);
  if (empM) result.employer = empM[1].trim();
  // Marital status
  if (t.includes('married')) result.maritalStatus = 'Married';
  else if (t.includes('single')||t.includes('unmarried')) result.maritalStatus = 'Single';
  // Travel history
  const travelFlags = [];
  if (t.includes('schengen visa')) travelFlags.push('Schengen');
  if (t.includes('uk visa')||t.includes('british visa')) travelFlags.push('UK');
  if (t.includes('us visa')||t.includes('american visa')) travelFlags.push('USA');
  if (t.includes('no travel')||t.includes('no prior')||t.includes('first time')) result.travelHistory = 'None';
  else if (travelFlags.length) result.travelHistory = travelFlags.join(', ');
  return result;
};

// ─── SCHENGEN COUNTRY DATABASE ────────────────────────────────────────────
const SCHENGEN_COUNTRIES = {
  italy:       { flag:'🇮🇹', approvalRate:72, processingDays:15, fee:80, vfsCity:'Lahore/Karachi/Islamabad', strengths:['Tourism-friendly','Large Pakistani diaspora','Accepts employer financials'], concerns:['Requires hotel bookings','Bank statement 6 months'], minBalance:200000 },
  germany:     { flag:'🇩🇪', approvalRate:58, processingDays:20, fee:80, vfsCity:'Islamabad', strengths:['Strong economic ties','Business visa friendly'], concerns:['Strict financial checks','Requires personal bank statement','Long processing'], minBalance:300000 },
  spain:       { flag:'🇪🇸', approvalRate:65, processingDays:15, fee:80, vfsCity:'Lahore/Karachi', strengths:['Tourism focused','Moderate requirements'], concerns:['Spanish documents preferred','Travel insurance mandatory'], minBalance:200000 },
  france:      { flag:'🇫🇷', approvalRate:55, processingDays:15, fee:80, vfsCity:'Islamabad/Karachi', strengths:['Major tourism destination'], concerns:['Very strict financial checks','Personal statement mandatory','High rejection for Pakistanis'], minBalance:300000 },
  netherlands: { flag:'🇳🇱', approvalRate:60, processingDays:15, fee:80, vfsCity:'Islamabad', strengths:['Efficient processing','Clear requirements'], concerns:['High balance required','Income proof strict'], minBalance:250000 },
  austria:     { flag:'🇦🇹', approvalRate:68, processingDays:15, fee:80, vfsCity:'Islamabad', strengths:['Reasonable approval rates','Combined with Schengen tour'], concerns:['Moderate requirements'], minBalance:200000 },
  switzerland: { flag:'🇨🇭', approvalRate:74, processingDays:10, fee:80, vfsCity:'Lahore/Islamabad', strengths:['Higher approval rate','Fast processing','Accepts employer letters'], concerns:['Expensive destination','Higher balance preferred'], minBalance:250000 },
  iceland:     { flag:'🇮🇸', approvalRate:82, processingDays:10, fee:80, vfsCity:'Islamabad (Denmark embassy)', strengths:['Very high approval rate','Low Pakistani applicant volume','Less scrutiny','Accepts varied financials'], concerns:['Remote destination','Via Denmark embassy'], minBalance:150000 },
  hungary:     { flag:'🇭🇺', approvalRate:70, processingDays:12, fee:80, vfsCity:'Islamabad', strengths:['Good approval rates','Central Europe access','Requires NTN/tax docs'], concerns:['NTN required','FBR ATL check'], minBalance:180000 },
  portugal:    { flag:'🇵🇹', approvalRate:71, processingDays:15, fee:80, vfsCity:'Islamabad', strengths:['Good for first-time applicants','Tourism friendly'], concerns:['Limited appointment slots in Pakistan'], minBalance:180000 },
  greece:      { flag:'🇬🇷', approvalRate:67, processingDays:15, fee:80, vfsCity:'Islamabad', strengths:['Tourism focus','Islands attraction'], concerns:['Peak season backlogs','Hotel proof required'], minBalance:200000 },
  czech:       { flag:'🇨🇿', approvalRate:66, processingDays:15, fee:80, vfsCity:'Islamabad', strengths:['Moderate requirements','Central location'], concerns:['Less Pakistani applicant data'], minBalance:180000 },
};

const calcSchengenScore = (country, profile) => {
  const cd = SCHENGEN_COUNTRIES[country];
  if (!cd) return 0;
  let score = cd.approvalRate;
  const bal = parseInt(profile.bankBalance||0);
  if (bal >= cd.minBalance*1.5) score += 8;
  else if (bal >= cd.minBalance) score += 4;
  else if (bal > 0) score -= 10;
  if (profile.travelHistory && profile.travelHistory !== 'None') score += 10;
  if (profile.travelHistory === 'None') score -= 5;
  if (profile.maritalStatus === 'Married' && profile.familyInPakistan) score += 5;
  if (profile.employer && profile.occupation) score += 5;
  if (profile.fbr === 'Yes') score += 5;
  if (profile.assets) score += 3;
  return Math.min(96, Math.max(30, Math.round(score)));
};

// ─── COVER LETTER TEMPLATES ────────────────────────────────────────────────
const generateCoverLetter = (client, country, purpose='tourism', datesStr='') => {
  const cn = SCHENGEN_COUNTRIES[country];
  const countryName = country.charAt(0).toUpperCase()+country.slice(1);
  const today = new Date().toLocaleDateString('en-PK',{day:'2-digit',month:'long',year:'numeric'});
  return `Date: ${today}

The Visa Officer
${countryName} Embassy / Consulate
Islamabad, Pakistan

Subject: Application for ${countryName} Schengen Visa — Tourism Purpose

Respected Sir/Madam,

I, ${client.name||'[Applicant Name]'}, holder of Pakistani Passport No. ${client.passport||'[Passport Number]'}, respectfully submit this application for a Schengen tourist visa to ${countryName}${datesStr ? ` for the period ${datesStr}` : ''}.

PERSONAL PROFILE:
I am employed as ${client.occupation||'[Occupation]'} at ${client.employer||'[Employer]'}, ${client.city||'Lahore'}, Pakistan. I have been in this position for ${client.yearsEmployed||'several'} years and earn a monthly salary of PKR ${client.salary ? parseInt(client.salary).toLocaleString() : '[Amount]'}.

PURPOSE OF VISIT:
The purpose of my visit is purely tourism. I intend to explore the cultural heritage, historical landmarks, and natural beauty of ${countryName}. This is a deeply cherished personal aspiration and I have planned and saved specifically for this trip.

FINANCIAL STANDING:
I am financially self-sufficient and capable of meeting all expenses during my stay in ${countryName}. My financial documents, including ${client.salary ? 'salary slips, employer letter, and bank statement' : 'bank statement and financial evidence'}, are enclosed to demonstrate my economic stability.

STRONG TIES TO PAKISTAN:
I have strong ties to Pakistan that guarantee my return within the authorised visa period:
• ${client.maritalStatus === 'Married' ? 'My spouse and children reside in Pakistan' : 'My immediate family resides in Pakistan'}
• I am in regular, stable employment with responsibilities requiring my return
• I own property and assets in Pakistan
• My entire social and professional network is based in Pakistan

TRAVEL HISTORY:
${client.travelHistory && client.travelHistory !== 'None' ? `I have previously held/obtained ${client.travelHistory} visa(s), demonstrating my compliance with immigration rules and my history of timely return.` : 'While this is my first Schengen visa application, I have a clean immigration record and full respect for all visa conditions.'}

I sincerely assure the Consular Officer that I will strictly abide by the visa conditions, will not overstay, and will return to Pakistan upon completion of my trip. All supporting documents are enclosed for your kind consideration.

I respectfully request a favourable decision on my application.

Yours sincerely,

${client.name||'[Applicant Name]'}
CNIC: ${client.cnic||'[CNIC Number]'}
Phone: ${client.phone||'[Phone Number]'}
Email: ${client.email||'[Email]'}
${client.city||'Lahore'}, Pakistan`;
};

// ─── SMART INTAKE VIEW ─────────────────────────────────────────────────────
const SmartIntakeView = ({ currentUser, onClientCreated }) => {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(1); // 1=paste, 2=review, 3=done

  const handleParse = () => {
    const result = parseClientText(text);
    setParsed(result);
    setForm({
      name: result.name||'', phone: result.phone||'', email: result.email||'',
      cnic: result.cnic||'', passport: result.passport||'', dob: result.dob||'',
      city: result.city||'', occupation: result.occupation||'', employer: result.employer||'',
      salary: result.salary||'', maritalStatus: result.maritalStatus||'',
      travelHistory: result.travelHistory||'', visaCategory: result.visaCategory||'schengen-visit',
    });
    setStep(2);
  };

  const handleSave = async () => {
    if (!form.name) { alert('Please enter client name.'); return; }
    setSaving(true);
    try {
      const id = genId('cl');
      await setDoc(doc(db, DB_PATH('clients'), id), {
        id, ...form, status:'new', source:'smart-intake',
        createdBy: currentUser.name, createdAt: ts(), deleted: false,
        intake_raw: text.slice(0,500),
      });
      await logActivity('client_created', `Smart Intake: ${form.name}`, currentUser);
      setSaved(true); setStep(3);
      if (onClientCreated) onClientCreated(id);
    } catch(e) { alert('Save failed: '+e.message); }
    setSaving(false);
  };

  const fields = [
    ['name','Full Name','text'],['phone','Phone','text'],['email','Email','email'],
    ['cnic','CNIC','text'],['passport','Passport No','text'],['dob','Date of Birth','text'],
    ['city','City','text'],['occupation','Occupation','text'],['employer','Employer','text'],
    ['salary','Monthly Salary (PKR)','number'],['maritalStatus','Marital Status','text'],
    ['travelHistory','Travel History','text'],
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-500 p-2 rounded-xl"><Zap size={20}/></div>
          <h2 className="text-xl font-black">🧠 Smart Client Intake</h2>
        </div>
        <p className="text-white/60 text-sm">Paste client info in ANY format — WhatsApp message, text, notes — system auto-extracts all fields. 100% Free, No API needed.</p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-4">
        {[['1','Paste Info'],['2','Review & Edit'],['3','Saved ✅']].map(([n,l])=>(
          <div key={n} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${step>=parseInt(n)?'bg-amber-600 text-white':'bg-slate-100 text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">{n}</span>{l}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <p className="text-sm font-bold text-slate-700 mb-3">📋 Paste client information below (any format):</p>
          <div className="bg-slate-50 rounded-xl p-3 mb-3 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-600">✅ Examples of what you can paste:</p>
            <p>• "Muhammad Aqib, CNIC: 34101-8611118-9, Passport YP1331181, Marketing Manager, PKR 300,000/month, Gujranwala, wants Schengen visa"</p>
            <p>• WhatsApp message forwarded from client with their details</p>
            <p>• Any text with name, phone, CNIC, passport, job, salary info</p>
          </div>
          <textarea
            value={text} onChange={e=>setText(e.target.value)} rows={8}
            placeholder="Paste client info here in any format..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-sm resize-none"
          />
          <button onClick={handleParse} disabled={!text.trim()}
            className="mt-4 w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition">
            <Zap size={16}/> Extract Client Data
          </button>
        </Card>
      )}

      {step === 2 && parsed && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-slate-800">✅ Extracted — Review & Edit Fields</p>
            <button onClick={()=>setStep(1)} className="text-xs text-slate-400 hover:text-slate-600">← Re-paste</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {fields.map(([key,label,type])=>(
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {label} {parsed[key] ? <span className="text-green-600 ml-1">✅ Auto-filled</span> : <span className="text-slate-400 ml-1">✏️ Enter manually</span>}
                </label>
                <input type={type} value={form[key]||''} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 text-sm"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Visa Category</label>
              <select value={form.visaCategory||'schengen-visit'} onChange={e=>setForm(f=>({...f,visaCategory:e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-400/20 text-sm">
                {VISA_CATEGORIES.map(v=><option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving||!form.name}
            className="w-full py-3 bg-[#1a1a2e] hover:bg-[#16213e] text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition">
            {saving?<Spinner/>:<><CheckCircle2 size={16}/> Save Client to CRM</>}
          </button>
        </Card>
      )}

      {step === 3 && (
        <Card className="text-center py-10">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Client Saved!</h3>
          <p className="text-slate-500 mb-6">{form.name} has been added to your CRM successfully.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={()=>{setStep(1);setText('');setParsed(null);setForm({});setSaved(false);}}
              className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500">
              + Add Another Client
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── SCHENGEN STRATEGY ENGINE ──────────────────────────────────────────────
const SchengenEngineView = ({ currentUser }) => {
  const [profile, setProfile] = useState({
    name:'', bankBalance:'', salary:'', travelHistory:'None',
    maritalStatus:'', familyInPakistan:true, employer:'', occupation:'',
    fbr:'No', assets:'', purpose:'Tourism', targetCountries:[], duration:'7',
  });
  const [results, setResults] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const allCountries = Object.keys(SCHENGEN_COUNTRIES);

  const toggleCountry = (c) => {
    setProfile(p=>({...p, targetCountries: p.targetCountries.includes(c) ? p.targetCountries.filter(x=>x!==c) : [...p.targetCountries,c]}));
  };

  const runAnalysis = () => {
    const targets = profile.targetCountries.length ? profile.targetCountries : ['italy','iceland','portugal','switzerland'];
    const scored = targets.map(c=>({ country:c, ...SCHENGEN_COUNTRIES[c], score: calcSchengenScore(c, profile) }))
      .sort((a,b)=>b.score-a.score);
    setResults(scored);
    setActiveTab('results');
  };

  const getScoreColor = (s) => s>=80?'text-green-600':s>=65?'text-amber-600':'text-red-500';
  const getScoreBg = (s) => s>=80?'bg-green-50 border-green-200':s>=65?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200';

  const CHECKLIST = {
    'schengen-visit': ['Valid Passport (6+ months validity, 2 blank pages)','Passport-size photos (35x45mm, white background)','Visa application form (filled & signed)','Travel insurance (€30,000 coverage)','Flight itinerary (round trip)','Hotel bookings / accommodation proof','Bank statement (6 months)','Salary slips (3 months)','Employer NOC / Leave approval letter','Employment certificate','CNIC copy (front & back)','NTN certificate (FBR filer)','Property documents / assets proof','Family registration certificate (if married)','Invitation letter (if visiting family/friends)','Cover letter explaining purpose of visit'],
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0f3460] to-[#16213e] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-500 p-2 rounded-xl"><Globe size={20}/></div>
          <h2 className="text-xl font-black">🇪🇺 Schengen Strategy Engine</h2>
        </div>
        <p className="text-white/60 text-sm">Enter client profile → Get country rankings, success probability scores, document checklist & cover letter. 100% Free.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        {[['profile','📋 Client Profile'],['results','📊 Analysis Results'],['checklist','✅ Document Checklist'],['letter','📝 Cover Letter']].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${activeTab===id?'bg-white text-slate-800 shadow':'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <p className="font-black text-slate-800 mb-4">Enter Client Profile for Analysis</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[['name','Client Name'],['occupation','Occupation'],['employer','Employer'],['salary','Monthly Salary (PKR)'],['bankBalance','Bank Balance (PKR)'],['duration','Trip Duration (Days)']].map(([k,l])=>(
              <div key={k}>
                <label className="block text-xs font-bold text-slate-500 mb-1">{l}</label>
                <input value={profile[k]||''} onChange={e=>setProfile(p=>({...p,[k]:e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-400/20 text-sm"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Travel History</label>
              <select value={profile.travelHistory} onChange={e=>setProfile(p=>({...p,travelHistory:e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm">
                {['None','Schengen','UK','USA','UAE/GCC','Multiple Countries'].map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Marital Status</label>
              <select value={profile.maritalStatus} onChange={e=>setProfile(p=>({...p,maritalStatus:e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm">
                {['Married','Single','Divorced','Widowed'].map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">FBR/NTN Tax Filer?</label>
              <select value={profile.fbr} onChange={e=>setProfile(p=>({...p,fbr:e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm">
                <option>Yes</option><option>No</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 mb-2">🌍 Target Countries (select all that apply, or leave blank for auto-recommendation)</label>
            <div className="flex flex-wrap gap-2">
              {allCountries.map(c=>(
                <button key={c} onClick={()=>toggleCountry(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${profile.targetCountries.includes(c)?'bg-amber-600 text-white border-amber-600':'bg-white text-slate-600 border-slate-200 hover:border-amber-400'}`}>
                  {SCHENGEN_COUNTRIES[c].flag} {c.charAt(0).toUpperCase()+c.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button onClick={runAnalysis}
            className="w-full py-3 bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] text-white font-black rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition">
            <TrendingUp size={16}/> Run Schengen Analysis
          </button>
        </Card>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {!results ? (
            <Card className="text-center py-10">
              <Globe size={40} className="text-slate-300 mx-auto mb-3"/>
              <p className="text-slate-500">Complete the client profile and run analysis first.</p>
              <button onClick={()=>setActiveTab('profile')} className="mt-4 px-6 py-2 bg-amber-600 text-white font-bold rounded-xl">Fill Profile →</button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {results.slice(0,3).map((r,i)=>(
                  <div key={r.country} className={`p-4 rounded-2xl border-2 ${i===0?'border-amber-400 bg-amber-50':getScoreBg(r.score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{r.flag}</span>
                      {i===0&&<span className="text-xs font-black bg-amber-600 text-white px-2 py-0.5 rounded-lg">🏆 BEST</span>}
                    </div>
                    <h3 className="font-black text-slate-800 text-lg capitalize">{r.country}</h3>
                    <div className={`text-3xl font-black ${getScoreColor(r.score)} my-2`}>{r.score}%</div>
                    <p className="text-xs text-slate-500">Success Probability</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Embassy Rate</span><span className="font-bold">{r.approvalRate}%</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Processing</span><span className="font-bold">{r.processingDays} days</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Min Balance</span><span className="font-bold">PKR {r.minBalance.toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              {results.map(r=>(
                <Card key={r.country} className="!p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{r.flag}</span>
                      <span className="font-black text-slate-800 capitalize">{r.country}</span>
                    </div>
                    <span className={`text-2xl font-black ${getScoreColor(r.score)}`}>{r.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full ${r.score>=80?'bg-green-500':r.score>=65?'bg-amber-500':'bg-red-500'}`} style={{width:r.score+'%'}}/>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-slate-400">✅ Strengths</p>{r.strengths.map((s,i)=><p key={i} className="text-green-700 font-medium">• {s}</p>)}</div>
                    <div><p className="text-slate-400">⚠️ Watch Points</p>{r.concerns.map((c,i)=><p key={i} className="text-amber-700 font-medium">• {c}</p>)}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <button onClick={()=>{setCoverLetter(generateCoverLetter(profile,r.country));setActiveTab('letter');}}
                      className="flex-1 py-1.5 bg-[#1a1a2e] text-white text-xs font-bold rounded-xl hover:bg-[#16213e]">
                      📝 Generate Cover Letter
                    </button>
                    <button onClick={()=>setActiveTab('checklist')}
                      className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200">
                      ✅ View Checklist
                    </button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <Card>
          <p className="font-black text-slate-800 mb-4">✅ Schengen Visa Document Checklist</p>
          <div className="space-y-2">
            {CHECKLIST['schengen-visit'].map((item,i)=>(
              <label key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-amber-50 cursor-pointer transition group">
                <input type="checkbox" className="mt-0.5 accent-amber-600"/>
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{item}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-black text-amber-700">🇵🇰 Pakistan-Specific Requirements</p>
            <div className="mt-2 space-y-1 text-xs text-amber-800">
              <p>• NTN certificate from FBR (fbr.gov.pk) — mandatory for most embassies</p>
              <p>• FBR ATL (Active Taxpayer List) verification print</p>
              <p>• Utility bills (electricity/gas) showing home address</p>
              <p>• VFS appointment confirmation (book via vfsglobal.com)</p>
              <p>• Travel insurance must be purchased from approved provider</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'letter' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-slate-800">📝 Generated Cover Letter</p>
            <button onClick={()=>navigator.clipboard.writeText(coverLetter).then(()=>alert('Cover letter copied!'))}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1">
              <Copy size={12}/> Copy All
            </button>
          </div>
          {!coverLetter ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">Go to Results tab and click "Generate Cover Letter" for a country.</p>
              <button onClick={()=>setActiveTab('results')} className="mt-3 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl">View Results →</button>
            </div>
          ) : (
            <textarea value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} rows={28}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-400/20 text-sm font-mono resize-none"/>
          )}
        </Card>
      )}
    </div>
  );
};

// ─── DOCUMENT UPLOAD VIEW ──────────────────────────────────────────────────
const DocUploadView = ({ currentUser, isAdmin }) => {
  const [clients, setClients] = useState([]);
  const [selClient, setSelClient] = useState('');
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('Passport');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(()=>{
    if(!db) return;
    getDocs(query(collection(db, DB_PATH('clients')), where('deleted','==',false), orderBy('createdAt','desc')))
      .then(s=>setClients(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  useEffect(()=>{
    if(!selClient||!db) return;
    setLoadingDocs(true);
    getDocs(collection(db, SUB_PATH('clients',selClient,'documents')))
      .then(s=>{setUploaded(s.docs.map(d=>({id:d.id,...d.data()})));setLoadingDocs(false);});
  },[selClient]);

  const handleUpload = async () => {
    if(!file||!selClient) { alert('Select client and file first.'); return; }
    if(!storage) { alert('Firebase Storage not configured.'); return; }
    setUploading(true); setProgress(0);
    try {
      const path = `clients/${selClient}/${docType}/${Date.now()}_${file.name}`;
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, file);
      task.on('state_changed', snap=>setProgress(Math.round(snap.bytesTransferred/snap.totalBytes*100)));
      await new Promise((res,rej)=>task.on('state_changed',null,rej,res));
      const url = await getDownloadURL(ref);
      const docId = genId('doc');
      const docData = { id:docId, name:file.name, type:docType, url, path, size:file.size, uploadedBy:currentUser.name, uploadedAt:ts(), clientId:selClient };
      await setDoc(doc(db, SUB_PATH('clients',selClient,'documents'), docId), docData);
      await logActivity('doc_uploaded', `Doc uploaded: ${file.name} for client`, currentUser);
      setUploaded(p=>[docData,...p]);
      setFile(null); setProgress(0);
      alert('✅ Document uploaded successfully!');
    } catch(e) { alert('Upload failed: '+e.message); }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-500 p-2 rounded-xl"><Cloud size={20}/></div>
          <h2 className="text-xl font-black">☁️ Document Upload to Firebase</h2>
        </div>
        <p className="text-white/60 text-sm">Upload client documents directly to Firebase Cloud Storage. Secure, permanent, accessible from anywhere.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <p className="font-black text-slate-800 mb-4">Upload New Document</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Select Client</label>
              <select value={selClient} onChange={e=>setSelClient(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm">
                <option value="">-- Select Client --</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name} {c.city?`(${c.city})`:''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Document Type</label>
              <select value={docType} onChange={e=>setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm">
                {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Select File</label>
              <input type="file" onChange={e=>setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-amber-50 file:text-amber-600 hover:file:bg-amber-100"/>
            </div>
            {file && <p className="text-xs text-slate-500">📄 {file.name} ({fmtFileSize(file.size)})</p>}
            {uploading && (
              <div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 bg-amber-500 rounded-full transition-all" style={{width:progress+'%'}}/>
                </div>
                <p className="text-xs text-amber-600 mt-1 font-bold">Uploading... {progress}%</p>
              </div>
            )}
            <button onClick={handleUpload} disabled={uploading||!file||!selClient}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition">
              {uploading?<Spinner/>:<><Upload size={16}/> Upload to Firebase</>}
            </button>
          </div>
        </Card>
        <Card>
          <p className="font-black text-slate-800 mb-4">
            {selClient ? `📁 Documents for ${clients.find(c=>c.id===selClient)?.name||'Client'}` : '📁 Select a client to view documents'}
          </p>
          {loadingDocs ? <div className="flex justify-center py-6"><Spinner size={6}/></div> :
          uploaded.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Folder size={32} className="mx-auto mb-2 opacity-40"/>
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {uploaded.map(d=>(
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-amber-600 flex-shrink-0"/>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{d.name}</p>
                      <p className="text-[10px] text-slate-400">{d.type} • {fmtFileSize(d.size||0)}</p>
                    </div>
                  </div>
                  <a href={d.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 ml-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100">
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
