import React, { useState, useEffect, useRef } from 'react';
import {
    BiMenu,
    BiMenuAltLeft,
    BiBell,
    BiChevronDown,
    BiUser,
    BiCog,
    BiLogOut
} from 'react-icons/bi';
import { LuLayoutGrid, LuShieldCheck } from 'react-icons/lu';
import { VscRightPanelShow, VscRightPanelHide } from "react-icons/vsc";
import { useNavigate } from 'react-router-dom';
import MegaMenuModal from '../MegaMenu/MegaMenuModal';
import styles from './Header.module.css';

const Header = ({ toggleSidebar, toggleSidebarSize, toggleSidebarVisibility, sidebarMode, isMobile }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        setIsDropdownOpen(false);
        setIsMegaMenuOpen(false);
        navigate('/login');
    };

    // Close Profile Dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <img src="/AS-LOGO.png" alt="Company Logo" className={styles.logo} />

                {/* Mobile: single hamburger toggle */}
                {isMobile ? (
                    <button
                        className={styles.toggleButton}
                        onClick={toggleSidebar}
                        aria-label="Toggle Sidebar"
                    >
                        <BiMenu size={22} />
                    </button>
                ) : (
                    /* Desktop: two separate controls */
                    <div className={styles.sidebarControls}>
                        {/* Size toggle: expanded ↔ mini */}
                        <button
                            className={styles.toggleButton}
                            onClick={toggleSidebarSize}
                            aria-label={sidebarMode === 'expanded' ? 'Collapse to mini' : 'Expand sidebar'}
                            title={sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            {sidebarMode === 'expanded'
                                ? <BiMenuAltLeft size={22} />
                                : <BiMenu size={22} />}
                        </button>

                        <span className={styles.sidebarDivider} aria-hidden="true" />

                        <button
                            className={`${styles.visibilityPill} ${sidebarMode === 'hidden' ? styles.pillActive : ''}`}
                            onClick={toggleSidebarVisibility}
                            aria-label={sidebarMode === 'hidden' ? 'Show sidebar' : 'Hide sidebar'}
                            title={sidebarMode === 'hidden' ? 'Show sidebar' : 'Hide sidebar'}
                        >
                            {sidebarMode === 'hidden' ? (
                                <VscRightPanelShow size={16} />
                            ) : (
                                <VscRightPanelHide size={16} />
                            )}
                        </button>
                    </div>
                )}

                {/* ── Modern Mega Menu Trigger Button ─────────────────────── */}
                <div className={styles.megaMenuContainer}>
                    <button
                        type="button"
                        className={`${styles.megaMenuTrigger} ${isMegaMenuOpen ? styles.megaMenuActive : ''}`}
                        onClick={() => setIsMegaMenuOpen(prev => !prev)}
                        aria-expanded={isMegaMenuOpen}
                        aria-haspopup="true"
                        title="Browse all 50+ modules and features"
                    >
                        <LuLayoutGrid size={16} strokeWidth={1.8} className={styles.megaIcon} />
                        <span className={styles.megaMenuLabel}>Mega Menu</span>
                        <BiChevronDown size={15} className={`${styles.megaChevron} ${isMegaMenuOpen ? styles.chevronOpen : ''}`} />
                    </button>
                </div>
            </div>

            {/* ── Shared Mega Menu Modal ─────────────────────────────── */}
            <MegaMenuModal
                isOpen={isMegaMenuOpen}
                onClose={() => setIsMegaMenuOpen(false)}
                zIndexOffset={0}
            />

            <div className={styles.rightSection}>
                {/* Notifications Button */}
                <button
                    className={styles.iconButton}
                    aria-label="Notifications"
                    title="Notifications & Alerts"
                    onClick={() => navigate('/banking/reconciliations/pending')}
                >
                    <BiBell size={20} />
                    <span className={styles.badge}></span>
                </button>

                {/* Profile Container */}
                <div className={styles.profileContainer} ref={dropdownRef}>
                    <button
                        className={`${styles.profileButton} ${isDropdownOpen ? styles.active : ''}`}
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                    >
                        <img
                            src="https://ui-avatars.com/api/?name=Alex+Doe&background=random"
                            alt="User"
                            className={styles.avatar}
                        />
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>Alex Doe</span>
                            <span className={styles.userRole}>Admin</span>
                        </div>
                        <BiChevronDown size={16} />
                    </button>

                    {/* Standard Profile Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownHeader}>
                                <span className={styles.dropdownLabel}>My Account</span>
                            </div>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    navigate('/settings/users');
                                }}
                            >
                                <BiUser size={18} /> Profile & Roles
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    navigate('/settings/company');
                                }}
                            >
                                <BiCog size={18} /> System Settings
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    navigate('/settings/audit-trail');
                                }}
                            >
                                <LuShieldCheck size={18} /> Audit Trail
                            </button>
                            <div className={styles.divider}></div>
                            <button
                                className={`${styles.dropdownItem} ${styles.logout}`}
                                onClick={handleLogout}
                            >
                                <BiLogOut size={18} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
