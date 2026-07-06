import { Link } from "react-router-dom";
import { resolveImageUrl } from "../api/client";
import { initials, timeAgo } from "../lib/format";

export default function ImageCard({ image, currentUserId, canDelete, onLike, onDelete }) {
  const liked = (image.likedBy || []).includes(currentUserId);

  return (
    <div className="card">
      <div className="card-head">
        <span className="avatar">{initials(image.authorName)}</span>
        <div className="meta">
          <div className="author">{image.authorName}</div>
          <div className="time">{timeAgo(image.createdAt)}</div>
        </div>
        {canDelete && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(image)}>
            Delete
          </button>
        )}
      </div>

      <Link to={`/image/${image.id}`}>
        <img className="card-img" src={resolveImageUrl(image.url)} alt={image.caption} loading="lazy" />
      </Link>

      <div className="card-body">
        <div className="like-row">
          <button
            className={`heart-btn${liked ? " liked" : ""}`}
            onClick={() => onLike(image)}
            aria-label="Like"
          >
            {liked ? "♥" : "♡"}
          </button>
          <span className="like-count">{image.likes}</span>
        </div>
        {image.caption && <div className="caption">{image.caption}</div>}
      </div>
    </div>
  );
}
