
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Job } from './types';
import { JobStatus } from './types';
import { MAX_CONCURRENT_JOBS, RATE_LIMIT_JOBS, RATE_LIMIT_WINDOW_MS } from './constants';
import { generateVideoFromJob } from './services/geminiService';
import JobForm from './components/JobForm';
import JobQueue from './components/JobQueue';
import { DownloadIcon } from './components/icons/DownloadIcon';

// Note: To use the "Download All" feature, you need to install jszip.
// Run: npm install jszip
// Or add the following script tag to your index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
declare var JSZip: any;


const App: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const jobStartTimestamps = useRef<number[]>([]);

    const updateJob = useCallback((id: string, updates: Partial<Job>) => {
        setJobs(prevJobs =>
            prevJobs.map(job => (job.id === id ? { ...job, ...updates } : job))
        );
    }, []);

    const processJob = useCallback(async (job: Job) => {
        updateJob(job.id, { status: JobStatus.Processing });
        try {
            const videoBlob = await generateVideoFromJob(job);
            const videoUrl = URL.createObjectURL(videoBlob);
            updateJob(job.id, { status: JobStatus.Completed, resultUrl: videoUrl, error: undefined });
        } catch (error) {
            console.error(`Job ${job.id} failed:`, error);
            updateJob(job.id, { status: JobStatus.Failed, error: error instanceof Error ? error.message : String(error) });
        }
    }, [updateJob]);

    useEffect(() => {
        if (!isProcessing) return;

        const processingJobs = jobs.filter(j => j.status === JobStatus.Processing).length;
        const queuedJobs = jobs.filter(j => j.status === JobStatus.Queued);

        if (queuedJobs.length === 0 && processingJobs === 0) {
            setIsProcessing(false);
            return;
        }
        
        const now = Date.now();
        jobStartTimestamps.current = jobStartTimestamps.current.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

        const concurrentSlots = MAX_CONCURRENT_JOBS - processingJobs;
        const rateLimitSlots = RATE_LIMIT_JOBS - jobStartTimestamps.current.length;

        const slotsAvailable = Math.min(concurrentSlots, rateLimitSlots);

        if (slotsAvailable > 0 && queuedJobs.length > 0) {
            const jobsToStart = queuedJobs.slice(0, slotsAvailable);
            jobsToStart.forEach(job => {
                jobStartTimestamps.current.push(Date.now());
                processJob(job);
            });
        }
        
    }, [jobs, isProcessing, processJob]);

    const handleAddJob = (job: Omit<Job, 'id' | 'status'>) => {
        const newJob: Job = {
            ...job,
            id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: JobStatus.Queued,
        };
        setJobs(prevJobs => [...prevJobs, newJob]);
    };

    const handleStartProcessing = () => {
        if (jobs.some(j => j.status === JobStatus.Queued)) {
            setIsProcessing(true);
        }
    };

    const handleRetryJob = (id: string) => {
        updateJob(id, { status: JobStatus.Queued, error: undefined });
        if (!isProcessing && jobs.length > 0) {
            setIsProcessing(true);
        }
    };
    
    const handleDownloadAll = async () => {
        if (typeof JSZip === 'undefined') {
            alert('JSZip library is not loaded. Cannot download all.');
            console.error('JSZip is not available. Please add it to your project.');
            return;
        }

        const zip = new JSZip();
        const completedJobs = jobs.filter(job => job.status === JobStatus.Completed && job.resultUrl);

        if (completedJobs.length === 0) {
            alert("No completed videos to download.");
            return;
        }

        await Promise.all(completedJobs.map(async (job, index) => {
            if (job.resultUrl) {
                try {
                    const response = await fetch(job.resultUrl);
                    const blob = await response.blob();
                    const sanitizedPrompt = job.prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
                    zip.file(`video_${index + 1}_${sanitizedPrompt}.mp4`, blob);
                } catch (error) {
                    console.error(`Failed to fetch blob for job ${job.id}:`, error);
                }
            }
        }));

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'gemini_videos.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const queuedCount = jobs.filter(j => j.status === JobStatus.Queued).length;
    const processingCount = jobs.filter(j => j.status === JobStatus.Processing).length;
    const completedCount = jobs.filter(j => j.status === JobStatus.Completed).length;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
                        Gemini Bulk Video Generator
                    </h1>
                    <p className="text-center text-gray-400 mt-2">
                        Create, queue, and process multiple video generation jobs with ease.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                        <JobForm onAddJob={handleAddJob} isDisabled={isProcessing} />
                    </div>
                    <div className="lg:col-span-8">
                        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                                <h2 className="text-2xl font-semibold">Job Queue ({jobs.length})</h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleDownloadAll}
                                        disabled={completedCount === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                        Download All ({completedCount})
                                    </button>
                                    <button
                                        onClick={handleStartProcessing}
                                        disabled={isProcessing || queuedCount === 0}
                                        className="px-6 py-2 bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-semibold"
                                    >
                                        {isProcessing ? `Processing (${processingCount})...` : `Start Processing (${queuedCount})`}
                                    </button>
                                </div>
                            </div>
                            <JobQueue jobs={jobs} onRetry={handleRetryJob} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
