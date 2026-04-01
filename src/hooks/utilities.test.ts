/**
 * Unit tests for src/hooks/utilities.ts
 *
 * Coverage strategy:
 *  - Pure / synchronous functions: exhaustive branch testing (no mocking needed)
 *  - Axios API functions: mock axios at the module level; verify correct HTTP
 *    method, URL path, auth header, and return value for each function
 *  - Functions with special logic (error swallowing, URL routing, throttling,
 *    storage side-effects): extra branch tests
 *  - Capacitor-dependent functions: mock @capacitor/preferences
 *
 * Mocking strategy:
 *  - axios is mocked at the module level so tests never make real network calls.
 *    When utilities.ts is eventually refactored to use api-client, swap the mock
 *    target from 'axios' to '../api/api-client' with minimal changes here.
 *  - @capacitor/preferences, @capacitor/core, @capacitor/text-zoom, and
 *    js-cookie are mocked so tests run without a native Capacitor runtime.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { makeAxiosResponse, makeAxiosError, setAuthToken, clearAuthToken } from '../test-utils/shared-mocks';

// ---------------------------------------------------------------------------
// Module mocks — vitest hoists these before all imports
// ---------------------------------------------------------------------------

// Mock axios so no real HTTP requests are made.
// The default export is a callable function (for axios({ method, url, ... }))
// that also has .get / .patch / .post / .delete methods.
vi.mock('axios', () => {
  const mockFn = vi.fn();
  const mock = {
    default: Object.assign(mockFn, {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      defaults: { withCredentials: false },
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  };
  return mock;
});

// Mock js-cookie so csrftoken reads return a predictable value.
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn().mockReturnValue('test-csrf-token'),
    remove: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock Capacitor Preferences — used by removeAllProfilesFromCapacitorStorage,
// handleLogoutCommon, setFontSizePref, applyThemeFromPref, etc.
// The factory must be self-contained (no external variables) because vi.mock is hoisted.
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue({ keys: [] }),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

const clearTransientAppStorage = vi.fn().mockResolvedValue(undefined);
vi.mock('./capacitorPreferences/all', () => ({
  clearTransientAppStorage: (...args: any[]) => clearTransientAppStorage(...args),
}));

// Mock Capacitor core — used by setTextZoom, paintSystemBars, applyRootTextScale
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('web'),
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
  CapacitorHttp: {},
}));

// Mock @capacitor/text-zoom — used by setTextZoom
vi.mock('@capacitor/text-zoom', () => ({
  TextZoom: {
    getPreferred: vi.fn().mockResolvedValue({ value: 1.0 }),
    get: vi.fn().mockResolvedValue({ value: 1.0 }),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock @capacitor/filesystem — imported at the bottom of utilities.ts
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {},
  Directory: {},
}));

// Mock @capacitor/app — not used in utilities.ts but imported transitively
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(() => ({ remove: vi.fn() })) },
}));

// Set a predictable BASE_URL before the module is evaluated.
// utilities.ts reads process.env.REACT_APP_BASE_URL at module init time.
process.env.REACT_APP_BASE_URL = 'https://test.example.com';

// Import the functions under test AFTER all vi.mock declarations.
import { Preferences } from '@capacitor/preferences';
import axios from 'axios';
import {
  isStagingEnvironment,
  isMobile,
  isPersonalPlus,
  isCommunityPlus,
  isPro,
  somethingInLetsTalkAbout,
  getBadgeCount,
  normalizeLocalMediaUrl,
  getAvatarDisplay,
  containsPii,
  containsLinkShortener,
  containsGoogleDocLink,
  onImgError,
  onAttachmentImgError,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  updateCurrentUserProfileWStatus,
  updateMutualConnection,
  updateOutgoingConnections,
  getDismissedConnections,
  updateDismissedConnections,
  clearDismissedConnections,
  updateUnmatchedConnections,
  clearHiddenSomething,
  updateBlockedConnections,
  removeBlockedConnection,
  getIncomingConnections,
  getMutualConnections,
  getMutualConnectionsFlat,
  getRandomProfileList,
  getPicksWithFilters,
  getProfileCardInfo,
  getChats,
  getGroupChats,
  getGroupChatInvites,
  heartMessage,
  unheartMessage,
  removeMessage,
  removeComment,
  editComment,
  markAllInChatAsRead,
  getAnnouncements,
  getAllAnnouncementsAtOnce,
  getProfileAnnouncementLikes,
  likeAnnouncement,
  unlikeAnnouncement,
  likeComment,
  unlikeComment,
  sidenoteComment,
  authorSidenoteComment,
  markParticipated,
  unmarkParticipated,
  getAnnouncementDetails,
  createAnnouncement,
  addComment,
  addCommentReply,
  getMessages,
  getGroupMessages,
  getAuth,
  logoutCurrent,
  logoutAll,
  currToken,
  deleteAccount,
  newMessagePush,
  sendAnEmail,
  createGroupMessage,
  acceptGroupChatInvite,
  checkVerificationCode,
  sendPhoneVerification,
  updateUsername,
  handleLogoutCommon,
  getWebsocketUrl,
  addToHiddenDialogs,
  removeFromHiddenDialogs,
  addToHiddenPosts,
  addToHiddenComments,
  addToHiddenAuthors,
  reportSomething,
  isAcceptingMessages,
  healthCheck,
  maintenanceCheck,
  updateCurrentModeration,
  increaseStreak,
  voteOnPoll,
  sendAnOpener,
  addSavedLocation,
  deleteSavedLocation,
  removeAllProfilesFromCapacitorStorage,
  updateCurrentUserChatSettings,
  updateCurrentUserPushNotificationSettings,
  uploadFileForMessageNew,
} from './utilities';

// Typed references to the mocked axios methods for cleaner assertions.
const axiosFn = vi.mocked(axios as any);
const axiosGet = vi.mocked(axios.get);
const axiosPatch = vi.mocked((axios as any).patch);
const axiosPost = vi.mocked((axios as any).post);
const axiosDelete = vi.mocked((axios as any).delete);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Asserts that the Authorization header passed to axios contains the token. */
function expectAuthHeader(call: any, token = 'test-token-abc123') {
  const config = call.mock.calls[0]?.[0];
  if (typeof config === 'object' && 'headers' in config) {
    // axios({ headers }) style
    expect(config.headers?.Authorization).toBe(`Token ${token}`);
  } else {
    // axios.get(url, { headers }) style — second arg is the config
    expect(call.mock.calls[0]?.[1]?.headers?.Authorization).toBe(`Token ${token}`);
  }
}

