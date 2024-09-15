'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const api_key = process.env.NEXT_PUBLIC_TERRA_API_KEY;
const reference_id = process.env.NEXT_PUBLIC_TERRA_DEV_ID;

/// The getWidgetAsync function is an asynchronous function that fetches the widget session URL from the Terra API
/// and sets the url state using the setUrl function.
/// It takes an object with an onSuccess callback function as a parameter to set state back to the main component.
export const getWidgetAsync = async (props: { onSuccess: any }) => {
  try {
    const response = await fetch(
      'https://api.tryterra.co/v2/auth/generateWidgetSession',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'dev-id': 'testingTerra',
          'content-type': 'application/json',
          'x-api-key': api_key as string,
        },
        body: JSON.stringify({
          reference_id: reference_id,
          providers:
            'GARMIN,WITHINGS,FITBIT,GOOGLE,OURA,WAHOO,PELOTON,ZWIFT,TRAININGPEAKS,FREESTYLELIBRE,DEXCOM,COROS,HUAWEI,OMRON,RENPHO,POLAR,SUUNTO,EIGHT,APPLE,CONCEPT2,WHOOP,IFIT,TEMPO,CRONOMETER,FATSECRET,NUTRACHECK,UNDERARMOUR',
          language: 'en',
          auth_success_redirect_url: 'terraficapp://request',
          auth_failure_redirect_url: 'terraficapp://login',
        }),
      },
    );
    const json = await response.json();
    props.onSuccess(json.url);
  } catch (error) {
    console.error(error);
  }
};

export const Widget = () => {
  const [url, setUrl] = useState('');

  // Close the browser when authentication is completed. Authentication completion can be detected by listening to the incoming link.
  // The success or fail url is logged into the console.
  const _handleURL = (event: MessageEvent) => {
    console.log(event.data);
  };
  // Open the browser for authentication using the Widget components.
  const _handlePressButtonAsync = async () => {
    getWidgetAsync({ onSuccess: setUrl });
    // Use window.open instead of WebBrowser.openBrowserAsync
    window.open(url, '_blank');
  };

  // set up an url listener and invoke getWidgetAsync when the component is mounted
  useEffect(() => {
    // Linking.addEventListener is not available in Next.js
    // We can use window.addEventListener for similar functionality
    window.addEventListener('message', _handleURL);
    getWidgetAsync({ onSuccess: setUrl });

    // Cleanup function
    return () => {
      window.removeEventListener('message', _handleURL);
    };
  }, []);

  return (
    <div>
      <Button onClick={_handlePressButtonAsync}>open widget</Button>
    </div>
  );
};
