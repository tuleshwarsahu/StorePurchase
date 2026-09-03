import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  let Icon = HelpCircle;
  let iconBg = 'bg-amber-100 text-amber-600';
  let confirmBtnStyle = 'bg-slate-900 hover:bg-slate-800 text-white';

  if (type === 'danger') {
    Icon = AlertCircle;
    iconBg = 'bg-rose-100 text-rose-600';
    confirmBtnStyle = 'bg-rose-600 hover:bg-rose-700 text-white';
  } else if (type === 'success') {
    Icon = CheckCircle2;
    iconBg = 'bg-emerald-100 text-emerald-600';
    confirmBtnStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white';
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-xs ${confirmBtnStyle}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full shrink-0 ${iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};
