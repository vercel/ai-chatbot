import 'server-only'
import { Client } from '@microsoft/microsoft-graph-client';
import { auth, EnrichedSession } from '../auth'; // Replace './auth' with the correct path to the file containing the EnrichedSession type


export default async function getGraphClient() {

    const session = (await auth()) as EnrichedSession;
    // console.log('Session inside the route ', session);

    const accessToken = session?.accessToken;
    // const refreshToken = session?.refreshToken; // Remove this line if refreshToken is not used

    const client = Client.init({
        authProvider: (done) =>
            done(
                null,
                accessToken // WHERE DO WE GET THIS FROM?
            ),
    });

    return client 
}
