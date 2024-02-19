// import NextAuth from "next-auth"
// import CredentialsProvider from "next-auth/providers/credentials"
// import { getCsrfToken } from "next-auth/react"
// import { SiweMessage } from "siwe"

// // For more information on each option (and a full list of options) go to
// // https://next-auth.js.org/configuration/options
// export default async function auth(req: any, res: any) {
//   const providers = [
//     CredentialsProvider({
//       name: "Ethereum",
//       credentials: {
//         message: {
//           label: "Message",
//           type: "text",
//           placeholder: "0x0",
//         },
//         signature: {
//           label: "Signature",
//           type: "text",
//           placeholder: "0x0",
//         },
//       },
//       async authorize(credentials) {
//         try {
//           const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"))
//           const nextAuthUrl = new URL(process.env.NEXTAUTH_URL)

        //   const result = await siwe.verify({
        //     signature: credentials?.signature || "",
        //     domain: nextAuthUrl.host,
        //     nonce: await getCsrfToken({ req }),
        //   })

//           if (result.success) {
//             return {
//               id: siwe.address,
//             }
//           }
//           return null
//         } catch (e) {
//           return null
//         }
//       },
//     }),
//   ]

//   const isDefaultSigninPage =
//     req.method === "GET" && req.query.nextauth.includes("signin")

//   // Hide Sign-In with Ethereum from default sign page
//   if (isDefaultSigninPage) {
//     providers.pop()
//   }

//   return await NextAuth(req, res, {
//     // https://next-auth.js.org/configuration/providers/oauth
//     providers,
//     session: {
//       strategy: "jwt",
//     },
//     secret: process.env.NEXTAUTH_SECRET,
//     callbacks: {
//       async session({ session, token }: { session: any; token: any }) {
//         session.address = token.sub
//         session.user.name = token.sub
//         session.user.image = "https://www.fillmurray.com/128/128"
//         return session
//       },
//     },
//   })
// }



// import { IncomingMessage } from 'http';
// import { NextApiRequest, NextApiResponse } from 'next';
// import NextAuth, { NextAuthOptions } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import { getCsrfToken } from 'next-auth/react';
// import { SiweMessage } from 'siwe';

// export function getAuthOptions(req: IncomingMessage): NextAuthOptions {
//   const providers = [
//     CredentialsProvider({
//       async authorize(credentials) {
//         try {
//           const siwe = new SiweMessage(
//             JSON.parse(credentials?.message || '{}')
//           );

//           const nextAuthUrl =
//             process.env.NEXTAUTH_URL ||
//             (process.env.VERCEL_URL
//               ? `https://${process.env.VERCEL_URL}`
//               : null);
//           if (!nextAuthUrl) {
//             return null;
//           }

//           const nextAuthHost = new URL(nextAuthUrl).host;
//           if (siwe.domain !== nextAuthHost) {
//             return null;
//           }

//           if (
//             siwe.nonce !==
//             (await getCsrfToken({ req: { headers: req.headers } }))
//           ) {
//             return null;
//           }

//           await siwe.verify({ signature: credentials?.signature || '' });
//           return {
//             id: siwe.address,
//           };
//         } catch (e) {
//           return null;
//         }
//       },
//       credentials: {
//         message: {
//           label: 'Message',
//           placeholder: '0x0',
//           type: 'text',
//         },
//         signature: {
//           label: 'Signature',
//           placeholder: '0x0',
//           type: 'text',
//         },
//       },
//       name: 'Ethereum',
//     }),
//   ];

//   return {
//     callbacks: {
//       async session({ session, token }) {
//         session.address = token.sub;
//         session.user = {
//           name: token.sub,
//         };
//         return session;
//       },
//     },
//     // https://next-auth.js.org/configuration/providers/oauth
//     providers,
//     secret: process.env.NEXTAUTH_SECRET,
//     session: {
//       strategy: 'jwt',
//     },
//   };
// }

// // For more information on each option (and a full list of options) go to
// // https://next-auth.js.org/configuration/options
// export default async function auth(req: NextApiRequest, res: NextApiResponse) {
//   const authOptions = getAuthOptions(req);

//   if (!Array.isArray(req.query.nextauth)) {
//     res.status(400).send('Bad request');
//     return;
//   }

//   const isDefaultSigninPage =
//     req.method === 'GET' &&
//     req.query.nextauth.find(value => value === 'signin');

//   // Hide Sign-In with Ethereum from default sign page
//   if (isDefaultSigninPage) {
//     authOptions.providers.pop();
//   }

//   return await NextAuth(req, res, authOptions);
// }