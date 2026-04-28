import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import CitySelectorModal from './CitySelectorModal';

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
  };
});

const renderModal = async (onDismiss = vi.fn()) => {
  await act(async () => {
    render(
      <IonApp>
        <CitySelectorModal onDismiss={onDismiss} />
      </IonApp>
    );
    await Promise.resolve();
  });
};

const getReactProps = (el: HTMLElement) => {
  const key = Object.keys(el).find((k) => k.startsWith('__reactProps'));
  return key ? (el as any)[key] : undefined;
};

const triggerSearchInput = async (value: string) => {
  const searchbar = document.querySelector('ion-searchbar') as unknown as HTMLElement;
  await act(async () => {
    fireEvent(searchbar, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
    await Promise.resolve();
  });
};

const clickElement = async (el: HTMLElement | null) => {
  if (!el) return;
  const onClick = getReactProps(el)?.onClick;
  if (typeof onClick === 'function') {
    await act(async () => {
      await onClick({ preventDefault: vi.fn(), defaultPrevented: false });
    });
    return;
  }
  await act(async () => { fireEvent.click(el); });
};

const mockGeonamesResponse = (geonames: any[]) => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ geonames }),
  } as any);
};

describe('CitySelectorModal', () => {
  afterEach(() => {
    delete (global as any).fetch;
  });

  it('renders the title, searchbar, and cancel button', async () => {
    await renderModal();

    expect(screen.getByText('Select a City')).toBeInTheDocument();
    expect(document.querySelector('ion-searchbar')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onDismiss with no args when cancel is pressed', async () => {
    const onDismiss = vi.fn();
    await renderModal(onDismiss);

    await clickElement(screen.getByText('Cancel').closest('ion-button') as HTMLElement);

    expect(onDismiss).toHaveBeenCalledWith();
  });

  it('does not fetch when the query is shorter than 2 characters', async () => {
    mockGeonamesResponse([]);
    await renderModal();

    await triggerSearchInput('P');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches from GeoNames and displays results when query is long enough', async () => {
    mockGeonamesResponse([
      { name: 'Portland', adminName1: 'Oregon', countryName: 'United States', lat: '45.5231', lng: '-122.6765' },
      { name: 'Portsmouth', adminName1: 'New Hampshire', countryName: 'United States', lat: '43.0718', lng: '-70.7626' },
    ]);

    await renderModal();
    await triggerSearchInput('Por');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('Por'));
    expect(screen.getByText('Portland, Oregon, United States')).toBeInTheDocument();
    expect(screen.getByText('Portsmouth, New Hampshire, United States')).toBeInTheDocument();
  });

  it('passes numeric lat/lng to onDismiss even when GeoNames returns strings', async () => {
    mockGeonamesResponse([
      { name: 'Portland', adminName1: 'Oregon', countryName: 'United States', lat: '45.5231', lng: '-122.6765' },
    ]);

    const onDismiss = vi.fn();
    await renderModal(onDismiss);
    await triggerSearchInput('Por');

    await clickElement(
      screen.getByText('Portland, Oregon, United States').closest('ion-item') as HTMLElement
    );

    expect(onDismiss).toHaveBeenCalledWith({
      name: 'Portland, Oregon, United States',
      lat: 45.5231,
      lng: -122.6765,
    });
    expect(typeof onDismiss.mock.calls[0][0].lat).toBe('number');
    expect(typeof onDismiss.mock.calls[0][0].lng).toBe('number');
  });

  it('omits the admin region when GeoNames does not include one', async () => {
    mockGeonamesResponse([
      { name: 'London', adminName1: '', countryName: 'United Kingdom', lat: '51.5074', lng: '-0.1278' },
    ]);

    await renderModal();
    await triggerSearchInput('Lon');

    expect(screen.getByText('London, United Kingdom')).toBeInTheDocument();
  });

  it('shows nothing when the GeoNames response has no geonames array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ status: { message: 'hourly limit exceeded' } }),
    } as any);

    await renderModal();
    await triggerSearchInput('Portland');

    expect(document.querySelectorAll('ion-item').length).toBe(0);
  });

  it('shows nothing and does not crash when the fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await renderModal();
    await triggerSearchInput('Portland');

    expect(document.querySelectorAll('ion-item').length).toBe(0);
  });
});
