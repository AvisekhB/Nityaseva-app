import { appsScriptAdapter } from './adapters/appsScriptAdapter';

// Decouples UI from backend; seamlessly switch to Supabase Adapter later!
const currentAdapter = appsScriptAdapter; 

export const DataService = {
  // Fetch all senior records from Google Sheets for the dropdown menu
  async getSeniors() {
    return await currentAdapter.post("getAllSeniors", {});
  },

  // Fetch a single senior profile by ID
  async getSenior(seniorId) {
    return await currentAdapter.post("getSenior", { seniorId });
  },

  // Fetch entitlement data for a senior for a given month
  async getEntitlements(seniorId, monthYear) {
    return await currentAdapter.post("getEntitlements", { seniorId, monthYear });
  },

  // Create a new senior profile directly in the Google Sheet
  async createSeniorProfile(seniorData) {
    return await currentAdapter.post("createSeniorProfile", seniorData);
  },

  async createWorkOrder(seniorId, serviceType, assignedToEmail, notifyEmails) {
    return await currentAdapter.post("createWorkOrder", {
      seniorId,
      serviceType,
      assignedToEmail,
      notifyEmails
    });
  },

  async verifyStartCode(woId, code, verifiedBy) {
    return await currentAdapter.post("verifyStartCode", { woId, code, verifiedBy });
  },

  async verifyEndCode(woId, code, verifiedBy) {
    return await currentAdapter.post("verifyEndCode", { woId, code, verifiedBy });
  }
};
