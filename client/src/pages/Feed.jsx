import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import ImageCard from "../components/ImageCard.jsx";
import RoleBadge from "../components/RoleBadge.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Feed() {
  const { user } = useAuth();
  const { name, roles } = useConfig();
  const caps = roles?.[user.role]?.can || {};
  const queryClient = useQueryClient();

  const { data: images = [], isLoading, isError } = useQuery({
    queryKey: ["images"],
    queryFn: async () => (await api.get("/images")).data,
  });

  const likeMutation = useMutation({
    mutationFn: (id) => api.post(`/images/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["images"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/images/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["images"] }),
  });

  const canDelete = (img) => caps.deleteAny || img.author === user.id;

  const onDelete = (img) => {
    if (window.confirm("Delete this image?")) deleteMutation.mutate(img.id);
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="container">
      <div className="page-head row-between">
        <div style={{ flex: 1 }}>
          <p className="muted">Hi, {user.name.split(" ")[0]} 👋</p>
          <h1>{name} feed</h1>
        </div>
        <RoleBadge role={user.role} />
      </div>

      {isError && <div className="flash flash-error">Could not load the feed.</div>}

      {!images.length && !isError && (
        <div className="empty">
          <span className="emoji">🖼️</span>
          <strong>No images yet</strong>
          <p>{caps.post ? "Head to Post to share the first image." : "Check back soon."}</p>
        </div>
      )}

      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          currentUserId={user.id}
          canDelete={canDelete(image)}
          onLike={(img) => likeMutation.mutate(img.id)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