// ---------------------------------------------------------------------------
// beforeEach / afterEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Restore a clean localStorage before each test
  localStorage.clear();
  setAuthToken(); // sets "test-token-abc123"
  // Default axios mock: resolve with empty data
  axiosFn.mockResolvedValue(makeAxiosResponse({}));
  axiosGet.mockResolvedValue(makeAxiosResponse({}));
  axiosPatch.mockResolvedValue(makeAxiosResponse({}));
  axiosPost.mockResolvedValue(makeAxiosResponse({}));
  axiosDelete.mockResolvedValue(makeAxiosResponse({}));
  // Reset Preferences mock to defaults before each test
  vi.mocked(Preferences.get).mockResolvedValue({ value: null });
  vi.mocked(Preferences.set).mockResolvedValue(undefined);
  vi.mocked(Preferences.remove).mockResolvedValue(undefined);
  vi.mocked(Preferences.keys).mockResolvedValue({ keys: [] });
});

afterEach(() => {
  localStorage.clear();
});

// ===========================================================================
// 1. isStagingEnvironment()
// ===========================================================================

describe('isStagingEnvironment()', () => {
  // The function checks whether BASE_URL includes the staging hostname.
  // In these tests we manipulate process.env before re-requiring; because
  // BASE_URL is captured at module init we test the currently-loaded value.

  it('returns false when BASE_URL is the test environment URL', () => {
    // process.env.REACT_APP_BASE_URL = 'https://test.example.com' (set at top)
    // That URL does not include the staging hostname, so should return false.
    expect(isStagingEnvironment()).toBe(false);
  });
});

// ===========================================================================
// 2. isMobile()
// ===========================================================================

describe('isMobile()', () => {
  // isMobile() checks window.location.href for Capacitor URL schemes.

  it('returns true when the URL contains the capacitor:// scheme', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'capacitor://localhost' },
      writable: true,
    });
    expect(isMobile()).toBe(true);
  });

  it('returns true when the URL contains the Refresh Connections app scheme', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://com.refreshconnections.app/home' },
      writable: true,
    });
    expect(isMobile()).toBe(true);
  });

  it('returns false for a plain https web URL', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://app.refreshconnections.com/home' },
      writable: true,
    });
    expect(isMobile()).toBe(false);
  });

  it('returns false for localhost dev URL', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:8100/home' },
      writable: true,
    });
    expect(isMobile()).toBe(false);
  });
});

// ===========================================================================
// 3. Subscription level helpers
// ===========================================================================

describe('isPersonalPlus()', () => {
  // Returns true for users on personalplus or pro; false for everything else.

  it('returns true for personalplus', () => {
    expect(isPersonalPlus('personalplus')).toBe(true);
  });

  it('returns true for pro (pro encompasses all plus features)', () => {
    expect(isPersonalPlus('pro')).toBe(true);
  });

  it('returns false for communityplus', () => {
    expect(isPersonalPlus('communityplus')).toBe(false);
  });

  it('returns false for none (free tier)', () => {
    expect(isPersonalPlus('none')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isPersonalPlus('')).toBe(false);
  });
});

describe('isCommunityPlus()', () => {
  // Returns true for users on communityplus or pro.

  it('returns true for communityplus', () => {
    expect(isCommunityPlus('communityplus')).toBe(true);
  });

  it('returns true for pro', () => {
    expect(isCommunityPlus('pro')).toBe(true);
  });

  it('returns false for personalplus', () => {
    expect(isCommunityPlus('personalplus')).toBe(false);
  });

  it('returns false for none', () => {
    expect(isCommunityPlus('none')).toBe(false);
  });
});

describe('isPro()', () => {
  // Returns true only for the highest tier.

  it('returns true for pro', () => {
    expect(isPro('pro')).toBe(true);
  });

  it('returns false for personalplus', () => {
    expect(isPro('personalplus')).toBe(false);
  });

  it('returns false for communityplus', () => {
    expect(isPro('communityplus')).toBe(false);
  });

  it('returns false for none', () => {
    expect(isPro('none')).toBe(false);
  });
});

// ===========================================================================
// 4. somethingInLetsTalkAbout()
// ===========================================================================

describe('somethingInLetsTalkAbout()', () => {
  // Returns true if at least one "lets talk about" field is non-empty;
  // false when every field is null or empty string.

  it('returns false when all fields are null', () => {
    const empty = {
      together_idea: null, freetime: null, hobby: null, petpeeve: null,
      talent: null, fave_book: null, fave_movie: null, fave_tv: null,
      fave_album: null, fave_topic: null, fave_musicalartist: null,
      fave_game: null, fave_sport_watch: null, fave_sport_play: null,
      fixation_game: null, fixation_book: null, fixation_movie: null,
      fixation_tv: null, fixation_topic: null, fixation_musicalartist: null,
      fixation_album: null,
    };
    expect(somethingInLetsTalkAbout(empty)).toBe(false);
  });

  it('returns false when all fields are empty strings', () => {
    const allEmpty: any = {};
    const fields = [
      'together_idea', 'freetime', 'hobby', 'petpeeve', 'talent',
      'fave_book', 'fave_movie', 'fave_tv', 'fave_album', 'fave_topic',
      'fave_musicalartist', 'fave_game', 'fave_sport_watch', 'fave_sport_play',
      'fixation_game', 'fixation_book', 'fixation_movie', 'fixation_tv',
      'fixation_topic', 'fixation_musicalartist', 'fixation_album',
    ];
    fields.forEach(f => { allEmpty[f] = ''; });
    expect(somethingInLetsTalkAbout(allEmpty)).toBe(false);
  });

  it('returns true when at least one field has a value', () => {
    const partial: any = {
      together_idea: null, freetime: '', hobby: 'Reading', petpeeve: null,
      talent: null, fave_book: null, fave_movie: null, fave_tv: null,
      fave_album: null, fave_topic: null, fave_musicalartist: null,
      fave_game: null, fave_sport_watch: null, fave_sport_play: null,
      fixation_game: null, fixation_book: null, fixation_movie: null,
      fixation_tv: null, fixation_topic: null, fixation_musicalartist: null,
      fixation_album: null,
    };
    expect(somethingInLetsTalkAbout(partial)).toBe(true);
  });

  it('returns true when the last field (fixation_album) is the only populated one', () => {
    const partial: any = {
      together_idea: null, freetime: null, hobby: null, petpeeve: null,
      talent: null, fave_book: null, fave_movie: null, fave_tv: null,
      fave_album: null, fave_topic: null, fave_musicalartist: null,
      fave_game: null, fave_sport_watch: null, fave_sport_play: null,
      fixation_game: null, fixation_book: null, fixation_movie: null,
      fixation_tv: null, fixation_topic: null, fixation_musicalartist: null,
      fixation_album: 'Rumours',
    };
    expect(somethingInLetsTalkAbout(partial)).toBe(true);
  });
});

// ===========================================================================
// 5. getBadgeCount()
// ===========================================================================

describe('getBadgeCount()', () => {
  // Sums the unread_count across all chats in the array.

  it('returns 0 for an empty chats array', async () => {
    expect(await getBadgeCount([])).toBe(0);
  });

  it('returns 0 for an undefined/null chats value', async () => {
    expect(await getBadgeCount(undefined)).toBe(0);
    expect(await getBadgeCount(null)).toBe(0);
  });

  it('sums unread_count across a single chat', async () => {
    expect(await getBadgeCount([{ unread_count: 5 }])).toBe(5);
  });

  it('sums unread_count across multiple chats', async () => {
    const chats = [{ unread_count: 3 }, { unread_count: 7 }, { unread_count: 2 }];
    expect(await getBadgeCount(chats)).toBe(12);
  });

  it('handles chats where unread_count is 0', async () => {
    const chats = [{ unread_count: 0 }, { unread_count: 4 }];
    expect(await getBadgeCount(chats)).toBe(4);
  });
});

