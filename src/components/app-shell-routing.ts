export const hasCompletedCoreOnboarding = (profile: any, emailStatus?: { phone?: string | null } | null) => {
  const hasPhone = Boolean(emailStatus?.phone);
  const birthDate = profile?.birth_date;
  const hasBirthDate = Boolean(birthDate && birthDate !== '1001-01-01');
  return hasPhone && hasBirthDate;
};

export const shouldShowOnboardingForProfile = (profile: any, emailStatus?: { phone?: string | null } | null) => {
  if (!profile) return false;
  if (!hasCompletedCoreOnboarding(profile, emailStatus)) return true;
  if (profile.onboarded === true) return false;
  return profile.created_profile === false || profile.onboarded === false;
};

export const shouldShowPrimaryOnboardingScreen = (
  pathname: string,
  profile: any,
  emailStatus?: { phone?: string | null } | null,
  hasCommunityProfile: boolean = false,
) => {
  if (pathname === '/community-onboarding' || pathname === '/personal-profile-onboarding') {
    return false;
  }
  if (hasCommunityProfile && profile?.onboarded !== false) {
    return false;
  }
  return shouldShowOnboardingForProfile(profile, emailStatus);
};
