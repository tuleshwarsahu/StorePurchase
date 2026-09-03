import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const StoreContext = createContext();

const INITIAL_INDENTS = [];

const INITIAL_NOTIFICATIONS = [];

export const StoreProvider = ({ children }) => {
  const [indents, setIndents] = useState(INITIAL_INDENTS);
  const [approvedIndents, setApprovedIndents] = useState([]);
  const [storeInRecords, setStoreInRecords] = useState([]);
  const [storeOutRecords, setStoreOutRecords] = useState([]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Seed fallback users matching Google Sheet 'Login Credentials'
  const SEED_USERS = [
    { employeeId: '1', name: 'Pawan Tiwari', username: 'pawan', password: '3313', role: 'admin', pageAccess: 'ALL', avatar: 'PT' },
    { employeeId: '2', name: 'Pratap Kumar', username: 'pratap', password: '2010', role: 'user', pageAccess: 'create-indent,all-indents,pending-processes,vendor-management', avatar: 'PK' }
  ];

  // Auth User Session State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('store_purchase_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user session:', e);
      }
    }
    return null; // Require explicit login on fresh sessions/devices!
  });

  // Login handler with GAS API & local seed fallback
  const loginUser = async (username, password) => {
    const uName = String(username || '').trim().toLowerCase();
    const pwd = String(password || '').trim();

    try {
      const res = await apiService.loginUser({ username: uName, password: pwd });
      if (res && res.status === 'success' && res.user) {
        localStorage.setItem('store_purchase_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        addToast('Login Successful', `Welcome back, ${res.user.name}!`, 'success');
        return { success: true, user: res.user };
      }
    } catch (err) {
      console.log('GAS login API failed, attempting offline seed login:', err);
    }

    // Fallback seed lookup
    const seedFound = SEED_USERS.find((u) => u.username === uName && u.password === pwd);
    if (seedFound) {
      localStorage.setItem('store_purchase_user', JSON.stringify(seedFound));
      setCurrentUser(seedFound);
      addToast('Login Successful', `Welcome back, ${seedFound.name}!`, 'success');
      return { success: true, user: seedFound };
    }

    addToast('Login Failed', 'Invalid username or password. Please try again.', 'error');
    return { success: false, message: 'Invalid username or password' };
  };

  // Logout handler
  const logoutUser = () => {
    localStorage.removeItem('store_purchase_user');
    setCurrentUser(null);
    addToast('Logged Out', 'You have been logged out safely.', 'info');
  };

  // Helper to verify if logged in user has access to a specific pageId
  const hasPageAccess = (pageId) => {
    if (!currentUser) return false;
    if (!currentUser.pageAccess || currentUser.pageAccess === 'ALL' || currentUser.role === 'admin') {
      return true;
    }
    const allowedList = String(currentUser.pageAccess).split(',').map((s) => s.trim());
    return allowedList.includes(pageId);
  };

  const deletedQuotesSet = React.useRef(new Set());

  const refreshIndents = async () => {
    try {
      const res = await apiService.getAllIndents();
      if (res && res.status === 'success' && Array.isArray(res.indents)) {
        setIndents((prevIndents) => {
          // Build local quotations & offers lookup map to preserve un-synced quotes
          const localQuotesMap = {};
          const localRegOffers = {};
          prevIndents.forEach((item) => {
            const prodNorm = String(item.productName || '').toLowerCase().trim();
            const key = prodNorm ? `${item.id}_${prodNorm}` : item.id;
            if (item.vendorQuotations && item.vendorQuotations.length > 0) {
              localQuotesMap[key] = item.vendorQuotations;
            }
            if (item.regularVendorOffer) {
              localRegOffers[key] = item.regularVendorOffer;
            }
          });

          return res.indents.map((remoteItem) => {
            const prodNorm = String(remoteItem.productName || '').toLowerCase().trim();
            const itemKey = prodNorm ? `${remoteItem.id}_${prodNorm}` : remoteItem.id;
            const remoteQuotes = remoteItem.vendorQuotations || [];
            const localQuotes = localQuotesMap[itemKey] || [];

            // Combine remote & local quotes uniquely by vendorName & rate
            const combinedQuotesMap = {};
            [...remoteQuotes, ...localQuotes].forEach((q) => {
              const qKey = `${q.vendorName}_${q.rate}`;
              if (!combinedQuotesMap[qKey]) {
                combinedQuotesMap[qKey] = q;
              }
            });

            // Filter out quotes that were explicitly deleted by user
            const mergedQuotes = Object.values(combinedQuotesMap).filter((q) => {
              const vName = String(q.vendorName || '').toLowerCase().trim();
              const key1 = `${remoteItem.id}_${vName}`;
              const key2 = `${remoteItem.id}_${String(remoteItem.productName || '').toLowerCase().trim()}_${vName}`;
              return !deletedQuotesSet.current.has(key1) && !deletedQuotesSet.current.has(key2);
            });

            const mergedRegOffer = remoteItem.regularVendorOffer || localRegOffers[itemKey] || localRegOffers[remoteItem.id] || null;

            return {
              ...remoteItem,
              vendorQuotations: mergedQuotes,
              regularVendorOffer: mergedRegOffer
            };
          });
        });
      }

      const approvedRes = await apiService.getApprovedIndents();
      if (approvedRes && approvedRes.status === 'success' && Array.isArray(approvedRes.indents)) {
        setApprovedIndents(approvedRes.indents);
      }

      const storeInRes = await apiService.getStoreInRecords();
      if (storeInRes && storeInRes.status === 'success' && Array.isArray(storeInRes.storeInItems)) {
        setStoreInRecords(storeInRes.storeInItems);
      }

      const storeOutRes = await apiService.getStoreOutRecords();
      if (storeOutRes && storeOutRes.status === 'success' && Array.isArray(storeOutRes.storeOutItems)) {
        setStoreOutRecords(storeOutRes.storeOutItems);
      }
    } catch (err) {
      console.log('Google Sheets load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load live indents from Google Sheets on mount & auto-poll every 10 seconds
  useEffect(() => {
    refreshIndents();
    const interval = setInterval(refreshIndents, 10000);
    return () => clearInterval(interval);
  }, []);

  const addToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // 1. Create New Indent (Supports Multiple Items under 1 Indent Number)
  const createIndent = (newIndentData) => {
    // Calculate max sequence matching Google Sheets Math.max() logic
    let maxSeq = 0;
    indents.forEach((item) => {
      if (item.id && item.id.startsWith('IND/2026/')) {
        const num = parseInt(item.id.replace('IND/2026/', ''), 10);
        if (!isNaN(num)) {
          maxSeq = Math.max(maxSeq, num);
        }
      }
    });

    const nextSeqNumber = maxSeq + 1;
    const paddedSeq = String(nextSeqNumber).padStart(4, '0');
    const newId = `IND/2026/${paddedSeq}`;

    let newRecords = [];
    if (newIndentData.items && Array.isArray(newIndentData.items) && newIndentData.items.length > 0) {
      newRecords = newIndentData.items.map((subItem) => ({
        id: newId,
        indentorName: newIndentData.indentorName || currentUser.name,
        department: newIndentData.department,
        areaOfMachine: newIndentData.areaOfMachine || '',
        groupHead: newIndentData.groupHead || '',
        productName: subItem.productName,
        quantity: Number(subItem.quantity),
        unit: subItem.unit || 'Kgs',
        productMakeSpecs: subItem.productMakeSpecs || '',
        currentStage: 'Process Selection',
        status: 'In Progress',
        createdDate: new Date().toISOString().split('T')[0],
        updatedTime: 'Just Now',
        assignedTo: newIndentData.indentorName || currentUser.name,
        regularVendorOffer: null,
        vendorQuotations: []
      }));
    } else {
      newRecords = [{
        id: newId,
        indentorName: newIndentData.indentorName || currentUser.name,
        department: newIndentData.department,
        areaOfMachine: newIndentData.areaOfMachine || '',
        groupHead: newIndentData.groupHead || '',
        productName: newIndentData.productName,
        quantity: Number(newIndentData.quantity),
        unit: newIndentData.unit || 'Kgs',
        productMakeSpecs: newIndentData.productMakeSpecs || '',
        currentStage: 'Process Selection',
        status: 'In Progress',
        createdDate: new Date().toISOString().split('T')[0],
        updatedTime: 'Just Now',
        assignedTo: newIndentData.indentorName || currentUser.name,
        regularVendorOffer: null,
        vendorQuotations: []
      }];
    }

    setIndents((prev) => [...newRecords, ...prev]);

    // Send to Google Apps Script Web App & Re-sync live indents
    apiService.createIndent(newIndentData).then((res) => {
      if (res && res.status === 'success') {
        const actualId = res.indentId || newId;
        addToast('Saved to Google Sheet', `Indent ${actualId} (${newRecords.length} items) successfully written to Google Sheet.`, 'success');
        refreshIndents();
      }
    }).catch((err) => console.log('GAS sync error:', err));

    addToast('Indent Created Successfully', `Generated Indent Number: ${newId} with ${newRecords.length} item(s)`, 'success');
    return newRecords[0];
  };

  // Helper for matching product name safely
  const isProductMatch = (itemProd, targetProd) => {
    if (!targetProd) return true;
    if (!itemProd) return false;
    return String(itemProd).trim().toLowerCase() === String(targetProd).trim().toLowerCase();
  };

  // 2. Submit Regular Vendor Offer (Col O: Actual 2)
  const saveRegularVendorOffer = (indentId, offerData, targetProductName = null) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === indentId && isProductMatch(item.productName, targetProductName)) {
          return {
            ...item,
            regularVendorOffer: {
              vendorName: offerData.vendorName,
              rate: Number(offerData.rate),
              paymentTerm: offerData.paymentTerm,
              unit: offerData.unit || item.unit,
              remarks: offerData.remarks || '',
              submittedAt: todayStr
            },
            selectedVendor: offerData.vendorName,
            actualVendorDate: todayStr,
            currentStage: 'Approval Queue',
            status: 'Ready for Approval',
            updatedTime: 'Just Now'
          };
        }
        return item;
      })
    );

    // Call Apps Script Backend to write Col O (Actual 2)
    apiService.saveRegularVendorOffer({
      indentId,
      productName: targetProductName,
      vendorName: offerData.vendorName,
      rate: offerData.rate,
      paymentTerm: offerData.paymentTerm,
      unit: offerData.unit,
      remarks: offerData.remarks
    }).catch((err) => console.error('GAS saveRegularVendorOffer sync error:', err));

    addToast('Vendor Offer Saved', `Regular Vendor details added for ${indentId}. Saved in Col O (Actual 2).`, 'success');
  };

  // 3. Add Single Quotation for Need More Vendor
  const addVendorQuotation = (indentId, quoteData, targetProductName = null) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const quoteId = `q-${Date.now()}`;
    const newQuote = {
      id: quoteId,
      vendorName: quoteData.vendorName,
      rate: Number(quoteData.rate),
      paymentTerm: quoteData.paymentTerm,
      unit: quoteData.unit || 'Pcs',
      addedOn: todayStr
    };

    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === indentId && isProductMatch(item.productName, targetProductName)) {
          return {
            ...item,
            vendorQuotations: [...(item.vendorQuotations || []), newQuote],
            updatedTime: 'Just Now'
          };
        }
        return item;
      })
    );

    // Call Apps Script Backend to save vendor quote
    apiService.addVendorQuotation({
      indentId,
      productName: targetProductName,
      vendorName: quoteData.vendorName,
      rate: quoteData.rate,
      paymentTerm: quoteData.paymentTerm,
      unit: quoteData.unit
    }).catch((err) => console.error('GAS addVendorQuotation sync error:', err));

    addToast('Quotation Added', `Quotation from ${quoteData.vendorName} recorded for ${targetProductName || indentId}.`, 'info');
  };

  // Remove vendor quotation
  const removeVendorQuotation = (indentId, quoteId, targetProductName = null, targetVendorName = null) => {
    if (targetVendorName) {
      const vName = String(targetVendorName).toLowerCase().trim();
      deletedQuotesSet.current.add(`${indentId}_${vName}`);
      if (targetProductName) {
        deletedQuotesSet.current.add(`${indentId}_${String(targetProductName).toLowerCase().trim()}_${vName}`);
      }
    }

    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === indentId && isProductMatch(item.productName, targetProductName)) {
          return {
            ...item,
            vendorQuotations: (item.vendorQuotations || []).filter((q) => q.id !== quoteId && (!targetVendorName || q.vendorName !== targetVendorName))
          };
        }
        return item;
      })
    );

    // Call Apps Script Backend to delete row from Approval Queue tab
    apiService.removeVendorQuotation({
      indentId,
      productName: targetProductName,
      vendorName: targetVendorName,
      quoteId
    }).catch((err) => console.error('GAS removeVendorQuotation sync error:', err));

    addToast('Quotation Removed', `Removed vendor quotation for ${targetProductName || indentId}.`, 'info');
  };

  // 4. Complete Vendor Collection (Move to Ready for Approval - Write Col R / Actual 3)
  const completeVendorCollection = (indentId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === indentId) {
          return {
            ...item,
            actualVendorDate: todayStr,
            currentStage: 'Approval Queue',
            status: 'Ready for Approval',
            updatedTime: 'Just Now'
          };
        }
        return item;
      })
    );

    // Call Apps Script Backend to write Col R (Actual 3)
    apiService.completeVendorCollection(indentId)
      .catch((err) => console.error('GAS completeVendorCollection sync error:', err));

    addToast('Vendor Collection Complete', `${indentId} saved in Col R (Actual 3) and moved to Approval Queue.`, 'success');
  };

  // 5. Approve Indent (Writes to APPROVE INDENT sheet tab starting Row 7+)
  const approveIndent = (indentId, selectedVendorNameOrMap, remarks) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const vendorMap = (typeof selectedVendorNameOrMap === 'object' && selectedVendorNameOrMap !== null)
      ? selectedVendorNameOrMap
      : null;
    const defaultVendorStr = typeof selectedVendorNameOrMap === 'string' ? selectedVendorNameOrMap : '';

    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === indentId) {
          let chosenVendor = '';
          if (vendorMap) {
            const pKey = String(item.productName || '').trim().toLowerCase();
            chosenVendor = vendorMap[pKey] || vendorMap[item.productName] || '';
          }
          if (!chosenVendor) chosenVendor = defaultVendorStr || item.selectedVendor || (item.regularVendorOffer ? item.regularVendorOffer.vendorName : '') || (item.vendorQuotations?.[0]?.vendorName || '');

          return {
            ...item,
            selectedVendor: chosenVendor,
            approverRemarks: remarks || 'Approved by Procurement Committee',
            approvedBy: currentUser.name,
            approvedDate: todayStr,
            actualApprovalDate: todayStr,
            currentStage: 'Completed',
            status: 'Approved',
            updatedTime: 'Just Now'
          };
        }
        return item;
      })
    );

    // Call Apps Script API to append records for ALL matching items under this indent
    const targetItems = indents.filter((i) => i.id === indentId);
    targetItems.forEach((targetItem) => {
      let chosenVendor = '';
      let chosenRate = 0;
      let chosenPaymentTerm = '';

      if (vendorMap) {
        const pKey = String(targetItem.productName || '').trim().toLowerCase();
        chosenVendor = vendorMap[pKey] || vendorMap[targetItem.productName] || '';
      }
      if (!chosenVendor) chosenVendor = defaultVendorStr;

      if (targetItem.regularVendorOffer) {
        if (!chosenVendor) chosenVendor = targetItem.regularVendorOffer.vendorName;
        chosenRate = targetItem.regularVendorOffer.rate;
        chosenPaymentTerm = targetItem.regularVendorOffer.paymentTerm;
      } else if (targetItem.vendorQuotations && targetItem.vendorQuotations.length > 0) {
        const foundQuote = targetItem.vendorQuotations.find((q) => q.vendorName === chosenVendor) || targetItem.vendorQuotations[0];
        if (foundQuote) {
          chosenVendor = foundQuote.vendorName;
          chosenRate = foundQuote.rate;
          chosenPaymentTerm = foundQuote.paymentTerm;
        }
      }

      if (chosenVendor) {
        apiService.approveIndent({
          indentId: indentId,
          what: targetItem.processType || targetItem.what || 'Regular Vendor',
          productName: targetItem.productName || '',
          vendorName: chosenVendor,
          rate: chosenRate,
          quantity: targetItem.quantity || 0,
          paymentTerm: chosenPaymentTerm,
          approvedBy: currentUser.name,
          remarks: remarks
        }).then((res) => {
          if (res && res.status === 'success') {
            if (res.poNumber) {
              addToast('PO Generated', `Approved & PO ${res.poNumber} created for ${targetItem.productName}.`, 'success');
            }
            refreshIndents();
          }
        }).catch((err) => console.error('GAS approveIndent sync error:', err));
      }
    });

    addToast('Indent Approved', `Indent ${indentId} items approved & saved to APPROVE INDENT sheet tab.`, 'success');
  };

  // 5b. Standalone Generate PO with Manual PO Number & Rate Input
  const generatePO = (indentId, customPoNumber, customRate, customVendorName) => {
    const targetItem = indents.find((i) => i.id === indentId);
    let chosenVendor = customVendorName || targetItem?.selectedVendor || (targetItem?.regularVendorOffer ? targetItem.regularVendorOffer.vendorName : '') || targetItem?.vendorName || '';
    let chosenRate = Number(customRate) > 0 ? Number(customRate) : (targetItem?.regularVendorOffer ? targetItem.regularVendorOffer.rate : (targetItem?.rate || 0));
    let chosenPaymentTerm = targetItem?.regularVendorOffer ? targetItem.regularVendorOffer.paymentTerm : (targetItem?.paymentTerm || '');

    // Fallback PO number calculation if manual input left blank
    let finalPoNo = customPoNumber && String(customPoNumber).trim() !== '' ? String(customPoNumber).trim() : '';
    if (!finalPoNo) {
      let maxPoSeq = 0;
      indents.forEach((item) => {
        if (item.poNumber && item.poNumber.startsWith('PO/2026/')) {
          const num = parseInt(item.poNumber.replace('PO/2026/', ''), 10);
          if (!isNaN(num)) maxPoSeq = Math.max(maxPoSeq, num);
        }
      });
      finalPoNo = `PO/2026/${String(maxPoSeq + 1).padStart(4, '0')}`;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === indentId) {
          return {
            ...item,
            poNumber: finalPoNo,
            rate: chosenRate,
            selectedVendor: chosenVendor,
            actualPoDate: todayStr,
            currentStage: 'PO Generated',
            status: 'Approved',
            updatedTime: 'Just Now'
          };
        }
        return item;
      })
    );

    apiService.generatePO({
      indentId: indentId,
      poNumber: finalPoNo,
      what: targetItem?.processType || targetItem?.what || 'Regular Vendor',
      productName: targetItem?.productName || '',
      vendorName: chosenVendor,
      rate: chosenRate,
      quantity: targetItem?.quantity || 0,
      paymentTerm: chosenPaymentTerm
    }).then((res) => {
      if (res && res.status === 'success') {
        const confirmedPo = res.poNumber || finalPoNo;
        addToast('PO Saved to Sheet', `PO ${confirmedPo} saved to Col J (Actual) & Col K (PO Number).`, 'success');
        refreshIndents();
      }
    }).catch((err) => console.error('GAS generatePO sync error:', err));
  };

  // 6. Reject Indent
  const rejectIndent = (indentId, remarks) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === indentId) {
          return {
            ...item,
            approverRemarks: remarks || 'Rejected during approval review.',
            approvedBy: currentUser.name,
            approvedDate: todayStr,
            actualApprovalDate: todayStr,
            currentStage: 'Completed',
            status: 'Rejected',
            updatedTime: 'Just Now'
          };
        }
        return item;
      })
    );

    addToast('Indent Rejected', `Indent ${indentId} has been rejected.`, 'error');
  };

  const selectProcess = (indentId, processTypeOrSelections) => {
    // If processTypeOrSelections is an array of item selections: [{ productName: '...', processType: '...' }]
    if (Array.isArray(processTypeOrSelections)) {
      const selectionsMap = {};
      processTypeOrSelections.forEach((sel) => {
        if (sel && sel.productName) {
          const typeStr = typeof sel.processType === 'string'
            ? sel.processType
            : (sel.processType?.processType || 'Regular Vendor');
          selectionsMap[sel.productName] = typeStr;
        }
      });

      setIndents((prev) =>
        prev.map((item) => {
          if (item.id === indentId && selectionsMap[item.productName]) {
            return {
              ...item,
              processType: selectionsMap[item.productName],
              processTypeSelected: true
            };
          }
          return item;
        })
      );

      apiService.saveProcessSelection(indentId, processTypeOrSelections).then((res) => {
        if (res && res.status === 'success') {
          addToast('Process Saved to Sheet', `Item process selections saved for ${indentId}`, 'success');
          refreshIndents();
        }
      }).catch((err) => console.log('GAS process selection sync error:', err));
    } else {
      // Single processType string fallback
      setIndents((prev) =>
        prev.map((item) => {
          if (item.id === indentId) {
            return {
              ...item,
              processType: processTypeOrSelections,
              processTypeSelected: true
            };
          }
          return item;
        })
      );

      apiService.saveProcessSelection(indentId, processTypeOrSelections).then((res) => {
        if (res && res.status === 'success') {
          addToast('Process Saved to Sheet', `Col M (What) set to '${processTypeOrSelections}' for ${indentId}`, 'success');
          refreshIndents();
        }
      }).catch((err) => console.log('GAS process selection sync error:', err));
    }
  };



  const recordStoreIn = (storeInPayload) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const newRecord = {
      timeStamp: todayStr,
      id: storeInPayload.indentId,
      statusOfReceived: storeInPayload.statusOfReceived || 'Completed',
      billStatus: storeInPayload.statusOfReceived || 'Completed',
      billNo: storeInPayload.billNo,
      vendorName: storeInPayload.vendorName,
      productName: storeInPayload.productName,
      indentQuantity: Number(storeInPayload.indentQuantity || storeInPayload.quantity),
      department: storeInPayload.department || '',
      receivedQuantity: Number(storeInPayload.receivedQuantity),
      quantity: Number(storeInPayload.receivedQuantity)
    };

    setStoreInRecords((prev) => [newRecord, ...prev]);

    setIndents((prev) =>
      prev.map((item) => {
        if (item.id === storeInPayload.indentId && String(item.productName).trim().toLowerCase() === String(storeInPayload.productName).trim().toLowerCase()) {
          const isCompleted = storeInPayload.statusOfReceived === 'Completed' || Number(storeInPayload.receivedQuantity) >= Number(item.quantity || storeInPayload.indentQuantity);
          return {
            ...item,
            billNo: storeInPayload.billNo,
            receivedQty: Number(storeInPayload.receivedQuantity),
            statusOfReceived: storeInPayload.statusOfReceived,
            storeInStatus: isCompleted ? 'Completed' : 'Partially Received',
            currentStage: isCompleted ? 'Store Received' : 'Partially Received in Store',
            updatedTime: 'Just Now'
          };
        }
        return item;
      })
    );

    apiService.recordStoreIn(storeInPayload).then((res) => {
      if (res && res.status === 'success') {
        addToast('Store In Recorded', `Bill No. ${storeInPayload.billNo} saved in STORE IN sheet tab!`, 'success');
      }
    }).catch((err) => console.log('GAS recordStoreIn sync error:', err));
  };

  const createStoreOutIndent = (storeOutPayload) => {
    let maxSeq = 0;
    storeOutRecords.forEach((r) => {
      if (r.id && r.id.startsWith('SOUT/2026/')) {
        const num = parseInt(r.id.replace('SOUT/2026/', ''), 10);
        if (!isNaN(num)) maxSeq = Math.max(maxSeq, num);
      }
    });

    const soutId = `SOUT/2026/${String(maxSeq + 1).padStart(4, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newRecord = {
      timeStamp: todayStr,
      id: soutId,
      storeOutNo: soutId,
      indentorName: storeOutPayload.indentorName || currentUser.name,
      department: storeOutPayload.department,
      area: storeOutPayload.area || storeOutPayload.areaOfMachine || '',
      groupHead: storeOutPayload.groupHead || '',
      productName: storeOutPayload.productName,
      qty: Number(storeOutPayload.qty || storeOutPayload.quantity),
      quantity: Number(storeOutPayload.qty || storeOutPayload.quantity),
      unit: storeOutPayload.unit || storeOutPayload.unitOfMeasurement || 'PCS',
      reason: storeOutPayload.reason || '',
      planned: todayStr,
      actual: '',
      status: 'Pending Issue'
    };

    setStoreOutRecords((prev) => [newRecord, ...prev]);

    apiService.createStoreOutIndent(storeOutPayload).then((res) => {
      if (res && res.status === 'success') {
        addToast('Store Out Indent Created', `Created Store Out request ${res.storeOutNo || soutId}`, 'success');
      }
    }).catch((err) => console.log('GAS createStoreOutIndent sync error:', err));
  };

  const issueStoreOutProduct = (soutId, productName) => {
    const todayStr = new Date().toISOString().split('T')[0];

    setStoreOutRecords((prev) =>
      prev.map((r) => {
        if (r.id === soutId && (!productName || String(r.productName).trim().toLowerCase() === String(productName).trim().toLowerCase())) {
          return {
            ...r,
            actual: todayStr,
            status: 'Issued'
          };
        }
        return r;
      })
    );

    apiService.issueStoreOutProduct({ storeOutNo: soutId, productName }).then((res) => {
      if (res && res.status === 'success') {
        addToast('Product Issued', `Store Out ${soutId} product issued successfully!`, 'success');
      }
    }).catch((err) => console.log('GAS issueStoreOutProduct sync error:', err));
  };

  return (
    <StoreContext.Provider
      value={{
        indents,
        approvedIndents,
        storeInRecords,
        storeOutRecords,
        notifications,
        toasts,
        isLoading,
        currentUser,
        loginUser,
        logoutUser,
        hasPageAccess,
        refreshIndents,
        createIndent,
        selectProcess,
        saveRegularVendorOffer,
        addVendorQuotation,
        removeVendorQuotation,
        completeVendorCollection,
        approveIndent,
        generatePO,
        recordStoreIn,
        createStoreOutIndent,
        issueStoreOutProduct,
        rejectIndent,
        addToast,
        removeToast,
        markNotificationsRead
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
