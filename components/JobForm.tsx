
import React, { useState, useCallback } from 'react';
import { Job, InputType } from '../types';
import { MODELS, ASPECT_RATIOS } from '../constants';

interface JobFormProps {
    onAddJob: (job: Omit<Job, 'id' | 'status'>) => void;
    isDisabled: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ onAddJob, isDisabled }) => {
    const [prompt, setPrompt] = useState('');
    const [inputType, setInputType] = useState<InputType>(InputType.TextToVideo);
    const [model, setModel] = useState(MODELS[0]);
    const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[1]);
    const [numberOfOutputs, setNumberOfOutputs] = useState(1);
    const [imageFile, setImageFile] = useState<File | undefined>(undefined);
    const [error, setError] = useState<string>('');

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError('Prompt cannot be empty.');
            return;
        }
        if (inputType === InputType.ImageToVideo && !imageFile) {
            setError('Please upload an image for Image-to-Video generation.');
            return;
        }
        setError('');
        onAddJob({ prompt, inputType, model, aspectRatio, numberOfOutputs, imageFile });
        // Reset form
        setPrompt('');
        setImageFile(undefined);
    }, [prompt, inputType, model, aspectRatio, numberOfOutputs, imageFile, onAddJob]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">Add New Job</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A neon hologram of a cat driving a sports car"
                        rows={4}
                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-2"
                        disabled={isDisabled}
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="inputType" className="block text-sm font-medium text-gray-300">Input Type</label>
                        <select
                            id="inputType"
                            value={inputType}
                            onChange={(e) => setInputType(e.target.value as InputType)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-2"
                            disabled={isDisabled}
                        >
                            <option value={InputType.TextToVideo}>Text to Video</option>
                            <option value={InputType.ImageToVideo}>Image to Video</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-300">Model</label>
                        <select
                            id="model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-2"
                            disabled={isDisabled}
                        >
                            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {inputType === InputType.ImageToVideo && (
                    <div>
                        <label htmlFor="imageFile" className="block text-sm font-medium text-gray-300">Upload Image</label>
                        <input
                            type="file"
                            id="imageFile"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                            disabled={isDisabled}
                        />
                         {imageFile && <p className="text-xs text-gray-400 mt-1 truncate">Selected: {imageFile.name}</p>}
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300">Aspect Ratio</label>
                        <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-2"
                            disabled={isDisabled}
                        >
                            {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="numberOfOutputs" className="block text-sm font-medium text-gray-300">Outputs</label>
                        <input
                            type="number"
                            id="numberOfOutputs"
                            value={numberOfOutputs}
                            onChange={(e) => setNumberOfOutputs(Math.max(1, parseInt(e.target.value, 10)))}
                            min="1"
                            max="4"
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-2"
                            disabled={isDisabled}
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    disabled={isDisabled}
                >
                    Add Job to Queue
                </button>
            </form>
        </div>
    );
};

export default JobForm;
