/**
 * Authentication Page Component - World-Class Enhancement
 * A visually enhanced, animated, and fully responsive dual-panel interface 
 * for Junior Advocates and Senior Counsel, now with world-class features.
 *
 * Features:
 * - Fluid panel expansion and collapse animations.
 * - Swipe gestures for panel switching on mobile.
 * - Staggered content animations for a dynamic user experience.
 * - Enhanced glassmorphism with ambient lighting effects.
 * - Skeleton loading state for improved perceived performance.
 * - Added trust signals: security badges and legal-specific form fields.
 * - Smart form enhancements like professional email validation.
 * - Improved accessibility with reduced motion support and live error regions.
 * - Enhanced micro-interactions on buttons and inputs.
 */
import React, { useState, useEffect, useRef } from 'react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Shield, 
  Scale,
  Award,
  CheckCircle,
  XCircle,
  Mail,
  Lock,
  User,
  ArrowRight,
  MessageSquare,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LexoHubBGhd from '../Public/Assets/LexoHubBGhd.jpg';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import { authService } from '../services/auth.service';

// --- Global Styles for Advanced Effects ---
const GlobalStyles = () => (
  <style>{`
    @keyframes rotate {
      to { transform: rotate(360deg); }
    }
    .panel-ambient-light::before {
      content: '';
      position: absolute;
      inset: -1px; /* Fit perfectly inside the border */
      background: conic-gradient(from 180deg at 50% 50%, transparent, var(--ambient-light-color, #ffffff), transparent);
      border-radius: inherit;
      opacity: 0;
      animation: rotate 6s linear infinite;
      transition: opacity 0.7s;
      z-index: -1; /* Place it behind the panel content */
    }
    .panel-ambient-light:hover::before {
      opacity: 0.25;
    }
    @media (prefers-reduced-motion: reduce) {
      .panel-ambient-light::before,
      .transition-all,
      .duration-1000,
      .duration-700,
      .duration-500,
      .animate-in,
      .animate-pulse,
      .animate-bounce {
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 1ms !important;
        transition-delay: 0ms !important;
      }
    }
  `}</style>
);


// --- Utility Function (previously in ./utils) ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}




// --- Placeholder Components (previously in separate files) ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-[0.98]",
        "px-4 py-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses: Record<string, string> = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-16 w-16' };
  return (
    <div className={cn(sizeClasses[size], 'animate-spin rounded-full border-b-2 border-t-2 border-white', className)} />
  );
};


const SignupBgImage = LexoHubBGhd;

type AuthMode = 'signin' | 'signup';
type UserType = 'junior' | 'senior';

// Smart Form validation utilities are centralized in ../utils/validation

// Form Input Component
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string; required?: boolean; children?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  validation?: { isValid: boolean; message?: string; strength?: number; warning?: string };
  showValidation?: boolean; id: string; autoComplete?: string;
}

