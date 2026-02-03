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
}

const fetchEvents = async () => {
  const response = await apiClient.get('/api/events/')
  return response.data as RefreshEvent[]
}

export function useGetEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  })
}
