import { createDocumentHandler } from "@/lib/artifacts/server";
 
export const sliderDocumentHandler = createDocumentHandler<"slider">({
  kind: "slider",
  // Called when the document is first created.
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";
    dataStream.writeData({
      type: "finish",
    });
 
    return draftContent;
  },
  // Called when updating the document based on user modifications.
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";
    console.log('Recieved update', document, description)
   
    return draftContent;
  },
  
});