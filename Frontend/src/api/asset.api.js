import api from "./axios";
import { MAP_PRESETS } from "../constants/mapPresets";
import { TOKEN_PRESETS } from "../constants/tokenPresets";

const RAW_BASE = api.defaults.baseURL || "http://localhost:8080/api";
const BACKEND_HOST = RAW_BASE.replace(/\/api\/?$/, "");

export const getAssetUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // اگر لینک کامل یا داده data / blob است، فوراً برگردان
  if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // اگر فقط نام فایل بدون اسلش بود، مسیر uploads را به آن اضافه کن
  if (!trimmed.includes("/")) {
    return `${BACKEND_HOST}/uploads/${trimmed}`;
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${BACKEND_HOST}${cleanPath}`;
};

export const assetApi = {
  getPresetMaps: async () => {
    return MAP_PRESETS || [];
  },

  getPresetTokens: async () => {
    return TOKEN_PRESETS || [];
  },

  getAssets: async (type = null) => {
    const params = type ? { type } : {};
    const res = await api.get("/assets", { params });
    return res.data;
  },

  uploadAsset: async (file, name, type = "TOKEN", metadata = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);
    formData.append("type", type);

    const fields = [
      "dpi",
      "columns",
      "rows",
      "rotation",
      "isVisible",
      "isLocked",
      "defaultText",
      "textColor",
      "fontSize",
      "fontFamily",
    ];

    fields.forEach((field) => {
      if (metadata[field] !== undefined && metadata[field] !== null) {
        formData.append(field, metadata[field]);
      }
    });

    const res = await api.post("/assets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  createAssetFromUrl: async (url, name, type = "TOKEN", metadata = {}) => {
    const res = await api.post("/assets/from-url", {
      url: url.trim(),
      name,
      type,
      ...metadata,
    });
    return res.data;
  },

  updateAsset: async (assetId, updateData) => {
    const res = await api.patch(`/assets/${assetId}`, updateData);
    return res.data;
  },

  deleteAsset: async (assetId) => {
    await api.delete(`/assets/${assetId}`);
    return true;
  },
};

export default assetApi;