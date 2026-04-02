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
import { IonApp } from '@ionic/react';
import { vi, describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import TextModal from './TextModal';
import { useWebSocketContext } from './WebsocketContext';
import {
  newMessagePush,
  uploadFileForMessage,
  uploadFileForMessageNew,
  markAllInChatAsRead,
  increaseStreak,
  heartMessage,
  unheartMessage,
  removeMessage,
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
const mockPresentAlert = vi.fn();
const mockPresentModal = vi.fn();
const mockDismissModal = vi.fn();

let mockIsConnected = true;
let mockHasNextPage = false;
let mockOverallUnread = 0;

const mockMessages: { pages: any[]; hasNextPage: boolean } = {
  pages: [{ data: [] }],
  hasNextPage: false,
};

const mockCurrentUser = {
  user: 'current-user',
  subscription_level: 'free',
  settings_streak_tracker: false,
};

const mockRouterPush = vi.fn();

const mockChatSettings = {
  allow_images_global: true,
  allow_audio_global: true,
};
const mockYourChatSettings = {
  ...mockChatSettings,
  conversation_starter: false,
  conversation_starter_text: '',
};
const mockOtherChatSettings = {
  ...mockChatSettings,
  conversation_starter: false,
  conversation_starter_text: '',
};

// ---------------------------------------------------------------------------
// vi.mock declarations (hoisted to top of module by vitest)
// ---------------------------------------------------------------------------

vi.mock('./WebsocketContext', () => ({
  useWebSocketContext: () => ({
    send: mockSend,
    addListener: mockAddListener,
    isConnected: mockIsConnected,
    connect: mockConnect,
  }),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonRouter: () => ({ push: mockRouterPush }),
    useIonModal: (component: any, modalProps: any) => [
      (...args: any[]) => mockPresentModal(component?.name ?? 'AnonymousModal', modalProps, ...args),
      (...args: any[]) => mockDismissModal(...args),
    ],
  };
});

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

const mockFetchNextPage = vi.fn();

vi.mock('../hooks/api/chats/messages-inf', () => ({
  useMessagesInf: () => ({
    data: mockMessages,
    isPending: false,
    fetchStatus: 'idle',
    hasNextPage: mockHasNextPage,
    fetchNextPage: mockFetchNextPage,
  }),
}));

vi.mock('../hooks/api/chats/message-file', () => ({
  useMessageFile: () => ({ data: null, isLoading: false }),
}));

vi.mock('../hooks/api/chats/chat-settings', () => ({
  useChatSettings: (userId?: string | number) => ({
    data: userId ? mockOtherChatSettings : mockYourChatSettings,
  }),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentUser }),
}));

vi.mock('../hooks/api/profiles/current-limits', () => ({
  useGetLimits: () => ({ data: { chats_removed: 0 } }),
}));

