/**
 * Shared mock utilities for use across all test files.
 *
 * Usage in a test file:
 *   import { makeAxiosResponse, setAuthToken, clearAuthToken } from '../test-utils/shared-mocks';
 *
 * Note: vi.mock() calls must still be declared in each test file because vitest
 * hoists them at compile time. These helpers standardise what those mocks return.
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Axios helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal axios-style resolved response object.
 * Pass this as the resolved value when mocking axios calls.
 *
 * @param data     - The `response.data` value the function under test will receive
 * @param status   - HTTP status code (default 200)
 */
export function makeAxiosResponse<T = any>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

/**
 * Builds an axios-style rejected error with a `response` property.
 * Useful for testing functions that catch errors and return `error.response`.
 *
 * @param status  - HTTP status code (e.g. 400, 401, 422)
 * @param data    - The `error.response.data` value
 */
export function makeAxiosError(status: number, data: any = {}) {
  const error: any = new Error(`Request failed with status ${status}`);
  error.response = { status, data, headers: {}, config: {} as any };
  return error;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

/**
 * Seeds localStorage with a fake auth token.
 * Matches the key ("token") that utilities.ts reads via localStorage.getItem("token").
 */
export function setAuthToken(token = 'test-token-abc123') {
  localStorage.setItem('token', token);
}

/** Removes the auth token from localStorage. */
export function clearAuthToken() {
  localStorage.removeItem('token');
}

// ---------------------------------------------------------------------------
// Capacitor Preferences mock factory
// ---------------------------------------------------------------------------

/**
 * Returns a vi mock object that mirrors the @capacitor/preferences Preferences API.
 * Use this inside a vi.mock('@capacitor/preferences', ...) factory.
 *
 * Example:
 *   vi.mock('@capacitor/preferences', () => ({ Preferences: makePreferencesMock() }));
 */
export function makePreferencesMock() {
  return {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue({ keys: [] }),
    clear: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Ionic React stub factory (for component/page tests)
// ---------------------------------------------------------------------------

/**
 * Creates a minimal set of Ionic React stubs.
 * Each component renders as a plain <div> so RTL can find children.
 *
 * Usage inside vi.mock('@ionic/react', () => createIonicMock()):
 *
 * Note: `require('react')` is intentional — vi.mock factories run in a
 * CommonJS-like context before ES module imports are resolved.
 */
export function createIonicMock() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');

  const stub = () => (props: any) =>
    React.createElement('div', props, props.children);

  const stubWithId = (testId: string) => (props: any) =>
    React.createElement(
      'div',
      { ...props, 'data-testid': props['data-testid'] ?? testId },
      props.children
    );

  // Tracks the IonInfiniteScroll handler so tests can trigger it manually
  const ionTestUtils: { handler?: (event: any) => void } = {};

  return {
    IonAlert: stub(),
    IonButton: stub(),
    IonCard: stub(),
    IonCardTitle: stub(),
    IonCol: stub(),
    IonContent: stub(),
    IonFab: stub(),
    IonFabButton: stub(),
    IonGrid: stubWithId('ion-grid'),
    IonIcon: stub(),
    IonInfiniteScroll: ({ onIonInfinite, children, ...rest }: any) => {
      ionTestUtils.handler = onIonInfinite;
      return React.createElement(
        'div',
        { 'data-testid': 'ion-infinite-scroll', ...rest },
        children
      );
    },
    IonInfiniteScrollContent: stub(),
    IonNote: stub(),
    IonPage: stub(),
    IonRefresher: stub(),
    IonRefresherContent: stub(),
    IonRow: stub(),
    IonSpinner: stub(),
    IonText: stub(),
    IonToast: stub(),
    IonList: stub(),
    IonItem: stub(),
    IonLabel: stub(),
    IonInput: stub(),
    IonTextarea: stub(),
    IonSelect: stub(),
    IonSelectOption: stub(),
    IonToggle: stub(),
    IonSegment: stub(),
    IonSegmentButton: stub(),
    IonHeader: stub(),
    IonToolbar: stub(),
    IonTitle: stub(),
    IonBackButton: stub(),
    IonButtons: stub(),
    IonFooter: stub(),
    IonModal: stub(),
    IonActionSheet: stub(),
    IonChip: stub(),
    IonBadge: stub(),
    IonAvatar: stub(),
    IonThumbnail: stub(),
    IonProgressBar: stub(),
    IonSkeletonText: stub(),
    IonSearchbar: stub(),
    IonDatetime: stub(),
    IonRange: stub(),
    IonCheckbox: stub(),
    IonRadio: stub(),
    IonRadioGroup: stub(),
    IonReorder: stub(),
    IonReorderGroup: stub(),
    IonItemSliding: stub(),
    IonItemOptions: stub(),
    IonItemOption: stub(),
    IonAccordion: stub(),
    IonAccordionGroup: stub(),
    IonPopover: stub(),
    IonPicker: stub(),
    IonLoading: stub(),
    IonCardContent: stub(),
    useIonModal: () => [vi.fn(), vi.fn()],
    useIonToast: () => [vi.fn(), vi.fn()],
    useIonAlert: () => [vi.fn(), vi.fn()],
    useIonActionSheet: () => [vi.fn(), vi.fn()],
    useIonLoading: () => [vi.fn(), vi.fn()],
    useIonPopover: () => [vi.fn(), vi.fn()],
    useIonRouter: () => ({
      push: vi.fn(),
      goBack: vi.fn(),
      canGoBack: vi.fn(() => true),
    }),
    // Expose so tests can trigger IonInfiniteScroll events
    __ionTestUtils: {
      triggerInfinite: (event: any) => ionTestUtils.handler?.(event),
    },
  };
}
