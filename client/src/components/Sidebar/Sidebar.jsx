import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { menuItems } from '../../data/MenuData';
import SidebarItem from './SidebarItem';
import styles from './Sidebar.module.css';

const Sidebar = ({ sidebarMode, isMobile }) => {
    const [openMenuIndex, setOpenMenuIndex] = React.useState(null);
    const [hoveredIndex, setHoveredIndex] = React.useState(null);
    const timeoutRef = React.useRef(null);

    const handleToggleMenu = (index) => {
        setOpenMenuIndex((prev) => (prev === index ? null : index));
    };

    const handleHover = (index) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (index !== null) {
            setHoveredIndex(index);
        } else {
            timeoutRef.current = setTimeout(() => {
                setHoveredIndex(null);
            }, 200); // 200ms grace period
        }
    };

    return (
        <aside
            className={`
                ${styles.sidebar} 
                ${styles[sidebarMode]} 
                ${isMobile ? styles.mobile : ' '}
            `}
        >
            <SimpleBar style={{ maxHeight: '100%' }}>
                <nav className={styles.nav}>
                    <ul className={styles.menuList}>
                        {menuItems.map((item, index) => (
                            <SidebarItem
                                key={index}
                                item={item}
                                isSidebarExpanded={sidebarMode === 'expanded'}
                                isOpen={openMenuIndex === index}
                                onToggle={() => handleToggleMenu(index)}
                                // Props for mini-sidebar flyout stability
                                isFlyoutActive={hoveredIndex === index}
                                setFlyoutHovered={(isHovered) => handleHover(isHovered ? index : null)}
                            />
                        ))}
                    </ul>
                </nav>
            </SimpleBar>
        </aside>
    );
};

export default Sidebar;
