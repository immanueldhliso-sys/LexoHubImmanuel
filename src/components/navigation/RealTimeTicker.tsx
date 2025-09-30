import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  DollarSign,
  Users,
  Gavel,
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TickerItem {
  id: string;
  type: 'deadline' | 'invoice' | 'matter' | 'court_date' | 'client' | 'payment';
  title: string;
  description: string;
  urgency: 'urgent' | 'attention' | 'normal';
  dueDate?: Date;
  amount?: number;
  navigateTo: string;
  icon: React.ReactNode;
}

interface RealTimeTickerProps {
  className?: string;
  onItemClick?: (item: TickerItem) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const RealTimeTicker: React.FC<RealTimeTickerProps> = ({
  className = '',
  onItemClick,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Load minimized state from localStorage
    const saved = localStorage.getItem('realTimeTicker_minimized');
    return saved ? JSON.parse(saved) : false;
  });
  const tickerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data generator - in production this would come from your API
  const generateTickerData = (): TickerItem[] => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: '1',
        type: 'deadline',
        title: 'Constitutional Court Filing Due',
        description: 'Smith v Jones - Application deadline in 2 hours',
        urgency: 'urgent',
        dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        navigateTo: '/matters',
        icon: <Gavel className="w-4 h-4" />
      },
      {
        id: '2',
        type: 'invoice',
        title: 'Overdue Invoice',
        description: 'Van der Merwe Trust - R45,000 overdue 15 days',
        urgency: 'urgent',
        amount: 45000,
        navigateTo: '/finance',
        icon: <DollarSign className="w-4 h-4" />
      },
      {
        id: '3',
        type: 'court_date',
        title: 'High Court Appearance',
        description: 'Johannesburg High Court - Tomorrow 9:00 AM',
        urgency: 'attention',
        dueDate: tomorrow,
        navigateTo: '/matters',
        icon: <Calendar className="w-4 h-4" />
      },
      {
        id: '4',
        type: 'matter',
        title: 'New Matter Assigned',
        description: 'Corporate Merger - Urgent review required',
        urgency: 'attention',
        navigateTo: '/matters',
        icon: <FileText className="w-4 h-4" />
      },
      {
        id: '5',
        type: 'client',
        title: 'Client Meeting Reminder',
        description: 'ABC Corporation - Strategy session in 1 hour',
        urgency: 'normal',
        dueDate: new Date(now.getTime() + 60 * 60 * 1000),
        navigateTo: '/matters',
        icon: <Users className="w-4 h-4" />
      },
      {
        id: '6',
        type: 'payment',
        title: 'Payment Received',
        description: 'XYZ Ltd - R25,000 payment processed',
        urgency: 'normal',
        amount: 25000,
        navigateTo: '/finance',
        icon: <DollarSign className="w-4 h-4" />
      },
      {
        id: '7',
        type: 'deadline',
        title: 'Discovery Deadline',
        description: 'Commercial Litigation - Document production due next week',
        urgency: 'normal',
        dueDate: nextWeek,
        navigateTo: '/matters',
        icon: <Clock className="w-4 h-4" />
      }
    ];
  };

  // Load ticker data
  useEffect(() => {
    const loadData = () => {
      setTickerItems(generateTickerData());
    };

    loadData();

    if (autoRefresh) {
      intervalRef.current = setInterval(loadData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Auto-scroll functionality
  useEffect(() => {
    if (isHovered || tickerItems.length === 0) return;

    const scrollInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4000); // Change item every 4 seconds

    return () => clearInterval(scrollInterval);
  }, [isHovered, tickerItems.length]);

  const getUrgencyStyles = (urgency: TickerItem['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          indicator: 'bg-red-500'
        };
      case 'attention':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-800',
          icon: 'text-amber-600',
          indicator: 'bg-amber-500'
        };
      case 'normal':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          indicator: 'bg-green-500'
        };
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  };

  const handleItemClick = (item: TickerItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const toggleMinimized = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    // Save to localStorage
    localStorage.setItem('realTimeTicker_minimized', JSON.stringify(newMinimizedState));
  };

  if (tickerItems.length === 0) {
    return null;
  }

  const currentItem = tickerItems[currentIndex];
  const urgencyStyles = getUrgencyStyles(currentItem.urgency);

  return (
    <div 
      className={cn(
        "relative overflow-hidden border-b border-neutral-200 bg-white transition-all duration-300",
        isMinimized ? "h-3" : "h-12",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Urgency indicator bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", urgencyStyles.indicator)} />
      
      {/* Minimize/Maximize button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMinimized();
        }}
        className="absolute top-1 right-2 z-10 p-1 rounded hover:bg-neutral-100 transition-colors"
        title={isMinimized ? "Expand ticker" : "Minimize ticker"}
      >
        {isMinimized ? (
          <Plus className="w-3 h-3 text-neutral-500" />
        ) : (
          <Minus className="w-3 h-3 text-neutral-500" />
        )}
      </button>

      {isMinimized ? (
        /* Minimized view - just the indicator bar and dots */
        <div className="flex items-center justify-center h-full">
          <div className="flex gap-1">
            {tickerItems.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1 h-1 rounded-full transition-all duration-300",
                  index === currentIndex 
                    ? urgencyStyles.indicator 
                    : "bg-neutral-300"
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Full view */
        <>
          {/* Ticker content */}
          <div 
            ref={tickerRef}
            className="flex items-center h-full px-4 cursor-pointer transition-all duration-300 hover:bg-neutral-50"
            onClick={() => handleItemClick(currentItem)}
          >
            {/* Icon */}
            <div className={cn("flex-shrink-0 mr-3", urgencyStyles.icon)}>
              {currentItem.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("font-medium text-sm truncate", urgencyStyles.text)}>
                  {currentItem.title}
                </span>
                
                {currentItem.urgency === 'urgent' && (
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-neutral-600">
                <span className="truncate">{currentItem.description}</span>
                
                {currentItem.amount && (
                  <span className="font-medium text-mpondo-gold-600">
                    {formatAmount(currentItem.amount)}
                  </span>
                )}
                
                {currentItem.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(currentItem.dueDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Navigation arrow */}
            <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0 ml-2 mr-6" />
          </div>

          {/* Progress indicators */}
          <div className="absolute bottom-1 right-8 flex gap-1">
            {tickerItems.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex 
                    ? urgencyStyles.indicator 
                    : "bg-neutral-300"
                )}
              />
            ))}
          </div>

          {/* Hover overlay with all items */}
          {isHovered && (
            <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 shadow-lg z-50 max-h-64 overflow-y-auto">
              {tickerItems.map((item, index) => {
                const itemStyles = getUrgencyStyles(item.urgency);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center p-3 border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50",
                      index === currentIndex && "bg-neutral-50"
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className={cn("flex-shrink-0 mr-3", itemStyles.icon)}>
                      {item.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium text-sm", itemStyles.text)}>
                          {item.title}
                        </span>
                        {item.urgency === 'urgent' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 truncate">
                        {item.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      {item.amount && (
                        <span className="font-medium text-mpondo-gold-600">
                          {formatAmount(item.amount)}
                        </span>
                      )}
                      {item.dueDate && (
                        <span>{formatTimeRemaining(item.dueDate)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RealTimeTicker;