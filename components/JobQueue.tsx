
import React from 'react';
import { Job } from '../types';
import JobItem from './JobItem';

interface JobQueueProps {
    jobs: Job[];
    onRetry: (id: string) => void;
}

const JobQueue: React.FC<JobQueueProps> = ({ jobs, onRetry }) => {
    if (jobs.length === 0) {
        return (
            <div className="text-center py-10 px-6 bg-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300">The queue is empty.</h3>
                <p className="text-gray-400 mt-1">Add a new job using the form to get started.</p>
            </div>
        );
    }
    return (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {jobs.map(job => (
                <JobItem key={job.id} job={job} onRetry={onRetry} />
            ))}
        </div>
    );
};

export default JobQueue;
