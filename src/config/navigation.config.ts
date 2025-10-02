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
  UserPlus,
  MessageSquare,
  Globe,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { UserTier } from '../types';
import type { NavigationConfig, NavigationItem } from '../types';

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
              minTier: UserTier.ADVOCATE_PRO,
              isNew: true
            }
          ]
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          items: [
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
              minTier: UserTier.ADVOCATE_PRO
            }
          ]
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
            },
            {
              id: 'matter-templates',
              label: 'Matter Templates',
              icon: FileText,
              description: 'Quick setup with templates',
              minTier: UserTier.ADVOCATE_PRO
            }
          ]
        },
        {
          id: 'time-billing',
          title: 'Time & Billing',
          items: [
            {
              id: 'time-tracking',
              label: 'Time Tracking',
              icon: Clock,
              description: 'Track time spent on matters'
            },
            {
              id: 'proforma',
              label: 'Pro Forma',
              page: 'proforma',
              icon: Receipt,
              description: 'Create and send pro forma invoices'
            },
            {
              id: 'matter-invoices',
              label: 'Invoices',
              page: 'invoices',
              icon: FileText,
              description: 'Generate invoices from matters'
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
              id: 'brief-analysis',
              label: 'Brief Analysis',
              icon: Brain,
              description: 'AI-powered brief and document analysis',
              minTier: UserTier.ADVOCATE_PRO,
              badge: 'AI'
            },
            {
              id: 'case-research',
              label: 'Case Research',
              icon: Search,
              description: 'AI-assisted legal research',
              minTier: UserTier.SENIOR_ADVOCATE,
              badge: 'AI'
            }
          ]
        }
      ],
      featured: [
        {
          id: 'ai-matter-insights',
          label: 'Complete Matter Workflow',
          icon: Zap,
          description: 'Matter → Time → Pro Forma → Invoice',
          minTier: UserTier.ADVOCATE_PRO,
          isNew: true
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
          id: 'billing-workflow',
          title: 'Billing Workflow',
          items: [
            {
              id: 'proforma',
              label: 'Pro Forma Invoices',
              page: 'proforma',
              icon: Receipt,
              description: 'Create and send estimates to clients'
            },
            {
              id: 'invoices',
              label: 'Final Invoices',
              page: 'invoices',
              icon: FileText,
              description: 'Manage invoices and billing'
            },
            {
              id: 'payment-tracking',
              label: 'Payment Tracking',
              icon: CreditCard,
              description: 'Track payments and outstanding amounts',
              minTier: UserTier.ADVOCATE_PRO
            }
          ]
        },
        {
          id: 'pricing-fees',
          title: 'Pricing & Fees',
          items: [
            {
              id: 'pricing',
              label: 'Pricing Management',
              page: 'pricing-management',
              icon: Scale,
              description: 'Manage pricing and fee structures'
            },
            {
              id: 'fee-calculator',
              label: 'Fee Calculator',
              icon: Calculator,
              description: 'Calculate fees and estimates',
              minTier: UserTier.ADVOCATE_PRO
            },
            {
              id: 'ai-billing',
              label: 'AI Billing Assistant',
              icon: Brain,
              description: 'Smart billing suggestions',
              minTier: UserTier.ADVOCATE_PRO,
              badge: 'AI'
            }
          ]
        },
        {
          id: 'financial-analytics',
          title: 'Financial Analytics',
          items: [
            {
              id: 'financial-reports',
              label: 'Financial Reports',
              icon: BarChart,
              description: 'Revenue and cash flow analysis',
              minTier: UserTier.ADVOCATE_PRO
            },
            {
              id: 'strategic-finance',
              label: 'Strategic Finance',
              page: 'strategic-finance',
              icon: TrendingUp,
              description: 'Advanced financial planning',
              minTier: UserTier.SENIOR_ADVOCATE,
              isNew: true
            }
          ]
        }
      ],
      featured: [
        {
          id: 'end-to-end-billing',
          label: 'End-to-End Billing',
          icon: Zap,
          description: 'Pro Forma → Invoice → Payment → Analytics',
          minTier: UserTier.ADVOCATE_PRO,
          isNew: true
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
              minTier: UserTier.ADVOCATE_PRO
            },
            {
              id: 'referral-tracking',
              label: 'Referral Tracking',
              icon: Target,
              description: 'Track and manage referrals',
              minTier: UserTier.ADVOCATE_PRO
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
              minTier: UserTier.SENIOR_ADVOCATE
            },
            {
              id: 'marketing-tools',
              label: 'Marketing Tools',
              icon: Rocket,
              description: 'Digital marketing and practice promotion',
              minTier: UserTier.ADVOCATE_PRO
            },
            {
              id: 'networking',
              label: 'Professional Network',
              icon: Users,
              description: 'Connect with other legal professionals',
              minTier: UserTier.SENIOR_ADVOCATE
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
              minTier: UserTier.ADVOCATE_PRO,
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
          minTier: UserTier.ADVOCATE_PRO
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
              minTier: UserTier.ADVOCATE_PRO
            },
            {
              id: 'predictive-analytics',
              label: 'Predictive Analytics',
              icon: LineChart,
              description: 'Predict case outcomes and practice trends',
              minTier: UserTier.ADVOCATE_PRO,
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
              minTier: UserTier.ADVOCATE_PRO
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
          minTier: UserTier.SENIOR_ADVOCATE,
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
          minTier: UserTier.ADVOCATE_PRO
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
              minTier: UserTier.ADVOCATE_PRO
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
              minTier: UserTier.ADVOCATE_PRO
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
              minTier: UserTier.ADVOCATE_PRO
            },
            {
              id: 'template-categories',
              label: 'Template Categories',
              icon: BookOpen,
              description: 'Manage template categories and organization',
              minTier: UserTier.ADVOCATE_PRO
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
          minTier: UserTier.SENIOR_ADVOCATE
        }
      ]
    }
  ],
  quickActions: [
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

// Helper function to filter navigation items by user tier
export const getAccessibleNavigationItems = (items: NavigationItem[], userTier: UserTier): NavigationItem[] => {
  return items.filter(item => hasAccess(userTier, item.minTier));
};

// Helper function to get all accessible navigation items for current user
export const getAllAccessibleNavigationItems = (userTier: string) => {
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