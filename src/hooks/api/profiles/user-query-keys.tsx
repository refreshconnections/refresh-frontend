// Effective React Query Keys
// https://tkdodo.eu/blog/effective-react-query-keys#use-query-key-factories
// https://tkdodo.eu/blog/leveraging-the-query-function-context#query-key-factories

export const userQueryKeys = {
    all: ['profiles'],
    mutuals: ['mutuals'],
    mutuals_no_dialog: ['mutuals-no-dialog'],
    searched: (searched_name: string) => ['mutuals', searched_name ],
    incoming: ['incoming'],
    incoming_paginated: ['incoming-paginated'],
    outgoing: ['outgoing'],
    notifications: ['notifications'],
    current: ['current'],
    global_current: ['global-current'],
    settings_current: ['settings-current'],
    refreshments_current: ['refreshments-current'],
    moderation: () => [...userQueryKeys.current, 'moderation'],
    streak: () => ['streak'],
    limits: () => ['limits'],
    picks_with_filters: ['picks_with_filters'],
    picks_and_profiles: ['picks-and-profiles'],
    details: () => [...userQueryKeys.all, 'detail'],
    detail: (id: number) => [...userQueryKeys.details(), id],
    push_notification_settings: (id: number) => ['current', 'push_notification_settings'],
    saved_locations: () => ['saved-locations'],
    multiple_accounts: () => ['multiple-accounts'],
    // pagination: (page: number) => [...userQueryKeys.all, 'pagination', page],
    // infinite: () => [...userQueryKeys.all, 'infinite'],
  };