vi.mock('../hooks/api/chats/unread-count', () => ({
  useGetUnreadCount: () => ({ data: mockOverallUnread }),
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

vi.mock('./ProfileModal', () => ({ default: function ProfileModal() { return null; } }));
vi.mock('./AttachmentsInfoModal', () => ({ default: function AttachmentsInfoModal() { return null; } }));
vi.mock('./ConversationStarterCard', () => ({
  default: ({ their_conversation_starter_text, your_conversation_starter_text }: any) => (
    <div>
      starter:{their_conversation_starter_text}:{your_conversation_starter_text}
    </div>
  ),
}));
vi.mock('./ConversationContextCard', () => ({
  default: ({ their_conversation_starter_text, your_conversation_starter_text }: any) => (
    <div>
      context:{their_conversation_starter_text}:{your_conversation_starter_text}
    </div>
  ),
}));
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
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <TextModal {...defaultProps} {...props} />
      </QueryClientProvider>
    </IonApp>
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
    mockIsConnected = true;
    mockHasNextPage = false;
    mockOverallUnread = 0;
    mockCurrentUser.user = 'current-user';
    mockMessages.pages = [{ data: [] }];
    mockMessages.pages[0].count = 0;
    mockYourChatSettings.conversation_starter = false;
    mockYourChatSettings.conversation_starter_text = '';
    mockOtherChatSettings.conversation_starter = false;
    mockOtherChatSettings.conversation_starter_text = '';
  });

  // -------------------------------------------------------------------------
  // Helper: build a minimal message object for list-rendering tests
  // -------------------------------------------------------------------------

  const makeMessage = (overrides: any = {}) => ({
    id: 1,
    out: false,
    text: 'hello',
    file: null,
    is_removed: false,
    heart: false,
    sent: 1700000000,
    sender: 42,
    sender_username: 'them',
    edited: 0,
    read: true,
    recipient: DEFAULT_OTHER_USER_ID,
    ...overrides,
  });

  // -------------------------------------------------------------------------
  // Smoke test
  // -------------------------------------------------------------------------

  it('renders without crashing', () => {
    const { container } = renderWithClient();
    expect(container).toBeTruthy();
  });

  it('marks the chat as read and invalidates unread-related queries when unreadCount is present', async () => {
    renderWithClient({ unreadCount: 2 });

    await waitFor(() => {
      expect(markAllInChatAsRead).toHaveBeenCalledWith(DEFAULT_OTHER_USER_ID);
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['unread'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chats', 'details', 1],
    });
  });

  it('marks the chat as read when overall unread count exists even if unreadCount prop is zero', async () => {
    mockOverallUnread = 4;

    renderWithClient({ unreadCount: 0 });

    await waitFor(() => {
      expect(markAllInChatAsRead).toHaveBeenCalledWith(DEFAULT_OTHER_USER_ID);
    });
  });

  it('does not mark the chat as read when no unread counts exist', async () => {
    renderWithClient({ unreadCount: 0 });

    await waitFor(() => {
      expect(markAllInChatAsRead).not.toHaveBeenCalled();
    });
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

    it('does not call push or send a read receipt for a different other user while the modal is open', () => {
      renderWithClient();
      const listenerCb = getCapturedListener();

      act(() => {
        listenerCb({ msg_type: 8, sender: '999', db_id: 201 });
      });

      expect(newMessagePush).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalledWith(
        expect.objectContaining({ msg_type: 6 })
      );
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
      mockPresentAlert.mockReset();
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

    const openImageAttachment = async (container: HTMLElement) => {
      const paperclipBtn = container.querySelector('.message-attachments') as HTMLElement;
      expect(paperclipBtn).toBeTruthy();
      fireEvent.click(paperclipBtn);

      const imageBtn = container.querySelector('[shape="round"]') as HTMLElement;
      expect(imageBtn).toBeTruthy();
      fireEvent.click(imageBtn);

      await waitFor(() => {
        expect(screen.getByAltText('uploaded image')).toBeInTheDocument();
      });

      return container.querySelector('.message-send[color="tertiary"]') as HTMLElement;
    };

    it('clears the image preview after a successful image send so blob does not persist', async () => {
      const { container } = renderWithClient();

      const sendBtn = await openImageAttachment(container);
      expect(sendBtn).toBeTruthy();

      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.queryByAltText('uploaded image')).not.toBeInTheDocument();
      });

      // uploadFileForMessageNew should have been called exactly once
      expect(uploadFileForMessageNew).toHaveBeenCalledTimes(1);
    });

    it('does not call uploadFileForMessageNew a second time if send is triggered again after image is cleared', async () => {

      const { container } = renderWithClient();

      const sendBtn = await openImageAttachment(container);

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

    it('falls back to a smaller multipart upload when the initial multipart upload fails', async () => {
      vi.mocked(uploadFileForMessageNew)
        .mockRejectedValueOnce(new Error('too large'))
        .mockResolvedValueOnce({ status: 200, data: { id: 101 } } as any);

      const { container } = renderWithClient();
      const sendBtn = await openImageAttachment(container);

      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.queryByAltText('uploaded image')).not.toBeInTheDocument();
      });

      expect(uploadFileForMessageNew).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ msg_type: 4, file_id: 101, user_pk: DEFAULT_OTHER_USER_ID })
      );
    });

    it('falls back to the base64 upload path when both multipart uploads fail', async () => {
      vi.mocked(uploadFileForMessageNew)
        .mockRejectedValueOnce(new Error('too large'))
        .mockRejectedValueOnce(new Error('still too large'))
        .mockResolvedValueOnce({ status: 200, data: { id: 202 } } as any);

      const { container } = renderWithClient();
      const sendBtn = await openImageAttachment(container);

      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(uploadFileForMessageNew).toHaveBeenCalledTimes(3);
      });

      const thirdCall = vi.mocked(uploadFileForMessageNew).mock.calls[2][0];
      expect(thirdCall).toEqual(
        expect.objectContaining({
          file: expect.stringMatching(/^data:image\/jpeg;base64,/),
        })
      );
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ msg_type: 4, file_id: 202, user_pk: DEFAULT_OTHER_USER_ID })
      );
    });

    it('shows the attachment error toast when every image upload fallback fails', async () => {
      vi.mocked(uploadFileForMessageNew)
        .mockRejectedValueOnce(new Error('too large'))
        .mockRejectedValueOnce(new Error('still too large'))
        .mockResolvedValueOnce({ status: 500, data: {} } as any)
        .mockResolvedValueOnce({ status: 500, data: {} } as any);

      const { container } = renderWithClient();
      const sendBtn = await openImageAttachment(container);

      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(document.querySelector('ion-toast')?.getAttribute('message')).toBe(
          'Your attachment is having troubles sending right now. Try again later.'
        );
      });
    });

    it('shows a confirm alert when opening the photo picker fails', async () => {
      vi.mocked(Camera.getPhoto).mockRejectedValueOnce(new Error('No permission'));

      const { container } = renderWithClient();
      const paperclipBtn = container.querySelector('.message-attachments') as HTMLElement;
      fireEvent.click(paperclipBtn);

      const imageBtn = container.querySelector('[shape="round"]') as HTMLElement;
      fireEvent.click(imageBtn);

      await waitFor(() => {
        expect(mockPresentAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            header: expect.stringContaining('Photo picker failed. Please check Photos permissions in Settings.'),
          })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Text message send flow
  // -------------------------------------------------------------------------

  describe('Text message send flow', () => {
    /** Dispatches an ionInput custom event on an ion-textarea, matching Ionic's API. */
    const ionInput = (el: HTMLElement, value: string) => {
      fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
    };

    it('sends a text message via WebSocket when user types and clicks send', () => {
      const { container } = renderWithClient();
      const textarea = container.querySelector('ion-textarea[name="message_input"]') as HTMLElement;
      expect(textarea).toBeTruthy();

      ionInput(textarea, 'hello world');

      const sendBtn = container.querySelector('.message-send[color="tertiary"]') as HTMLElement;
      fireEvent.click(sendBtn);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          msg_type: 3,
          text: 'hello world',
          user_pk: DEFAULT_OTHER_USER_ID,
        })
      );
    });

    it('clears the textarea after sending', () => {
      const { container } = renderWithClient();
      const textarea = container.querySelector('ion-textarea[name="message_input"]') as HTMLElement;

      ionInput(textarea, 'test message');

      const sendBtn = container.querySelector('.message-send[color="tertiary"]') as HTMLElement;
      fireEvent.click(sendBtn);

      expect(textarea.getAttribute('value')).toBeFalsy();
    });

    it('increases streak when settings_streak_tracker is enabled', async () => {
      mockCurrentUser.settings_streak_tracker = true;
      const { container } = renderWithClient();
      const textarea = container.querySelector('ion-textarea[name="message_input"]') as HTMLElement;

      ionInput(textarea, 'streak test');

      const sendBtn = container.querySelector('.message-send[color="tertiary"]') as HTMLElement;
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(increaseStreak).toHaveBeenCalledTimes(1);
      });

      mockCurrentUser.settings_streak_tracker = false;
    });

    it('marks the chat list for refresh when dismissing after sending a message from the modal', () => {
      const { container } = renderWithClient();
      const textarea = container.querySelector('ion-textarea[name="message_input"]') as HTMLElement;
      const backIcon = container.querySelector('.message-back') as HTMLElement;

      ionInput(textarea, 'refresh after send');

      const sendBtn = container.querySelector('.message-send[color="tertiary"]') as HTMLElement;
      fireEvent.click(sendBtn);
      fireEvent.click(backIcon);

      expect(defaultProps.onDismiss).toHaveBeenCalledWith({ refreshChatList: true });
    });
  });

  // -------------------------------------------------------------------------
  // Back button
  // -------------------------------------------------------------------------

  describe('Back button', () => {
    it('calls onDismiss with refreshChatList false when the back button is clicked and nothing changed', () => {
      const { container } = renderWithClient();
      const backIcon = container.querySelector('.message-back') as HTMLElement;
      expect(backIcon).toBeTruthy();
      fireEvent.click(backIcon);
      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
      expect(defaultProps.onDismiss).toHaveBeenCalledWith({ refreshChatList: false });
    });

    it('calls onDismiss with refreshChatList true after an incoming message from another user while open', () => {
      const { container } = renderWithClient();
      const listenerCb = getCapturedListener();
      const backIcon = container.querySelector('.message-back') as HTMLElement;

      act(() => {
        listenerCb({ msg_type: 8, sender: '999', db_id: 300 });
      });

      fireEvent.click(backIcon);

      expect(defaultProps.onDismiss).toHaveBeenCalledWith({ refreshChatList: true });
    });

    it('keeps refreshChatList false when only our own websocket confirmation arrives', () => {
      const { container } = renderWithClient();
      const listenerCb = getCapturedListener();
      const backIcon = container.querySelector('.message-back') as HTMLElement;

      act(() => {
        listenerCb({ msg_type: 8, sender: 'current-user', db_id: 301 });
      });

      fireEvent.click(backIcon);

      expect(defaultProps.onDismiss).toHaveBeenCalledWith({ refreshChatList: false });
    });
  });

  describe('Header profile modal', () => {
    it('opens the profile modal from the header and passes through profile details and settingsAlt', () => {
      renderWithClient({ settingsAlt: true, from_name: 'Alice' });

      fireEvent.click(screen.getByText('Test User'));

      expect(mockPresentModal).toHaveBeenCalledWith(
        'ProfileModal',
        expect.objectContaining({
          cardData: expect.objectContaining({ name: 'Test User' }),
          profiletype: 'connected',
          settingsAlt: true,
          yourName: 'Alice',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Disconnected state
  // -------------------------------------------------------------------------

  describe('Disconnected state', () => {
    it('shows "Trying to reconnect…" text when websocket is disconnected', () => {
      mockIsConnected = false;
      const { container } = renderWithClient();
      expect(container.textContent).toContain('Trying to reconnect');
    });

    it('does not show the Reconnect button before the 10-second timeout elapses', async () => {
      vi.useFakeTimers();
      mockIsConnected = false;
      renderWithClient();

      await act(async () => {
        vi.advanceTimersByTime(9000);
      });

      expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
      expect(screen.getByText('Trying to reconnect…')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('calls connect() when the Reconnect button is clicked', async () => {
      vi.useFakeTimers();
      mockIsConnected = false;
      renderWithClient();

      // Fast-forward past the 10-second delay before the Reconnect button appears
      await act(async () => {
        vi.advanceTimersByTime(11000);
      });

      const reconnectBtn = screen.getByText('Reconnect');
      fireEvent.click(reconnectBtn);
      expect(mockConnect).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('Conversation starter and context helpers', () => {
    it('shows the starter card when the chat is empty and the other person has a starter prompt', () => {
      mockMessages.pages = [{ count: 0, data: [] }];
      mockOtherChatSettings.conversation_starter = true;
      mockOtherChatSettings.conversation_starter_text = 'Ask me about mask blocs';
      mockYourChatSettings.conversation_starter = true;
      mockYourChatSettings.conversation_starter_text = 'Ask me about books';

      renderWithClient();

      expect(screen.getByText('starter:Ask me about mask blocs:Ask me about books')).toBeInTheDocument();
    });

    it('shows and hides the context card for short existing conversations with starter text', () => {
      mockMessages.pages = [{ count: 2, data: [makeMessage({ id: 2 }), makeMessage({ id: 1 })] }];
      mockOtherChatSettings.conversation_starter = true;
      mockOtherChatSettings.conversation_starter_text = 'Ask me about mask blocs';
      mockYourChatSettings.conversation_starter = true;
      mockYourChatSettings.conversation_starter_text = 'Ask me about books';

      renderWithClient();

      fireEvent.click(screen.getByText('Need Context?'));
      expect(screen.getByText('context:Ask me about mask blocs:Ask me about books')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Hide Context'));
      expect(screen.queryByText('context:Ask me about mask blocs:Ask me about books')).not.toBeInTheDocument();
    });

    it('does not show the context helper when the latest row is a system heart message', () => {
      mockMessages.pages = [{ count: 2, data: [makeMessage({ id: 2 }), makeMessage({ id: -1, text: 'liked this' })] }];
      mockOtherChatSettings.conversation_starter = true;
      mockOtherChatSettings.conversation_starter_text = 'Ask me about mask blocs';
      mockYourChatSettings.conversation_starter = true;
      mockYourChatSettings.conversation_starter_text = 'Ask me about books';

      renderWithClient();

      expect(screen.queryByText('Need Context?')).not.toBeInTheDocument();
      expect(screen.queryByText(/context:/)).not.toBeInTheDocument();
    });

    it('does not show the context helper for longer conversations', () => {
      mockMessages.pages = [{
        count: 10,
        data: [makeMessage({ id: 10 }), makeMessage({ id: 9 }), makeMessage({ id: 8 })],
      }];
      mockOtherChatSettings.conversation_starter = true;
      mockOtherChatSettings.conversation_starter_text = 'Ask me about mask blocs';
      mockYourChatSettings.conversation_starter = true;
      mockYourChatSettings.conversation_starter_text = 'Ask me about books';

      renderWithClient();

      expect(screen.queryByText('Need Context?')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // "See more" button
  // -------------------------------------------------------------------------

  describe('"See more" button', () => {
    it('shows "See more" button when there are more pages to load', () => {
      mockHasNextPage = true;
      renderWithClient();
      expect(screen.getByText('See more')).toBeInTheDocument();
    });

    it('calls fetchNextPage when "See more" is clicked', () => {
      mockHasNextPage = true;
      renderWithClient();
      fireEvent.click(screen.getByText('See more'));
      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('does not show "See more" button when hasNextPage is false', () => {
      renderWithClient();
      expect(screen.queryByText('See more')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Message list rendering
  // -------------------------------------------------------------------------

  describe('Message list rendering', () => {
    it('renders a text message', () => {
      mockMessages.pages = [{ data: [makeMessage({ text: 'Hey there!' })] }];
      renderWithClient();
      expect(screen.getByText('Hey there!')).toBeInTheDocument();
    });

    it('renders a removed message', () => {
      mockMessages.pages = [{ data: [makeMessage({ is_removed: true, text: null })] }];
      const { container } = renderWithClient();
      expect(container.querySelector('.removed-item')).toBeTruthy();
    });

    it('renders an incoming hearted message with a filled heart', () => {
      mockMessages.pages = [{ data: [makeMessage({ out: false, heart: true })] }];
      const { container } = renderWithClient();
      expect(container.querySelector('.in-heart-red')).toBeTruthy();
    });

    it('renders an outgoing hearted message with a filled heart', () => {
      mockMessages.pages = [{ data: [makeMessage({ out: true, heart: true })] }];
      const { container } = renderWithClient();
      expect(container.querySelector('.out-heart-red')).toBeTruthy();
    });

    it('renders a liked message (id === -1) with the conversation-heart icon', () => {
      mockMessages.pages = [{ data: [makeMessage({ id: -1, text: 'liked this' })] }];
      const { container } = renderWithClient();
      // The faCommentHeart SVG is rendered before the message text
      expect(screen.getByText('liked this')).toBeInTheDocument();
      expect(container.querySelector('svg[data-icon="comment-heart"]')).toBeTruthy();
    });

    it('renders a file attachment message', () => {
      mockMessages.pages = [{ data: [makeMessage({ text: null, file: '99' })] }];
      const { container } = renderWithClient();
      // MessageAttachment renders a fallback img when file data hasn't loaded
      expect(container.querySelector('img[alt="audio message isn\'t loading"]')).toBeTruthy();
    });
  });

  describe('Message heart interactions', () => {
    it('reveals an outline heart when an incoming unhearted message is tapped', async () => {
      mockMessages.pages = [{ data: [makeMessage({ id: 101, out: false, heart: false, text: 'tap me' })] }];
      const { container } = renderWithClient();

      fireEvent.click(screen.getByText('tap me').closest('ion-item') as HTMLElement);

      await waitFor(() => {
        expect(container.querySelector('.in-heart')).toBeTruthy();
      });
    });

    it('likes an incoming unhearted message and then lets you undo that temporary heart', async () => {
      mockMessages.pages = [{ data: [makeMessage({ id: 102, out: false, heart: false, text: 'like me' })] }];
      const { container } = renderWithClient();

      fireEvent.click(screen.getByText('like me').closest('ion-item') as HTMLElement);

      await waitFor(() => {
        expect(container.querySelector('.in-heart')).toBeTruthy();
      });

      fireEvent.click(container.querySelector('.in-heart') as HTMLElement);

      await waitFor(() => {
        expect(heartMessage).toHaveBeenCalledWith(102);
        expect(container.querySelector('.in-heart-red')).toBeTruthy();
      });

      fireEvent.click(container.querySelector('.in-heart-red') as HTMLElement);

      await waitFor(() => {
        expect(unheartMessage).toHaveBeenCalledWith(102);
        expect(container.querySelector('.in-heart-red')).toBeFalsy();
      });
    });

    it('unlikes a hearted incoming message and then re-hearts it from the outline state', async () => {
      mockMessages.pages = [{ data: [makeMessage({ id: 103, out: false, heart: true, text: 'hearted already' })] }];
      const { container } = renderWithClient();

      fireEvent.click(container.querySelector('.in-heart-red') as HTMLElement);

      await waitFor(() => {
        expect(unheartMessage).toHaveBeenCalledWith(103);
        expect(container.querySelector('.in-heart')).toBeTruthy();
      });

      fireEvent.click(container.querySelector('.in-heart') as HTMLElement);

      await waitFor(() => {
        expect(heartMessage).toHaveBeenCalledWith(103);
        expect(container.querySelector('.in-heart-red')).toBeTruthy();
      });
    });

    it('tracks the active heart affordance by message id so matching indexes on different pages do not both open', async () => {
      mockMessages.pages = [
        { data: [makeMessage({ id: 201, out: false, heart: false, text: 'page one' })] },
        { data: [makeMessage({ id: 202, out: false, heart: false, text: 'page two' })] },
      ];
      const { container } = renderWithClient();

      fireEvent.click(screen.getByText('page one').closest('ion-item') as HTMLElement);

      await waitFor(() => {
        expect(container.querySelectorAll('.in-heart').length).toBe(1);
      });

      fireEvent.click(screen.getByText('page two').closest('ion-item') as HTMLElement);

      await waitFor(() => {
        expect(container.querySelectorAll('.in-heart').length).toBe(1);
      });
    });
  });

  describe('Additional non-audio actions', () => {
    it('opens the attachments info modal from the attachment tray', () => {
      const { container } = renderWithClient();

      fireEvent.click(container.querySelector('.message-attachments') as HTMLElement);
      fireEvent.click(container.querySelector('.attachment-buttons ion-button[fill="outline"]') as HTMLElement);

      expect(mockPresentModal).toHaveBeenCalledWith(
        'AttachmentsInfoModal',
        expect.objectContaining({
          onNavigate: expect.any(Function),
        })
      );
    });

    it('navigates to help from the attachments info modal callback', () => {
      const { container } = renderWithClient();

      fireEvent.click(container.querySelector('.message-attachments') as HTMLElement);
      fireEvent.click(container.querySelector('.attachment-buttons ion-button[fill="outline"]') as HTMLElement);

      const modalProps = mockPresentModal.mock.calls.at(-1)?.[1];
      expect(modalProps?.onNavigate).toEqual(expect.any(Function));

      modalProps.onNavigate('/help');

      expect(mockRouterPush).toHaveBeenCalledWith('/help');
    });

    it('confirms and unsends an eligible outgoing message', async () => {
      mockMessages.pages = [{
        count: 1,
        data: [makeMessage({ id: 44, out: true, sender_username: 'you', sent: Math.floor(Date.now() / 1000) })],
      }];

      const { container } = renderWithClient();
      const unsendButton = Array.from(container.querySelectorAll('ion-button')).find((button) =>
        button.textContent?.includes('Unsend')
      ) as HTMLElement;

      fireEvent.click(unsendButton);

      const unsendAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
      expect(unsendAlert.header).toBe('Do you want to unsend this message?');

      await act(async () => {
        await unsendAlert.buttons[1].handler();
      });

      await waitFor(() => {
        expect(removeMessage).toHaveBeenCalledWith(44);
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['limits'] });
    });

    it('shows the early-support notice CTA and routes to help', async () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      renderWithClient({
        textModalData: { other_user_id: '24', id: 1 },
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Get help'));
      });

      await waitFor(() => {
        expect(defaultProps.onDismiss).toHaveBeenCalledWith({ refreshChatList: false });
      });
      await waitFor(() => {
        expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/help');
        expect(dispatchSpy).toHaveBeenCalled();
      });
    });
  });
});
