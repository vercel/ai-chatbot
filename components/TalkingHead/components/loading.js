export default function Loading({ loadingMessage }) {
  return (
    <div
      id="loading"
      style={{
        textAlign: "center",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {loadingMessage}
    </div>
  );
}
