export default function Spinner({ full = false }) {
  return (
    <div className={`spinner-wrap${full ? " full" : ""}`}>
      <div className="spinner" />
    </div>
  );
}
