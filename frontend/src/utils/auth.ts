export const getGoogleAuthUrl = () => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri: "http://localhost:3000/auth/callback",
        client_id: "518518930801-6b3lu430juulj4o9d38tvc0sk71vno0q.apps.googleusercontent.com",
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    const qs = new URLSearchParams(options);

    return `${rootUrl}?${qs.toString()}`;
};
