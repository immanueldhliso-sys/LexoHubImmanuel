import { 
  BarChart3, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Brain, 
  GraduationCap,
  FileText,
  Scale,
  Users,
  Calendar,
  Clock,
  PlusCircle,
  Search,
  Settings,
  Shield,
  Mic,
  Calculator,
  Target,
  BookOpen,
  Award,
  Zap,
  BarChart,
  PieChart,
  LineChart,
  CreditCard,
  Receipt,
  Wallet,
  Building,
  UserPlus,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Lightbulb,
  Rocket,
  Star
} from 'lucide-react';
import type { NavigationConfig } from '../types';

export const navigationConfig: NavigationConfig = {
  categories: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      page: 'dashboard',
      icon: BarChart3,
      description: 'Your practice overview and key metrics',
      sections: [
        {
          id: 'overview',
          title: 'Overview',
          items: [
            {
              id: 'main-dashboard',
              label: 'Practice Dashboard',
              page: 'dashboard',
              icon: BarChart3,
              description: 'Complete practice overview with key metrics'
            },
            {
              id: 'ai-analytics',
              label: 'AI Analytics',
              page: 'ai-analytics',
              icon: Brain,
              description: 'AI-powered insights and analytics',
              minTier: 'advocate_pro',
              isNew: true
            }
          ]
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          items: [
            {
              id: 'voice-time-entry',
              label: 'Voice Time Entry',
              icon: Mic,
              description: 'Capture time entries using voice commands',
              minTier: 'advocate_pro',
              badge: 'Voice'
            },
            {
              id: 'create-matter',
              label: 'New Matter',
              icon: PlusCircle,
              description: 'Create a new matter quickly'
            },
            {
              id: 'quick-invoice',
              label: 'Quick Invoice',
              icon: Receipt,
              description: 'Generate invoice from recent time entries'
            }
          ]
        },
        {
          id: 'reports',
          title: 'Reports & Analytics',
          items: [
            {
              id: 'practice-reports',
              label: 'Practice Reports',
              page: 'reports',
              icon: BarChart,
              description: 'Comprehensive practice performance reports'
            },
            {
              id: 'financial-analytics',
              label: 'Financial Analytics',
              icon: PieChart,
              description: 'Revenue and profitability insights',
              minTier: 'advocate_pro'
            }
          ]
        }
      ],
      featured: [
        {
          id: 'voice-dashboard',
          label: 'Voice-Powered Dashboard',
          icon: Mic,
          description: 'Control your dashboard with voice commands',
          minTier: 'senior_advocate',
          isNew: true
        }
      ]
    },
    {
      id: 'matters',
      label: 'Matters',
      page: 'matters',
      icon: Briefcase,
      description: 'Manage your legal matters and cases',
      sections: [
        {
          id: 'matter-management',
          title: 'Matter Management',
          items: [
            {
              id: 'all-matters',
              label: 'All Matters',
              page: 'matters',
              icon: Briefcase,
              description: 'View and manage all your matters'
            },
            {
              id: 'active-matters',
              label: 'Active Matters',
              icon: Clock,
              description: 'Currently active matters requiring attention'
            },
            {
              id: 'new-matter',
              label: 'New Matter',
              icon: PlusCircle,
              description: 'Create a new matter'
            }
          ]
        },
        {
          id: 'case-tools',
          title: 'Case Tools',
          items: [
            {
              id: 'conflict-check',
              label: 'Conflict Check',
              icon: Shield,
              description: 'Perform conflict of interest checks'
            },
            {
              id: 'matter-calendar',
              label: 'Matter Calendar',
              icon: Calendar,
              description: 'View matter-related deadlines and events'
            },
            {
              id: 'time-tracking',
              label: 'Time Tracking',
              icon: Clock,
              description: 'Track time spent on matters'
            }
          ]
        },
        {
          id: 'templates',
          title: 'Templates',
          items: [
            {
              id: 'matter-templates',
              label: 'Matter Templates',
              icon: FileText,
              description: 'Manage and use matter templates for quick setup',
              minTier: 'advocate_pro'
            },
            {
              id: 'template-library',
              label: 'Template Library',
              icon: BookOpen,
              description: 'Browse and organize your matter templates',
              minTier: 'advocate_pro'
            }
          ]
        },
        {
          id: 'ai-assistance',
          title: 'AI Assistance',
          items: [
            {
              id: 'brief-analysis',
              label: 'Brief Analysis',
              icon: Brain,
              description: 'AI-powered brief and document analysis',
              minTier: 'advocate_pro',
              badge: 'AI'
            },
            {
              id: 'case-research',
              label: 'Case Research',
              icon: Search,
              description: 'AI-assisted legal research and precedent finding',
              minTier: 'senior_advocate',
              badge: 'AI'
            },
            {
              id: 'document-drafting',
              label: 'Document Drafting',
              icon: FileText,
              description: 'AI-assisted document creation and review',
              minTier: 'senior_advocate',
              badge: 'AI'
            }
          ]
        }
      ],
      featured: [
        {
          id: 'ai-matter-insights',
          label: 'AI Matter Insights',
          icon: Brain,
          description: 'Get AI-powered insights on your matters',
          minTier: 'advocate_pro'
        }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      page: 'invoices',
      icon: DollarSign,
      description: 'Financial management and billing',
      sections: [
        {
          id: 'billing',
          title: 'Billing & Invoicing',
          items: [
            {
              id: 'invoices',
              label: 'Invoices',
              page: 'invoices',
              icon: FileText,
              description: 'Manage invoices and billing'
            },
            {
              id: 'proforma',
              label: 'Pro Forma',
              page: 'proforma',
              icon: Receipt,
              description: 'Create and manage pro forma invoices'
            },
            {
              id: 'pricing',
              label: 'Pricing Management',
              page: 'pricing-management',
              icon: Scale,
              description: 'Manage your pricing and fee structures'
            }
          ]
        },
        {
          id: 'financial-tools',
          title: 'Financial Tools',
          items: [
            {
              id: 'fee-calculator',
              label: 'Fee Calculator',
              icon: Calculator,
              description: 'Calculate fees and estimates',
              minTier: 'advocate_pro'
            },
            {
              id: 'payment-tracking',
              label: 'Payment Tracking',
              icon: CreditCard,
              description: 'Track payments and outstanding amounts',
              minTier: 'advocate_pro'
            },
            {
              id: 'financial-reports',
              label: 'Financial Reports',
              icon: BarChart,
              description: 'Comprehensive financial reporting',
              minTier: 'senior_advocate'
            }
          ]
        },
        {
          id: 'strategic-finance',
          title: 'Strategic Finance',
          items: [
            {
              id: 'strategic-finance',
              label: 'Strategic Finance',
              page: 'strategic-finance',
              icon: TrendingUp,
              description: 'Advanced financial planning and analysis',
              minTier: 'senior_advocate',
              isNew: true
            }
          ]
        }
      ],
      featured: [
        {
          id: 'ai-billing',
          label: 'AI-Powered Billing',
          icon: Brain,
          description: 'Intelligent billing suggestions and automation',
          minTier: 'advocate_pro'
        }
      ]
    },
    {
      id: 'growth',
      label: 'Growth',
      page: 'practice-growth',
      icon: TrendingUp,
      description: 'Practice development and client management',
      sections: [
        {
          id: 'client-management',
          title: 'Client Management',
          items: [
            {
              id: 'client-portal',
              label: 'Client Portal',
              icon: Users,
              description: 'Manage client relationships and communications'
            },
            {
              id: 'client-acquisition',
              label: 'Client Acquisition',
              icon: UserPlus,
              description: 'Tools for acquiring new clients',
              minTier: 'advocate_pro'
            },
            {
              id: 'referral-tracking',
              label: 'Referral Tracking',
              icon: Target,
              description: 'Track and manage referrals',
              minTier: 'advocate_pro'
            }
          ]
        },
        {
          id: 'practice-development',
          title: 'Practice Development',
          items: [
            {
              id: 'practice-growth',
              label: 'Practice Growth',
              page: 'practice-growth',
              icon: TrendingUp,
              description: 'Strategic practice development tools',
              minTier: 'senior_advocate'
            },
            {
              id: 'marketing-tools',
              label: 'Marketing Tools',
              icon: Rocket,
              description: 'Digital marketing and practice promotion',
              minTier: 'advocate_pro'
            },
            {
              id: 'networking',
              label: 'Professional Network',
              icon: Users,
              description: 'Connect with other legal professionals',
              minTier: 'senior_advocate'
            }
          ]
        },
        {
          id: 'communication',
          title: 'Communication',
          items: [
            {
              id: 'client-communication',
              label: 'Client Communication',
              icon: MessageSquare,
              description: 'Streamlined client communication tools',
              minTier: 'advocate_pro',
              isNew: true
            }
          ]
        }
      ],
      featured: [
        {
          id: 'growth-analytics',
          label: 'Growth Analytics',
          icon: BarChart,
          description: 'Track your practice growth metrics',
          minTier: 'advocate_pro'
        }
      ]
    },
    {
      id: 'intelligence',
      label: 'Intelligence',
      page: 'ai-analytics',
      icon: Brain,
      description: 'AI-powered insights and analytics',
      sections: [
        {
          id: 'ai-analytics',
          title: 'AI Analytics',
          items: [
            {
              id: 'ai-dashboard',
              label: 'AI Dashboard',
              page: 'ai-analytics',
              icon: Brain,
              description: 'AI-powered practice insights and analytics',
              minTier: 'advocate_pro'
            },
            {
              id: 'predictive-analytics',
              label: 'Predictive Analytics',
              icon: LineChart,
              description: 'Predict case outcomes and practice trends',
              minTier: 'advocate_pro',
              badge: 'AI'
            }
          ]
        },
        {
          id: 'automation',
          title: 'Automation',
          items: [
            {
              id: 'workflow-automation',
              label: 'Workflow Automation',
              page: 'workflow-integrations',
              icon: Zap,
              description: 'Automate repetitive tasks and workflows',
              minTier: 'advocate_pro'
            }
          ]
        }
      ],
      featured: [
        {
          id: 'ai-assistant',
          label: 'AI Legal Assistant',
          icon: Brain,
          description: 'Your personal AI legal assistant',
          minTier: 'senior_advocate',
          isNew: true
        }
      ]
    },
    {
      id: 'academy',
      label: 'Academy',
      page: 'academy',
      icon: GraduationCap,
      description: 'Legal education and professional development',
      sections: [
        {
          id: 'learning',
          title: 'Learning & Development',
          items: [
            {
              id: 'courses',
              label: 'Online Courses',
              icon: BookOpen,
              description: 'Professional development courses'
            },
            {
              id: 'webinars',
              label: 'Webinars',
              icon: Globe,
              description: 'Live and recorded legal webinars'
            },
            {
              id: 'certifications',
              label: 'Certifications',
              icon: Award,
              description: 'Professional certifications and CPD points'
            }
          ]
        },
        {
          id: 'resources',
          title: 'Resources',
          items: [
            {
              id: 'legal-updates',
              label: 'Legal Updates',
              icon: Lightbulb,
              description: 'Latest legal news and case law updates'
            },
            {
              id: 'practice-guides',
              label: 'Practice Guides',
              icon: BookOpen,
              description: 'Comprehensive practice management guides'
            }
          ]
        }
      ],
      featured: [
        {
          id: 'ai-learning',
          label: 'AI-Powered Learning',
          icon: Brain,
          description: 'Personalized learning recommendations',
          minTier: 'advocate_pro'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      page: 'settings',
      icon: Settings,
      description: 'Practice settings, integrations, compliance, and advanced features',
      sections: [
        {
          id: 'practice-settings',
          title: 'Practice Settings',
          items: [
            {
              id: 'general-settings',
              label: 'General Settings',
              page: 'settings',
              icon: Settings,
              description: 'Basic practice configuration and preferences'
            },
            {
              id: 'user-profile',
              label: 'User Profile',
              icon: Users,
              description: 'Manage your personal profile and preferences'
            },
            {
              id: 'billing-settings',
              label: 'Billing Settings',
              icon: CreditCard,
              description: 'Configure billing preferences and payment methods'
            }
          ]
        },
        {
          id: 'integrations',
          title: 'Integrations',
          items: [
            {
              id: 'workflow-integrations',
              label: 'Workflow Integrations',
              page: 'workflow-integrations',
              icon: Zap,
              description: 'Connect with external tools and services'
            },
            {
              id: 'api-settings',
              label: 'API Settings',
              icon: Globe,
              description: 'Manage API keys and external connections',
              minTier: 'advocate_pro'
            }
          ]
        },
        {
          id: 'compliance-security',
          title: 'Compliance & Security',
          items: [
            {
              id: 'compliance-settings',
              label: 'Compliance Settings',
              page: 'compliance',
              icon: Shield,
              description: 'Ethics compliance and regulatory settings'
            },
            {
              id: 'security-settings',
              label: 'Security Settings',
              icon: Shield,
              description: 'Account security and access controls',
              minTier: 'advocate_pro'
            }
          ]
        },
        {
          id: 'template-management',
          title: 'Template Management',
          items: [
            {
              id: 'template-settings',
              label: 'Template Settings',
              icon: FileText,
              description: 'Configure template preferences and defaults',
              minTier: 'advocate_pro'
            },
            {
              id: 'template-categories',
              label: 'Template Categories',
              icon: BookOpen,
              description: 'Manage template categories and organization',
              minTier: 'advocate_pro'
            }
          ]
        },
        {
          id: 'advanced-features',
          title: 'Advanced Features',
          items: [
            {
              id: 'feature-toggles',
              label: 'Feature Toggles',
              icon: Zap,
              description: 'Enable or disable advanced features',
              minTier: 'advocate_pro'
            },
            {
              id: 'ai-settings',
              label: 'AI Settings',
              icon: Brain,
              description: 'Configure AI features and preferences',
              minTier: 'advocate_pro'
            }
          ]
        }
      ],
      featured: [
        {
          id: 'advanced-settings',
          label: 'Advanced Configuration',
          icon: Settings,
          description: 'Access advanced practice configuration options',
          minTier: 'senior_advocate'
        }
      ]
    }
  ],
  quickActions: [
    {
      id: 'voice-capture',
      label: 'Voice Capture',
      icon: Mic,
      description: 'Quick voice time entry',
      minTier: 'advocate_pro'
    },
    {
      id: 'new-matter',
      label: 'New Matter',
      icon: PlusCircle,
      description: 'Create new matter'
    },
    {
      id: 'quick-invoice',
      label: 'Quick Invoice',
      icon: Receipt,
      description: 'Generate invoice'
    },
    {
      id: 'search',
      label: 'Global Search',
      icon: Search,
      description: 'Search everything'
    }
  ]
};

// User tier hierarchy for access control
export const tierHierarchy = {
  'junior_start': 0,
  'advocate_pro': 1,
  'senior_advocate': 2,
  'chambers_enterprise': 3
};

// Helper function to check if user has access to a feature based on tier
export const hasAccess = (userTier: string, requiredTier?: string): boolean => {
  if (!requiredTier) return true;
  
  const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] ?? 0;
  const requiredLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] ?? 0;
  
  return userLevel >= requiredLevel;
};

// Helper function to get filtered navigation config based on user tier
export const getFilteredNavigationConfig = (userTier: string): NavigationConfig => {
  const filteredConfig = { ...navigationConfig };
  
  filteredConfig.categories = navigationConfig.categories.map(category => ({
    ...category,
    sections: category.sections.map(section => ({
      ...section,
      items: section.items.filter(item => hasAccess(userTier, item.minTier))
    })),
    featured: category.featured?.filter(item => hasAccess(userTier, item.minTier)) || []
  }));
  
  filteredConfig.quickActions = navigationConfig.quickActions.filter(action => 
    hasAccess(userTier, action.minTier)
  );
  
  return filteredConfig;
};

// Helper function to get accessible navigation items for current user
export const getAccessibleNavigationItems = (userTier: string) => {
  const config = getFilteredNavigationConfig(userTier);
  const items: Array<{ id: string; label: string; page?: string }> = [];
  
  config.categories.forEach(category => {
    if (category.page) {
      items.push({ id: category.id, label: category.label, page: category.page });
    }
    
    category.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.page) {
          items.push({ id: item.id, label: item.label, page: item.page });
        }
      });
    });
  });
  
  return items;
};