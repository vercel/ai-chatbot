// app/(chat)/generate/page.tsx
'use client';
import { useState } from 'react';

export default function GenerateJD() {
  const [formData, setFormData] = useState({
    title: '',
    industry: '',
    experience: '',
    details: ''
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate_jd',
          content: formData
        })
      });
      
      const data = await response.json();
      setResult(data.generatedJD);
    } catch (error) {
      console.error('Error:', error);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Generate Job Description</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Job Title</label>
          <input 
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="e.g., Senior Software Engineer"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Industry</label>
          <select 
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Industry</option>
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Experience Level</label>
          <select 
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Experience Level</option>
            <option value="Entry Level">Entry Level (0-2 years)</option>
            <option value="Mid Level">Mid Level (3-5 years)</option>
            <option value="Senior Level">Senior Level (5+ years)</option>
            <option value="Lead">Lead (7+ years)</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Job Details</label>
          <textarea 
            value={formData.details}
            onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
            className="w-full h-32 p-2 border rounded"
            placeholder="Describe the role, responsibilities, and key requirements..."
            required
          />
        </div>

        <button 
          type="submit"
          disabled={loading || !formData.title || !formData.industry || !formData.details}
          className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
        >
          {loading ? 'Generating...' : 'Generate JD'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Generated Job Description:</h2>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: result }} />
          </div>
        </div>
      )}
    </div>
  );
}
