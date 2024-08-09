export default function Subtitles({ subtitles, isKeyboardOpen, fontSize }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: isKeyboardOpen ? "30px" : "140px",
        left: "50%",
        transform: "translateX(-50%)",
        color: "#FFF", // Change as needed
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Background to make text more readable
        padding: "10px",
        borderRadius: "5px",
        width: "80%",
        fontSize: fontSize,
        textAlign: "center", // Adjust as needed
      }}
    >
      {subtitles}
    </div>
  );
}
