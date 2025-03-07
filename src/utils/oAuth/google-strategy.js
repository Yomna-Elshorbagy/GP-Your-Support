import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID2);

async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID2,
  });
  console.log(ticket);
  
  return ticket.getPayload();
}

import fetch from 'node-fetch';

async function getGoogleUserProfile(accessToken) {
  const response = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch user profile from Google People API');
  return await response.json();
}

export {
  verifyGoogleToken,
  getGoogleUserProfile
};