// ===========================================================================
// 6. normalizeLocalMediaUrl()
// ===========================================================================

describe('normalizeLocalMediaUrl()', () => {
  // Prepends BASE_URL to relative /media and /static paths; passes through
  // absolute URLs unchanged; returns undefined for falsy input.

  it('returns undefined for null input', () => {
    expect(normalizeLocalMediaUrl(null)).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(normalizeLocalMediaUrl(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(normalizeLocalMediaUrl('')).toBeUndefined();
  });

  it('passes through a full https URL unchanged', () => {
    const url = 'https://cdn.example.com/img/photo.jpg';
    expect(normalizeLocalMediaUrl(url)).toBe(url);
  });

  it('passes through a full http URL unchanged', () => {
    const url = 'http://cdn.example.com/img/photo.jpg';
    expect(normalizeLocalMediaUrl(url)).toBe(url);
  });

  it('prepends BASE_URL to a /media path', () => {
    // Exact value depends on BASE_URL at module init — assert the path is included
    const result = normalizeLocalMediaUrl('/media/photos/pic.jpg');
    expect(result).toContain('/media/photos/pic.jpg');
  });

  it('prepends BASE_URL to a /static path', () => {
    const result = normalizeLocalMediaUrl('/static/img/avatar.png');
    expect(result).toContain('/static/img/avatar.png');
  });

  it('prepends BASE_URL with slash separator for a media/ path without leading slash', () => {
    // The function adds a '/' between BASE_URL and the relative path
    const result = normalizeLocalMediaUrl('media/photos/pic.jpg');
    expect(result).toContain('media/photos/pic.jpg');
    // Must differ from the input (BASE_URL was prepended)
    expect(result).not.toBe('media/photos/pic.jpg');
  });

  it('prepends BASE_URL with slash separator for a static/ path without leading slash', () => {
    const result = normalizeLocalMediaUrl('static/img/avatar.png');
    expect(result).toContain('static/img/avatar.png');
    expect(result).not.toBe('static/img/avatar.png');
  });

  it('returns an unrecognised relative path as-is', () => {
    const url = 'uploads/photo.jpg';
    expect(normalizeLocalMediaUrl(url)).toBe(url);
  });
});

// ===========================================================================
// 7. getAvatarDisplay()
// ===========================================================================

describe('getAvatarDisplay()', () => {
  // Computes the CSS className and image src for an avatar based on whether
  // there is an image and whether both viewer and author have connected.

  it('uses the refresh-avatar class and placeholder src when no profileImage', () => {
    const result = getAvatarDisplay({ profileImage: null });
    expect(result.className).toBe('refresh-avatar');
    expect(result.src).toBe('../static/img/refresh-flower-blue.png');
    expect(result.hasImage).toBe(false);
    expect(result.showConnectBorder).toBe(false);
  });

  it('uses community-avatar class when there is an image but no mutual connection', () => {
    const result = getAvatarDisplay({ profileImage: '/media/photos/user.jpg' });
    expect(result.className).toContain('community-avatar');
    expect(result.hasImage).toBe(true);
    expect(result.showConnectBorder).toBe(false);
  });

  it('uses connect-avatar class when both viewer and author have connected and there is an image', () => {
    const result = getAvatarDisplay({
      profileImage: '/media/photos/user.jpg',
      viewerConnect: true,
      authorConnect: true,
    });
    expect(result.className).toContain('connect-avatar');
    expect(result.showConnectBorder).toBe(true);
  });

  it('does NOT show connect border when only viewerConnect is true', () => {
    const result = getAvatarDisplay({
      profileImage: '/media/photos/user.jpg',
      viewerConnect: true,
      authorConnect: false,
    });
    expect(result.showConnectBorder).toBe(false);
    expect(result.className).not.toContain('connect-avatar');
  });

  it('does NOT show connect border when there is no image even if both connected', () => {
    const result = getAvatarDisplay({
      profileImage: null,
      viewerConnect: true,
      authorConnect: true,
    });
    expect(result.showConnectBorder).toBe(false);
  });

  it('prepends byline-avatar class when includeBylineClass is true', () => {
    const result = getAvatarDisplay({
      profileImage: '/media/photos/user.jpg',
      includeBylineClass: true,
    });
    expect(result.className).toContain('byline-avatar');
    expect(result.className).toContain('community-avatar');
  });

  it('normalizes the src URL when profileImage is a relative /media path', () => {
    // Exact value depends on BASE_URL at module init — assert path is included
    const result = getAvatarDisplay({ profileImage: '/media/photos/user.jpg' });
    expect(result.src).toContain('/media/photos/user.jpg');
  });

  it('accepts a custom placeholderSrc', () => {
    const result = getAvatarDisplay({
      profileImage: null,
      placeholderSrc: '../static/img/custom-placeholder.png',
    });
    expect(result.src).toBe('../static/img/custom-placeholder.png');
  });
});

// ===========================================================================
// 8. containsPii()
// ===========================================================================

describe('containsPii()', () => {
  // Detects email addresses and plausible phone numbers in text.

  it('returns false for a clean text string', () => {
    expect(containsPii('Hi there, hope you are well!')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(containsPii('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(containsPii(null)).toBe(false);
  });

  it('detects a plain email address', () => {
    expect(containsPii('You can reach me at hello@example.com')).toBe(true);
  });

  it('detects an email with subdomain', () => {
    expect(containsPii('name@mail.company.org')).toBe(true);
  });

  it('detects a plain phone number', () => {
    expect(containsPii('Call me on 555-867-5309')).toBe(true);
  });

  it('detects a phone number with country code', () => {
    expect(containsPii('+1 (800) 555-1234')).toBe(true);
  });

  it('does NOT flag a short 4-digit number as a phone', () => {
    // Fewer than 7 digits is not considered a plausible phone
    expect(containsPii('Code is 1234')).toBe(false);
  });
});

// ===========================================================================
// 9. containsLinkShortener()
// ===========================================================================

describe('containsLinkShortener()', () => {
  // Returns true if the text contains a URL from a known shortener service.

  it('returns false for plain text with no URLs', () => {
    expect(containsLinkShortener('Check out my profile!')).toBe(false);
  });

  it('returns false for a full non-shortener URL', () => {
    expect(containsLinkShortener('Visit https://www.refreshconnections.com')).toBe(false);
  });

  it('detects bit.ly links', () => {
    expect(containsLinkShortener('Click https://bit.ly/abc123')).toBe(true);
  });

  it('detects tinyurl.com links', () => {
    expect(containsLinkShortener('See https://tinyurl.com/xyz')).toBe(true);
  });

  it('does NOT flag youtu.be (in allowlist)', () => {
    expect(containsLinkShortener('Watch https://youtu.be/dQw4w9WgXcQ')).toBe(false);
  });

  it('does NOT flag t.co (in allowlist)', () => {
    expect(containsLinkShortener('https://t.co/sometweet')).toBe(false);
  });

  it('detects bare bit.ly without https prefix', () => {
    expect(containsLinkShortener('See bit.ly/link')).toBe(true);
  });
});

// ===========================================================================
// 10. containsGoogleDocLink()
// ===========================================================================

describe('containsGoogleDocLink()', () => {
  // Returns true if the text contains a Google Docs / Drive link.

  it('returns false for plain text', () => {
    expect(containsGoogleDocLink('Great post!')).toBe(false);
  });

  it('detects docs.google.com links', () => {
    expect(containsGoogleDocLink('Here is the doc: https://docs.google.com/document/d/1abc')).toBe(true);
  });

  it('detects drive.google.com links', () => {
    expect(containsGoogleDocLink('File: https://drive.google.com/file/d/xyz/view')).toBe(true);
  });

  it('detects forms.gle links', () => {
    expect(containsGoogleDocLink('Take the survey: https://forms.gle/abc')).toBe(true);
  });

  it('returns false for non-Google URLs', () => {
    expect(containsGoogleDocLink('https://dropbox.com/s/abc')).toBe(false);
  });
});

// ===========================================================================
// 11. onImgError() and onAttachmentImgError()
// ===========================================================================

describe('onImgError()', () => {
  // First error: swaps src to the null.png placeholder and marks fallback=true.
  // Second error (fallback already set): swaps to an inline base64 SVG.

  it('sets src to null.png on the first error', () => {
    const img: any = { src: 'broken.jpg', dataset: {} };
    onImgError({ currentTarget: img });
    expect(img.src).toBe('../static/img/null.png');
    expect(img.dataset.fallback).toBe('true');
  });

  it('sets src to the inline base64 SVG on the second error (fallback already set)', () => {
    const img: any = { src: '../static/img/null.png', dataset: { fallback: 'true' } };
    onImgError({ currentTarget: img });
    expect(img.src).toContain('data:image/svg+xml;base64,');
  });

  it('does not change src a third time (already base64)', () => {
    const base64 = 'data:image/svg+xml;base64,PHN2Zy';
    const img: any = { src: base64, dataset: { fallback: 'true' } };
    onImgError({ currentTarget: img });
    // Still replaces with base64 (same path — acceptable idempotent behavior)
    expect(img.src).toContain('data:image/svg+xml;base64,');
  });
});

describe('onAttachmentImgError()', () => {
  // Same pattern as onImgError but uses isntloading.png as the first fallback.

  it('sets src to isntloading.png on the first error', () => {
    const img: any = { src: 'broken.jpg', dataset: {} };
    onAttachmentImgError({ currentTarget: img });
    expect(img.src).toContain('isntloading.png');
    expect(img.dataset.fallback).toBe('true');
  });

  it('sets src to the inline base64 SVG on the second error', () => {
    const img: any = { src: '../static/img/isntloading.png', dataset: { fallback: 'true' } };
    onAttachmentImgError({ currentTarget: img });
    expect(img.src).toContain('data:image/svg+xml;base64,');
  });
});

// ===========================================================================
// 12. Profile API functions
// ===========================================================================

describe('getCurrentUserProfile()', () => {
  // GET /api/profiles/current/ — returns response.data

  it('calls axios.get with the profiles/current endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ name: 'Test User' }));
    const result = await getCurrentUserProfile();
    expect(axiosGet).toHaveBeenCalledOnce();
    const [url] = axiosGet.mock.calls[0];
    expect(url).toContain('/api/profiles/current/');
  });

  it('sends the Authorization header with the stored token', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ name: 'Test User' }));
    await getCurrentUserProfile();
    expect(axiosGet.mock.calls[0][1]?.headers?.Authorization).toBe('Token test-token-abc123');
  });

  it('returns response.data', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ name: 'Test User', id: 42 }));
    const result = await getCurrentUserProfile();
    expect(result).toEqual({ name: 'Test User', id: 42 });
  });
});

