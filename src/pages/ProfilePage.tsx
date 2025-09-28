import React, { useState } from 'react';
import { Scale, BarChart3, TrendingUp, User as UserIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'specializations' | 'development' | 'achievements'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  // Mock user profile data
  const [userProfile, setUserProfile] = useState({
    name: 'Advocate Sarah Johnson',
    email: 'sarah.johnson@lexohub.co.za',
    phone: '+27 11 123 4567',
    practiceNumber: 'GP12345',
    admissionDate: '2015-03-15',
    chambers: 'Johannesburg Bar',
    specializations: ['Commercial Law', 'Contract Disputes', 'Corporate Litigation'],
    experience: '8 years',
    successRate: '87%',
    totalMatters: 156,
    totalRecovered: 'R12.5M',
    avatar: '/api/placeholder/120/120'
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Profile saved:', userProfile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values if needed
  };

  const handleInputChange = (field: string, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const specializations = [
    {
      id: 1,
      area: 'Commercial Law',
      level: 'Expert',
      yearsExperience: 8,
      certifications: ['Commercial Law Certificate', 'Advanced Contract Law'],
      recentCases: 23,
      successRate: '92%'
    },
    {
      id: 2,
      area: 'Contract Disputes',
      level: 'Advanced',
      yearsExperience: 6,
      certifications: ['Contract Dispute Resolution'],
      recentCases: 18,
      successRate: '85%'
    },
    {
      id: 3,
      area: 'Corporate Litigation',
      level: 'Intermediate',
      yearsExperience: 4,
      certifications: ['Corporate Law Basics'],
      recentCases: 12,
      successRate: '78%'
    }
  ];

  const developmentGoals = [
    {
      id: 1,
      title: 'Complete Advanced Arbitration Course',
      category: 'Education',
      progress: 65,
      deadline: '2024-06-30',
      status: 'in-progress'
    },
    {
      id: 2,
      title: 'Obtain Mediation Certification',
      category: 'Certification',
      progress: 30,
      deadline: '2024-09-15',
      status: 'in-progress'
    },
    {
      id: 3,
      title: 'Attend International Commercial Law Conference',
      category: 'Networking',
      progress: 0,
      deadline: '2024-11-20',
      status: 'planned'
    }
  ];

  const achievements = [
    {
      id: 1,
      title: 'Top Performer 2023',
      description: 'Highest success rate in commercial disputes',
      date: '2023-12-15',
      type: 'award',
      icon: '🏆'
    },
    {
      id: 2,
      title: 'R5M Settlement Achievement',
      description: 'Successfully negotiated largest settlement in practice history',
      date: '2023-08-22',
      type: 'milestone',
      icon: '💰'
    },
    {
      id: 3,
      title: 'Client Satisfaction Excellence',
      description: '98% client satisfaction rating for Q3 2023',
      date: '2023-09-30',
      type: 'recognition',
      icon: '⭐'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'specializations', label: 'Specializations', icon: Scale },
    { id: 'development', label: 'Development', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: BarChart3 }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
          <p className="text-neutral-600 mt-1">Manage your professional profile and development</p>
        </div>
        <div className="flex space-x-2">
          {isEditing && (
            <Button onClick={handleSave} variant="primary">
              Save Changes
            </Button>
          )}
          <Button
            onClick={isEditing ? handleCancel : () => setIsEditing(true)}
            variant={isEditing ? "secondary" : "primary"}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-judicial-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-judicial-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-2xl font-bold text-neutral-900 bg-transparent border-b border-neutral-300 focus:border-judicial-blue-500 outline-none"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-neutral-900">{userProfile.name}</h2>
                )}
                <span className="badge badge-success">Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600">
                <div>
                  <p><strong>Email:</strong> {isEditing ? (
                    <input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="ml-2 bg-transparent border-b border-neutral-300 focus:border-judicial-blue-500 outline-none"
                    />
                  ) : userProfile.email}</p>
                  <p><strong>Phone:</strong> {isEditing ? (
                    <input
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="ml-2 bg-transparent border-b border-neutral-300 focus:border-judicial-blue-500 outline-none"
                    />
                  ) : userProfile.phone}</p>
                  <p><strong>Practice Number:</strong> {isEditing ? (
                    <input
                      type="text"
                      value={userProfile.practiceNumber}
                      onChange={(e) => handleInputChange('practiceNumber', e.target.value)}
                      className="ml-2 bg-transparent border-b border-neutral-300 focus:border-judicial-blue-500 outline-none"
                    />
                  ) : userProfile.practiceNumber}</p>
                </div>
                <div>
                  <p><strong>Chambers:</strong> {isEditing ? (
                    <input
                      type="text"
                      value={userProfile.chambers}
                      onChange={(e) => handleInputChange('chambers', e.target.value)}
                      className="ml-2 bg-transparent border-b border-neutral-300 focus:border-judicial-blue-500 outline-none"
                    />
                  ) : userProfile.chambers}</p>
                  <p><strong>Admitted:</strong> {new Date(userProfile.admissionDate).toLocaleDateString()}</p>
                  <p><strong>Experience:</strong> {isEditing ? (
                    <input
                      type="text"
                      value={userProfile.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="ml-2 bg-transparent border-b border-neutral-300 focus:border-judicial-blue-500 outline-none"
                    />
                  ) : userProfile.experience}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-judicial-blue-600">{userProfile.successRate}</div>
                  <div className="text-xs text-neutral-600">Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-mpondo-gold-600">{userProfile.totalMatters}</div>
                  <div className="text-xs text-neutral-600">Total Matters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-status-success-600">{userProfile.totalRecovered}</div>
                  <div className="text-xs text-neutral-600">Total Recovered</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-judicial-blue-500 text-judicial-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900">Professional Summary</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile.specializations.map((spec, index) => (
                    <span key={index} className="badge badge-primary">{spec}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Practice Areas</h4>
                <p className="text-neutral-600 text-sm">
                  Experienced advocate specializing in commercial law, contract disputes, and corporate litigation. 
                  Known for strategic thinking and successful case outcomes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-2 h-2 bg-status-success-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">Completed Advanced Contract Law Course</p>
                  <p className="text-xs text-neutral-600">2 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-2 h-2 bg-judicial-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">Won major commercial dispute case</p>
                  <p className="text-xs text-neutral-600">1 week ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-2 h-2 bg-mpondo-gold-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">Updated specialization profile</p>
                  <p className="text-xs text-neutral-600">2 weeks ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'specializations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Practice Specializations</h3>
            <Button variant="secondary">Add Specialization</Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {specializations.map((spec) => (
              <Card key={spec.id} hoverable>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-neutral-900">{spec.area}</h4>
                    <span className={`badge ${
                      spec.level === 'Expert' ? 'badge-success' :
                      spec.level === 'Advanced' ? 'badge-primary' : 'badge-secondary'
                    }`}>
                      {spec.level}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Experience:</span>
                      <span className="font-medium">{spec.yearsExperience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Recent Cases:</span>
                      <span className="font-medium">{spec.recentCases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Success Rate:</span>
                      <span className="font-medium text-status-success-600">{spec.successRate}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-xs font-medium text-neutral-700 mb-2">Certifications</h5>
                    <div className="flex flex-wrap gap-1">
                      {spec.certifications.map((cert, index) => (
                        <span key={index} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'development' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Professional Development Goals</h3>
            <Button variant="secondary">Add Goal</Button>
          </div>
          
          <div className="space-y-4">
            {developmentGoals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900 mb-1">{goal.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600">
                        <span className="badge badge-outline">{goal.category}</span>
                        <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`badge ${
                      goal.status === 'in-progress' ? 'badge-primary' :
                      goal.status === 'completed' ? 'badge-success' : 'badge-secondary'
                    }`}>
                      {goal.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-judicial-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-neutral-900">Professional Achievements</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} hoverable>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900 mb-1">{achievement.title}</h4>
                      <p className="text-neutral-600 text-sm mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`badge ${
                          achievement.type === 'award' ? 'badge-success' :
                          achievement.type === 'milestone' ? 'badge-primary' : 'badge-secondary'
                        }`}>
                          {achievement.type}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(achievement.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;