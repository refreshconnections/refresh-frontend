import { IonButton, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonSpinner } from "@ionic/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useParams } from "react-router-dom"



import './OpenedPost.css'

import { useGetComments } from "../../hooks/api/refreshments/comments";
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

};

import './Comments.css'
import { useGetDynamicPostContent } from "../../hooks/api/refreshments/dynamic-post-content";
import { useTopLevelCommentsInf } from "../../hooks/api/refreshments/top-level-comments";




const Comments: React.FC<Props> = (props) => {


  const { showSidenotes, setReplyTo, replyTo, onLikeUnlike, forceShowRepliesFor, sortByRecentActivity, setSortByRecentActivity } = props;

  let { id } = useParams<PostDetail>()

  const dynamicContentPost = useGetDynamicPostContent(parseInt(id)).data;

  const handleSortChange = (value: string) => {
    const isRecent = value === 'activity';
    setSortByRecentActivity(isRecent);
    localStorage.setItem('sortByRecentActivity', String(isRecent));
  };


  const {
    data: topLevelComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending
  } = useTopLevelCommentsInf(parseInt(id), sortByRecentActivity);


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
      {(isPending && dynamicContentPost?.comment_count > 0) ?
        <IonRow className="ion-justify-content-center">
          <IonSpinner name="bubbles"></IonSpinner>
        </IonRow>
        :
        <>
          {dynamicContentPost?.comment_count > 0 &&

            <IonRow class="ion-align-items-center ion-padding ion-space-around ion-justify-content-around">
              <IonLabel>Sort comments by</IonLabel>
              <IonSelect
                value={sortByRecentActivity ? 'activity' : 'timeline'}
                placeholder="Select Order"
                onIonChange={(e) => handleSortChange(e.detail.value)}
                interface="popover"
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  minWidth: '160px',
                  height: '36px',
                  fontSize: '14px'
                }}
              >
                <IonSelectOption value="activity">Recent activity first</IonSelectOption>
                <IonSelectOption value="timeline">Chronological order</IonSelectOption>
              </IonSelect>

            </IonRow>}
          <IonList lines="full" class="comments">
            {topLevelComments?.pages?.map((page) =>
              page.results.map((comment) => (
                <CommentItem key={comment.id} comment={comment} showSidenotes={showSidenotes} setReplyTo={setReplyTo} replyTo={replyTo} isAReply={false} onLikeUnlike={onLikeUnlike} forceShowReplies={forceShowRepliesFor.has(comment.id)} />
              ))
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


