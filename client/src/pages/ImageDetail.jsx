import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import { initials, timeAgo } from "../lib/format";
import Spinner from "../components/Spinner.jsx";

export default function ImageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles } = useConfig();
  const caps = roles?.[user.role]?.can || {};
  const queryClient = useQueryClient();

  const { data: image, isLoading, isError } = useQuery({
    queryKey: ["image", id],
    queryFn: async () => (await api.get(`/images/${id}`)).data,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/images/${id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["image", id] });
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/images/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      navigate("/");
    },
  });

  if (isLoading) return <Spinner />;
  if (isError || !image)
    return <div className="container"><div className="empty"><span className="emoji">🔍</span>
      <p>This image is no longer available.</p></div></div>;

  const liked = (image.likedBy || []).includes(user.id);
  const canDelete = caps.deleteAny || image.author === user.id;

  return (
    <div className="container">
      <Link to="/" className="nav-link" style={{ display: "inline-block", marginBottom: 14 }}>
        ← Back to feed
      </Link>
      <div className="card">
        <img className="card-img" src={resolveImageUrl(image.url)} alt={image.caption} />
        <div className="card-body">
          <div className="card-head" style={{ padding: "0 0 10px" }}>
            <span className="avatar">{initials(image.authorName)}</span>
            <div className="meta">
              <div className="author">{image.authorName}</div>
              <div className="time">{timeAgo(image.createdAt)}</div>
            </div>
          </div>
          {image.caption && <p className="caption" style={{ margin: "10px 0" }}>{image.caption}</p>}
          <div className="like-row">
            <button className={`heart-btn${liked ? " liked" : ""}`} onClick={() => likeMutation.mutate()}>
              {liked ? "♥" : "♡"}
            </button>
            <span className="like-count">{image.likes} likes</span>
          </div>
          {canDelete && (
            <button className="btn btn-danger btn-sm mt"
              onClick={() => window.confirm("Delete this image?") && deleteMutation.mutate()}>
              Delete image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
