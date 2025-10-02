import React, { useState } from 'react';
import { Button } from '../../design-system/components';
import { NewMatterModal, MatterPrepopulationData } from './NewMatterModal';
import { BarAssociation, ClientType, FeeType, RiskLevel, Matter } from '../../types';

/**
 * Test component to demonstrate NewMatterModal prepopulation functionality
 * This component shows how to use the initialData prop to prepopulate form fields
 */
export const NewMatterModalTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testScenario, setTestScenario] = useState<'empty' | 'basic' | 'full'>('empty');

  // Test data scenarios
  const testData: Record<string, MatterPrepopulationData | undefined> = {
    empty: undefined,
    basic: {
      title: 'Smith v Jones Commercial Dispute',
      client_name: 'John Smith',
      matter_type: 'Commercial Litigation',
      description: 'Contract dispute regarding software licensing agreement'
    },

      tags: ['urgent', 'ip', 'research']
    },
    full: {
      title: 'Complex Corporate Merger',
      description: 'Due diligence and legal review for corporate acquisition',
      matter_type: 'Commercial Litigation',
      client_name: 'MegaCorp Industries',
      client_email: 'legal@megacorp.com',
      client_phone: '+27 11 555 0123',
      client_type: ClientType.COMPANY,
      instructing_attorney: 'Michael Davis',
      instructing_attorney_email: 'mdavis@lawfirm.com',
      instructing_firm: 'Davis & Associates',
      bar: BarAssociation.CAPE_TOWN,
      fee_type: FeeType.RETAINER,
      estimated_fee: '150000',
      risk_level: RiskLevel.HIGH,
      tags: 'corporate,merger,due-diligence,high-value'
    }
  };

  const handleOpenModal = (scenario: typeof testScenario) => {
    setTestScenario(scenario);
    setIsModalOpen(true);
  };

  const handleMatterCreated = (matter: Matter) => {
    console.log('Matter created:', matter);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">NewMatterModal Prepopulation Test</h2>
      <p className="text-gray-600">
        Test different prepopulation scenarios for the NewMatterModal component.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={() => handleOpenModal('empty')}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center"
        >
          <span className="font-medium">Empty Form</span>
          <span className="text-sm text-gray-500">No prepopulation</span>
        </Button>

        <Button
          onClick={() => handleOpenModal('basic')}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center"
        >
          <span className="font-medium">Basic Data</span>
          <span className="text-sm text-gray-500">Title, client, type</span>
        </Button>



        <Button
          onClick={() => handleOpenModal('full')}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center"
        >
          <span className="font-medium">Full Data</span>
          <span className="text-sm text-gray-500">All fields populated</span>
        </Button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Current Test Scenario: {testScenario}</h3>
        <pre className="text-sm text-gray-600 overflow-x-auto">
          {JSON.stringify(testData[testScenario], null, 2)}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Expected Behavior:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Prepopulated fields should show blue background and "Pre-filled" badge</li>
          <li>• "Pre-filled data" indicator should appear in modal header</li>
          <li>• "Clear Pre-filled" button should be visible when data is prepopulated</li>
          <li>• Field aliases should map correctly (client → client_name, attorney → instructing_attorney)</li>
          <li>• Form validation should work normally for prepopulated fields</li>
        </ul>
      </div>

      <NewMatterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMatterCreated={handleMatterCreated}
        initialData={testData[testScenario]}
      />
    </div>
  );
};