/**
 * Tests for TextModal component.
 *
 * Covers:
 *   - Bug #1 regression: After sending an image, blob/imageName are cleared so
 *     subsequent sends do NOT re-attach the same image (uploadFileForMessageNew
 *     should only be called once per user-selected image).
 *   - Bug #2 regression: newMessagePush is only called when the incoming WebSocket
 *     msg_type 8 has sender === other_user_id (never for our own outgoing messages
 *     confirmed by the server).
 *   - General smoke test and key WebSocket handler behaviours.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import TextModal from './TextModal';
import { useWebSocketContext } from './WebsocketContext';
import {
  newMessagePush,
  uploadFileForMessage,
  uploadFileForMessageNew,
  markAllInChatAsRead,
  increaseStreak,
} from '../hooks/utilities';
import { Camera } from '@capacitor/camera';

// ---------------------------------------------------------------------------
// Mock variables — must start with "mock" so vitest hoists them alongside
// vi.mock() calls (otherwise ReferenceError in factory functions).
// ---------------------------------------------------------------------------

const mockSend = vi.fn();
// mockAddListener captures the WebSocket listener so tests can fire messages.
// It returns a vi.fn() unsubscribe function, satisfying the useEffect cleanup.
const mockAddListener = vi.fn().mockReturnValue(vi.fn());
const mockConnect = vi.fn();
const mockInvalidateQueries = vi.fn();

const mockMessages = {
  pages: [{ data: [] }],
  hasNextPage: false,
};

const mockCurrentUser = {
  subscription_level: 'free',
  settings_streak_tracker: false,
};

const mockChatSettings = {
  allow_images_global: true,
  allow_audio_global: true,
};

// ---------------------------------------------------------------------------
// vi.mock declarations (hoisted to top of module by vitest)
// ---------------------------------------------------------------------------

vi.mock('@ionic/react', async () => {
  const { createIonicMock } = await import('../test-utils/shared-mocks');
  return createIonicMock();
});

vi.mock('./WebsocketContext', () => ({
  useWebSocketContext: () => ({
    send: mockSend,
    addListener: mockAddListener,
    isConnected: true,
    connect: mockConnect,
  }),
}));

// Keep real QueryClient/QueryClientProvider; only override useQueryClient so
// we can spy on invalidateQueries without actual query network calls.
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

vi.mock('../hooks/utilities', () => ({
  newMessagePush: vi.fn(),
  uploadFileForMessage: vi.fn(),
  uploadFileForMessageNew: vi.fn(),
  markAllInChatAsRead: vi.fn().mockResolvedValue(undefined),
  increaseStreak: vi.fn().mockResolvedValue(undefined),
  getCurrentUserProfile: vi.fn().mockResolvedValue({}),
  getWebsocketUrl: vi.fn(),
  heartMessage: vi.fn().mockResolvedValue(undefined),
  unheartMessage: vi.fn().mockResolvedValue(undefined),
  removeMessage: vi.fn().mockResolvedValue({}),
  isMobile: vi.fn().mockReturnValue(false),
  onImgError: vi.fn(),
  onAttachmentImgError: vi.fn(),
}));

vi.mock('../hooks/api/chats/accepting-messages', () => ({
  useAcceptingMessages: () => ({ data: true, isLoading: false }),
}));

vi.mock('../hooks/api/chats/messages-inf', () => ({
  useMessagesInf: () => ({
    data: mockMessages,
    isPending: false,
    fetchStatus: 'idle',
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}));

vi.mock('../hooks/api/chats/message-file', () => ({
  useMessageFile: () => ({ data: null, isLoading: false }),
}));

vi.mock('../hooks/api/chats/chat-settings', () => ({
  useChatSettings: () => ({ data: mockChatSettings }),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentUser }),
}));

vi.mock('../hooks/api/profiles/current-limits', () => ({
  useGetLimits: () => ({ data: { chats_removed: 0 } }),
}));

vi.mock('../hooks/api/chats/unread-count', () => ({
  useGetUnreadCount: () => ({ data: 0 }),
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Photos: 'photos' },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    convertFileSrc: vi.fn((src: string) => src),
    isNativePlatform: vi.fn().mockReturnValue(false),
    getPlatform: vi.fn().mockReturnValue('web'),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn(),
  },
}));

vi.mock('react-photo-view', () => ({
  PhotoProvider: ({ children }: any) => <>{children}</>,
  PhotoView: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-linkify', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-h5-audio-player', () => ({
  default: () => null,
  RHAP_UI: { MAIN_CONTROLS: 'MAIN_CONTROLS' },
}));

vi.mock('capacitor-voice-recorder', () => ({
  VoiceRecorder: {
    requestAudioRecordingPermission: vi.fn().mockResolvedValue({ value: false }),
    hasAudioRecordingPermission: vi.fn().mockResolvedValue({ value: false }),
    startRecording: vi.fn().mockResolvedValue({}),
    stopRecording: vi.fn().mockResolvedValue({ value: { recordDataBase64: '', mimeType: 'audio/aac' } }),
  },
}));

vi.mock('react-image-file-resizer', () => ({
  default: { imageFileResizer: vi.fn() },
}));

vi.mock('base64-arraybuffer', () => ({
  decode: vi.fn().mockReturnValue(new ArrayBuffer(0)),
}));

vi.mock('./ProfileModal', () => ({ default: () => null }));
vi.mock('./AttachmentsInfoModal', () => ({ default: () => null }));
vi.mock('./ConversationStarterCard', () => ({ default: () => null }));
vi.mock('./ConversationContextCard', () => ({ default: () => null }));
vi.mock('./MessageLikePopover', () => ({ default: () => null }));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const DEFAULT_OTHER_USER_ID = '42';

const defaultProps = {
  textModalData: { other_user_id: DEFAULT_OTHER_USER_ID, id: 1 },
  unreadCount: 0,
  profileDetails: {
    name: 'Test User',
    pic1_main: null,
    deactivated_profile: false,
  },
  pro: false,
  settingsAlt: false,
  from_name: 'Test User',
  onDismiss: vi.fn(),
};

function renderWithClient(props: Partial<typeof defaultProps> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TextModal {...defaultProps} {...props} />
    </QueryClientProvider>
  );
}

/** Returns the listener callback that was registered with addListener. */
function getCapturedListener(): (msg: any) => void {
  expect(mockAddListener).toHaveBeenCalled();
  return mockAddListener.mock.calls[0][0] as (msg: any) => void;
}

