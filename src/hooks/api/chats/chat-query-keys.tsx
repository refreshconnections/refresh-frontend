// Effective React Query Keys
// https://tkdodo.eu/blog/effective-react-query-keys#use-query-key-factories
// https://tkdodo.eu/blog/leveraging-the-query-function-context#query-key-factories

export const chatQueryKeys = {
    all: ['chats'],
    details: (id: number) => ['chats', 'details', id],
    file: (file_id: string) => ['chats', 'file', file_id],
    messages: (id: number) => ['chats', 'messages', id],
    settings: (id: number) => ['chats', 'settings', id],
    accepting: (id: number) => ['chats', 'messages', 'accepting', id],
    unread: ['unread']
    // pagination: (page: number) => [...userQueryKeys.all, 'pagination', page],
    // infinite: () => [...userQueryKeys.all, 'infinite'],
  };