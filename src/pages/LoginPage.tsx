/**
 * Authentication Page Component
 * A visually enhanced, animated, and fully responsive dual-panel interface 
 * for Junior Advocates and Senior Counsel.
 *
 * Features:
 * - Fluid panel expansion and collapse animations.
 * - Staggered content animations for a dynamic user experience.
 * - Improved glassmorphism styling for better readability.
 * - Fully responsive design for mobile, tablet, and desktop views.
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
  ArrowRight
} from 'lucide-react';

// --- Utility Function (previously in ./utils) ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Placeholder Components (previously in separate files) ---

// Button.tsx
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        "px-4 py-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

// LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses: Record<string, string> = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16',
  };
  return (
    <div className={cn(sizeClasses[size], 'animate-spin rounded-full border-b-2 border-t-2 border-white', className)} />
  );
};


// Import the real AuthContext
import { useAuth } from '../contexts/AuthContext';


const SignupBgImage = '/src/Public/SignupInbgpicLEXO.png';

type AuthMode = 'signin' | 'signup';
type UserType = 'junior' | 'senior';

// Form validation utilities
const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, message: 'Email is required' };
  if (!emailRegex.test(email)) return { isValid: false, message: 'Please enter a valid email address' };
  return { isValid: true };
};

const validatePassword = (password: string): { isValid: boolean; message?: string; strength?: number } => {
  if (!password) return { isValid: false, message: 'Password is required', strength: 0 };
  if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters', strength: 1 };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength < 3) return { isValid: false, message: 'Password is too weak', strength };
  return { isValid: true, strength };
};

const validateName = (name: string): { isValid: boolean; message?: string } => {
  if (!name) return { isValid: false, message: 'Full name is required' };
  if (name.trim().length < 2) return { isValid: false, message: 'Please enter your full name' };
  return { isValid: true };
};

// Enhanced Form Input Component with validation and accessibility
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  children?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  validation?: { isValid: boolean; message?: string; strength?: number };
  showValidation?: boolean;
  id: string;
  autoComplete?: string;
}

const FormInput: React.FC<FormInputProps> = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className, 
  required = false, 
  children, 
  icon: Icon,
  validation,
  showValidation = false,
  id,
  autoComplete,
  ...props 
}) => {
  const hasError = showValidation && validation && !validation.isValid;
  const hasSuccess = showValidation && validation && validation.isValid && value;
  
  return (
    <div className="relative space-y-2">
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-white/50 z-10" />
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={cn(
            "w-full py-2 sm:py-2.5 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/70",
            "focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-300",
            "focus:bg-white/20 hover:bg-white/18 text-sm font-medium",
            Icon ? "pl-8 sm:pl-10 pr-3 sm:pr-4" : "px-3 sm:px-4",
            hasError && "border-red-400/50 focus:ring-red-400",
            hasSuccess && "border-green-400/50 focus:ring-green-400",
            className
          )}
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          {...props}
        />
        {children}
        {showValidation && (
          <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2">
            {hasError && <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />}
            {hasSuccess && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />}
          </div>
        )}
      </div>
      
      {/* Validation Message */}
      {showValidation && validation && !validation.isValid && validation.message && (
        <p id={`${id}-error`} className="text-sm text-red-300 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4" />
          {validation.message}
        </p>
      )}
      
      {/* Password Strength Indicator */}
      {type === 'password' && showValidation && validation && validation.strength !== undefined && value && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  (validation.strength ?? 0) >= level
                    ? (validation.strength ?? 0) <= 2
                      ? "bg-red-400"
                      : (validation.strength ?? 0) <= 3
                      ? "bg-yellow-400"
                      : "bg-green-400"
                    : "bg-white/20"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-white/70">
            Password strength: {
              (validation.strength ?? 0) <= 2 ? "Weak" :
              (validation.strength ?? 0) <= 3 ? "Fair" :
              (validation.strength ?? 0) <= 4 ? "Good" : "Strong"
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Panel Component for DRY code
interface AuthPanelProps {
  userType: UserType;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  features: string[];
  badge: React.ReactNode;
  color: string;
  selectedType: UserType | null;
  setSelectedType: (type: UserType | null) => void;
  children: React.ReactNode;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ 
    userType, 
    title, 
    subtitle, 
    Icon, 
    features, 
    badge,
    color,
    selectedType,
    setSelectedType,
    children 
}) => {
    const isSelected = selectedType === userType;
    const isAnotherSelected = selectedType && !isSelected;

    return (
        <div
            className={cn(
                "relative p-1 sm:p-2 md:p-3 lg:p-4 cursor-pointer transition-all duration-700 ease-in-out",
                `from-${color}-600/30 to-${color}-700/30`,
                `hover:from-${color}-600/40 hover:to-${color}-700/40`,
                isSelected 
                    ? "flex-[2] md:flex-[3] ring-1 ring-white/30" 
                    : "flex-1",
                isAnotherSelected && "opacity-70 scale-98 hover:opacity-85 hover:scale-100 md:opacity-50",
                "flex flex-col min-h-0 overflow-x-hidden overflow-y-auto w-full" // Strict constraints
            )}
            onClick={() => setSelectedType(userType)}
        >
            {/* Decorative background elements */}
            <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/10 to-transparent opacity-50`}></div>
            <Icon className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 absolute top-1 right-1 sm:top-2 sm:right-2 md:top-4 md:right-4 text-${color}-400/20 transform-gpu transition-transform duration-500 ${isSelected ? 'rotate-6' : '-rotate-12'}`} />

            <div className="relative z-10 flex flex-col h-full min-h-0">
                <div className={`transition-all duration-500 ${isAnotherSelected ? 'md:opacity-80' : 'opacity-100'} flex-shrink-0`}>
                    <Award className={`w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 text-${color}-200 mb-1 sm:mb-2`} />
                    <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white leading-tight tracking-wide">{title}</h2>
                    <p className={`text-${color}-100 text-sm sm:text-base leading-tight font-medium hidden sm:block`}>{subtitle}</p>
                    {isAnotherSelected && (
                        <p className="text-white/80 text-sm mt-2 hidden md:block font-medium">Click to switch</p>
                    )}
                </div>

                <div className={`my-2 sm:my-3 md:my-5 space-y-2 sm:space-y-3 transition-all duration-500 ease-in-out flex-shrink-0 ${isSelected ? 'opacity-100 delay-300' : 'opacity-0 h-0 pointer-events-none md:opacity-100 md:h-auto md:pointer-events-auto'}`}>
                    {features.slice(0, 2).map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3 text-white">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 bg-${color}-300 rounded-full shadow-sm`}></div>
                            <span className="text-sm sm:text-base font-medium truncate">{feature}</span>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block">{badge}</div>

                {/* Mobile Back Button */}
                {isSelected && (
                    <button 
                        className="md:hidden absolute top-1 left-1 sm:top-2 sm:left-2 z-30 p-1.5 sm:p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors text-sm sm:text-base"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedType(null);
                        }}
                        aria-label="Go back to role selection"
                    >
                        ←
                    </button>
                )}

                {/* Authentication Form */}
                <div className={`flex-1 flex flex-col justify-center mt-1 sm:mt-2 transition-opacity duration-500 overflow-y-auto min-h-0 ${isSelected ? 'opacity-100 delay-200' : 'opacity-0 pointer-events-none'}`}>
                     {children}
                </div>
            </div>
        </div>
    );
};