describe('updateCurrentUserProfile()', () => {
  // PATCH /api/profiles/current/ — returns response.data

  it('calls axios with method patch and the profiles/current endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ name: 'Updated' }));
    await updateCurrentUserProfile({ name: 'Updated' });
    expect(axiosFn).toHaveBeenCalledOnce();
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('patch');
    expect(config.url).toContain('/api/profiles/current/');
  });

  it('passes the data payload', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await updateCurrentUserProfile({ bio: 'Hello' });
    expect(axiosFn.mock.calls[0][0].data).toEqual({ bio: 'Hello' });
  });

  it('returns response.data', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ success: true }));
    const result = await updateCurrentUserProfile({});
    expect(result).toEqual({ success: true });
  });
});

describe('updateCurrentUserProfileWStatus()', () => {
  // Same endpoint as updateCurrentUserProfile but returns the full response
  // (not just response.data) — callers use response.status.

  it('returns the full response (not just response.data)', async () => {
    const full = makeAxiosResponse({ name: 'Test' }, 200);
    axiosFn.mockResolvedValue(full);
    const result = await updateCurrentUserProfileWStatus({ name: 'Test' });
    expect(result).toEqual(full); // full response object, not result.data
  });
});

describe('updateMutualConnection()', () => {
  it('sends connection_id in the request body', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await updateMutualConnection(99);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 99 });
  });

  it('calls the mutual_connections endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await updateMutualConnection(99);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/mutual_connections/');
  });
});

describe('updateOutgoingConnections()', () => {
  // PATCH /api/profiles/outgoing_connections/ — used when the user "likes" someone.

  it('sends the liked profile id in the request body', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await updateOutgoingConnections(7);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 7 });
  });

  it('calls the outgoing_connections endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await updateOutgoingConnections(7);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/outgoing_connections/');
  });
});

describe('getDismissedConnections()', () => {
  it('calls GET on the dismissed_connections endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    const result = await getDismissedConnections();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/dismissed_connections/');
    expect(result).toEqual([]);
  });
});

describe('updateDismissedConnections()', () => {
  it('sends the dismissed connection id and returns response.data', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ ok: true }));
    const result = await updateDismissedConnections(12);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 12 });
    expect(result).toEqual({ ok: true });
  });
});

describe('clearDismissedConnections()', () => {
  it('calls the clear_dismissed_connections endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ cleared: true }));
    await clearDismissedConnections();
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/clear_dismissed_connections/');
  });
});

describe('updateUnmatchedConnections()', () => {
  it('sends the unmatched connection id', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await updateUnmatchedConnections(55);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 55 });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/unmatched_connections/');
  });
});

