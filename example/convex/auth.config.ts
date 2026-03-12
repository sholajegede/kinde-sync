const authConfig = {
  providers: [
    {
      domain: process.env.KINDE_ISSUER_URL,
      applicationID: process.env.KINDE_CLIENT_ID,
    },
  ],
};

export default authConfig;