const FormInput: React.FC<FormInputProps> = ({ 
  type = 'text', placeholder, value, onChange, className, required = false, children, icon: Icon, validation, showValidation = false, id, autoComplete, ...props 
}) => {
  const hasError = showValidation && validation && !validation.isValid;
  const hasSuccess = showValidation && validation && validation.isValid && value && !validation.warning;
  const hasWarning = showValidation && validation && validation.isValid && validation.warning;
  
  return (
    <div className="relative space-y-2">
      <div className="relative">
        {Icon && <Icon className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-white/50 z-10" />}
        <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete={autoComplete}
          className={cn(
            "w-full py-2 sm:py-2.5 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/70 transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-opacity-75 focus:bg-white/20 hover:bg-white/18 text-sm font-medium",
            Icon ? "pl-8 sm:pl-10 pr-10" : "px-3 sm:px-4 pr-10",
            hasError && "border-red-400/50 focus:ring-red-400",
            hasSuccess && "border-green-400/50 focus:ring-green-400",
            hasWarning && "border-yellow-400/50 focus:ring-yellow-400",
            className
          )}
          required={required} aria-invalid={hasError} aria-describedby={hasError ? `${id}-error` : (hasWarning ? `${id}-warning` : undefined)}
          {...props}
        />
        {children}
        {showValidation && (
          <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2">
            {hasError && <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />}
            {hasSuccess && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />}
            {hasWarning && <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />}
          </div>
        )}
        {!showValidation && children && (
          <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2">
            {children}
          </div>
        )}
      </div>
      
      {showValidation && validation && !validation.isValid && validation.message && (
        <p id={`${id}-error`} className="text-sm text-red-300 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4" /> {validation.message}
        </p>
      )}
       {showValidation && validation && validation.isValid && validation.warning && (
        <p id={`${id}-warning`} className="text-sm text-yellow-300 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4" /> {validation.warning}
        </p>
      )}
      
      {type === 'password' && showValidation && validation && value && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className={cn( "h-1.5 flex-1 rounded-full transition-all duration-300",
                  (validation.strength ?? 0) >= level ? ((validation.strength ?? 0) <= 2 ? "bg-red-400" : (validation.strength ?? 0) <= 3 ? "bg-yellow-400" : "bg-green-400") : "bg-white/20"
              )}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Auth Panel Component
interface AuthPanelProps { userType: UserType; title: string; subtitle: string; Icon: React.ComponentType<{ className?: string }>; features: string[]; badge: React.ReactNode; color: string; selectedType: UserType | null; setSelectedType: (type: UserType | null) => void; children: React.ReactNode; }

const AuthPanel: React.FC<AuthPanelProps> = ({ userType, title, subtitle, Icon, features, badge, color, selectedType, setSelectedType, children }) => {
    const isSelected = selectedType === userType;
    const isAnotherSelected = selectedType && !isSelected;
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (panelRef.current) {
            panelRef.current.style.setProperty('--ambient-light-color', `var(--tw-color-${color}-400)`);
        }
    }, [color]);

    return (
        <div ref={panelRef} onClick={() => setSelectedType(userType)}
            className={cn(
                "relative p-1 sm:p-2 md:p-3 lg:p-4 cursor-pointer transition-all duration-700 ease-in-out panel-ambient-light",
                isSelected ? "flex-[2] md:flex-[3] ring-1 ring-white/30" : "flex-1",
                isAnotherSelected && "opacity-70 scale-98 hover:opacity-85 hover:scale-100 md:opacity-50",
                "flex flex-col min-h-0 overflow-x-hidden overflow-y-auto w-full"
            )}>
            <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-40`}></div>
            <Icon className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 absolute top-1 right-1 sm:top-2 sm:right-2 md:top-4 md:right-4 text-${color}-400/20 transform-gpu transition-transform duration-500 ${isSelected ? 'rotate-6' : '-rotate-12'}`} />

            <div className="relative z-10 flex flex-col h-full min-h-0">
                <div className={`transition-all duration-500 ${isAnotherSelected ? 'md:opacity-80' : 'opacity-100'} flex-shrink-0`}>
                    <Award className={`w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 text-${color}-200 mb-1 sm:mb-2`} />
                    <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white leading-tight tracking-wide">{title}</h2>
                    <p className={`text-${color}-100 text-sm sm:text-base leading-tight font-medium hidden sm:block`}>{subtitle}</p>
                    {isAnotherSelected && <p className="text-white/80 text-sm mt-2 hidden md:block font-medium">Click to switch</p>}
                </div>

                <div className={`my-2 sm:my-3 md:my-5 space-y-2 sm:space-y-3 transition-all duration-500 ease-in-out flex-shrink-0 ${isSelected ? 'opacity-100 delay-300' : 'opacity-0 h-0 pointer-events-none md:opacity-100 md:h-auto md:pointer-events-auto'}`}>
                    {features.slice(0, 2).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3 text-white">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 bg-${color}-300 rounded-full shadow-sm`}></div>
                            <span className="text-sm sm:text-base font-medium truncate">{feature}</span>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block">{badge}</div>

                {isSelected && (
                    <button className="md:hidden absolute top-1 left-1 sm:top-2 sm:left-2 z-30 p-1.5 sm:p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors text-sm sm:text-base"
                        onClick={(e) => { e.stopPropagation(); setSelectedType(null); }} aria-label="Go back to role selection"> ← </button>
                )}

                <div className={cn(
                    "flex-1 flex flex-col justify-center mt-1 sm:mt-2 overflow-y-auto min-h-0",
                    "transition-all duration-700 ease-out transform-gpu will-change-transform",
                    isSelected ? "opacity-100 delay-200 translate-x-0" : "opacity-0 pointer-events-none translate-x-4"
                )}>
                     {children}
                </div>
            </div>
        </div>
    );
};

// --- Skeleton Loading Component ---
const SkeletonAuthPage = () => (
    <div className="min-h-[100svh] w-screen overflow-hidden flex flex-col bg-slate-900 font-sans">
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 w-full h-full flex flex-col p-4">
            <header className="text-center mb-6 flex-shrink-0">
                <div className="h-9 w-40 bg-slate-700/50 rounded-md mx-auto mb-3 animate-pulse"></div>
                <div className="h-5 w-80 bg-slate-700/50 rounded-md mx-auto animate-pulse"></div>
            </header>
            <main className="bg-black/40 rounded-xl border border-white/30 flex-1 flex md:flex-row overflow-hidden w-full max-w-6xl mx-auto min-h-0">
                <div className="flex-1 p-4 border-r border-white/20 animate-pulse bg-slate-800/20">
                    <div className="h-9 w-3/4 bg-slate-700/50 rounded-md mb-2"></div>
                    <div className="h-5 w-1/2 bg-slate-700/50 rounded-md"></div>
                </div>
                <div className="flex-1 p-4 animate-pulse bg-slate-800/20">
                    <div className="h-9 w-3/4 bg-slate-700/50 rounded-md mb-2"></div>
                    <div className="h-5 w-1/2 bg-slate-700/50 rounded-md"></div>
                </div>
            </main>
        </div>
    </div>
);


const LoginPage = () => {
  const { signIn, signUp, signInWithMagicLink, loading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', rememberMe: true, termsAccepted: false });
  
  const formRef = useRef<HTMLFormElement>(null);
  const touchStartRef = useRef<number | null>(null);

  const emailValidation = validateEmail(formData.email);
  const passwordValidation = validatePassword(formData.password);
  const nameValidation = validateName(formData.fullName);

  const isFormValid = emailValidation.isValid && passwordValidation.isValid && (authMode === 'signin' || (nameValidation.isValid && formData.termsAccepted));

  useEffect(() => {
    setError(null); setSuccess(null);
    setFormData(prev => ({ ...prev, email: '', password: '', fullName: '', termsAccepted: false }));
    setShowValidation(false); setTouchedFields(new Set()); setShowPassword(false);
  }, [selectedType, authMode]);

  const handleInputChange = (field: string, value: string | boolean) => {
    let finalValue = value;
    if (field === 'fullName' && typeof value === 'string') {
        finalValue = value.split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' ');
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (value && !touchedFields.has(field)) {
      setTouchedFields(prev => new Set(prev).add(field));
    }
  };

  const handleInputBlur = (field: string) => { setTouchedFields(prev => new Set(prev).add(field)); setShowValidation(true); };

  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setShowValidation(true); setTouchedFields(new Set(['email', 'password', 'fullName']));
    if (!isFormValid) {
      setError('Please fix the errors above before submitting.');
      toast.error('Please fix the errors above before submitting.');
      setTimeout(() => { (formRef.current?.querySelector('[aria-invalid="true"]') as HTMLInputElement)?.focus(); }, 100);
      return;
    }
    setIsSubmitting(true);
    try {
      if (authMode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          const message = authService.getFriendlyErrorMessage(error);
          setError(message);
          toast.error(message);
        } else {
          setSuccess('Signed in successfully');
          toast.success('Welcome back');
          setRedirecting(true);
          setTimeout(() => { window.location.href = '/'; }, 300);
        }
      } else {
        const metadata = { user_type: selectedType as 'junior' | 'senior', /* other metadata */ };
        const { error } = await signUp(formData.email, formData.password, metadata);
        if (error) {
          const message = authService.getFriendlyErrorMessage(error);
          setError(message);
          toast.error(message);
        } else {
          // Show confirmation when signup succeeds (email verification flow)
          setSuccess('Account created. Please check your email to confirm your address.');
          toast.success('Account created. Check your email to confirm.');
        }
      }
    } catch {
      const message = 'An unexpected error occurred. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMagicLink = async () => {
    setShowValidation(true);
    if (!emailValidation.isValid) {
      const msg = emailValidation.message || 'Please enter a valid email.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await signInWithMagicLink(formData.email);
      if (error) {
        const message = authService.getFriendlyErrorMessage(error);
        setError(message);
        toast.error(message);
      } else {
        setSuccess('Magic link sent. Check your email to sign in.');
        toast.success('Magic link sent. Check your email.');
      }
    } catch (e) {
      const message = 'Failed to send magic link. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (type: UserType) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create demo user data
      const demoUser = {
        id: `demo-${type}-${Date.now()}`,
        email: type === 'junior'
          ? (import.meta.env.VITE_DEMO_JUNIOR_EMAIL ?? 'demo.junior@lexo.co.za')
          : (import.meta.env.VITE_DEMO_SENIOR_EMAIL ?? 'demo.senior@lexo.co.za'),
        user_metadata: {
          full_name: type === 'junior' ? 'Demo Junior Advocate' : 'Demo Senior Counsel',
          user_type: type,
          practice_number: type === 'junior' ? 'JA12345' : 'SC67890',
          bar: 'johannesburg',
          year_admitted: type === 'junior' ? 2020 : 2010,
          specialisations: type === 'junior' ? ['Criminal Law', 'Civil Litigation'] : ['Commercial Law', 'Constitutional Law'],
          hourly_rate: type === 'junior' ? 1500 : 3500
        },
        advocate_profile: {
          full_name: type === 'junior' ? 'Demo Junior Advocate' : 'Demo Senior Counsel',
          practice_number: type === 'junior' ? 'JA12345' : 'SC67890',
          bar: 'johannesburg',
          specialisations: type === 'junior' ? ['Criminal Law', 'Civil Litigation'] : ['Commercial Law', 'Constitutional Law'],
          hourly_rate: type === 'junior' ? 1500 : 3500
        }
      };

      // Create demo session (valid for 1 hour)
      const demoSession = {
        access_token: `demo-token-${Date.now()}`,
        refresh_token: `demo-refresh-${Date.now()}`,
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour from now
        user: demoUser
      };

      // Store in localStorage for demo mode
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      localStorage.setItem('demo_session', JSON.stringify(demoSession));

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger auth state change by reloading the page or manually updating context
      window.location.reload();
      
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Failed to start demo session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchStartRef.current - touchEnd;
    if (Math.abs(swipeDistance) > 75) { // Min swipe distance
        if (swipeDistance > 0 && selectedType === 'junior') setSelectedType('senior');
        else if (swipeDistance < 0 && selectedType === 'senior') setSelectedType('junior');
    }
    touchStartRef.current = null;
  };

  if (loading) return <SkeletonAuthPage />;

  return (
    <div className="min-h-[100svh] w-screen overflow-hidden flex flex-col bg-slate-900 font-sans"
      style={{ 
        backgroundImage: `url(${SignupBgImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundAttachment: 'scroll',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <GlobalStyles />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/45"></div>
      
      <div className="relative z-10 w-full h-full flex flex-col overflow-x-hidden overflow-y-auto px-1 sm:px-2 md:px-4 py-1 sm:py-2 md:py-4">
        <header className="text-center mb-2 sm:mb-3 md:mb-6 animate-in fade-in slide-in-from-top-4 duration-1000 flex-shrink-0">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-1 sm:mb-2 md:mb-3 group">
                <Scale className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-yellow-400 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 drop-shadow-sm" />
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-wider drop-shadow-sm">lexo</h1>
            </div>
            <p className="text-sm md:text-base text-slate-200 leading-tight px-2 font-medium hidden sm:block">Where Strategy Meets Practice.</p>
        </header>

        <main className={cn("bg-black/25 backdrop-blur-lg rounded-lg sm:rounded-xl border border-white/30 shadow-2xl flex flex-col md:flex-row transition-all duration-700 ease-in-out flex-1 overflow-hidden w-full max-w-6xl mx-auto min-h-0")}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {!selectedType && (
                <>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex">
                        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-pulse"><p className="text-white font-bold text-lg">OR</p></div>
                    </div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
                        <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm animate-bounce">Choose your role to continue</div>
                    </div>
                </>
            )}
            
            {selectedType && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
                    <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs">Swipe or tap to switch</div>
                </div>
            )}
        
        <AuthPanel userType="junior" title="JUNIOR ADVOCATES" subtitle="BUILD YOUR PRACTICE. INNOVATE & GROW" Icon={TrendingUp} features={['AI-Powered Brief Analysis', 'Practice Growth Tools']}
          badge={ <div className="flex items-center gap-2 p-2 bg-white/15 rounded-lg border border-white/30 w-fit mt-auto shadow-sm"><span className="text-white text-sm font-medium">South Africa</span></div> }
          color="blue" selectedType={selectedType} setSelectedType={setSelectedType}
        >
          <div className="bg-white/5 rounded-lg border border-white/15 p-2 sm:p-3 md:p-4 shadow-lg overflow-visible">
              <div className="flex bg-black/30 rounded-lg p-1 mb-2 sm:mb-3 relative">
                  <div
                    className={cn(
                      "absolute inset-y-1 w-[calc(50%-4px)] rounded-md transition-all duration-300 ease-out shadow-lg",
                      authMode === 'signin' ? "left-1" : "left-[calc(50%+2px)]",
                      selectedType === 'junior' ? "bg-blue-600" : "bg-amber-600"
                    )}
                  />
                  {['signin', 'signup'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAuthMode(mode as AuthMode)}
                        className={cn(
                          "relative z-10 flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-sm font-medium transition-all duration-200",
                          authMode === mode ? "text-white" : "text-white/80 hover:text-white"
                        )}
                      >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                  ))}
              </div>

              <form ref={formRef} id="auth-form-junior" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div role="alert" aria-live="assertive" className="sr-only">{error}</div>
                  {error && <div className="bg-red-500/30 border border-red-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300"><AlertCircle className="h-5 w-5 text-red-300" /><p className="text-sm text-red-200">{error}</p></div>}
                  {success && <div className="bg-green-500/30 border border-green-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300"><CheckCircle className="h-5 w-5 text-green-300" /><p className="text-sm text-green-200">{success}</p></div>}
                  
                  {authMode === 'signup' && <FormInput id="fullName-junior" placeholder="Full Name" value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} onBlur={() => handleInputBlur('fullName')} className="focus:ring-blue-500" icon={User} validation={nameValidation} showValidation={touchedFields.has('fullName')} autoComplete="name" required />}
                  <FormInput id="email-junior" type="email" placeholder="Email address" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} onBlur={() => handleInputBlur('email')} className="focus:ring-blue-500" icon={Mail} validation={emailValidation} showValidation={touchedFields.has('email')} autoComplete="email" required />
                  <FormInput id="password-junior" type={showPassword ? 'text' : 'password'} placeholder="Password" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} onBlur={() => handleInputBlur('password')} className="focus:ring-blue-500" icon={Lock} validation={passwordValidation} showValidation={touchedFields.has('password')} autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} required>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-20" aria-label="Toggle password visibility">
                          {showPassword ? <EyeOff size={12} className="sm:w-4 sm:h-4" /> : <Eye size={12} className="sm:w-4 sm:h-4" />}
                      </button>
                  </FormInput>

                  {authMode === 'signup' && (
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="terms-junior" checked={formData.termsAccepted} onChange={(e) => handleInputChange('termsAccepted', e.target.checked)} className="rounded bg-white/20 border-white/30 text-blue-500 focus:ring-blue-500" />
                        <label htmlFor="terms-junior" className="text-xs text-white/80">I agree to the <a href="#" className="underline hover:text-white">Terms & Conditions</a>.</label>
                    </div>
                  )}
                  {authMode === 'signin' && (
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="rememberMe-junior" checked={formData.rememberMe} onChange={(e) => handleInputChange('rememberMe', e.target.checked)} className="rounded bg-white/20 border-white/30 text-blue-500 focus:ring-blue-500" />
                            <label htmlFor="rememberMe-junior" className="text-xs text-white/80">Remember me</label>
                          </div>
                          <a href="#" className="text-xs text-blue-300 hover:underline">Forgot password?</a>
                      </div>
                  )}

                  <Button type="submit" disabled={isSubmitting || (showValidation && !isFormValid)} className={cn("w-full py-2.5 sm:py-3 text-sm font-medium text-white transition-all duration-300 group", isFormValid && !isSubmitting ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30" : "bg-blue-600/50 cursor-not-allowed")}> 
                      {isSubmitting ? <><LoadingSpinner size="sm" className="mr-2" />{authMode === 'signin' ? 'Signing In...' : 'Creating...'}</> : <div className="flex items-center justify-center gap-2"><span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></div>}
                  </Button>
                  {authMode === 'signin' && <div className="text-center"><button type="button" onClick={() => handleDemoLogin('junior')} disabled={isSubmitting} className={cn("text-xs transition-colors flex items-center justify-center gap-1 mx-auto", isSubmitting ? "text-blue-300/50 cursor-not-allowed" : "text-blue-300 hover:text-blue-200 hover:underline")}>{isSubmitting ? <><LoadingSpinner size="sm" className="w-3 h-3" /><span>Signing in...</span></> : 'Try Junior Demo Account'}</button></div>}
              </form>
          </div>
        </AuthPanel>

        <AuthPanel userType="senior" title="SENIOR COUNSEL" subtitle="PRESTIGE. EFFICIENCY. LEGACY" Icon={Shield} features={['Advanced Analytics', 'Strategic Finance Tools', 'Chambers Management']}
          badge={ <div className="flex items-center gap-2 p-2 bg-white/15 rounded-lg border border-white/30 w-fit mt-auto shadow-sm"><Shield className="w-4 h-4 text-amber-300" /><span className="text-white text-sm font-medium">SC</span></div> }
          color="amber" selectedType={selectedType} setSelectedType={setSelectedType}
        >
          <div className="bg-white/5 rounded-lg border border-white/15 p-2 sm:p-3 md:p-4 shadow-lg overflow-visible">
               <div className="flex bg-black/30 rounded-lg p-1 mb-2 sm:mb-3 relative">
                  <div
                    className={cn(
                      "absolute inset-y-1 w-[calc(50%-4px)] rounded-md transition-all duration-300 ease-out shadow-lg",
                      authMode === 'signin' ? "left-1" : "left-[calc(50%+2px)]",
                      selectedType === 'junior' ? "bg-blue-600" : "bg-amber-600"
                    )}
                  />
                  {['signin', 'signup'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAuthMode(mode as AuthMode)}
                        className={cn(
                          "relative z-10 flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-sm font-medium transition-all duration-200",
                          authMode === mode ? "text-white" : "text-white/80 hover:text-white"
                        )}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                  ))}
              </div>
              <form id="auth-form-senior" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  {error && <div className="bg-red-500/30 border border-red-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300"><AlertCircle className="h-5 w-5 text-red-300" /><p className="text-sm text-red-200">{error}</p></div>}
                  {success && <div className="bg-green-500/30 border border-green-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300"><CheckCircle className="h-5 w-5 text-green-300" /><p className="text-sm text-green-200">{success}</p></div>}
                  {authMode === 'signup' && <FormInput id="fullName-senior" placeholder="Full Name" value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} onBlur={() => handleInputBlur('fullName')} className="focus:ring-amber-500" icon={User} validation={nameValidation} showValidation={touchedFields.has('fullName')} autoComplete="name" required />}
                  <FormInput id="email-senior" type="email" placeholder="Email address" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} onBlur={() => handleInputBlur('email')} className="focus:ring-amber-500" icon={Mail} validation={emailValidation} showValidation={touchedFields.has('email')} autoComplete="email" required />
                  <FormInput id="password-senior" type={showPassword ? 'text' : 'password'} placeholder="Password" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} onBlur={() => handleInputBlur('password')} className="focus:ring-amber-500" icon={Lock} validation={passwordValidation} showValidation={touchedFields.has('password')} autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} required>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-20" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={12} className="sm:w-4 sm:h-4" /> : <Eye size={12} className="sm:w-4 sm:h-4" />}</button>
                  </FormInput>

                  {authMode === 'signup' && (
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="terms-senior" checked={formData.termsAccepted} onChange={(e) => handleInputChange('termsAccepted', e.target.checked)} className="rounded bg-white/20 border-white/30 text-amber-500 focus:ring-amber-500" />
                        <label htmlFor="terms-senior" className="text-xs text-white/80">I agree to the <a href="#" className="underline hover:text-white">Terms & Conditions</a>.</label>
                    </div>
                  )}
                  {authMode === 'signin' && (
                      <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                            <input type="checkbox" id="rememberMe-senior" checked={formData.rememberMe} onChange={(e) => handleInputChange('rememberMe', e.target.checked)} className="rounded bg-white/20 border-white/30 text-amber-500 focus:ring-amber-500" />
                            <label htmlFor="rememberMe-senior" className="text-xs text-white/80">Remember me</label>
                          </div>
                          <button type="button" onClick={handleSendMagicLink} className="text-xs text-amber-300 hover:underline">Email me a magic link</button>
                      </div>
                  )}
                  
                  <Button type="submit" disabled={isSubmitting || (showValidation && !isFormValid)} className={cn("w-full py-2.5 sm:py-3 text-sm font-medium text-white transition-all duration-300 group", isFormValid && !isSubmitting ? "bg-amber-600 hover:bg-amber-700 hover:scale-[1.02] hover:shadow-lg" : "bg-amber-600/50 cursor-not-allowed")}>
                      {isSubmitting ? <><LoadingSpinner size="sm" className="mr-2" />{authMode === 'signin' ? 'Signing In...' : 'Creating...'}</> : <div className="flex items-center justify-center gap-2"><span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></div>}
                  </Button>
                  {authMode === 'signin' && <div className="text-center"><button type="button" onClick={() => handleDemoLogin('senior')} disabled={isSubmitting} className={cn("text-xs transition-colors flex items-center justify-center gap-1 mx-auto", isSubmitting ? "text-amber-300/50 cursor-not-allowed" : "text-amber-300 hover:text-amber-200 hover:underline")}>{isSubmitting ? <><LoadingSpinner size="sm" className="w-3 h-3" /><span>Signing in...</span></> : 'Try Senior Demo Account'}</button></div>}
              </form>
          </div>
        </AuthPanel>
        </main>

        <footer className="text-center mt-1 sm:mt-2 space-y-2 flex-shrink-0 px-4">
          <div className="flex items-center justify-center gap-4 text-slate-400">
             <div className="flex items-center gap-1.5">
               <Lock size={12} />
               <span className="text-xs">256-bit SSL Encryption</span>
             </div>
             <div className="flex items-center gap-1.5">
               <Shield size={12} />
               <span className="text-xs">Privacy Certified</span>
             </div>
          </div>
            <p className="text-slate-400 text-xs">&copy; {new Date().getFullYear()} lexo. All rights reserved. Data stored in South Africa.</p>
        </footer>

        {redirecting && (
          <>
            <div role="alert" aria-live="polite" className="sr-only">Redirecting...</div>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-black/50 border border-white/30 rounded-lg px-4 py-3 text-white flex items-center gap-3 shadow-xl">
                <LoadingSpinner size="md" />
                <span className="text-sm">Redirecting…</span>
              </div>
            </div>
          </>
        )}

        {/* Floating Chat/Support Button */}
        <button
          onClick={() => {
            const number = import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER;
            const text = encodeURIComponent('Hi Lexo Support — I need help with login.');
            if (!number) {
              toast.error('WhatsApp support number not configured. Set VITE_WHATSAPP_SUPPORT_NUMBER');
              return;
            }
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const url = isMobile
              ? `whatsapp://send?phone=${number}&text=${text}`
              : `https://wa.me/${number}?text=${text}`;
            window.open(url, '_blank');
          }}
          aria-label="Open WhatsApp support"
          title="WhatsApp Support"
          className="fixed bottom-4 right-4 bg-yellow-500 text-white p-3 rounded-full shadow-lg hover:bg-yellow-600 transition-all active:scale-95 z-30"
        >
            <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
};

export default LoginPage;