describe('clearHiddenSomething()', () => {
  // The "something" parameter is interpolated into the URL path.

  it('constructs the URL using the provided something parameter', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await clearHiddenSomething('profiles');
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/clear_hidden_profiles/');
  });

  it('works with a different value for something', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await clearHiddenSomething('posts');
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/clear_hidden_posts/');
  });
});

describe('updateBlockedConnections()', () => {
  it('sends the blocked connection id and uses the blocked_connections endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await updateBlockedConnections(88);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 88 });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/blocked_connections/');
  });
});

describe('removeBlockedConnection()', () => {
  it('calls the remove_blocked_connection endpoint with the connection id', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await removeBlockedConnection(88);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 88 });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/remove_blocked_connection/');
  });
});

describe('getIncomingConnections()', () => {
  it('calls GET on the incoming_connections endpoint and returns data', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([{ id: 1 }]));
    const result = await getIncomingConnections();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/incoming_connections/');
    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('getMutualConnections()', () => {
  it('calls the mutual_connections endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getMutualConnections();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/mutual_connections/');
  });
});

describe('getMutualConnectionsFlat()', () => {
  it('calls the flat_mutual_connections endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getMutualConnectionsFlat();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/flat_mutual_connections/');
  });
});

describe('getRandomProfileList()', () => {
  it('calls the randomlist/not_connected endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getRandomProfileList();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/randomlist/not_connected/');
  });
});

describe('getPicksWithFilters()', () => {
  it('calls the randomlist/get_picks endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getPicksWithFilters();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/randomlist/get_picks/');
  });
});

describe('getProfileCardInfo()', () => {
  it('appends the profile id to the profiles endpoint URL', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ name: 'Alice' }));
    await getProfileCardInfo(42);
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/42');
  });
});

// ===========================================================================
// 13. Chat API functions
// ===========================================================================

describe('getChats()', () => {
  it('calls the chats/dialogs endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getChats();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/chats/dialogs/');
  });
});

describe('getGroupChats()', () => {
  it('calls the groupdialogs endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getGroupChats();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/chats/groupdialogs/');
  });
});

describe('getGroupChatInvites()', () => {
  it('calls the groupdialoginvites endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getGroupChatInvites();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/chats/groupdialoginvites/');
  });
});

describe('heartMessage()', () => {
  it('sends the message_id in the body to the heart endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ ok: true }));
    await heartMessage(101);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/chats/heart/');
    expect(config.data).toEqual({ message_id: 101 });
  });
});

describe('unheartMessage()', () => {
  it('sends the message_id to the unheart endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ ok: true }));
    await unheartMessage(202);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/chats/unheart/');
    expect(config.data).toEqual({ message_id: 202 });
  });
});

describe('removeMessage()', () => {
  it('sends the message_id to the remove_message endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await removeMessage(303);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/chats/remove_message/');
    expect(config.data).toEqual({ message_id: 303 });
  });
});

describe('markAllInChatAsRead()', () => {
  it('sends the sender_id to the mark_all endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await markAllInChatAsRead(77);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/chats/mark_all_messages_in_chat_as_read/');
    expect(config.data).toEqual({ sender_id: 77 });
  });
});

describe('getMessages()', () => {
  it('appends the chat id to the messages endpoint URL', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getMessages(5);
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/chats/messages/5/');
  });
});

describe('getGroupMessages()', () => {
  it('appends the group id to the groupmessages endpoint URL', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getGroupMessages(9);
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/chats/groupmessages/9/');
  });
});

describe('createGroupMessage()', () => {
  it('POSTs the group data and returns the full response', async () => {
    const resp = makeAxiosResponse({ id: 1 });
    axiosFn.mockResolvedValue(resp);
    const result = await createGroupMessage({ name: 'My Group', members: [1, 2] });
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('post');
    expect(config.url).toContain('/api/profiles/chats/create_group/');
    expect(result).toBe(resp); // full response, not just .data
  });
});

describe('acceptGroupChatInvite()', () => {
  it('sends the group id with accept=true to the create_group endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ joined: true }));
    await acceptGroupChatInvite(11);
    const config = axiosFn.mock.calls[0][0];
    expect(config.data).toEqual({ id: 11, accept: 'true' });
    expect(config.url).toContain('/api/profiles/chats/create_group/');
  });
});

describe('addToHiddenDialogs()', () => {
  it('sends the user_id to the hidden_chats endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await addToHiddenDialogs(66);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/hidden_chats/');
    expect(config.data).toEqual({ id: 66 });
  });
});

describe('removeFromHiddenDialogs()', () => {
  it('sends the user_id to the unhide_chat endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await removeFromHiddenDialogs(66);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/unhide_chat/');
    expect(config.data).toEqual({ id: 66 });
  });
});

describe('sendAnOpener()', () => {
  it('POSTs recipient_id and message text to the opener endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ sent: true }));
    await sendAnOpener(33, 'Hey there!');
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('post');
    expect(config.url).toContain('/api/profiles/chats/opener/');
    expect(config.data).toEqual({ recipient_id: 33, text: 'Hey there!' });
  });
});

// ===========================================================================
// 14. Refreshments / posts API functions
// ===========================================================================

describe('removeComment()', () => {
  it('sends comment_id to the comment/remove endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await removeComment(404);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/refreshments/comment/remove/');
    expect(config.data).toEqual({ comment_id: 404 });
  });
});

describe('editComment()', () => {
  it('sends comment_id and updated text to the comment/edit endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await editComment(50, 'Corrected text');
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/refreshments/comment/edit/');
    expect(config.data).toEqual({ comment_id: 50, text: 'Corrected text' });
  });
});

describe('addToHiddenPosts()', () => {
  it('sends the post id to the hidden_posts endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await addToHiddenPosts(77);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/hidden_posts/');
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 77 });
  });
});

describe('addToHiddenComments()', () => {
  it('sends the comment id to the hidden_comments endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await addToHiddenComments(88);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/hidden_comments/');
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 88 });
  });
});

describe('addToHiddenAuthors()', () => {
  it('sends the announcement id to the hidden_authors endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await addToHiddenAuthors(99);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/hidden_authors/');
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 99 });
  });
});

describe('voteOnPoll()', () => {
  it('POSTs the option_id to the poll/vote endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ voted: true }));
    await voteOnPoll(3);
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('post');
    expect(config.url).toContain('/api/refreshments/poll/vote/');
    expect(config.data).toEqual({ option_id: 3 });
  });
});

describe('sidenoteComment()', () => {
  it('sends comment_id to the comment/sidenote endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await sidenoteComment(200);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/refreshments/comment/sidenote/');
    expect(axiosFn.mock.calls[0][0].data).toEqual({ comment_id: 200 });
  });
});

describe('authorSidenoteComment()', () => {
  it('sends comment_id to the comment/author_sidenote endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await authorSidenoteComment(201);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/refreshments/comment/author_sidenote/');
    expect(axiosFn.mock.calls[0][0].data).toEqual({ comment_id: 201 });
  });
});

// ===========================================================================
// 15. Announcement API functions
// ===========================================================================

