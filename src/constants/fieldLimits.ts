export const ANNOUNCEMENT_FIELD_LIMITS = {
  title: 100,
  byline: 100,
  content: 10000,
  location: 100,
  link: 200,
  coverPhotoAlt: 400,
  sensitiveDescription: 500,
  commentInstructions: 300,
} as const;

export const EVENT_FIELD_LIMITS = {
  name: 255,
  description: 2000,
  location: 100,
  externalLink: 400,
  sensitiveDescription: 500,
} as const;

export const PROFILE_FIELD_LIMITS = {
  nickname: 20,
  username: 24,
  pronouns: 20,
  bio: 100,
  location: 100,
  job: 100,
  politics: 100,
  school: 100,
  covidPrecautionInfo: 400,
  shortAnswer: 100,
  photoCaption: 100,
  photoAlt: 300,
} as const;

export const COMMUNITY_PROFILE_FIELD_LIMITS = {
  bio: 180,
} as const;
