import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | React.ReactNode; // Made description optional
  onConfirm?: () => void; // Optional confirm action
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  children?: React.ReactNode;
  hideActions?: boolean; // New prop to hide default action buttons
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-indigo-600 hover:bg-indigo-700",
  children,
  hideActions = false,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 dark:bg-opacity-80 backdrop-blur-sm transition-opacity duration-300 ease-in-out" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 sm:p-6 w-full max-w-md mx-4 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="sm:flex sm:items-start">
          <div className="mt-3 text-center sm:mt-0 sm:ms-4 sm:text-start w-full"> {/* Use ms and text-start for LTR/RTL */}
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            {description && (
              <div className="mt-2">
                {typeof description === 'string' ? <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p> : description}
              </div>
            )}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>
        {!hideActions && onConfirm && (
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 sm:ms-3 sm:w-auto sm:text-sm ${confirmButtonClass}`}
              onClick={() => {
                onConfirm();
                // onClose(); // Let confirm handler decide if modal should close, or close it explicitly after onConfirm
              }}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;