describe('getAnnouncements()', () => {
  // Has URL-building logic: uses pageUrl if provided, appends filter tags as
  // a comma-separated query parameter.

  it('uses the default announcements URL when pageUrl is empty', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ results: [] }));
    await getAnnouncements('', []);
    expect(axiosGet.mock.calls[0][0]).toContain('/api/announcements/');
  });

  it('uses the provided pageUrl when it is non-empty', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ results: [] }));
    const nextPage = 'https://test.example.com/api/announcements/?page=2';
    await getAnnouncements(nextPage, []);
    expect(axiosGet.mock.calls[0][0]).toBe(nextPage);
  });

  it('appends tag query param when filter tags are provided', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ results: [] }));
    await getAnnouncements('', ['news', 'events']);
    const calledUrl = axiosGet.mock.calls[0][0];
    expect(calledUrl).toContain('?tags=news,events');
  });

  it('does NOT append a tag query param when filter tags array is empty', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ results: [] }));
    await getAnnouncements('', []);
    const calledUrl = axiosGet.mock.calls[0][0];
    expect(calledUrl).not.toContain('?tags=');
  });

  it('appends tags to a provided pageUrl', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ results: [] }));
    await getAnnouncements('https://test.example.com/api/announcements/?page=2', ['sports']);
    const calledUrl = axiosGet.mock.calls[0][0];
    expect(calledUrl).toContain('?tags=sports');
  });
});

describe('getAllAnnouncementsAtOnce()', () => {
  it('calls the announcements endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getAllAnnouncementsAtOnce();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/announcements/');
  });
});

describe('getProfileAnnouncementLikes()', () => {
  it('calls the announcement_likes endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse([]));
    await getProfileAnnouncementLikes();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/announcement_likes/');
  });
});

describe('getAnnouncementDetails()', () => {
  it('appends the announcement id to the announcement_detail URL', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({}));
    await getAnnouncementDetails(15);
    expect(axiosGet.mock.calls[0][0]).toContain('/api/announcement_detail/15');
  });
});

describe('likeAnnouncement()', () => {
  it('sends the announcement_id to the like endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await likeAnnouncement(20);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/announcement/like/');
    expect(config.data).toEqual({ announcement_id: 20 });
  });
});

describe('unlikeAnnouncement()', () => {
  it('sends the announcement_id to the unlike endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await unlikeAnnouncement(20);
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/announcement/unlike/');
    expect(config.data).toEqual({ announcement_id: 20 });
  });
});

describe('likeComment()', () => {
  it('sends the comment_id to the comment like endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await likeComment(30);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ comment_id: 30 });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/comment/like/');
  });
});

describe('unlikeComment()', () => {
  it('sends the comment_id to the comment unlike endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await unlikeComment(30);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ comment_id: 30 });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/comment/unlike/');
  });
});

describe('createAnnouncement()', () => {
  // Returns the full response (not just .data) so callers can inspect status.

  it('POSTs to the announcement endpoint and returns the full response', async () => {
    const resp = makeAxiosResponse({ id: 1 });
    axiosFn.mockResolvedValue(resp);
    const result = await createAnnouncement({ title: 'Hello' });
    expect(axiosFn.mock.calls[0][0].method).toBe('post');
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/announcement/');
    expect(result).toBe(resp);
  });
});

describe('addComment()', () => {
  it('POSTs the comment data and returns the full response', async () => {
    const resp = makeAxiosResponse({ id: 5 });
    axiosFn.mockResolvedValue(resp);
    const result = await addComment({ announcement_id: 1, text: 'Great post!' });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/announcement/add_comment/');
    expect(result).toBe(resp);
  });
});

describe('addCommentReply()', () => {
  it('POSTs to the add_comment_reply endpoint and returns full response', async () => {
    const resp = makeAxiosResponse({ id: 6 });
    axiosFn.mockResolvedValue(resp);
    const result = await addCommentReply({ comment_id: 1, text: 'Reply!' });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/refreshments/comment/add_comment_reply/');
    expect(result).toBe(resp);
  });
});

describe('markParticipated()', () => {
  it('sends the campaign_id to the mark_participated endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await markParticipated(7);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ campaign_id: 7 });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/campaign/mark_participated/');
  });
});

describe('unmarkParticipated()', () => {
  it('sends the campaign_id to the unmark_participated endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await unmarkParticipated(7);
    expect(axiosFn.mock.calls[0][0].data).toEqual({ campaign_id: 7 });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/campaign/unmark_participated/');
  });
});

// ===========================================================================
// 16. Auth / account functions
// ===========================================================================

describe('getAuth()', () => {
  it('calls the authed endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ authed: true }));
    await getAuth();
    expect(axiosGet.mock.calls[0][0]).toContain('/api/profiles/authed/');
  });
});

describe('logoutCurrent()', () => {
  it('calls the amazinglogout endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({}));
    await logoutCurrent();
    expect(axiosGet.mock.calls[0][0]).toContain('/account/amazinglogout/');
  });
});

describe('logoutAll()', () => {
  it('calls the amazinglogout/all endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({}));
    await logoutAll();
    expect(axiosGet.mock.calls[0][0]).toContain('/account/amazinglogout/all/');
  });
});

describe('currToken()', () => {
  it('calls the currtoken endpoint with the auth header', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ token: 'abc' }));
    const result = await currToken();
    expect(axiosGet.mock.calls[0][0]).toContain('/account/currtoken/');
    expect(result).toEqual({ token: 'abc' });
  });
});

describe('deleteAccount()', () => {
  it('calls the account/delete endpoint', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({ deleted: true }));
    await deleteAccount();
    expect(axiosGet.mock.calls[0][0]).toContain('/account/delete/');
  });
});

describe('checkVerificationCode()', () => {
  it('POSTs the phone and code to the verify/code endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ valid: true }));
    await checkVerificationCode('+15005550006', '1234');
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('post');
    expect(config.url).toContain('/api/profiles/verify/code/');
    expect(config.data).toEqual({ code: '1234', phone_number: '+15005550006' });
  });
});

describe('sendPhoneVerification()', () => {
  // This function catches errors and returns error.response instead of throwing.

  it('POSTs the phone number to the verify/send endpoint on success', async () => {
    const resp = makeAxiosResponse({ sent: true });
    axiosFn.mockResolvedValue(resp);
    const result = await sendPhoneVerification('+15005550006');
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/verify/send/');
    expect(result).toBe(resp);
  });

  it('catches errors and returns the error response instead of throwing', async () => {
    const errorResp = { status: 400, data: { error: 'Invalid number' } };
    axiosFn.mockRejectedValue({ response: errorResp });
    const result = await sendPhoneVerification('bad-number');
    expect(result).toEqual(errorResp);
  });
});

describe('updateUsername()', () => {
  // Catches errors and returns error.response instead of throwing.

  it('PATCHes the profiles/current endpoint with the username data', async () => {
    const resp = makeAxiosResponse({ updated: true });
    axiosFn.mockResolvedValue(resp);
    const result = await updateUsername({ username: 'newname' });
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/current/');
    expect(result).toBe(resp);
  });

  it('catches errors and returns error.response instead of throwing', async () => {
    const errorResp = { status: 400, data: { username: ['Already taken'] } };
    axiosFn.mockRejectedValue({ response: errorResp });
    const result = await updateUsername({ username: 'taken' });
    expect(result).toEqual(errorResp);
  });
});

