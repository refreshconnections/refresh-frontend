// Effective React Query Keys
// https://tkdodo.eu/blog/effective-react-query-keys#use-query-key-factories
// https://tkdodo.eu/blog/leveraging-the-query-function-context#query-key-factories

export const postQueryKeys = {
    all: ['posts'],
    filtered: (category: string, search: string | null, local: boolean, radius: number | null, sort: string) => ['filteredposts', category, search, local, radius, sort],
    postcontents: () => [...postQueryKeys.all, 'postcontent'],
    postcontent: (id: number) => [...postQueryKeys.postcontents(), id],
    staticpostcontent: (id: number) => [...postQueryKeys.postcontents(), 'static', id],
    dynamicpostcontent: (id: number) => [...postQueryKeys.postcontents(), 'dynamic', id],
    comments: (id: number) => [...postQueryKeys.postcontent(id), 'comments'],
    comment: (comment_id: number) => [...postQueryKeys.all, 'comment', comment_id],
    staticcomment: (comment_id: number) => [...postQueryKeys.all, 'comment', 'static',comment_id],
    dynamiccomment: (comment_id: number) => [...postQueryKeys.all, 'comment','dynamic', comment_id],
    commentreplies: (comment_id: number) => [...postQueryKeys.all, 'comment', comment_id, 'commentreplies'],
    notshown: (id: number) => ['notshown', id],
    topcomments: (postId:number, sortByRecentActivity) =>['top-comments', postId, sortByRecentActivity],
    topcommentReplies: (commentId: number) => ['comments', commentId, 'replies'],

  };