import { useState } from 'react';
import LocationInput from './LocationInput';
import { Button, Alert } from '../common';

/* TODO: Remove test scenarios dropdown when real APIs integrated */
const TEST_SCENARIOS = [
  {
    id: 'custom',
    label: 'Custom (enter your own)',
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_hours: 0,
    description: null,
  },
  {
    id: 'short',
    label: 'Short Trip: Chicago → Milwaukee → Madison',
    current_location: 'Chicago, IL',
    pickup_location: 'Milwaukee, WI',
    dropoff_location: 'Madison, WI',
    current_cycle_hours: 10,
    description: '~250 miles, ~4 hrs driving',
  },
  {
    id: 'medium',
    label: 'Medium Trip: Green Bay → Chicago → Dallas',
    current_location: 'Green Bay, WI',
    pickup_location: 'Chicago, IL',
    dropoff_location: 'Dallas, TX',
    current_cycle_hours: 25,
    description: '~1,300 miles, ~20 hrs driving',
  },
  {
    id: 'long',
    label: 'Long Trip: Seattle → Denver → Miami',
    current_location: 'Seattle, WA',
    pickup_location: 'Denver, CO',
    dropoff_location: 'Miami, FL',
    current_cycle_hours: 45,
    description: '~3,500 miles, ~50 hrs driving',
  },
  {
    id: 'cross_country',
    label: 'Cross Country: Los Angeles → Phoenix → New York',
    current_location: 'Los Angeles, CA',
    pickup_location: 'Phoenix, AZ',
    dropoff_location: 'New York, NY',
    current_cycle_hours: 60,
    description: '~2,800 miles, ~40 hrs driving',
  },
];

const TripForm = ({ onSubmit, isLoading, error }) => {
  const [selectedScenario, setSelectedScenario] = useState('custom');
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_hours: 0,
  });

  const [locations, setLocations] = useState({
    current: null,
    pickup: null,
    dropoff: null,
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleLocationSelect = (field, data) => {
    setFormData((prev) => ({
      ...prev,
      [field]: data.address,
    }));
    setLocations((prev) => ({
      ...prev,
      [field.replace('_location', '')]: {
        lat: data.lat,
        lng: data.lng,
        address: data.address,
      },
    }));
    // Clear validation error for this field
    setValidationErrors((prev) => ({
      ...prev,
      [field]: null,
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear the coordinates when user types manually
    setLocations((prev) => ({
      ...prev,
      [field.replace('_location', '')]: null,
    }));
  };

  const handleCycleHoursChange = (e) => {
    const value = e.target.value;
    // Allow empty value or valid numbers between 0-70
    if (value === '' || (Number(value) >= 0 && Number(value) <= 70)) {
      setFormData((prev) => ({
        ...prev,
        current_cycle_hours: value === '' ? '' : Number(value),
      }));
      setValidationErrors((prev) => ({
        ...prev,
        current_cycle_hours: null,
      }));
    }
  };

  /* TODO: Remove test scenario handler when real APIs integrated */
  const handleScenarioChange = (e) => {
    const scenarioId = e.target.value;
    setSelectedScenario(scenarioId);

    const scenario = TEST_SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario && scenarioId !== 'custom') {
      setFormData({
        current_location: scenario.current_location,
        pickup_location: scenario.pickup_location,
        dropoff_location: scenario.dropoff_location,
        current_cycle_hours: scenario.current_cycle_hours,
      });
      // Clear locations so they get re-geocoded
      setLocations({
        current: null,
        pickup: null,
        dropoff: null,
      });
      // Clear any validation errors
      setValidationErrors({});
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.current_location.trim()) {
      errors.current_location = 'Current location is required';
    }
    if (!formData.pickup_location.trim()) {
      errors.pickup_location = 'Pickup location is required';
    }
    if (!formData.dropoff_location.trim()) {
      errors.dropoff_location = 'Dropoff location is required';
    }
    if (formData.current_cycle_hours === '' || formData.current_cycle_hours < 0 || formData.current_cycle_hours > 70) {
      errors.current_cycle_hours = 'Cycle hours must be between 0 and 70';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      current_location: formData.current_location,
      pickup_location: formData.pickup_location,
      dropoff_location: formData.dropoff_location,
      current_cycle_hours: formData.current_cycle_hours,
    });
  };

  const currentScenario = TEST_SCENARIOS.find((s) => s.id === selectedScenario);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert type="error" message={error} />
      )}

      {/* TODO: Remove test scenarios dropdown when real APIs integrated */}
      <div className="space-y-1">
        <label htmlFor="test_scenario" className="block text-sm font-medium text-gray-700">
          Test Scenarios
          <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Dev Only
          </span>
        </label>
        <select
          id="test_scenario"
          name="test_scenario"
          value={selectedScenario}
          onChange={handleScenarioChange}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors outline-none bg-white appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.25rem 1.25rem',
            paddingRight: '2.5rem',
          }}
        >
          {TEST_SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
        {currentScenario?.description && (
          <p className="text-xs text-gray-500 mt-1">
            {currentScenario.description}
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4" />

      <LocationInput
        label="Current Location"
        name="current_location"
        value={formData.current_location}
        onChange={(value) => handleLocationChange('current_location', value)}
        onSelect={(data) => handleLocationSelect('current_location', data)}
        placeholder="Where are you now?"
        required
        error={validationErrors.current_location}
      />

      <LocationInput
        label="Pickup Location"
        name="pickup_location"
        value={formData.pickup_location}
        onChange={(value) => handleLocationChange('pickup_location', value)}
        onSelect={(data) => handleLocationSelect('pickup_location', data)}
        placeholder="Where to pick up load?"
        required
        error={validationErrors.pickup_location}
      />

      <LocationInput
        label="Dropoff Location"
        name="dropoff_location"
        value={formData.dropoff_location}
        onChange={(value) => handleLocationChange('dropoff_location', value)}
        onSelect={(data) => handleLocationSelect('dropoff_location', data)}
        placeholder="Where to deliver?"
        required
        error={validationErrors.dropoff_location}
      />

      <div className="space-y-1">
        <label htmlFor="current_cycle_hours" className="block text-sm font-medium text-gray-700">
          Current Cycle Hours Used
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="number"
          id="current_cycle_hours"
          name="current_cycle_hours"
          value={formData.current_cycle_hours}
          onChange={handleCycleHoursChange}
          min="0"
          max="70"
          step="0.5"
          required
          className={`
            w-full px-4 py-3 text-base border rounded-lg 
            transition-colors outline-none
            ${validationErrors.current_cycle_hours
              ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            }
          `}
        />
        <p className="text-xs text-gray-500">
          Hours driven in current 8-day cycle (0-70)
        </p>
        {validationErrors.current_cycle_hours && (
          <p className="text-sm text-red-600">{validationErrors.current_cycle_hours}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isLoading}
        className="w-full mt-6"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Calculating Route...
          </span>
        ) : (
          'Calculate Trip'
        )}
      </Button>
    </form>
  );
};

export default TripForm;
