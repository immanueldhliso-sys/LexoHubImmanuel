import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  service_categories?: {
    id: string;
    name: string;
  };
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface ServicesSectionProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  selectedServices,
  onServicesChange
}) => {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      
      // Fetch service categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (categoriesError) {
        console.error('Error fetching service categories:', categoriesError);
        toast.error('Failed to load service categories');
        return;
      }
      
      // Fetch services with their categories
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          name,
          description,
          category_id,
          service_categories (
            id,
            name
          )
        `)
        .order('name');
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        toast.error('Failed to load services');
        return;
      }
      
      setServiceCategories(categoriesData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      onServicesChange([...selectedServices, serviceId]);
    } else {
      onServicesChange(selectedServices.filter(id => id !== serviceId));
    }
  };

  const getSelectedServicesCount = () => {
    return selectedServices.length;
  };

  const getSelectedServicesByCategory = (categoryId: string) => {
    const categoryServices = services.filter(service => service.category_id === categoryId);
    return categoryServices.filter(service => selectedServices.includes(service.id)).length;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Associated Services</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Select the services that will be provided for this matter
        </p>
        {getSelectedServicesCount() > 0 && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mpondo-gold text-white">
              {getSelectedServicesCount()} service{getSelectedServicesCount() !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}
      </div>

      {loadingServices ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold"></div>
          <span className="ml-3 text-sm text-neutral-600">Loading services...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {serviceCategories.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-500">
                No services available. Please contact your administrator.
              </p>
            </div>
          ) : (
            serviceCategories.map(category => {
              const categoryServices = services.filter(service => service.category_id === category.id);
              if (categoryServices.length === 0) return null;
              
              const selectedCount = getSelectedServicesByCategory(category.id);
              
              return (
                <div key={category.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-neutral-800">
                        {category.name}
                      </h4>
                      {selectedCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedCount} selected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {categoryServices.map(service => (
                      <label key={service.id} className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                          className="mt-1 rounded border-neutral-300 text-mpondo-gold focus:ring-mpondo-gold focus:ring-offset-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 group-hover:text-mpondo-gold transition-colors">
                            {service.name}
                          </div>
                          {service.description && (
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {getSelectedServicesCount() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Services Selected
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {getSelectedServicesCount()} service{getSelectedServicesCount() !== 1 ? 's' : ''} will be associated with this matter. You can modify this selection later if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};