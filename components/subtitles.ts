export const translateText = async ({
  text,
}: {
  text: string;
}): Promise<string> => {
  const apiKey = "AIzaSyCIF1_dbZ3UHMe1x3Fxtu-GB0mYwzrh5Mo";
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}&q=${text}&target=es`;
  try {
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    // @ts-ignore
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: "error", message: error })
    );
    return "";
  }
};
