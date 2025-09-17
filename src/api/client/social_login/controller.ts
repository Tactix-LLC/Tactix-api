import { RequestHandler } from "express";
import axios from "axios";
import AppError from "../../../utils/app_error";
import generateToken from "../../../utils/generate_token";
import Client from "../dal";
import configs from "../../../configs";

// Google Sign-In verification using Google Auth Library
const verifyGoogleToken = async (idToken: string) => {
  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client();
    
    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: [
        '545588730676-j8ubicjil67nigc71luslotbgk77ok94.apps.googleusercontent.com', // Android
        '545588730676-cubab3ceuge681a5s1stjl30g8fd1lbt.apps.googleusercontent.com', // iOS
        '545588730676-otk6a1qemi8u1qet3btkfm98d0sncsi0.apps.googleusercontent.com'  // Web
      ]
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError("Invalid Google token payload", 401);
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      given_name: payload.given_name,
      family_name: payload.family_name,
      name: payload.name,
      picture: payload.picture
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new AppError("Invalid Google token", 401);
  }
};

// Facebook Sign-In verification
const verifyFacebookToken = async (accessToken: string) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`
    );
    return response.data;
  } catch (error) {
    throw new AppError("Invalid Facebook token", 401);
  }
};

// Apple Sign-In verification with proper JWT verification
const verifyAppleToken = async (identityToken: string) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // First, decode without verification to get the header
    const decodedHeader = jwt.decode(identityToken, { complete: true });
    if (!decodedHeader) {
      throw new AppError("Invalid Apple token format", 401);
    }

    // Get Apple's public keys
    const response = await axios.get('https://appleid.apple.com/auth/keys');
    const keys = response.data.keys;
    
    // Find the correct key based on the token's kid (key ID)
    const kid = decodedHeader.header.kid;
    const key = keys.find((k: any) => k.kid === kid);
    
    if (!key) {
      throw new AppError("Apple public key not found", 401);
    }

    // Convert JWK to PEM format for verification
    const jwkToPem = require('jwk-to-pem');
    const publicKey = jwkToPem(key);

    // Verify the token
    const payload = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      audience: configs.apple.clientId || 'app.jointactix.fantasy', // Your app's bundle ID
      issuer: 'https://appleid.apple.com'
    });

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || 'Apple User',
      email_verified: payload.email_verified
    };
  } catch (error) {
    console.error('Apple token verification error:', error);
    throw new AppError("Invalid Apple token", 401);
  }
};

export const socialLogin: RequestHandler = async (req, res, next) => {
  try {
    console.log('=== SOCIAL LOGIN REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    const { provider, id_token, access_token, email, first_name, last_name, profile_picture } = req.body;
    
    console.log('Parsed data:', {
      provider,
      email,
      first_name,
      last_name,
      hasIdToken: !!id_token,
      hasAccessToken: !!access_token,
      profile_picture
    });

    let verifiedData: any = {};

    // Verify the social provider token
    console.log(`Verifying ${provider} token...`);
    switch (provider) {
      case 'google':
        console.log('Verifying Google token...');
        verifiedData = await verifyGoogleToken(id_token);
        console.log('Google verification result:', verifiedData);
        break;
      case 'facebook':
        console.log('Verifying Facebook token...');
        verifiedData = await verifyFacebookToken(access_token);
        console.log('Facebook verification result:', verifiedData);
        break;
      case 'apple':
        console.log('Verifying Apple token...');
        verifiedData = await verifyAppleToken(id_token);
        console.log('Apple verification result:', verifiedData);
        break;
      default:
        console.log('Unsupported provider:', provider);
        return next(new AppError("Unsupported social provider", 400));
    }

    // Check if user exists by email
    console.log('Checking if user exists by email:', email);
    let client = await Client.getClientByEmail(email);
    console.log('Existing client found:', !!client);

    if (!client) {
      // Create new user
      console.log('Creating new user...');
      const clientData = {
        first_name: first_name || verifiedData.given_name || verifiedData.name?.split(' ')[0] || 'User',
        last_name: last_name || verifiedData.family_name || verifiedData.name?.split(' ').slice(1).join(' ') || '',
        email: email || verifiedData.email,
        phone_number: undefined, // Social login users don't need phone number
        birth_date: undefined,
        pin: '0000', // Default pin for social login users
        pin_confirm: '0000',
        accept: true,
        agent_code: '', // Empty string instead of undefined
        ref_agent_code: '',
        profile_picture: profile_picture || verifiedData.picture?.data?.url || verifiedData.picture,
        social_provider: provider,
        social_id: verifiedData.sub || verifiedData.id,
      };
      console.log('Client data to create:', clientData);

      client = await Client.signUp(clientData);
      console.log('New client created:', client._id);
    } else {
      // Update existing user with social provider info if not already set
      console.log('Updating existing client...');
      if (!client.social_provider) {
        await Client.updateClientSocialInfo(client._id, {
          social_provider: provider,
          social_id: verifiedData.sub || verifiedData.id,
          profile_picture: profile_picture || verifiedData.picture?.data?.url || verifiedData.picture,
        });
        console.log('Client social info updated');
      }
    }

    // Generate token
    console.log('Generating JWT token for client:', client._id);
    const token = generateToken({ id: client._id, user: "client" });

    // Respond
    console.log('Sending successful response');
    res.status(200).json({
      status: "SUCCESS",
      message: "Social login successful",
      data: {
        client: {
          id: client._id,
          has_team: client.has_team,
        },
      },
      token,
    });
  } catch (error) {
    console.log('=== SOCIAL LOGIN ERROR ===');
    console.log('Error:', error);
    console.log('Error message:', error instanceof Error ? error.message : String(error));
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    next(error);
  }
};