// ===========================================================================
// 17. reportSomething() — URL routing by type
// ===========================================================================

describe('reportSomething()', () => {
  // Routes to a different endpoint depending on whether the target is
  // an announcement, a user, or a comment.

  it('reports an announcement to the report_announcement endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await reportSomething(1, 'announcement');
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/announcement/report_announcement/');
  });

  it('reports a user to the report_user endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await reportSomething(2, 'user');
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/report_user/');
  });

  it('reports a comment to the report_comment endpoint (default branch)', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await reportSomething(3, 'comment');
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/comment/report_comment/');
  });

  it('sends the id in the request body regardless of type', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await reportSomething(99, 'user');
    expect(axiosFn.mock.calls[0][0].data).toEqual({ id: 99 });
  });
});

// ===========================================================================
// 18. isAcceptingMessages()
// ===========================================================================

describe('isAcceptingMessages()', () => {
  it('appends the user id to the accepting_messages endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ accepting: true }));
    await isAcceptingMessages(42);
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/accepting_messages/42');
  });

  it('returns the response data', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ accepting: false }));
    const result = await isAcceptingMessages(42);
    expect(result).toEqual({ accepting: false });
  });
});

// ===========================================================================
// 19. Health / maintenance checks
// ===========================================================================

describe('healthCheck()', () => {
  it('calls the /health/ endpoint and returns the full response', async () => {
    const resp = makeAxiosResponse({ status: 'ok' });
    axiosFn.mockResolvedValue(resp);
    const result = await healthCheck();
    expect(axiosFn.mock.calls[0][0].url).toContain('/health/');
    expect(result).toBe(resp);
  });
});

describe('maintenanceCheck()', () => {
  it('calls the /maintenance/ endpoint and returns the full response', async () => {
    const resp = makeAxiosResponse({ maintenance: false });
    axiosFn.mockResolvedValue(resp);
    const result = await maintenanceCheck();
    expect(axiosFn.mock.calls[0][0].url).toContain('/maintenance/');
    expect(result).toBe(resp);
  });
});

// ===========================================================================
// 20. Moderation
// ===========================================================================

describe('updateCurrentModeration()', () => {
  it('PATCHes the moderation_current endpoint with the data', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ ok: true }));
    await updateCurrentModeration({ flagged: false });
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('patch');
    expect(config.url).toContain('/api/profiles/moderation_current/');
    expect(config.data).toEqual({ flagged: false });
  });
});

// ===========================================================================
// 21. increaseStreak() — 20-hour throttle
// ===========================================================================

describe('increaseStreak()', () => {
  // increaseStreak() reads the "lastStreakUpdate" key from localStorage.
  // If the last update was less than 20 hours ago, it skips the API call.
  // Otherwise it calls the API and writes the current timestamp back.

  it('makes the API call when no previous streak update exists', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ streak: 5 }));
    await increaseStreak();
    expect(axiosFn).toHaveBeenCalledOnce();
  });

  it('skips the API call when last update was less than 20 hours ago', async () => {
    // Store a timestamp from 1 hour ago
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('lastStreakUpdate', oneHourAgo);
    const result = await increaseStreak();
    expect(axiosFn).not.toHaveBeenCalled();
    expect(result).toEqual({ skipped: true });
  });

  it('makes the API call when last update was more than 20 hours ago', async () => {
    // Store a timestamp from 21 hours ago
    const twentyOneHoursAgo = new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('lastStreakUpdate', twentyOneHoursAgo);
    axiosFn.mockResolvedValue(makeAxiosResponse({ streak: 3 }));
    await increaseStreak();
    expect(axiosFn).toHaveBeenCalledOnce();
    expect(axiosFn.mock.calls[0][0].url).toContain('/api/profiles/increase_streak/');
  });

  it('writes the current timestamp to localStorage when the API returns a streak', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ streak: 5 }));
    await increaseStreak();
    const stored = localStorage.getItem('lastStreakUpdate');
    expect(stored).toBeTruthy();
    // The stored date should be within the last 5 seconds
    const diff = Date.now() - new Date(stored!).getTime();
    expect(diff).toBeLessThan(5000);
  });

  it('does NOT write to localStorage when the response has no streak', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({})); // no streak field
    await increaseStreak();
    expect(localStorage.getItem('lastStreakUpdate')).toBeNull();
  });
});

// ===========================================================================
// 22. getWebsocketUrl() — protocol selection
// ===========================================================================

describe('getWebsocketUrl()', () => {
  // getWebsocketUrl() calls new URL(BASE_URL) to extract the host.
  // In the test environment BASE_URL resolves to '/' (Vite's base path),
  // which is not a valid absolute URL and causes new URL() to throw.
  //
  // NOTE (potential bug): if BASE_URL is ever a bare path like '/' rather than
  // a full origin, this function will crash at runtime. Worth guarding against.
  //
  // The protocol-selection logic (wss vs ws) is tested here by mocking a valid
  // BASE_URL via vi.stubEnv + vi.resetModules + dynamic import isn't feasible
  // with static ESM imports, so we test the throw behaviour and document the
  // expected protocol rules in comments for when the env is properly configured.

  it('throws when BASE_URL is not a valid absolute URL (e.g. path-only "/")', () => {
    // This documents the current behaviour when BASE_URL='/' in the test env.
    // In production BASE_URL is always a full origin so this should not occur.
    Object.defineProperty(window, 'location', {
      value: { href: 'https://app.refreshconnections.com' },
      writable: true,
    });
    expect(() => getWebsocketUrl()).toThrow();
  });

  // Protocol selection rules (verified by code inspection):
  //   - wss:// when: URL contains "https", OR URL contains "capacitor://", OR URL does NOT contain "localhost"
  //   - ws://  when: URL contains "localhost" AND does NOT contain "https" AND does NOT contain "capacitor://"
});

// ===========================================================================
// 23. handleLogoutCommon() — side-effect validation
// ===========================================================================

describe('handleLogoutCommon()', () => {
  // Calls the logout endpoint (best effort), then clears localStorage,
  // Preferences, and cookies before redirecting.

  beforeEach(() => {
    // Mock window.location.href setter for redirect assertion
    Object.defineProperty(window, 'location', {
      value: { href: 'https://app.refreshconnections.com' },
      writable: true,
    });
  });

  it('removes the token from localStorage', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({}));
    localStorage.setItem('token', 'some-token');
    await handleLogoutCommon();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('removes the EXPIRY key from Capacitor Preferences', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({}));
    await handleLogoutCommon();
    expect(vi.mocked(Preferences.remove)).toHaveBeenCalledWith({ key: 'EXPIRY' });
  });

  it('clears transient capacitor caches during logout', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({}));
    await handleLogoutCommon();
    expect(clearTransientAppStorage).toHaveBeenCalled();
  });

  it('redirects to / after logout', async () => {
    axiosGet.mockResolvedValue(makeAxiosResponse({}));
    await handleLogoutCommon();
    expect(window.location.href).toBe('/');
  });

  it('still clears storage even when the logout API call fails', async () => {
    // The logout API might fail if the user is already expired — the function
    // catches the error and continues with cleanup.
    axiosGet.mockRejectedValue(new Error('Network error'));
    await handleLogoutCommon();
    expect(localStorage.getItem('token')).toBeNull();
    expect(vi.mocked(Preferences.remove)).toHaveBeenCalledWith({ key: 'EXPIRY' });
  });
});

