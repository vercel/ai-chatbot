import  { useEffect } from 'react';
import useDrivePicker from 'react-google-drive-picker'
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

function App({ setUploadQueue, setAttachments, uploadFile, setOpen}) {
  const [openPicker, data, authResponse] = useDrivePicker();  
  // const customViewsArray = [new google.picker.DocsView()]; // custom view
  const handleOpenPicker = () => {
    openPicker({
      clientId: "3873881820-5l4vi6jcloffatnr9shr8l2hji23v99k.apps.googleusercontent.com",
      developerKey: "AIzaSyAa4sLIvA6YZLaAiOMObKBjW7aDdjMkhwA",
      viewId: "DOCS",
      // token: token, // pass oauth token in case you already have one
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: true,
      // customViews: customViewsArray, // custom view
      callbackFunction: (data) => {
        if (data.action === 'cancel') {
          console.log('User clicked cancel/close button')
        }else if(data.action == "picked"){
          renderDriveFiles(data.docs)
        }
        console.log(data)
        console.log(data)
      },
    })
  }

  const renderDriveFiles = async (files) =>{
      setUploadQueue(files.map((file) => file.name));
      try {
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...files.map(file=>({ ...file, contentType: file.mimeType, url: file.embedUrl})),
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    }

  

  
  return (
    <DropdownMenuItem
       onSelect={() => {
         setOpen(false);
       }}
       onClick={() => handleOpenPicker()}
       className="gap-2 group/item flex flex-row justify-between items-center"
     >
       <div className="flex flex-col gap-1 items-start">
         Connect to google drive
       </div>
       <div className="text-foreground dark:text-foreground group-data-[active=true]/item:opacity-100">
         <img src='/images/drive.png' className='h-4 bg-slate-200'/>
       </div>
     </DropdownMenuItem>
  );
}

export default App;
