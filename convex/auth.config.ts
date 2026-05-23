export default {
  providers: [
    {
      domain: "https://accounts.google.com",
      applicationID: process.env.GOOGLE_CLIENT_ID!,
    },
    {
      domain: "https://github.com",
      applicationID: process.env.GITHUB_CLIENT_ID!,
    },
  ],
};
