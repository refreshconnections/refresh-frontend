// Effective React Query Keys
// https://tkdodo.eu/blog/effective-react-query-keys#use-query-key-factories
// https://tkdodo.eu/blog/leveraging-the-query-function-context#query-key-factories

export const emailBuilderQueryKeys = {
    purposes: ['purposes'],
    emails: ['emails'],
    emails_by_purpose: (purpose: number) => ['emails', 'purpose', purpose],
    detail: (id: number) => ['emailbuilder', 'detail', id],
    purposes_by_id: (id: number) => ['emailbuilder', 'purposes', id],
  };