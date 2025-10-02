
export enum JobStatus {
    Queued = 'Queued',
    Processing = 'Processing',
    Completed = 'Completed',
    Failed = 'Failed',
}

export enum InputType {
    TextToVideo = 'TextToVideo',
    ImageToVideo = 'ImageToVideo',
}

export interface Job {
    id: string;
    prompt: string;
    inputType: InputType;
    model: string;
    aspectRatio: string;
    numberOfOutputs: number;
    imageFile?: File;
    status: JobStatus;
    resultUrl?: string;
    error?: string;
}
