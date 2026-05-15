import { IonCard, IonCardContent, IonRow, IonText, IonNote } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faHeart } from '@fortawesome/pro-solid-svg-icons';
import './PostSuggestionMini.css';

type PostSuggestionMiniProps = {
  post: any;
  routerLink?: string;
  onClick?: () => void;
  showContent?: boolean;
  showLikeCount?: boolean;
  showCommentCount?: boolean;
  customMeta?: React.ReactNode;
  className?: string;
};

const PostSuggestionMini: React.FC<PostSuggestionMiniProps> = ({
  post,
  routerLink,
  onClick,
  showContent = false,
  showLikeCount = true,
  showCommentCount = true,
  customMeta,
  className = '',
}) => {
  const bodyContent = post.markdown ? (post.preview ?? '') : (post.content ?? '');

  return (
    <IonCard
      className={`post-suggestion-mini ${className}`.trim()}
      routerLink={routerLink}
      button={Boolean(routerLink || onClick)}
      onClick={onClick}
    >
      <div className={`post-suggestion-banner category-${post.category || 'refreshments'}`} />
      <IonCardContent className="post-suggestion-body">
        <IonText className="post-suggestion-title">{post.title}</IonText>
        {(customMeta || showLikeCount || showCommentCount) ? (
          <IonRow className="post-suggestion-meta">
            {customMeta ? (
              <IonText className="post-suggestion-meta-item">
                {customMeta}
              </IonText>
            ) : null}
            {showLikeCount ? (
              <IonText className="post-suggestion-meta-item">
                <FontAwesomeIcon icon={faHeart} /> {post.like_count ?? 0}
              </IonText>
            ) : null}
            {showCommentCount ? (
              <IonText className="post-suggestion-meta-item">
                <FontAwesomeIcon icon={faCommentDots} /> {post.comment_count ?? 0}
              </IonText>
            ) : null}
          </IonRow>
        ) : null}
        {showContent ? (
          <IonNote className="post-suggestion-copy">
            {bodyContent}
          </IonNote>
        ) : null}
      </IonCardContent>
    </IonCard>
  );
};

export default PostSuggestionMini;
