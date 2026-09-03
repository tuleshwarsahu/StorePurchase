/**
 * API Integration Service for Google Apps Script Backend
 */

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_URL;

export const apiService = {
  // 1. Fetch Dashboard Summary Data
  async getDashboardSummary() {
    try {
      const res = await fetch(`${GAS_WEB_APP_URL}?action=getDashboardSummary`);
      return await res.json();
    } catch (err) {
      console.error('GAS getDashboardSummary error:', err);
      return null;
    }
  },

  // 2. Fetch All Indents
  async getAllIndents() {
    try {
      const res = await fetch(`${GAS_WEB_APP_URL}?action=getAllIndents`);
      return await res.json();
    } catch (err) {
      console.error('GAS getAllIndents error:', err);
      return null;
    }
  },

  // 2b. Fetch Approved Indents directly from APPROVE INDENT sheet tab
  async getApprovedIndents() {
    try {
      const res = await fetch(`${GAS_WEB_APP_URL}?action=getApprovedIndents`);
      return await res.json();
    } catch (err) {
      console.error('GAS getApprovedIndents error:', err);
      return null;
    }
  },

  // 3. Create Indent - Posts directly to Google Sheet
  async createIndent(indentPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'createIndent', data: indentPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS createIndent error:', err);
      return null;
    }
  },

  // 3b. Save Process Selection (Col L: Actual, Col M: What)
  async saveProcessSelection(indentId, processTypeOrSelections) {
    try {
      const payloadData = Array.isArray(processTypeOrSelections)
        ? { indentId, itemSelections: processTypeOrSelections }
        : { indentId, processType: processTypeOrSelections };

      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveProcessSelection', data: payloadData })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS saveProcessSelection error:', err);
      return null;
    }
  },

  // 4. Save Regular Vendor Offer
  async saveRegularVendorOffer(offerPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveRegularVendorOffer', data: offerPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS saveRegularVendorOffer error:', err);
      return null;
    }
  },

  // 5. Add Vendor Quotation
  async addVendorQuotation(quotePayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addVendorQuotation', data: quotePayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS addVendorQuotation error:', err);
      return null;
    }
  },

  // 5b. Remove Vendor Quotation
  async removeVendorQuotation(quotePayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'removeVendorQuotation', data: quotePayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS removeVendorQuotation error:', err);
      return null;
    }
  },

  // 6. Complete Vendor Collection
  async completeVendorCollection(indentId) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'completeVendorCollection', data: { indentId } })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS completeVendorCollection error:', err);
      return null;
    }
  },

  // 7. Approve Indent
  async approveIndent(approvalPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'approveIndent', data: approvalPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS approveIndent error:', err);
      return null;
    }
  },

  // 7b. Generate PO
  async generatePO(poPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'generatePO', data: poPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS generatePO error:', err);
      return null;
    }
  },

  // 8. Reject Indent
  async rejectIndent(rejectionPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'rejectIndent', data: rejectionPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS rejectIndent error:', err);
      return null;
    }
  },

  // 9. Record Store In Receiving
  async recordStoreIn(storeInPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'recordStoreIn', data: storeInPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS recordStoreIn error:', err);
      return null;
    }
  },

  // 10. Fetch Store In Records
  async getStoreInRecords() {
    try {
      const res = await fetch(`${GAS_WEB_APP_URL}?action=getStoreInRecords`);
      return await res.json();
    } catch (err) {
      console.error('GAS getStoreInRecords error:', err);
      return null;
    }
  },

  // 11. Create Store Out Indent Request
  async createStoreOutIndent(storeOutPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'createStoreOutIndent', data: storeOutPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS createStoreOutIndent error:', err);
      return null;
    }
  },

  // 12. Issue Store Out Product
  async issueStoreOutProduct(issuePayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'issueStoreOutProduct', data: issuePayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS issueStoreOutProduct error:', err);
      return null;
    }
  },

  // 13. Fetch Store Out Records
  async getStoreOutRecords() {
    try {
      const res = await fetch(`${GAS_WEB_APP_URL}?action=getStoreOutRecords`);
      return await res.json();
    } catch (err) {
      console.error('GAS getStoreOutRecords error:', err);
      return null;
    }
  },

  // 14. Authenticate / Login User
  async loginUser(credentials) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'loginUser', data: credentials })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS loginUser error:', err);
      return null;
    }
  },

  // 15. Get All Login Credentials
  async getLoginCredentials() {
    try {
      const res = await fetch(`${GAS_WEB_APP_URL}?action=getLoginCredentials`);
      return await res.json();
    } catch (err) {
      console.error('GAS getLoginCredentials error:', err);
      return null;
    }
  },

  // 16. Save / Update User Credential
  async saveUserCredential(userData) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveUserCredential', data: userData })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS saveUserCredential error:', err);
      return null;
    }
  },

  // 17. Delete User Credential
  async deleteUserCredential(userPayload) {
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteUserCredential', data: userPayload })
      });
      return await res.json();
    } catch (err) {
      console.error('GAS deleteUserCredential error:', err);
      return null;
    }
  }
};
