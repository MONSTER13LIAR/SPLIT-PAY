export const getGoogleAuthUrl = () => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/callback",
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    if (!options.client_id) {
        console.error("Google Client ID is missing from environment variables.");
    }

    const qs = new URLSearchParams(options);

    return `${rootUrl}?${qs.toString()}`;
};
