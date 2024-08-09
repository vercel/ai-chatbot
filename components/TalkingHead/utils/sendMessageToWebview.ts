export default function sendMessageToWebview({
  concept,
  message,
  exercise,
  lesson,
  lessonId,
  reading,
  classId,
  userUID,
}: {
  concept?: string;
  message?: string;
  exercise?: string;
  lesson?: string;
  lessonId?: string;
  reading?: string;
  classId?: string;
  userUID?: string;
}): void {
  // @ts-ignore
  window?.ReactNativeWebView?.postMessage(
    JSON.stringify({
      concept,
      message,
      exercise,
      lesson,
      lessonId,
      reading,
      classId,
      userUID,
    })
  );
}
