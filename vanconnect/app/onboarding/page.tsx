'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPreferences } from '@/types';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserPreferences>({
    activity: '',
    vibe: '',
    energy: '',
    indoorOutdoor: 'both',
    availability: [],
    sustainability: [],
  });

  const activities = ['Coffee', 'Hiking', 'Study', 'Food', 'Sports', 'Arts', 'Gaming'];
  const vibes = ['Chill', 'Adventurous', 'Focused', 'Social', 'Creative'];
  const energyLevels = ['Low-key', 'Moderate', 'High-energy'];
  const sustainabilityOptions = ['Public Transit', 'Bike-friendly', 'Zero-waste', 'Local businesses'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/swipe');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (field: 'availability' | 'sustainability', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tell us about yourself</h1>
          <p className="text-gray-600 mb-8">Help us find your perfect match!</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Activity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What's your ideal activity?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activities.map(activity => (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, activity }))}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.activity === activity
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What's your vibe?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vibes.map(vibe => (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, vibe }))}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.vibe === vibe
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Energy level?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {energyLevels.map(energy => (
                  <button
                    key={energy}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, energy }))}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.energy === energy
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {energy}
                  </button>
                ))}
              </div>
            </div>

            {/* Indoor/Outdoor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Indoor or Outdoor?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['indoor', 'outdoor', 'both'] as const).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, indoorOutdoor: option }))}
                    className={`py-2 px-4 rounded-lg font-medium transition-all capitalize ${
                      formData.indoorOutdoor === option
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Sustainability */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Sustainability preferences (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {sustainabilityOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayItem('sustainability', option)}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.sustainability.includes(option)
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.activity || !formData.vibe || !formData.energy}
              className="w-full bg-purple-500 text-white font-bold py-4 px-6 rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Saving...' : 'Continue to Matching'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
