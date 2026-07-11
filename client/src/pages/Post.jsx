import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function Post() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (formData) =>
      api.post("/images", formData, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      navigate("/");
    },
    onError: (err) => setError(apiError(err, "Could not post image.")),
  });

  const onPick = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!file && !imageUrl.trim()) return setError("Provide an image file or an image URL.");
    const fd = new FormData();
    if (file) fd.append("imageFile", file);
    if (imageUrl.trim()) fd.append("imageUrl", imageUrl.trim());
    fd.append("caption", caption);
    mutation.mutate(fd);
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>Create listing</h1>
        <p>Listing as {user.name}</p>
      </div>
      {error && <div className="flash flash-error">{error}</div>}
      <form onSubmit={submit}>
        {preview && (
          <img
            className="card-img"
            src={preview}
            alt="preview"
            style={{ borderRadius: 20, marginBottom: 18 }}
          />
        )}
        <label className="label">Upload property image</label>
        <input className="input" type="file" accept="image/*" onChange={onPick} />
        <div className="divider">— or —</div>
        <label className="label">Use a photo URL</label>
        <input
          className="input"
          type="url"
          placeholder="https://example.com/property.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <label className="label">Property description</label>
        <textarea
          className="input"
          rows="4"
          placeholder="Describe the home or land for sale..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button className="btn btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? "Listing..." : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
