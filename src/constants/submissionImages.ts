export type SubmissionImageSourceResize = {
  width: number;
  height: number;
  format: 'JPEG' | 'PNG' | 'WEBP';
  quality: number;
  rotation: number;
  outputType: 'base64' | 'blob' | 'file';
  minWidth?: number;
  minHeight?: number;
};

export type SubmissionImageConstraints = {
  accept: string;
  outputMaxWidth: number;
  outputMaxHeight: number;
  outputFormat: 'JPEG' | 'PNG' | 'WEBP';
  outputQuality: number;
  sourceResize?: SubmissionImageSourceResize;
};

const SHARED_SUBMISSION_IMAGE_CONSTRAINTS = {
  accept: 'image/*',
  outputMaxWidth: 1500,
  outputMaxHeight: 1500,
  outputFormat: 'JPEG',
  outputQuality: 95,
} satisfies SubmissionImageConstraints;

export const ANNOUNCEMENT_IMAGE_CONSTRAINTS: SubmissionImageConstraints = {
  ...SHARED_SUBMISSION_IMAGE_CONSTRAINTS,
  sourceResize: {
    width: 1500,
    height: 1500,
    format: 'JPEG',
    quality: 100,
    rotation: 0,
    outputType: 'base64',
    minWidth: 800,
    minHeight: 800,
  },
};

export const EVENT_IMAGE_CONSTRAINTS: SubmissionImageConstraints = {
  ...SHARED_SUBMISSION_IMAGE_CONSTRAINTS,
};
