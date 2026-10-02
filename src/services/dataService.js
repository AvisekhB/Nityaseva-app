import { appsScriptAdapter } from './adapters/appsScriptAdapter';

// Decouples UI from backend; seamlessly switch to Supabase Adapter later!
const currentAdapter = appsScriptAdapter; 

export const DataService = {
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