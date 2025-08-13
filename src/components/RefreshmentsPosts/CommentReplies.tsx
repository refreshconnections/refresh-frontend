import { useEffect, useState } from "react";
import CommentItem from "./CommentItem";
import { IonButton, IonList, IonSpinner, IonText } from "@ionic/react";
import { useTopLevelCommentRepliesInf } from "../../hooks/api/refreshments/top-level-comments-replies";
import "./Comments.css";

const CommentReplies = ({
  commentId,
  previewReply,
  showSidenotes,
  setReplyTo,
  replyTo,
  onLikeUnlike,
  replyCount,
  forceOpen = false
}) => {
  const [showAll, setShowAll] = useState(forceOpen);

  const {
    data: replies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending
  } = useTopLevelCommentRepliesInf(parseInt(commentId));

  // Keep showAll in sync with forceOpen
  useEffect(() => {
    if (forceOpen && !showAll) {
      setShowAll(true);
    }
  }, [forceOpen]);

  // Optionally preload replies when forceOpen is triggered
  useEffect(() => {
    if (forceOpen && !replies?.pages?.length && fetchNextPage) {
      fetchNextPage();
    }
  }, [forceOpen]);

  const shouldShowPreviewOnly = !!previewReply && !showAll && !forceOpen && !(replyCount <= 1 && showSidenotes);
  const shouldShowAllReplies = showAll || forceOpen || (replyCount <= 1 && showSidenotes);

  return (
    <>
      {shouldShowPreviewOnly && (
        <div className="borderwtail">
          <ul style={{ margin: 0, padding: 0 }}>
            {!previewReply.removed && (
              <CommentItem
                comment={previewReply}
                showSidenotes={showSidenotes}
                setReplyTo={setReplyTo}
                replyTo={replyTo}
                isAReply={true}
                onLikeUnlike={onLikeUnlike}
              />
            )}
          </ul>
          {(replyCount > 1) && (
            <IonButton size="small" fill="clear" onClick={() => setShowAll(true)}>
              See more replies
            </IonButton>
          )}
        </div>
      )}

      {shouldShowAllReplies && (
        <IonList class="comments" id="wl" lines="none">
          <div className="borderwtail">
            <ul style={{ margin: 0, padding: 0 }}>
              {replies?.pages?.flatMap((page) =>
                page?.results?.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    showSidenotes={showSidenotes}
                    setReplyTo={setReplyTo}
                    replyTo={replyTo}
                    isAReply={true}
                    onLikeUnlike={onLikeUnlike}
                  />
                ))
              )}
            </ul>
          </div>

          {hasNextPage && (
            <IonButton onClick={() => fetchNextPage()} disabled={isFetchingNextPage} fill="clear" size="small">
              {isFetchingNextPage ? <IonSpinner name="dots" /> : "See more replies"}
            </IonButton>
          )}
        </IonList>
      )}

      {isPending && replyCount > 0 && (
        <div style={{ padding: "6pt", display: "flex", justifyContent: "center" }}>
          <IonSpinner name="bubbles" />
        </div>
      )}
    </>
  );
};

export default CommentReplies;
