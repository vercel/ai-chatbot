export default function TestingUI({ head, handleSpeak }) {
  return (
    <>
      <input
        type="text"
        id="message"
        style={{
          position: "absolute",
          bottom: "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid lightgray",
          width: "80%",
        }}
      />
      <button
        onClick={() => {
          const message = document.getElementById("message").value;
          console.log("Message:", message);
          handleSpeak(message);
        }}
        style={{
          position: "absolute",
          bottom: "-80px",
          left: "50%",
          transform: "translateX(-0%)",
          backgroundColor: "blue",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          border: "none",
        }}
      >
        Speak
      </button>
      <input
        type="file"
        id="avatarFile"
        onChange={() => {
          const file = document.getElementById("avatarFile").files[0];
          const reader = new FileReader();
          reader.onload = function (e) {
            const dataURL = e.target.result;
            head.current.changeAvatar(dataURL);
          };
          reader.readAsDataURL(file);
        }}
        style={{
          position: "absolute",
          bottom: "-130px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px",
          borderRadius: "5px",
          border: "none",
          width: "80%",
        }}
      />
    </>
  );
}
