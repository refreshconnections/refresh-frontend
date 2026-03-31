import { useQuery } from '@tanstack/react-query'
import { apiClient } from './api-client'

export type RefreshEvent = {
  id: number
  name: string
  description?: string | null
  image?: string | null
  start_datetime: string
  end_datetime: string
  post?: number | null
  external_link?: string | null
  external_registration_required?: boolean
  event_type?: string | null
  in_person_precautions?: string[]
  attendee_precaution_preference?: string | null
  local_only?: boolean
  location?: string | null
  location_point_lat?: number | null
  location_point_long?: number | null
  sensitive?: boolean
  reported_by?: number[]
  can_answer_questions?: boolean
  user?: number | null
  anonymous?: boolean
  status?: string
  uploadDateTime?: string
  username?: string | null
  profile_image?: string | null
  settings_community_profile?: boolean
  interested?: boolean
}

export type EventFilters = {
  eventTypes: string[]
  attendeePrecautionPreferences: string[]
  inPersonPrecautions: string[]
}

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  eventTypes: ['all'],
  attendeePrecautionPreferences: ['all'],
  inPersonPrecautions: ['all'],
}

export const EVENT_FILTER_PREF_KEYS = {
  eventTypes: 'event_filter_type',
  attendeePrecautionPreferences: 'event_filter_attendee_precaution',
  inPersonPrecautions: 'event_filter_in_person_precautions',
}

const fetchEvents = async (filters: EventFilters) => {
  const params = new URLSearchParams()
  if (!filters.eventTypes.includes('all')) {
    params.set('event_type', filters.eventTypes.join(','))
  }
  if (!filters.attendeePrecautionPreferences.includes('all')) {
    params.set('attendee_precaution_preference', filters.attendeePrecautionPreferences.join(','))
  }
  if (!filters.inPersonPrecautions.includes('all')) {
    params.set('in_person_precautions', filters.inPersonPrecautions.join(','))
  }
  const query = params.toString()
  const response = await apiClient.get(query ? `/api/events/?${query}` : '/api/events/')
  return response.data as RefreshEvent[]
}

export function useGetEvents(filters: EventFilters = DEFAULT_EVENT_FILTERS) {
  return useQuery({
    queryKey: ['events', filters.eventTypes, filters.attendeePrecautionPreferences, filters.inPersonPrecautions],
    queryFn: () => fetchEvents(filters),
  })
}
