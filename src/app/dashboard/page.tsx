'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import ReferencesUpload from '@/components/dashboard/ReferencesUpload';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user?.firstName || 'User'}</h1>
          <p className="text-gray-400">Create your manga masterpieces</p>
        </div>

        {/* Credits Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 text-white shadow-xl">
            <div className="text-sm font-medium text-purple-200 mb-2">Available Credits</div>
            <div className="text-4xl font-bold">8</div>
            <div className="text-sm text-purple-300 mt-2">3 panels + 1 clip included</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg p-6 text-white shadow-xl">
            <div className="text-sm font-medium text-pink-200 mb-2">Projects</div>
            <div className="text-4xl font-bold">0</div>
            <div className="text-sm text-pink-300 mt-2">Start your first memoir</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white shadow-xl">
            <div className="text-sm font-medium text-blue-200 mb-2">References</div>
            <div className="text-4xl font-bold">0</div>
            <div className="text-sm text-blue-300 mt-2">Uploaded assets</div>
          </div>
        </div>

        {/* References Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <ReferencesUpload userId={user?.id || ''} />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg">
            + Create New Project
          </button>
          <button className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg border border-gray-600">
            📧 Request More Credits
          </button>
        </div>
      </div>
    </div>
  );
}
