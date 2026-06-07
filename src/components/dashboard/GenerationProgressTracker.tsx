'use client';

import { useEffect, useState } from 'react';

interface GenerationTask {
  taskId: string;
  sceneId: string;
  type: 'panel' | 'clip';
  status: 'pending' | 'generating' | 'complete' | 'failed';
  progress: number;
  result?: string;
  error?: string;
}

interface GenerationProgressTrackerProps {
  batchId: string;
  tasks: GenerationTask[];
  onComplete?: () => void;
}

export default function GenerationProgressTracker({
  batchId,
  tasks: initialTasks,
  onComplete,
}: GenerationProgressTrackerProps) {
  const [tasks, setTasks] = useState<GenerationTask[]>(initialTasks);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Simulate progress updates
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.status === 'complete' || task.status === 'failed') {
            return task;
          }

          if (task.status === 'pending') {
            return { ...task, status: 'generating', progress: 25 };
          }

          if (task.progress < 100) {
            const newProgress = Math.min(
              task.progress + Math.random() * 30,
              100
            );
            return {
              ...task,
              progress: newProgress,
              status: newProgress === 100 ? 'complete' : 'generating',
            };
          }

          return task;
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning]);

  const allComplete = tasks.every(
    (t) => t.status === 'complete' || t.status === 'failed'
  );
  const totalProgress =
    tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length;

  useEffect(() => {
    if (allComplete) {
      setIsRunning(false);
      onComplete?.();
    }
  }, [allComplete, onComplete]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">
            Batch Generation Progress
          </h3>
          <span className="text-sm text-gray-400">
            {Math.round(totalProgress)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.taskId}
            className="bg-gray-900 rounded p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-white">
                  Scene {task.sceneId} - {task.type === 'panel' ? '🖼️' : '🎬'}{' '}
                  {task.type === 'panel' ? 'Manga Panel' : 'Anime Clip'}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  task.status === 'complete'
                    ? 'bg-green-500/20 text-green-400'
                    : task.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : task.status === 'generating'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-700 text-gray-300'
                }`}
              >
                {task.status === 'complete' && '✓ Complete'}
                {task.status === 'generating' && '⟳ Generating'}
                {task.status === 'failed' && '✕ Failed'}
                {task.status === 'pending' && '⋯ Pending'}
              </span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  task.status === 'complete'
                    ? 'bg-green-500'
                    : task.status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-purple-500'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>

            {task.error && (
              <p className="text-xs text-red-400 mt-2">{task.error}</p>
            )}

            {task.result && (
              <p className="text-xs text-green-400 mt-2">
                Result: {task.result.substring(0, 50)}...
              </p>
            )}
          </div>
        ))}
      </div>

      {allComplete && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm">
          ✓ All generation tasks completed! Review results above.
        </div>
      )}
    </div>
  );
}
