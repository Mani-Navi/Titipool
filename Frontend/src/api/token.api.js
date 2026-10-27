import api from "./axios";

export const tokenApi = {
  getTokensByScene: async (sceneId) => {
    const res = await api.get(`/tokens/scene/${sceneId}`);
    return res.data;
  },

  createToken: async (tokenData) => {
    const res = await api.post("/tokens", tokenData);
    return res.data;
  },

  deleteToken: async (tokenId) => {
    await api.delete(`/tokens/${encodeURIComponent(tokenId)}`);
    return true;
  },
};