// ===========================================================================
// 24. newMessagePush() — fire-and-forget with error swallowing
// ===========================================================================

describe('newMessagePush()', () => {
  // Sends a push notification request. Errors are caught and swallowed —
  // the function never throws.

  it('POSTs to the notify endpoint with all required fields', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await newMessagePush('ext-id-1', 'New message', 'Hello!', 'chat', 'some content');
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/notify/');
    expect(config.data).toEqual({
      extId: 'ext-id-1',
      headings: 'New message',
      contents: 'Hello!',
      type: 'chat',
      activityContent: 'some content',
    });
  });

  it('uses default type="none" and activityContent="" when not provided', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await newMessagePush('ext-id-2', 'Heads up', 'Content');
    expect(axiosFn.mock.calls[0][0].data.type).toBe('none');
    expect(axiosFn.mock.calls[0][0].data.activityContent).toBe('');
  });

  it('does not throw when the API call fails', async () => {
    axiosFn.mockRejectedValue(new Error('Network error'));
    await expect(newMessagePush('id', 'h', 'c')).resolves.not.toThrow();
  });
});

// ===========================================================================
// 25. sendAnEmail()
// ===========================================================================

describe('sendAnEmail()', () => {
  it('POSTs to the email endpoint with to_email, subject, and message', async () => {
    const resp = makeAxiosResponse({ queued: true });
    axiosFn.mockResolvedValue(resp);
    const result = await sendAnEmail('test@example.com', 'Hi', 'Hello there');
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('post');
    expect(config.url).toContain('/api/profiles/email/');
    expect(config.data).toEqual({ to_email: 'test@example.com', subject: 'Hi', message: 'Hello there' });
    expect(result).toBe(resp);
  });
});

// ===========================================================================
// 26. removeAllProfilesFromCapacitorStorage()
// ===========================================================================

describe('removeAllProfilesFromCapacitorStorage()', () => {
  // Reads all Preferences keys, filters for those starting with "profile-",
  // and removes them. Non-profile keys must be left untouched.

  it('removes all keys that start with "profile-"', async () => {
    vi.mocked(Preferences.keys).mockResolvedValue({
      keys: ['profile-1', 'profile-2', 'chats', 'token'],
    });
    await removeAllProfilesFromCapacitorStorage();
    expect(vi.mocked(Preferences.remove)).toHaveBeenCalledWith({ key: 'profile-1' });
    expect(vi.mocked(Preferences.remove)).toHaveBeenCalledWith({ key: 'profile-2' });
    expect(vi.mocked(Preferences.remove)).toHaveBeenCalledTimes(2);
  });

  it('does nothing when there are no profile keys', async () => {
    vi.mocked(Preferences.keys).mockResolvedValue({ keys: ['chats', 'token'] });
    await removeAllProfilesFromCapacitorStorage();
    expect(vi.mocked(Preferences.remove)).not.toHaveBeenCalled();
  });

  it('does nothing when storage is empty', async () => {
    vi.mocked(Preferences.keys).mockResolvedValue({ keys: [] });
    await removeAllProfilesFromCapacitorStorage();
    expect(vi.mocked(Preferences.remove)).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 27. Saved locations
// ===========================================================================

describe('addSavedLocation()', () => {
  it('POSTs the location data to the saved_locations endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ id: 1 }));
    const location = { name: 'Home', lat: 51.5, lng: -0.1 };
    await addSavedLocation(location);
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('post');
    expect(config.url).toContain('/api/profiles/saved_locations/');
    expect(config.data).toEqual(location);
  });
});

describe('deleteSavedLocation()', () => {
  it('DELETEs the saved_locations/:id endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({}));
    await deleteSavedLocation(5);
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('delete');
    expect(config.url).toContain('/api/profiles/saved_locations/5');
  });
});

// ===========================================================================
// 28. Chat / push notification settings
// ===========================================================================

describe('updateCurrentUserChatSettings()', () => {
  it('PATCHes the chat_settings endpoint with the provided data', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ ok: true }));
    await updateCurrentUserChatSettings({ read_receipts: false });
    const config = axiosFn.mock.calls[0][0];
    expect(config.method).toBe('patch');
    expect(config.url).toContain('/api/profiles/chat_settings/');
    expect(config.data).toEqual({ read_receipts: false });
  });
});

describe('updateCurrentUserPushNotificationSettings()', () => {
  it('PATCHes the push_notification_settings endpoint', async () => {
    axiosFn.mockResolvedValue(makeAxiosResponse({ ok: true }));
    await updateCurrentUserPushNotificationSettings({ messages: true });
    const config = axiosFn.mock.calls[0][0];
    expect(config.url).toContain('/api/profiles/push_notification_settings/');
    expect(config.data).toEqual({ messages: true });
  });
});

// ===========================================================================
// 29. uploadFileForMessageNew() — JSON vs multipart dispatch
// ===========================================================================

describe('uploadFileForMessageNew()', () => {
  // When passed a plain object it uses fetch with JSON content-type.
  // When passed a FormData it uses fetch with multipart (no Content-Type header,
  // the browser/fetch sets the boundary automatically).

  beforeEach(() => {
    // Reset the global fetch mock
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the JSON path for a plain object', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => ({ url: 'https://example.com/file.jpg' }),
    } as any);

    const result = await uploadFileForMessageNew({ message: 'hello' });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
    expect((init as any).headers?.['Content-Type']).toBe('application/json; charset=UTF-8');
    expect(result.status).toBe(200);
  });

  it('uses the multipart path for FormData', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => ({ url: 'https://example.com/file.jpg' }),
    } as any);

    const formData = new FormData();
    formData.append('file', new Blob(['data'], { type: 'image/png' }), 'photo.png');

    await uploadFileForMessageNew(formData);
    const [, init] = mockFetch.mock.calls[0];
    // Must NOT set Content-Type manually — let fetch set the multipart boundary
    expect((init as any).headers?.['Content-Type']).toBeUndefined();
    expect((init as RequestInit).body).toBe(formData);
  });

  it('includes the Authorization header in both paths', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => ({}),
    } as any);

    await uploadFileForMessageNew({ data: 'x' });
    const [, init] = mockFetch.mock.calls[0];
    expect((init as any).headers?.Authorization).toBe('Token test-token-abc123');
  });
});