export const LoginPage: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  // Real-time validation
  const emailValidation = validateEmail(formData.email);
  const passwordValidation = validatePassword(formData.password);
  const nameValidation = validateName(formData.fullName);

  // Check if form is valid
  const isFormValid = emailValidation.isValid && 
    passwordValidation.isValid && 
    (authMode === 'signin' || nameValidation.isValid);

  // Reset form when switching user type or auth mode
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setFormData({ email: '', password: '', fullName: '' });
    setShowValidation(false);
    setTouchedFields(new Set());
    // Reset password visibility when switching
    setShowPassword(false);
  }, [selectedType, authMode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Mark field as touched when user starts typing
    if (value && !touchedFields.has(field)) {
      setTouchedFields(prev => new Set(prev).add(field));
    }
  };

  const handleInputBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    setShowValidation(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowValidation(true);
    
    // Mark all fields as touched
    setTouchedFields(new Set(['email', 'password', 'fullName']));
    
    // Validate form before submission
    if (!isFormValid) {
      setError('Please fix the errors above before submitting.');
      // Focus first invalid field
      setTimeout(() => {
        const firstInvalidField = formRef.current?.querySelector('[aria-invalid="true"]') as HTMLInputElement;
        firstInvalidField?.focus();
      }, 100);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (authMode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) setError(error.message || 'Failed to sign in');
      } else {
        const metadata = {
          full_name: formData.fullName,
          initials: formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase(),
          practice_number: '', // Will be set later in profile completion
          bar: 'johannesburg' as const, // Default, can be changed later
          year_admitted: new Date().getFullYear(), // Default, can be changed later
          specialisations: [], // Will be set later in profile completion
          hourly_rate: 0, // Will be set later in profile completion
          user_type: selectedType as 'junior' | 'senior',
        };
        const { error } = await signUp(formData.email, formData.password, metadata);
        if (error) setError(error.message || 'Failed to create account');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (type: UserType) => {
    // Set the auth mode and type first
    setAuthMode('signin');
    setSelectedType(type);
    
    // Clear any existing errors and success messages
    setError(null);
    setSuccess(null);
    setShowValidation(false);
    setTouchedFields(new Set());
    
    // Set demo credentials
    const demoEmail = type === 'junior' ? 'demo@lexo.co.za' : 'sarah.counsel@lexo.co.za';
    const demoPassword = 'demo123';
    
    setFormData({
      fullName: '',
      email: demoEmail,
      password: demoPassword
    });
    
    setIsSubmitting(true);
    
    try {
      console.log(`Starting demo login for ${type}`);
      
      // Create a demo user object that matches the ExtendedUser interface
      const demoUser = {
        id: `demo-${type}-${Date.now()}`,
        aud: 'authenticated',
        role: 'authenticated',
        email: demoEmail,
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { provider: 'demo', providers: ['demo'] },
        user_metadata: {
          full_name: type === 'junior' ? 'Demo Junior Advocate' : 'Demo Senior Counsel',
          user_type: type
        },
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        advocate_profile: {
          full_name: type === 'junior' ? 'Demo Junior Advocate' : 'Demo Senior Counsel',
          practice_number: type === 'junior' ? 'JA001' : 'SC001',
          bar: 'johannesburg',
          specialisations: type === 'junior' ? ['Commercial Law'] : ['Constitutional Law', 'Appeals'],
          hourly_rate: type === 'junior' ? 1500 : 3500
        }
      };
      
      // Store demo user in localStorage to persist across page reloads
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      localStorage.setItem('demo_session', JSON.stringify({
        access_token: 'demo_token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        user: demoUser
      }));
      
      console.log('✅ Demo user created and stored:', demoUser);
      setError(null);
      setSuccess(`Demo login successful! Welcome, ${type === 'junior' ? 'Junior Advocate' : 'Senior Counsel'}!`);
      
      // Reload the page to trigger AuthContext to check for demo user
      setTimeout(() => {
        setSuccess(`Redirecting to dashboard...`);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }, 1000);
      
    } catch (err) {
      console.error('Demo login exception:', err);
      setError('Demo login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden flex flex-col bg-slate-900 font-sans"
      style={{
        backgroundImage: `url(${SignupBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full h-full flex flex-col overflow-x-hidden overflow-y-auto px-1 sm:px-2 md:px-4 py-1 sm:py-2 md:py-4">
        <header className="text-center mb-2 sm:mb-3 md:mb-6 animate-in fade-in slide-in-from-top-4 duration-1000 flex-shrink-0">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-1 sm:mb-2 md:mb-3 group">
                <Scale className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-yellow-400 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 drop-shadow-sm" />
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-wider drop-shadow-sm">
                    lexo
                </h1>
            </div>
            <p className="text-sm md:text-base text-slate-200 leading-tight px-2 font-medium hidden sm:block">
                Your Practice, Amplified. The Advocate's Intelligence Platform.
            </p>
        </header>

        <main 
            className={cn(
                "bg-black/40 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/30 shadow-2xl",
                "flex flex-col md:flex-row transition-all duration-700 ease-in-out",
                "flex-1 overflow-x-hidden w-full max-w-6xl mx-auto", // Strict width constraints
                "min-h-0" // Allow flex shrinking
            )}
        >
            {!selectedType && (
                <>
                    {/* Desktop OR indicator */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex">
                        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <p className="text-white font-bold text-lg">OR</p>
                        </div>
                    </div>
                    
                    {/* Mobile instruction */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
                        <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm animate-bounce">
                            Choose your role to continue
                        </div>
                    </div>
                </>
            )}
            
            {selectedType && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
                    <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs">
                        Tap other panel to switch
                    </div>
                </div>
            )}
          
          <AuthPanel
            userType="junior"
            title="JUNIOR ADVOCATES"
            subtitle="BUILD YOUR PRACTICE. INNOVATE & GROW"
            Icon={TrendingUp}
            features={['Voice-First Time Capture', 'AI-Powered Brief Analysis', 'Practice Growth Tools']}
            badge={
                <div className="flex items-center gap-2 p-2 bg-white/15 rounded-lg border border-white/30 w-fit mt-auto shadow-sm">
                    <span className="text-white text-sm font-medium">South Africa</span>
                </div>
            }
            color="blue"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          >
            <div className="bg-white/10 rounded-lg border border-white/20 p-2 sm:p-3 md:p-4 shadow-lg overflow-visible">
                <div className="flex bg-black/30 rounded-lg p-1 mb-2 sm:mb-3">
                    {['signin', 'signup'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setAuthMode(mode as AuthMode)}
                            className={cn(
                                "flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-sm font-medium transition-all duration-200",
                                authMode === mode 
                                    ? "bg-blue-600 text-white shadow-sm" 
                                    : "text-white/80 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>

                <form ref={formRef} id="auth-form-junior" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {error && (
                        <div className="bg-red-500/30 border border-red-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-5 w-5 text-red-300" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}
                    
                    {success && (
                        <div className="bg-green-500/30 border border-green-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                            <CheckCircle className="h-5 w-5 text-green-300" />
                            <p className="text-sm text-green-200">{success}</p>
                        </div>
                    )}
                    
                    {authMode === 'signup' && (
                        <FormInput
                            id="fullName-junior"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={e => handleInputChange('fullName', e.target.value)}
                            onBlur={() => handleInputBlur('fullName')}
                            className="focus:ring-blue-500"
                            icon={User}
                            validation={nameValidation}
                            showValidation={showValidation && touchedFields.has('fullName')}
                            autoComplete="name"
                            required
                        />
                    )}
                    
                    <FormInput
                        id="email-junior"
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        onBlur={() => handleInputBlur('email')}
                        className="focus:ring-blue-500"
                        icon={Mail}
                        validation={emailValidation}
                        showValidation={showValidation && touchedFields.has('email')}
                        autoComplete="email"
                        required
                    />
                    
                    <FormInput
                        id="password-junior"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={e => handleInputChange('password', e.target.value)}
                        onBlur={() => handleInputBlur('password')}
                        className="focus:ring-blue-500"
                        icon={Lock}
                        validation={passwordValidation}
                        showValidation={showValidation && touchedFields.has('password')}
                        autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                        required
                    >
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-20"
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff size={12} className="sm:w-4 sm:h-4" /> : <Eye size={12} className="sm:w-4 sm:h-4" />}
                        </button>
                    </FormInput>

                    <Button
                        type="submit"
                        disabled={isSubmitting || (showValidation && !isFormValid)}
                        className={cn(
                            "w-full py-2.5 sm:py-3 text-sm font-medium text-white transition-all duration-300 group",
                            isFormValid && !isSubmitting
                                ? "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] hover:shadow-lg"
                                : "bg-blue-600/50 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                            </>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        )}
                    </Button>

                    {authMode === 'signin' && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('junior')}
                                disabled={isSubmitting}
                                className={cn(
                                    "text-xs transition-colors flex items-center justify-center gap-1 mx-auto",
                                    isSubmitting 
                                        ? "text-blue-300/50 cursor-not-allowed" 
                                        : "text-blue-300 hover:text-blue-200 hover:underline"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size="sm" className="w-3 h-3" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    'Try Junior Demo Account'
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
          </AuthPanel>

          <AuthPanel
            userType="senior"
            title="SENIOR COUNSEL"
            subtitle="PRESTIGE. EFFICIENCY. LEGACY"
            Icon={Shield}
            features={['Advanced Analytics', 'Strategic Finance Tools', 'Chambers Management']}
            badge={
                <div className="flex items-center gap-2 p-2 bg-white/15 rounded-lg border border-white/30 w-fit mt-auto shadow-sm">
                    <Shield className="w-4 h-4 text-amber-300" />
                    <span className="text-white text-sm font-medium">SC</span>
                </div>
            }
            color="amber"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          >
            <div className="bg-white/10 rounded-lg border border-white/20 p-2 sm:p-3 md:p-4 shadow-lg overflow-visible">
                <div className="flex bg-black/30 rounded-lg p-1 mb-2 sm:mb-3">
                    {['signin', 'signup'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setAuthMode(mode as AuthMode)}
                            className={cn(
                                "flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-sm font-medium transition-all duration-200",
                                authMode === mode 
                                    ? "bg-amber-600 text-white shadow-sm" 
                                    : "text-white/80 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>

                <form id="auth-form-senior" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {error && (
                        <div className="bg-red-500/30 border border-red-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-5 w-5 text-red-300" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}
                    
                    {success && (
                        <div className="bg-green-500/30 border border-green-500/50 rounded-md p-3 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                            <CheckCircle className="h-5 w-5 text-green-300" />
                            <p className="text-sm text-green-200">{success}</p>
                        </div>
                    )}
                    
                    {authMode === 'signup' && (
                        <FormInput
                            id="fullName-senior"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={e => handleInputChange('fullName', e.target.value)}
                            onBlur={() => handleInputBlur('fullName')}
                            className="focus:ring-amber-500"
                            icon={User}
                            validation={nameValidation}
                            showValidation={showValidation && touchedFields.has('fullName')}
                            autoComplete="name"
                            required
                        />
                    )}
                    
                    <FormInput
                        id="email-senior"
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        onBlur={() => handleInputBlur('email')}
                        className="focus:ring-amber-500"
                        icon={Mail}
                        validation={emailValidation}
                        showValidation={showValidation && touchedFields.has('email')}
                        autoComplete="email"
                        required
                    />
                    
                    <FormInput
                        id="password-senior"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={e => handleInputChange('password', e.target.value)}
                        onBlur={() => handleInputBlur('password')}
                        className="focus:ring-amber-500"
                        icon={Lock}
                        validation={passwordValidation}
                        showValidation={showValidation && touchedFields.has('password')}
                        autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                        required
                    >
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-20"
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff size={12} className="sm:w-4 sm:h-4" /> : <Eye size={12} className="sm:w-4 sm:h-4" />}
                        </button>
                    </FormInput>

                    <Button
                        type="submit"
                        disabled={isSubmitting || (showValidation && !isFormValid)}
                        className={cn(
                            "w-full py-2.5 sm:py-3 text-sm font-medium text-white transition-all duration-300 group",
                            isFormValid && !isSubmitting
                                ? "bg-amber-600 hover:bg-amber-700 hover:scale-[1.02] hover:shadow-lg"
                                : "bg-amber-600/50 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                            </>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        )}
                    </Button>

                    {authMode === 'signin' && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('senior')}
                                disabled={isSubmitting}
                                className={cn(
                                    "text-xs transition-colors flex items-center justify-center gap-1 mx-auto",
                                    isSubmitting 
                                        ? "text-amber-300/50 cursor-not-allowed" 
                                        : "text-amber-300 hover:text-amber-200 hover:underline"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size="sm" className="w-3 h-3" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    'Try Senior Demo Account'
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
          </AuthPanel>
        </main>

        <footer className="text-center mt-1 flex-shrink-0 hidden sm:block">
            <p className="text-slate-400 text-xs">
                &copy; {new Date().getFullYear()} lexo
            </p>
        </footer>
      </div>
    </div>
  );
};

