import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

const Modal = ({
  open = false,
  visible, // Backwards-compatible alias for open
  title,
  children,
  onOk,
  onCancel,
  okText = 'OK',
  cancelText = 'Cancel',
  okType = 'primary', // 'primary' | 'danger'
  confirmLoading = false,
  okButtonProps = {},
  cancelButtonProps = {},
  footer, // undefined = default buttons, null = no footer, ReactNode = custom footer
  width = 520,
  centered = true,
  closable = true,
  closeIcon,
  mask = true,
  maskClosable = true,
  destroyOnClose = false,
  zIndex = 1000,
  className = '',
  style = {},
  bodyStyle = {},
  headerStyle = {},
  footerStyle = {},
}) => {
  const isOpen = Boolean(open !== undefined ? open : visible);
  const [mounted, setMounted] = useState(isOpen);
  const [animatingIn, setAnimatingIn] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const modalRef = useRef(null);

  // Synchronize mounted state with animation
  useEffect(() => {
    let animTimer;
    let unmountTimer;

    if (isOpen) {
      setMounted(true);
      animTimer = setTimeout(() => {
        setAnimatingIn(true);
      }, 20);
    } else {
      setAnimatingIn(false);
      unmountTimer = setTimeout(() => {
        setMounted(false);
      }, 220);
    }

    return () => {
      clearTimeout(animTimer);
      clearTimeout(unmountTimer);
    };
  }, [isOpen]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mounted]);

  // Handle ESC key press
  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, onCancel]);

  // Handle OK button click (supports async promises)
  const handleOk = async (e) => {
    if (onOk) {
      try {
        const result = onOk(e);
        if (result && typeof result.then === 'function') {
          setInternalLoading(true);
          await result;
          setInternalLoading(false);
        }
      } catch (err) {
        setInternalLoading(false);
        console.error('Modal onOk error:', err);
      }
    }
  };

  const handleMaskClick = (e) => {
    if (maskClosable && e.target === e.currentTarget) {
      if (onCancel) onCancel(e);
    }
  };

  if (!mounted && !isOpen) {
    return null;
  }

  const isLoading = confirmLoading || internalLoading;

  const defaultFooter = (
    <>
      <button
        type="button"
        className={`${styles.btn} ${styles.cancelBtn}`}
        onClick={onCancel}
        disabled={isLoading}
        {...cancelButtonProps}
      >
        {cancelText}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${okType === 'danger' ? styles.dangerBtn : styles.okBtn} ${
          isLoading ? styles.btnDisabled : ''
        }`}
        onClick={handleOk}
        disabled={isLoading}
        {...okButtonProps}
      >
        {isLoading && <span className={styles.spinner} />}
        {okText}
      </button>
    </>
  );

  const modalNode = (
    <div
      className={`${styles.modalRoot} ${className}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      {mask && (
        <div
          className={`${styles.mask} ${animatingIn ? styles.maskEnter : styles.maskLeave}`}
          onClick={handleMaskClick}
        />
      )}

      {/* Dialog container */}
      <div
        className={`${styles.wrap} ${centered ? styles.centered : ''}`}
        onClick={handleMaskClick}
      >
        <div
          ref={modalRef}
          className={`${styles.modal} ${animatingIn ? styles.modalEnter : styles.modalLeave}`}
          style={{ width: typeof width === 'number' ? `${width}px` : width, ...style }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || closable) && (
            <div className={styles.header} style={headerStyle}>
              {title && <div className={styles.title}>{title}</div>}
              {closable && (
                <button
                  type="button"
                  aria-label="Close"
                  className={styles.closeBtn}
                  onClick={onCancel}
                >
                  {closeIcon || (
                    <svg
                      viewBox="64 64 896 896"
                      focusable="false"
                      data-icon="close"
                      width="14"
                      height="14"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .04-.02.05-.06.08L569.93 512l287.7 287.71c.04.04.06.05.06.09 0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.06-.09.06a.12.12 0 01-.07 0c-.03-.01-.05-.02-.07-.06l-57.7-57.69c-.03-.04-.05-.06-.05-.08 0-.04.02-.05.05-.09L454.07 512 166.38 224.23c-.04-.03-.06-.05-.06-.08 0-.02.02-.04.06-.07l57.69-57.7c.03-.04.05-.06.08-.06a.12.12 0 01.07 0c.04 0 .05.02.09.06L512 454.07l287.71-287.7c.04-.04.06-.06.09-.06.02 0 .04.02.06.06z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={styles.body} style={bodyStyle}>
            {children}
          </div>

          {/* Footer */}
          {footer !== null && (
            <div className={styles.footer} style={footerStyle}>
              {footer !== undefined ? footer : defaultFooter}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : null;
};

export default Modal;
