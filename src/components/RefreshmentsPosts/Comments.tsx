import { IonButton, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonNote, IonProgressBar, IonRow, IonSearchbar, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonSpinner } from "@ionic/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query";



import './OpenedPost.css'

import { useGetComments } from "../../hooks/api/refreshments/comments";
import { useCommentSearch } from "../../hooks/api/refreshments/comment-search";
import { useGetCommentById } from "../../hooks/api/refreshments/comment-by-id";
import { postQueryKeys } from "../../hooks/api/refreshments/post-query-keys";
import CommentItem from "./CommentItem";

type PostDetail = {
  id: string,
}

type Props = {
  showSidenotes: boolean,
  setReplyTo: React.Dispatch<React.SetStateAction<any | null>>;
  replyTo?: any,
  onLikeUnlike: (commentId: string | number) => void;
  forceShowRepliesFor: Set<number>;
  sortByRecentActivity: boolean,
  setSortByRecentActivity: React.Dispatch<React.SetStateAction<boolean>>;
  onViewThread: (commentId: number) => void;
  isMegathread?: boolean;
};

import './Comments.css'
import { useGetDynamicPostContent } from "../../hooks/api/refreshments/dynamic-post-content";
import { useTopLevelCommentsInf } from "../../hooks/api/refreshments/top-level-comments";




const Comments: React.FC<Props> = (props) => {


  const { showSidenotes, setReplyTo, replyTo, onLikeUnlike, forceShowRepliesFor, sortByRecentActivity, setSortByRecentActivity, onViewThread, isMegathread } = props;

  let { id } = useParams<PostDetail>()

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [contextFetchId, setContextFetchId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const dynamicContentPost = useGetDynamicPostContent(parseInt(id)).data;

  const handleSortChange = (value: string) => {
    const isRecent = value === 'activity';
    setSortByRecentActivity(isRecent);
    localStorage.setItem('sortByRecentActivity', String(isRecent));
  };


  const {
    data: topLevelComments,
    fetchNextPage: fetchNextTopLevel,
    hasNextPage: hasNextTopLevel,
    isPending,
  } = useTopLevelCommentsInf(parseInt(id), sortByRecentActivity);

  const {
    data: searchResults,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetching: searchIsFetching,
  } = useCommentSearch(parseInt(id), debouncedSearch);

  const { data: contextComment } = useGetCommentById(parseInt(id), contextFetchId);

  useEffect(() => {
    if (!contextComment || contextFetchId === null) return;
    queryClient.setQueryData(
      postQueryKeys.topcomments(parseInt(id), sortByRecentActivity),
      (old: any) => {
        if (!old) return old;
        const alreadyInList = old.pages.some((p: any) =>
          p.results.some((c: any) => c.id === contextComment.id)
        );
        if (alreadyInList) return old;
        return {
          ...old,
          pages: [
            { ...old.pages[0], results: [contextComment, ...old.pages[0].results] },
            ...old.pages.slice(1),
          ],
        };
      }
    );
    setTimeout(() => {
      document.getElementById(`comment-${contextComment.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setContextFetchId(null);
    }, 50);
  }, [contextComment]);

  const activeData = debouncedSearch ? searchResults : topLevelComments;
  const fetchNextPage = debouncedSearch ? fetchNextSearch : fetchNextTopLevel;
  const hasNextPage = debouncedSearch ? hasNextSearch : hasNextTopLevel;


  const commentsTop = useRef<null | HTMLDivElement>(null)

  const scrollToCommentsTop = () => {

    commentsTop.current?.scrollIntoView({
      behavior: "auto",
      block: "center"
    })
  }

  return (

    <>

      <div ref={commentsTop}></div>
      {(isPending && !debouncedSearch && dynamicContentPost?.comment_count > 0) ?
        <IonRow className="ion-justify-content-center">
          <IonSpinner name="bubbles"></IonSpinner>
        </IonRow>
        :
        <>
          {isMegathread && dynamicContentPost?.comment_count >= 5 && (
            <IonSearchbar
              value={search}
              onIonInput={e => setSearch(e.detail.value ?? '')}
              placeholder="Search megathread…"
              debounce={0}
            />
          )}

          {dynamicContentPost?.comment_count > 0 && !debouncedSearch &&
            <IonRow className="ion-align-items-center ion-padding">
              <div className="sort-container">
                <label className="sort-label">Sort comments by</label>
                <IonSelect
                  value={sortByRecentActivity ? 'activity' : 'timeline'}
                  placeholder="Select Order"
                  onIonChange={(e) => handleSortChange(e.detail.value)}
                  interface="popover"
                  className="select-box"
                >
                  <IonSelectOption value="activity">Recent activity first</IonSelectOption>
                  <IonSelectOption value="timeline">Oldest first</IonSelectOption>
                </IonSelect>
              </div>
            </IonRow>}

          {debouncedSearch && searchIsFetching && (
            <IonProgressBar type="indeterminate" style={{ height: '2px' }} />
          )}

          <IonList lines="full" className="comments">
            {activeData?.pages?.map((page) =>
              page.results.map((comment: any) => (
                <React.Fragment key={comment.id}>
                  <div id={`comment-${comment.id}`}>
                    <CommentItem comment={comment} showSidenotes={showSidenotes} setReplyTo={setReplyTo} replyTo={replyTo} isAReply={false} onLikeUnlike={onLikeUnlike} forceShowReplies={forceShowRepliesFor.has(comment.id)} />
                  </div>
                  {debouncedSearch && comment.reply_to && (
                    <IonItem lines="none" style={{ '--background': 'var(--ion-color-light)' } as React.CSSProperties}>
                      <IonNote className="ion-text-wrap" style={{ fontSize: '12px' }}>
                        ↳ replying to: "{comment.reply_to.text?.slice(0, 80)}{(comment.reply_to.text?.length ?? 0) > 80 ? '…' : ''}"
                      </IonNote>
                      <IonButton slot="end" size="small" fill="clear" onClick={() => {
                        const targetId = comment.reply_to.id;
                        onViewThread(targetId);
                        setSearch('');
                        setDebouncedSearch('');
                        setContextFetchId(targetId);
                      }}>View thread</IonButton>
                    </IonItem>
                  )}
                  {debouncedSearch && !comment.reply_to && comment.reply_count > 0 && (
                    <IonItem lines="none" style={{ '--background': 'var(--ion-color-light)' } as React.CSSProperties}>
                      <IonButton size="small" fill="clear" onClick={() => {
                        onViewThread(comment.id);
                        setSearch('');
                        setDebouncedSearch('');
                        setContextFetchId(comment.id);
                      }}>View thread ({comment.reply_count})</IonButton>
                    </IonItem>
                  )}
                </React.Fragment>
              ))
            )}
            {debouncedSearch && !searchIsFetching && searchResults?.pages?.every(p => p.results.length === 0) && (
              <IonItem lines="none">
                <IonNote>No comments match "{debouncedSearch}"</IonNote>
              </IonItem>
            )}
          </IonList>
          <IonInfiniteScroll
            onIonInfinite={async (ev) => {
              if (hasNextPage) {
                await fetchNextPage();
              }
              (ev.target as HTMLIonInfiniteScrollElement).complete();
            }}
            disabled={!hasNextPage}
          >
            <IonInfiniteScrollContent loadingSpinner="bubbles" style={{ minHeight: "14px" }}></IonInfiniteScrollContent>
          </IonInfiniteScroll>
        </>
      }
    </>
  )


};

export default Comments;


