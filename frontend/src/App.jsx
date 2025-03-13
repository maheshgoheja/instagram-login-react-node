import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './App.css'; // Import a CSS file for styling

function App() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [conversations, setConversations] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const profile = urlParams.get('profile');
        if (profile) {
            try {
                const profileResult = JSON.parse(decodeURIComponent(profile));
                setProfileData(profileResult.profile);
                setAccessToken(profileResult.accessToken);
            } catch (e) {
                setError("Failed to parse profile data from URL.");
                console.error("Error parsing profile data:", e);
            }
        }
    }, []);

    const handleLogin = () => {
        window.location.href = 'http://localhost:5000/auth/instagram';
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('http://localhost:5000/auth/instagram/callback' + window.location.search);
                setProfileData(response.data.profile);
                setAccessToken(response.data.accessToken);
            } catch (err) {
                setError(err.message || "Failed to fetch profile data.");
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        if (window.location.pathname === '/auth/instagram/callback') {
            if (urlParams.has('code')) {
                fetchProfile();
            } else if (urlParams.has('error')) {
                setError(`Instagram Authentication Error: ${urlParams.get('error_description') || urlParams.get('error')}`);
                setLoading(false);
            }
        }
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        setError(null);
        setConversations(null);
        try {
            if (!accessToken) {
                setError("Access token is not available. Please login again.");
                setLoading(false);
                return;
            }
            const response = await axios.get('http://localhost:5000/api/instagram/conversations', {
                headers: { Authorization: `${accessToken}` }
            });
            setConversations(response.data.data);
        } catch (err) {
            setError(err.message || "Failed to fetch conversations.");
            console.error("Error fetching conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            {!profileData ? (
                // Landing Page UI
                <div className="landing-page">
                    <header className="landing-header">
                        <h1>Welcome to Instagram Profile Viewer</h1>
                        <p>Login with Instagram to view your profile details and messages.</p>
                    </header>
                    <main className="landing-main">
                        <button onClick={handleLogin} className="login-button" disabled={loading}>
                            {loading ? 'Loading...' : 'Login with Instagram'}
                        </button>
                        {error && <p className="error-message">{error}</p>}
                    </main>
                    <footer className="landing-footer">
                        <p>© 2025 Instagram Demo App</p>
                    </footer>
                </div>
            ) : (
                // Profile Page UI
                <div className="profile-page">
                    <header className="profile-header">
                        <h1>Your Instagram Profile</h1>
                    </header>
                    <main className="profile-main">
                        <div className="profile-card">
                            <img src={profileData.profile_picture_url} alt="Profile" className="profile-image" />
                            <div className="profile-details">
                                <p><strong>Username:</strong> {profileData.username}</p>
                                <p><strong>Name:</strong> {profileData.name}</p>
                                <p><strong>Account Type:</strong> {profileData.account_type}</p>
                                <p><strong>Media Count:</strong> {profileData.media_count}</p>
                                <p><strong>User ID:</strong> {profileData.id}</p>
                                <p><strong>Followers Count:</strong> {profileData.followers_count}</p>
                                <p><strong>Follows Count:</strong> {profileData.follows_count}</p>
                            </div>
                        </div>

                        <div className="conversations-section">
                            <button onClick={fetchConversations} className="fetch-conversations-button" disabled={loading || conversations}>
                                {loading ? 'Fetching Conversations...' : conversations ? 'Conversations Loaded' : 'Fetch Conversations'}
                            </button>
                            {error && <p className="error-message">{error}</p>}
                            {conversations && (
                                <div className="conversations-list">
                                    <h3>Conversations</h3>
                                    <ul>
                                        {conversations.map(conversation => (
                                            <li key={conversation.id} className="conversation-item">
                                                <p><strong>Conversation ID:</strong> {conversation.id}</p>
                                                <p><strong>Participants:</strong> {conversation.participants.map(p => p.username).join(', ')}</p>
                                                <div className="messages-list">
                                                    <strong>Last 5 Messages:</strong>
                                                    <ul>
                                                        {conversation.messages.data.map(message => (
                                                            <li key={message.id} className="message-item">
                                                                <p><strong>From:</strong> {message.from.username}</p>
                                                                <p><strong>Message:</strong> {message.message}</p>
                                                                <p className="message-time"><strong>Created:</strong> {new Date(message.created_time).toLocaleString()}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </main>
                    <footer className="profile-footer">
                        <p>Profile data fetched from Instagram API.</p>
                    </footer>
                </div>
            )}
        </div>
    );
}

export default App;