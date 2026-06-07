'use client';

import { useState, useEffect } from 'react';
import { saveTemplate, listUserTemplates } from '@/app/actions/templateActions';

interface Template {
  id: string;
  name: string;
  description: string;
  sceneCount: number;
  createdAt: string;
}

interface TemplateManagerProps {
  projectId: string;
  scenes: any[];
  onLoadTemplate?: (scenes: any[]) => void;
}

export default function TemplateManager({
  projectId,
  scenes,
  onLoadTemplate,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const result = await listUserTemplates();
      setTemplates(result);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;

    try {
      setLoading(true);
      await saveTemplate(projectId, templateName, templateDesc, scenes);
      setTemplateName('');
      setTemplateDesc('');
      setShowSaveForm(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">📋 Templates</h3>
        <button
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
        >
          {showSaveForm ? '✕ Cancel' : '+ Save Current'}
        </button>
      </div>

      {showSaveForm && (
        <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-700">
          <input
            type="text"
            placeholder="Template name (e.g., 'Childhood Memories')"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 mb-2 text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={templateDesc}
            onChange={(e) => setTemplateDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 mb-2 text-sm"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={loading || !templateName.trim()}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded text-sm"
          >
            {loading ? '⟳ Saving...' : '💾 Save Template'}
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No templates yet. Create one to reuse scene structures!
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-900 rounded p-3 border border-gray-700 hover:border-purple-500 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{template.name}</p>
                  {template.description && (
                    <p className="text-gray-400 text-xs mt-1">
                      {template.description}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {template.sceneCount} scenes
                  </p>
                </div>
              </div>
              <button
                onClick={() => onLoadTemplate?.(template as any)}
                className="mt-2 w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
              >
                📖 Load Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
