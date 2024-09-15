import { NextRequest, NextResponse } from "next/server";

const api_key = process.env.TERRA_API_KEY;
const reference_id = process.env.TERRA_DEV_ID;

export async function POST(request: NextRequest) {
  try {
    console.log('API Key:', api_key);
    console.log('Reference ID:', reference_id);
    
    if (!api_key || !reference_id) {
      console.error('Missing API key or reference ID');
      return NextResponse.json({ error: 'Missing API key or reference ID' }, { status: 400 });
    }

    const response = await fetch(
      'https://api.tryterra.co/v2/auth/generateWidgetSession',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'dev-id': 'testingTerra',
          'content-type': 'application/json',
          'x-api-key': api_key,
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
    
    console.log('Terra API response status:', response.status);
    
    const data = await response.json();
    console.log('Terra API response data:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Terra API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}