import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const CATEGORY_OPTIONS = [
  { value: "villa", label: "Villa" },
  { value: "flat", label: "Flat" },
  { value: "bunglow", label: "Bungalow" },
  { value: "farm", label: "Farm" },
];

const CITY_SUGGESTIONS = ["Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai", "Delhi", "Kolkata"];

const AMENITY_OPTIONS = [
  "Covered Parking",
  "Gymnasium",
  "Swimming Pool",
  "Power Backup",
  "Lift",
  "Club House",
  "24x7 Security",
  "Landscaped Garden",
  "Kids Play Area",
  "Rainwater Harvesting",
];

const twoCol = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

const EMPTY_FORM = {
  title: "",
  category: "flat",
  city: "",
  state: "",
  address: "",
  priceAmount: "",
  priceUnit: "lakh",
  bhk: "",
  size: "",
  description: "",
};

export default function Post() {
  const { user } = useAuth();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [amenities, setAmenities] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imageUrls, setImageUrls] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);

  // In edit mode, load the listing and pre-fill the form.
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    api
      .get(`/listings/${id}`)
      .then((r) => {
        if (!mounted) return;
        const l = r.data;
        setForm({
          title: l.title || "",
          category: l.category || "flat",
          city: l.city || "",
          state: l.state || "",
          address: l.address || "",
          priceAmount: l.priceAmount != null ? String(l.priceAmount) : "",
          priceUnit: l.priceUnit || "lakh",
          bhk: l.bhk ? String(l.bhk) : "",
          size: l.size ? String(l.size) : "",
          description: l.description || "",
        });
        setAmenities(l.amenities || []);
        setExistingImages(l.images || []);
      })
      .catch(() => setError("Could not load this listing."))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleAmenity = (a) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const onFiles = (e) => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  };

  const removeExisting = (idx) => setExistingImages((prev) => prev.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: (fd) => {
      const opts = { headers: { "Content-Type": "multipart/form-data" } };
      return isEdit ? api.patch(`/listings/${id}`, fd, opts) : api.post("/listings", fd, opts);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      navigate(`/listing/${res.data.id || id}`);
    },
    onError: (err) => setError(apiError(err, "Could not save the listing.")),
  });

  const submit = (e) => {
    e.preventDefault();
    setError("");

    const newUrls = imageUrls
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const allUrls = [...existingImages, ...newUrls];

    if (!form.title.trim()) return setError("Please enter a title.");
    if (!form.city.trim()) return setError("Please enter a city.");
    if (!files.length && !allUrls.length)
      return setError("Add at least one image — upload a file or paste an image URL.");

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("category", form.category);
    fd.append("city", form.city.trim());
    fd.append("state", form.state.trim());
    fd.append("address", form.address.trim());
    fd.append("priceAmount", form.priceAmount);
    fd.append("priceUnit", form.priceUnit);
    fd.append("bhk", form.bhk);
    fd.append("size", form.size);
    fd.append("description", form.description);
    amenities.forEach((a) => fd.append("amenities", a));
    files.forEach((f) => fd.append("imageFiles", f));
    // Send the full desired URL set (kept existing + newly pasted).
    allUrls.forEach((u) => fd.append("imageUrls", u));

    mutation.mutate(fd);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="page-head">
          <h1>Edit listing</h1>
        </div>
        <p className="muted">Loading listing…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>{isEdit ? "Edit listing" : "Create listing"}</h1>
        <p>
          {isEdit
            ? "Update the property details below."
            : `Listing as ${user.name}. Fill in the property details buyers will see.`}
        </p>
      </div>

      {error && <div className="flash flash-error">{error}</div>}

      <form onSubmit={submit}>
        {/* Basics */}
        <label className="label">Title</label>
        <input
          className="input"
          placeholder="e.g. Spacious 3 BHK villa with garden"
          value={form.title}
          onChange={update("title")}
          required
        />

        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={update("category")}>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Location */}
        <div style={twoCol}>
          <div>
            <label className="label">City</label>
            <input
              className="input"
              list="city-suggestions"
              placeholder="City"
              value={form.city}
              onChange={update("city")}
              required
            />
            <datalist id="city-suggestions">
              {CITY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">State</label>
            <input
              className="input"
              placeholder="State"
              value={form.state}
              onChange={update("state")}
            />
          </div>
        </div>

        <label className="label">Full address</label>
        <input
          className="input"
          placeholder="Street, area, landmark"
          value={form.address}
          onChange={update("address")}
        />
        <p className="muted" style={{ marginTop: -8, marginBottom: 16, fontSize: 13 }}>
          The full address is visible to admins and you only. Buyers see the city and state.
        </p>

        {/* Pricing & size */}
        <div style={twoCol}>
          <div>
            <label className="label">Price</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 1.6"
              value={form.priceAmount}
              onChange={update("priceAmount")}
            />
          </div>
          <div>
            <label className="label">Price unit</label>
            <select className="input" value={form.priceUnit} onChange={update("priceUnit")}>
              <option value="lakh">Lakh</option>
              <option value="crore">Crore</option>
            </select>
          </div>
        </div>

        <div style={twoCol}>
          <div>
            <label className="label">BHK</label>
            <input
              className="input"
              type="number"
              min="0"
              step="1"
              placeholder="Bedrooms (0 for land/farm)"
              value={form.bhk}
              onChange={update("bhk")}
            />
          </div>
          <div>
            <label className="label">Size (sq ft)</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="e.g. 2100"
              value={form.size}
              onChange={update("size")}
            />
          </div>
        </div>

        {/* Description */}
        <label className="label">Description</label>
        <textarea
          className="input"
          rows="4"
          placeholder="Describe the property, its highlights, and neighbourhood..."
          value={form.description}
          onChange={update("description")}
        />

        {/* Amenities */}
        <label className="label">Amenities</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {AMENITY_OPTIONS.map((a) => {
            const active = amenities.includes(a);
            return (
              <button
                key={a}
                type="button"
                className={`btn btn-sm ${active ? "" : "btn-ghost"}`}
                aria-pressed={active}
                onClick={() => toggleAmenity(a)}
              >
                {active ? "✓ " : ""}
                {a}
              </button>
            );
          })}
        </div>

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <>
            <label className="label">Current images</label>
            <div className="grid-thumbs" style={{ marginBottom: 16 }}>
              {existingImages.map((src, i) => (
                <div key={`${src}-${i}`} style={{ position: "relative" }}>
                  <img src={resolveImageUrl(src)} alt={`image ${i + 1}`} loading="lazy" />
                  <button
                    type="button"
                    onClick={() => removeExisting(i)}
                    aria-label="Remove image"
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "#fff",
                      fontSize: 13,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* New images */}
        <label className="label">{isEdit ? "Add more images" : "Property images"}</label>
        <input className="input" type="file" accept="image/*" multiple onChange={onFiles} />
        {previews.length > 0 && (
          <div className="grid-thumbs" style={{ marginBottom: 16 }}>
            {previews.map((src, i) => (
              <img key={i} src={src} alt={`preview ${i + 1}`} />
            ))}
          </div>
        )}
        <div className="divider">— and / or —</div>
        <label className="label">Image URLs</label>
        <textarea
          className="input"
          rows="3"
          placeholder={"Paste image URLs, one per line\nhttps://example.com/photo1.jpg"}
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
        />

        <button className="btn btn-block" disabled={mutation.isPending}>
          {mutation.isPending
            ? isEdit
              ? "Saving..."
              : "Publishing..."
            : isEdit
            ? "Save changes"
            : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
