require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID; // Add your Business Account ID to .env

// Step 1: Redirect to Instagram Login
app.get('/auth/instagram', (req, res) => {
    // Documentation: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=instagram_business_basic,instagram_business_manage_messages&response_type=code`; // Added instagram_manage_messages scope
    res.redirect(authUrl);
});

// Step 2: Handle Callback and Get Access Token
app.get('/auth/instagram/callback', async (req, res) => {
    const { code } = req.query;

    if (code) {
        try {
            // Exchange code for access token
            const tokenResponse = await axios({
                method: 'post',
                url: 'https://api.instagram.com/oauth/access_token',
                data: {
                    client_id: INSTAGRAM_APP_ID,
                    client_secret: INSTAGRAM_APP_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: INSTAGRAM_REDIRECT_URI,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const accessToken = tokenResponse.data.access_token;
            const userId = tokenResponse.data.user_id;

            // Step 3: Get Profile Details
            // Documentation: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started#fields
            const profileResponse = await axios.get(`https://graph.instagram.com/v22.0/${userId}?fields=id,username,account_type,media_count,profile_picture_url,name,followers_count,follows_count&access_token=${accessToken}`);
            const profileData = profileResponse.data;

            // Step 4: Send Profile Data to Frontend
            // For simplicity, we are also passing the access token back to the frontend here.
            // In a real production app, you would handle token storage more securely (e.g., backend sessions).
            res.json({ profile: profileData, accessToken: accessToken });

        } catch (error) {
            console.error("Instagram API Error:", error);
            res.status(500).json({ error: 'Failed to authenticate with Instagram' });
        }
    } else {
        res.status(400).json({ error: 'No code received from Instagram' });
    }
});

// Step 5: Endpoint to Get Conversations (Messaging API Example)
app.get('/api/instagram/conversations', async (req, res) => {
    const accessToken = req.headers.authorization; // Access token from Authorization header
    const businessAccountId = INSTAGRAM_BUSINESS_ACCOUNT_ID; // Business Account ID from .env

    if (!accessToken) {
        return res.status(401).json({ error: 'Access token required' });
    }
    if (!businessAccountId) {
        return res.status(400).json({ error: 'Instagram Business Account ID is not configured in backend .env file.' });
    }

    try {
        // Documentation: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
        // Getting conversations for a Business Account
        const conversationsResponse = await axios.get(`https://graph.instagram.com/v22.0/${businessAccountId}/conversations?fields=id,messages.limit(5){id,message,created_time,from},participants&access_token=${accessToken}`);
        const conversationsData = conversationsResponse.data;

        res.json(conversationsData);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: 'Failed to fetch conversations from Instagram API' });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});