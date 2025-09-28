import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  Trophy, 
  Calendar,
  BookOpen,
  Video,
  Award,
  Clock,
  Target,
  TrendingUp,
  Star,
  PlayCircle,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { VirtualShadowingDashboard } from '../components/academy/VirtualShadowingDashboard';
import { PeerReviewNetwork } from '../components/academy/PeerReviewNetwork';
import { CPDTrackingCard } from '../components/academy/CPDTrackingCard';
import { PracticeSuccessionPlanning } from '../components/academy/PracticeSuccessionPlanning';

export const AcademyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shadowing' | 'peer-review' | 'cpd' | 'succession'>('overview');
  const [learningProgress, setLearningProgress] = useState({
    totalCourses: 24,
    completedCourses: 18,
    cpdHours: 15.5,
    requiredCpdHours: 20,
    shadowingSessions: 8,
    peerReviews: 12
  });

  const featuredCourses = [
    {
      id: '1',
      title: 'Advanced Commercial Litigation Techniques',
      instructor: 'SC Sarah Matthews',
      duration: '3.5 hours',
      level: 'Advanced',
      rating: 4.8,
      students: 156,
      cpdCredits: 3.5,
      category: 'Commercial Law',
      thumbnail: '/api/placeholder/300/200'
    },
    {
      id: '2',
      title: 'Constitutional Law Masterclass',
      instructor: 'Prof. Michael Thompson',
      duration: '5 hours',
      level: 'Expert',
      rating: 4.9,
      students: 203,
      cpdCredits: 5,
      category: 'Constitutional Law',
      thumbnail: '/api/placeholder/300/200'
    },
    {
      id: '3',
      title: 'Modern Employment Law Trends',
      instructor: 'Adv. Nomsa Mthembu',
      duration: '2.5 hours',
      level: 'Intermediate',
      rating: 4.7,
      students: 89,
      cpdCredits: 2.5,
      category: 'Employment Law',
      thumbnail: '/api/placeholder/300/200'
    }
  ];

  const upcomingEvents = [
    {
      id: '1',
      type: 'Virtual Shadowing',
      title: 'High Court Motion Proceedings',
      date: '2024-02-15',
      time: '09:00',
      mentor: 'SC David Wilson',
      participants: 12
    },
    {
      id: '2',
      type: 'Peer Review',
      title: 'Contract Drafting Workshop',
      date: '2024-02-16',
      time: '14:00',
      mentor: 'Adv. Jane Smith',
      participants: 8
    },
    {
      id: '3',
      type: 'CPD Seminar',
      title: 'Ethics in Digital Age Practice',
      date: '2024-02-18',
      time: '10:30',
      mentor: 'Prof. Robert Chen',
      participants: 45
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'text-success-600 bg-success-100';
      case 'Intermediate':
        return 'text-warning-600 bg-warning-100';
      case 'Advanced':
        return 'text-mpondo-gold-600 bg-mpondo-gold-100';
      case 'Expert':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'Virtual Shadowing':
        return <Video className="w-4 h-4" />;
      case 'Peer Review':
        return <Users className="w-4 h-4" />;
      case 'CPD Seminar':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">The Academy</h1>
              <p className="text-neutral-600 mt-1">
                Professional development, virtual shadowing, and peer learning for advocates
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                My Schedule
              </Button>
              <Button className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700">
                <GraduationCap className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-6 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shadowing')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'shadowing'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Virtual Shadowing
              </div>
            </button>
            <button
              onClick={() => setActiveTab('peer-review')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'peer-review'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Peer Review
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cpd')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'cpd'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                CPD Tracking
              </div>
            </button>
            <button
              onClick={() => setActiveTab('succession')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'succession'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Succession Planning
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Courses Completed</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {learningProgress.completedCourses}/{learningProgress.totalCourses}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-mpondo-gold-500" />
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-mpondo-gold-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(learningProgress.completedCourses / learningProgress.totalCourses) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">CPD Hours</p>
                      <p className="text-2xl font-bold text-success-600">
                        {learningProgress.cpdHours}/{learningProgress.requiredCpdHours}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-success-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    {learningProgress.requiredCpdHours - learningProgress.cpdHours} hours remaining
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Shadowing Sessions</p>
                      <p className="text-2xl font-bold text-judicial-blue-600">{learningProgress.shadowingSessions}</p>
                    </div>
                    <Video className="w-8 h-8 text-judicial-blue-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Peer Reviews</p>
                      <p className="text-2xl font-bold text-neutral-900">{learningProgress.peerReviews}</p>
                    </div>
                    <Users className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Given & received</p>
                </CardContent>
              </Card>
            </div>

            {/* Featured Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Featured Courses</h3>
                    <p className="text-neutral-600">Recommended courses based on your practice area</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View All Courses
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredCourses.map((course) => (
                    <div key={course.id} className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-neutral-100 flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-neutral-400" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-neutral-600">{course.rating}</span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-neutral-900 mb-1">{course.title}</h4>
                        <p className="text-sm text-neutral-600 mb-2">{course.instructor}</p>
                        <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                          <span>{course.duration}</span>
                          <span>{course.students} students</span>
                          <span>{course.cpdCredits} CPD credits</span>
                        </div>
                        <Button size="sm" className="w-full bg-mpondo-gold-600 hover:bg-mpondo-gold-700">
                          Start Course
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Upcoming Events</h3>
                    <p className="text-neutral-600">Your scheduled learning activities</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Calendar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-mpondo-gold-100 rounded-lg text-mpondo-gold-700">
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900">{event.title}</h4>
                        <p className="text-sm text-neutral-600">{event.mentor}</p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500 mt-1">
                          <span>{event.date}</span>
                          <span>{event.time}</span>
                          <span>{event.participants} participants</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'shadowing' && (
          <VirtualShadowingDashboard />
        )}

        {activeTab === 'peer-review' && (
          <PeerReviewNetwork />
        )}

        {activeTab === 'cpd' && (
          <CPDTrackingCard />
        )}

        {activeTab === 'succession' && (
          <PracticeSuccessionPlanning />
        )}
      </div>
    </div>
  );
};

export default AcademyPage;
