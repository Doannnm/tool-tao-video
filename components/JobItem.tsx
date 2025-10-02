
import React from 'react';
import { Job, JobStatus } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { RetryIcon } from './icons/RetryIcon';

interface JobItemProps {
    job: Job;
    onRetry: (id: string) => void;
}

const getStatusPill = (status: JobStatus) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
    switch (status) {
        case JobStatus.Queued:
            return <span className={`${baseClasses} bg-gray-500 text-gray-100`}>Queued</span>;
        case JobStatus.Processing:
            return (
                <span className={`${baseClasses} bg-blue-500 text-white flex items-center`}>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                </span>
            );
        case JobStatus.Completed:
            return <span className={`${baseClasses} bg-green-500 text-white`}>Completed</span>;
        case JobStatus.Failed:
            return <span className={`${baseClasses} bg-red-500 text-white`}>Failed</span>;
        default:
            return null;
    }
};


const JobItem: React.FC<JobItemProps> = ({ job, onRetry }) => {
    return (
        <div className="bg-gray-700/60 p-4 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 font-medium truncate" title={job.prompt}>{job.prompt}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                        <span>Model: {job.model}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>Aspect: {job.aspectRatio}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>Type: {job.inputType === 'ImageToVideo' ? 'Image' : 'Text'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {getStatusPill(job.status)}
                    {job.status === JobStatus.Failed && (
                         <button onClick={() => onRetry(job.id)} className="p-1.5 rounded-full hover:bg-gray-600 transition-colors" title="Retry Job">
                           <RetryIcon className="w-5 h-5 text-yellow-400" />
                        </button>
                    )}
                     {job.status === JobStatus.Completed && job.resultUrl && (
                        <a href={job.resultUrl} download={`video_${job.id}.mp4`} className="p-1.5 rounded-full hover:bg-gray-600 transition-colors" title="Download Video">
                           <DownloadIcon className="w-5 h-5 text-blue-400"/>
                        </a>
                    )}
                </div>
            </div>
            
            {job.status === JobStatus.Completed && job.resultUrl && (
                <div className="mt-4">
                    <video controls className="w-full max-w-sm mx-auto rounded-md" src={job.resultUrl} />
                </div>
            )}
            
            {job.status === JobStatus.Failed && job.error && (
                <div className="mt-3 p-3 bg-red-900/30 rounded-md">
                    <p className="text-sm text-red-300">
                        <span className="font-semibold">Error:</span> {job.error}
                    </p>
                </div>
            )}
        </div>
    );
};

export default JobItem;
