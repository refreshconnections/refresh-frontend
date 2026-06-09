import { describe, expect, it } from 'vitest';
import {
  hasCompletedCoreOnboarding,
  shouldShowOnboardingForProfile,
  shouldShowPrimaryOnboardingScreen,
} from './app-shell-routing';

describe('shouldShowOnboardingForProfile', () => {
  it('does not treat onboarding as complete until both phone and birth date exist', () => {
    expect(hasCompletedCoreOnboarding({ birth_date: '2000-01-01' }, { phone: null })).toBe(false);
    expect(hasCompletedCoreOnboarding({ birth_date: '1001-01-01' }, { phone: '+15555555555' })).toBe(false);
    expect(hasCompletedCoreOnboarding({ birth_date: '2000-01-01' }, { phone: '+15555555555' })).toBe(true);
  });

  it('requires onboarding for a first-login profile with created_profile false when onboarded is missing', () => {
    expect(
      shouldShowOnboardingForProfile({
        created_profile: false,
        birth_date: '2000-01-01',
      }, { phone: '+15555555555' })
    ).toBe(true);
  });

  it('does not require onboarding after core onboarding is completed, even before profile setup', () => {
    expect(
      shouldShowOnboardingForProfile({
        created_profile: false,
        onboarded: true,
        birth_date: '2000-01-01',
      }, { phone: '+15555555555' })
    ).toBe(false);
  });

  it('requires onboarding when onboarded is explicitly false', () => {
    expect(
      shouldShowOnboardingForProfile({
        created_profile: true,
        onboarded: false,
        birth_date: '2000-01-01',
      }, { phone: '+15555555555' })
    ).toBe(true);
  });

  it('requires onboarding when phone or birthday is still missing even if the profile is otherwise created', () => {
    expect(
      shouldShowOnboardingForProfile({
        created_profile: true,
        onboarded: true,
        birth_date: '1001-01-01',
      }, { phone: null })
    ).toBe(true);
  });

  it('does not require onboarding for a fully completed profile', () => {
    expect(
      shouldShowOnboardingForProfile({
        created_profile: true,
        onboarded: true,
        birth_date: '2000-01-01',
      }, { phone: '+15555555555' })
    ).toBe(false);
  });

  it('allows the community onboarding route instead of bouncing back to the first onboarding screen', () => {
    expect(
      shouldShowPrimaryOnboardingScreen(
        '/community-onboarding',
        {
          created_profile: false,
          onboarded: false,
          birth_date: '2000-01-01',
        },
        { phone: '+15555555555' }
      )
    ).toBe(false);
  });

  it('allows the personal profile onboarding route instead of bouncing back to the first onboarding screen', () => {
    expect(
      shouldShowPrimaryOnboardingScreen(
        '/personal-profile-onboarding',
        {
          created_profile: false,
          onboarded: true,
          birth_date: '2000-01-01',
        },
        { phone: '+15555555555' },
        true
      )
    ).toBe(false);
  });

  it('does not show the ready-to-start onboarding screen once a community profile already exists', () => {
    expect(
      shouldShowPrimaryOnboardingScreen(
        '/community',
        {
          created_profile: false,
          onboarded: true,
          birth_date: '2000-01-01',
        },
        { phone: '+15555555555' },
        true
      )
    ).toBe(false);
  });

  it('allows exploring community after onboarding even when no community profile exists yet', () => {
    expect(
      shouldShowPrimaryOnboardingScreen(
        '/community',
        {
          created_profile: false,
          onboarded: true,
          birth_date: '2000-01-01',
        },
        { phone: '+15555555555' },
        false
      )
    ).toBe(false);
  });

  it('still shows the ready-to-start onboarding screen when onboarded is explicitly false, even if a community profile exists', () => {
    expect(
      shouldShowPrimaryOnboardingScreen(
        '/community',
        {
          created_profile: false,
          onboarded: false,
          birth_date: '2000-01-01',
        },
        { phone: '+15555555555' },
        true
      )
    ).toBe(true);
  });
});