// ---------------------------------------------------------------------------
// Canvas / Image environment mocks (needed for the image upload flow tests)
// ---------------------------------------------------------------------------

// We save originals so we can restore them after the image-related describe block.
const origImage = (global as any).Image;
const origToBlob = HTMLCanvasElement.prototype.toBlob;
const origGetContext = HTMLCanvasElement.prototype.getContext;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TextModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure addListener always returns a valid unsubscribe function.
    mockAddListener.mockReturnValue(vi.fn());
  });

  // -------------------------------------------------------------------------
  // Smoke test
  // -------------------------------------------------------------------------

  it('renders without crashing', () => {
    const { container } = renderWithClient();
    expect(container).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Bug #2 regression — push notification must NOT fire for own messages
  //
  // Root cause: newMessagePush was called unconditionally on msg_type === 8,
  // before the `if (msg.sender === textModalData?.other_user_id)` guard.
  // Fix: moved newMessagePush inside that guard.
  // -------------------------------------------------------------------------

  describe('WebSocket msg_type 8 handler (Bug #2: no self-notification)', () => {
    it('does NOT call newMessagePush when server confirms our own outgoing message (sender !== other_user_id)', () => {
      renderWithClient();
      const listenerCb = getCapturedListener();

      // Server echoes back our own outgoing message with a sender value that
      // is NOT the other user's ID (it could be null, undefined, or our own ID).
      act(() => {
        listenerCb({ msg_type: 8, sender: 'current-user', db_id: 100 });
      });

      expect(newMessagePush).not.toHaveBeenCalled();
    });

    it('does NOT send a read receipt (msg_type 6) for our own outgoing message', () => {
      renderWithClient();
      const listenerCb = getCapturedListener();

      act(() => {
        listenerCb({ msg_type: 8, sender: 'current-user', db_id: 100 });
      });

      expect(mockSend).not.toHaveBeenCalledWith(
        expect.objectContaining({ msg_type: 6 })
      );
    });

    it('calls newMessagePush when an incoming message from the other user is delivered', () => {
      renderWithClient();
      const listenerCb = getCapturedListener();

      // sender === other_user_id → this is a message FROM the other user
      act(() => {
        listenerCb({ msg_type: 8, sender: DEFAULT_OTHER_USER_ID, db_id: 200 });
      });

      expect(newMessagePush).toHaveBeenCalledWith(
        [DEFAULT_OTHER_USER_ID],
        'Test User sent you a message',
        'View it in the app!',
        'message'
      );
    });

    it('sends read receipt (msg_type 6) for an incoming message from the other user', () => {
      renderWithClient();
      const listenerCb = getCapturedListener();

      act(() => {
        listenerCb({ msg_type: 8, sender: DEFAULT_OTHER_USER_ID, db_id: 200 });
      });

      expect(mockSend).toHaveBeenCalledWith({
        msg_type: 6,
        user_pk: DEFAULT_OTHER_USER_ID,
        message_id: 200,
      });
    });

    it('calls resetMessages (invalidates queries) for any msg_type 8 regardless of sender', () => {
      renderWithClient();
      const listenerCb = getCapturedListener();

      // Own outgoing message — resetMessages should still fire
      act(() => {
        listenerCb({ msg_type: 8, sender: 'current-user', db_id: 100 });
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['chats', 'messages', parseInt(DEFAULT_OTHER_USER_ID)],
        })
      );
    });

    it('ignores WebSocket messages with non-8 msg_type', () => {
      renderWithClient();
      const listenerCb = getCapturedListener();

      act(() => {
        listenerCb({ msg_type: 3, text: 'hello', sender: DEFAULT_OTHER_USER_ID });
      });

      expect(newMessagePush).not.toHaveBeenCalled();
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it('uses from_name prop in the push notification body', () => {
      renderWithClient({ from_name: 'Alice' });
      const listenerCb = getCapturedListener();

      act(() => {
        listenerCb({ msg_type: 8, sender: DEFAULT_OTHER_USER_ID, db_id: 1 });
      });

      expect(newMessagePush).toHaveBeenCalledWith(
        expect.anything(),
        'Alice sent you a message',
        expect.anything(),
        expect.anything()
      );
    });

    it('falls back to "Someone" in push notification when from_name prop is falsy', () => {
      // @ts-ignore — intentionally passing null to test the fallback
      renderWithClient({ from_name: null });
      const listenerCb = getCapturedListener();

      act(() => {
        listenerCb({ msg_type: 8, sender: DEFAULT_OTHER_USER_ID, db_id: 1 });
      });

      expect(newMessagePush).toHaveBeenCalledWith(
        expect.anything(),
        'Someone sent you a message',
        expect.anything(),
        expect.anything()
      );
    });
  });

  // -------------------------------------------------------------------------
  // Bug #1 regression — image blob must be cleared after a successful send
  //
  // Root cause: finalizeUploadedImage and sendOutgoingTextMessageWithFileAudio
  // called setImage(null) but forgot setBlob(null) and setImageName(null).
  // This meant the blob persisted in state and was re-uploaded on the next send.
  // Fix: both handlers now call setBlob(null) and setImageName(null).
  //
  // Test strategy:
  //   1. Mock Camera, fetch, canvas and Image so uploadPhoto completes without
  //      any real I/O.
  //   2. Click the attachment toggle then the image button — uploadPhoto runs
  //      and sets blob/image state.
  //   3. Verify the image preview appears (image state is set).
  //   4. Click send — sendOutgoingTextMessageWithFileImage → finalizeUploadedImage
  //      → setBlob(null), setImage(null), setImageName(null).
  //   5. Verify the image preview disappears (image state is null).
  //   6. Verify uploadFileForMessageNew was called exactly once — a second send
  //      click (if the button were enabled) would NOT re-upload.
  // -------------------------------------------------------------------------

  describe('Image blob clearing after send (Bug #1)', () => {
    beforeAll(() => {
      // Replace global Image with a minimal stub that fires onload immediately
      // so resizeToJpegBase64 can proceed without a real browser image decode.
      (global as any).Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 100;
        height = 100;
        private _src = '';
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          // Fire onload on the next microtask
          Promise.resolve().then(() => this.onload?.());
        }
      };

      // Override canvas methods so toBlob completes synchronously with a fake blob
      HTMLCanvasElement.prototype.getContext = () =>
        ({ drawImage: vi.fn() } as any);
      HTMLCanvasElement.prototype.toBlob = function (
        cb: BlobCallback,
        _type?: string,
        _quality?: any
      ) {
        cb(new Blob(['fake-jpeg'], { type: 'image/jpeg' }));
      };

      // URL.createObjectURL / revokeObjectURL don't exist in jsdom, so assign
      // them directly rather than using vi.spyOn (which requires existing props).
      (URL as any).createObjectURL = vi.fn().mockReturnValue('blob:preview-url');
      (URL as any).revokeObjectURL = vi.fn();
    });

    afterAll(() => {
      // Restore originals so other test suites are unaffected
      (global as any).Image = origImage;
      HTMLCanvasElement.prototype.toBlob = origToBlob;
      HTMLCanvasElement.prototype.getContext = origGetContext;
      delete (URL as any).createObjectURL;
      delete (URL as any).revokeObjectURL;
    });

    beforeEach(() => {
      // uploadFileForMessageNew succeeds with a file ID of 99
      vi.mocked(uploadFileForMessageNew).mockResolvedValue({
        status: 200,
        data: { id: 99 },
      } as any);

      // Camera returns a webPath (no native path) so uploadPhoto uses webPath
      vi.mocked(Camera.getPhoto).mockResolvedValue({
        path: null as any,
        webPath: 'blob:fake-photo-url',
        format: 'jpeg',
        saved: false,
      });

      // fetch is called with the webPath to get the raw blob
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['fake-img'], { type: 'image/jpeg' })),
      } as any);

      // Reset URL mocks between tests
      ((URL as any).createObjectURL as ReturnType<typeof vi.fn>).mockReturnValue(
        'blob:preview-url'
      );
    });

    afterEach(() => {
      delete (global as any).fetch;
    });

    it('clears the image preview after a successful image send so blob does not persist', async () => {
      const { container } = renderWithClient();

      // ── Step 1: Open the attachment panel via the paperclip button ──────────
      const paperclipBtn = container.querySelector('.message-attachments') as HTMLElement;
      expect(paperclipBtn).toBeTruthy();
      fireEvent.click(paperclipBtn);

      // ── Step 2: Click the image-upload button (first shape="round" button) ──
      // The image button is the first attachment button in the revealed panel.
      const imageBtn = container.querySelector('[shape="round"]') as HTMLElement;
      expect(imageBtn).toBeTruthy();
      fireEvent.click(imageBtn);

      // ── Step 3: Wait for Camera + fetch + canvas pipeline to complete ────────
      // uploadPhoto → Camera.getPhoto → fetch → resizeToJpegBase64 → setBlob/setImage
      await waitFor(() => {
        expect(screen.getByAltText('uploaded image')).toBeInTheDocument();
      });

      // The send button is now enabled (image is set)
      const sendBtn = container.querySelector('.message-send[color="tertiary"]') as HTMLElement;
      expect(sendBtn).toBeTruthy();

      // ── Step 4: Click send ───────────────────────────────────────────────────
      fireEvent.click(sendBtn);

      // ── Step 5: Wait for upload to finish and state to clear ─────────────────
      await waitFor(() => {
        expect(screen.queryByAltText('uploaded image')).not.toBeInTheDocument();
      });

      // uploadFileForMessageNew should have been called exactly once
      expect(uploadFileForMessageNew).toHaveBeenCalledTimes(1);
    });

    it('does not call uploadFileForMessageNew a second time if send is triggered again after image is cleared', async () => {
      const { container } = renderWithClient();

      // Select image
      const paperclipBtn = container.querySelector('.message-attachments') as HTMLElement;
      fireEvent.click(paperclipBtn);
      const imageBtn = container.querySelector('[shape="round"]') as HTMLElement;
      fireEvent.click(imageBtn);

      await waitFor(() => {
        expect(screen.getByAltText('uploaded image')).toBeInTheDocument();
      });

      const sendBtn = container.querySelector('.message-send[color="tertiary"]') as HTMLElement;

      // First send — uploads the image
      fireEvent.click(sendBtn);
      await waitFor(() => {
        expect(screen.queryByAltText('uploaded image')).not.toBeInTheDocument();
      });

      // Second send click — send button is now disabled (no content left), so
      // even if clicked, sendHandler would not call uploadFileForMessageNew again
      // because blob is null.
      fireEvent.click(sendBtn);

      // Should still be exactly 1 call — the blob was cleared after the first send
      expect(uploadFileForMessageNew).toHaveBeenCalledTimes(1);
    });
  });
});
