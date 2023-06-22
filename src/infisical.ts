import InfisicalClient from "infisical-node";

const client = new InfisicalClient({
  token: process.env.INFISICAL_TOKEN,
});

export default client;
