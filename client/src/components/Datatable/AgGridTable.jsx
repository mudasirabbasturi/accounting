import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { BiDownload, BiSearch, BiMoveHorizontal, BiInfoCircle, BiChevronDown } from 'react-icons/bi';
import { LuMaximize2, LuMinimize2, LuRotateCcw, LuLayoutGrid } from 'react-icons/lu';
import MegaMenuModal from '../MegaMenu/MegaMenuModal';

// Register AG Grid Community & Enterprise modules once
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

export const AgGridTable = ({
    gridId = null,
    rowData,
    columnDefs,
    loading = false,
    height = '680px',
    title = null,
    quickFilter = true,
    enableSearch = true,
    exportButtons = true,
    enableExport = true,
    horizontalScrollToggle = true,
    extraHeaderActions = null,
    onRowClicked = null,
    rowSelection = undefined,
    gridOptions = {},
}) => {
    const gridRef = useRef(null);
    const gridContainerRef = useRef(null);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

    // Unique storage key for persisting table state (full mode, column widths, sort, order)
    const storageKey = useMemo(() => {
        if (gridId) return `grid_${gridId}`;
        if (title) return `grid_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const pathPart = window.location.pathname.replace(/[^a-z0-9]/g, '_') || 'root';
        return `grid_${pathPart}`;
    }, [gridId, title]);

    // Restore full mode state across page reloads
    const [isFullMode, setIsFullMode] = useState(() => {
        try {
            return localStorage.getItem(`aggrid_fullmode_${storageKey}`) === 'true';
        } catch {
            return false;
        }
    });

    // Restore horizontal scroll mousewheel mode across reloads
    const [horizontalScrollMode, setHorizontalScrollMode] = useState(() => {
        try {
            return localStorage.getItem('aggrid_hscroll_mode') === 'true';
        } catch {
            return false;
        }
    });

    const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);

    // Normalize search & export prop aliases
    const showQuickFilter = quickFilter ?? enableSearch ?? true;
    const showExportButtons = exportButtons ?? enableExport ?? true;

    // Body overflow management when Full View is active
    useEffect(() => {
        if (isFullMode) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullMode]);

    // Dynamically check whether horizontal scroll exists on the client side in real-time
    const checkHorizontalScroll = useCallback(() => {
        const container = gridContainerRef.current;
        if (!container) return;

        const hScroll = container.querySelector('.ag-body-horizontal-scroll-viewport');
        const centerCols = container.querySelector('.ag-center-cols-viewport');
        const headerRoot = container.querySelector('.ag-header-viewport');

        let hasScroll = false;
        if (hScroll) {
            const style = window.getComputedStyle(hScroll);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                if (hScroll.scrollWidth > hScroll.clientWidth + 2) {
                    hasScroll = true;
                }
            }
        }
        if (!hasScroll && centerCols) {
            if (centerCols.scrollWidth > centerCols.clientWidth + 2) {
                hasScroll = true;
            }
        }
        if (!hasScroll && headerRoot) {
            if (headerRoot.scrollWidth > headerRoot.clientWidth + 2) {
                hasScroll = true;
            }
        }

        setHasHorizontalScroll(hasScroll);
    }, []);

    // Full Mode Toggle & State Preservation
    const toggleFullMode = useCallback(() => {
        setIsFullMode((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(`aggrid_fullmode_${storageKey}`, next ? 'true' : 'false');
            } catch (e) {
                console.warn('Failed to save fullMode state to localStorage', e);
            }

            // After viewport expands/restores, re-calculate column fits & horizontal scroll
            setTimeout(() => {
                if (gridRef.current?.api) {
                    gridRef.current.api.autoSizeAllColumns(false);
                }
                checkHorizontalScroll();
            }, 100);

            return next;
        });
    }, [storageKey, checkHorizontalScroll]);

    // Horizontal Scroll Toggle & State Preservation
    const toggleHorizontalScrollMode = useCallback(() => {
        setHorizontalScrollMode((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('aggrid_hscroll_mode', next ? 'true' : 'false');
            } catch (e) {
                console.warn('Failed to save hscroll state to localStorage', e);
            }
            return next;
        });
    }, []);

    // Escape Key Listener to close Mega Menu or roll back from Full Mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isMegaMenuOpen) {
                    setIsMegaMenuOpen(false);
                    return;
                }
                if (isFullMode) {
                    toggleFullMode();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullMode, isMegaMenuOpen, toggleFullMode]);

    // ResizeObserver and window resize listener for real-time client-side horizontal scroll detection
    useEffect(() => {
        window.addEventListener('resize', checkHorizontalScroll);
        const container = gridContainerRef.current;
        let observer;
        if (container && window.ResizeObserver) {
            observer = new ResizeObserver(() => {
                checkHorizontalScroll();
            });
            observer.observe(container);
        }
        return () => {
            window.removeEventListener('resize', checkHorizontalScroll);
            if (observer) observer.disconnect();
        };
    }, [checkHorizontalScroll]);

    // Mouse wheel horizontal scroll handler when horizontalScrollMode is ON
    useEffect(() => {
        const container = gridContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (!horizontalScrollMode) return;
            // Native shift+wheel already scrolls horizontally
            if (e.shiftKey) return;

            // When user scrolls mouse wheel vertically, redirect to horizontal scroll
            if (e.deltaY !== 0) {
                const hScroll = container.querySelector('.ag-body-horizontal-scroll-viewport');
                const cScroll = container.querySelector('.ag-center-cols-viewport');

                if (hScroll) {
                    hScroll.scrollLeft += e.deltaY;
                    e.preventDefault();
                } else if (cScroll) {
                    cScroll.scrollLeft += e.deltaY;
                    e.preventDefault();
                }
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [horizontalScrollMode]);

    // Save column state (order, width, pinned, sort, visibility) to localStorage
    const saveColumnState = useCallback(() => {
        if (!gridRef.current?.api) return;
        try {
            const colState = gridRef.current.api.getColumnState();
            if (colState && colState.length > 0) {
                localStorage.setItem(`aggrid_colstate_${storageKey}`, JSON.stringify(colState));
            }
        } catch (e) {
            console.warn('Failed to save column state to localStorage', e);
        }
    }, [storageKey]);

    // Modern professional quartz theme tailored to the dashboard's palette
    const gridTheme = useMemo(() => {
        return themeQuartz.withParams({
            accentColor: '#4f46e5',
            backgroundColor: '#ffffff',
            foregroundColor: '#0f172a',
            borderColor: '#e2e8f0',
            headerBackgroundColor: '#f8fafc',
            headerTextColor: '#334155',
            headerFontWeight: 600,
            rowHoverColor: '#f1f5f9',
            selectedRowBackgroundColor: '#e0e7ff',
            fontSize: 13,
            borderRadius: 6,
            headerHeight: 44,
            floatingFiltersHeight: 40,
        });
    }, []);

    // Default enterprise column properties
    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            sortable: true,
            resizable: true,
            enableRowGroup: true,
            enablePivot: true,
            enableValue: true,
            floatingFilter: true,
            minWidth: 100,
            tooltipValueGetter: (params) => (params.value != null ? String(params.value) : ''),
        };
    }, []);

    // Automatic Column Sizing Strategy: dynamically fits column widths to cell contents
    const autoSizeStrategy = useMemo(() => ({
        type: 'fitCellContents',
        defaultMinWidth: 100,
    }), []);

    // Helper to auto-size all columns based on header and cell content
    const autoSizeAll = useCallback((api) => {
        const gridApi = api || gridRef.current?.api;
        if (gridApi) {
            gridApi.autoSizeAllColumns(false);
            setTimeout(checkHorizontalScroll, 80);
        }
    }, [checkHorizontalScroll]);

    // Reset columns back to auto-fit and clear saved column overrides
    const resetColumnLayout = useCallback(() => {
        try {
            localStorage.removeItem(`aggrid_colstate_${storageKey}`);
        } catch (e) {}
        if (gridRef.current?.api) {
            gridRef.current.api.resetColumnState();
            autoSizeAll(gridRef.current.api);
        }
    }, [storageKey, autoSizeAll]);

    // Auto-size or restore saved column state on grid ready
    const onGridReady = useCallback((params) => {
        try {
            const savedState = localStorage.getItem(`aggrid_colstate_${storageKey}`);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    params.api.applyColumnState({ state: parsed, applyOrder: true });
                } else {
                    autoSizeAll(params.api);
                }
            } else {
                autoSizeAll(params.api);
            }
        } catch {
            autoSizeAll(params.api);
        }
        setTimeout(checkHorizontalScroll, 120);
        if (gridOptions?.onGridReady) gridOptions.onGridReady(params);
    }, [storageKey, autoSizeAll, checkHorizontalScroll, gridOptions]);

    // Auto-size columns as soon as initial data renders (if no saved state)
    const onFirstDataRendered = useCallback((params) => {
        const hasSaved = localStorage.getItem(`aggrid_colstate_${storageKey}`);
        if (!hasSaved) {
            autoSizeAll(params.api);
        }
        setTimeout(checkHorizontalScroll, 100);
        if (gridOptions?.onFirstDataRendered) gridOptions.onFirstDataRendered(params);
    }, [storageKey, autoSizeAll, checkHorizontalScroll, gridOptions]);

    // Re-auto-size columns if no customized state exists
    useEffect(() => {
        if (rowData && rowData.length > 0) {
            const timer = setTimeout(() => {
                const hasSaved = localStorage.getItem(`aggrid_colstate_${storageKey}`);
                if (!hasSaved) {
                    autoSizeAll();
                } else {
                    checkHorizontalScroll();
                }
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [rowData, storageKey, autoSizeAll, checkHorizontalScroll]);

    // Export CSV
    const onExportCsv = useCallback(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.exportDataAsCsv({
                fileName: `${title || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`
            });
        }
    }, [title]);

    // Export Excel (Enterprise feature)
    const onExportExcel = useCallback(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.exportDataAsExcel({
                fileName: `${title || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`
            });
        }
    }, [title]);

    // Quick filter search
    const onQuickFilterChanged = useCallback((e) => {
        if (gridRef.current?.api) {
            gridRef.current.api.setGridOption('quickFilterText', e.target.value);
        }
    }, []);

    // Enterprise Sidebar Configuration (Columns & Filters tool panels)
    const sideBar = useMemo(() => {
        return {
            toolPanels: [
                {
                    id: 'columns',
                    labelDefault: 'Columns',
                    labelKey: 'columns',
                    iconKey: 'columns',
                    toolPanel: 'agColumnsToolPanel',
                    toolPanelParams: {
                        suppressRowGroups: false,
                        suppressValues: false,
                        suppressPivots: false,
                        suppressPivotMode: false,
                    }
                },
                {
                    id: 'filters',
                    labelDefault: 'Filters',
                    labelKey: 'filters',
                    iconKey: 'filter',
                    toolPanel: 'agFiltersToolPanel',
                }
            ],
            defaultToolPanel: ''
        };
    }, []);

    // Status bar configuration (Total rows, filtered count, aggregations)
    const statusBar = useMemo(() => {
        return {
            statusPanels: [
                { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
                { statusPanel: 'agSelectedRowCountComponent' },
                { statusPanel: 'agAggregationComponent' }
            ]
        };
    }, []);

    return (
        <>
            {/* Backdrop Overlay when Full View Mode is active */}
            {isFullMode && (
                <div
                    onClick={toggleFullMode}
                    aria-label="Exit Full View"
                    title="Click backdrop or press Esc to exit Full View"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        zIndex: 99998,
                        transition: 'opacity 0.2s ease',
                    }}
                />
            )}

            {/* Injected styling to guarantee ag-root-wrapper has proper border radius and never touches corners */}
            <style>{`
                .ag-theme-quartz .ag-root-wrapper {
                    border-radius: 8px !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
                    overflow: hidden !important;
                }
            `}</style>

            {/* ── Mega Menu Modal inside AgGridTable (accessible in Full View!) ─── */}
            <MegaMenuModal 
                isOpen={isMegaMenuOpen} 
                onClose={() => setIsMegaMenuOpen(false)} 
                zIndexOffset={100000} 
            />

            <div style={{
                background: '#ffffff',
                borderRadius: isFullMode ? '14px' : '8px',
                border: isFullMode ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                boxShadow: isFullMode 
                    ? '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.08)' 
                    : '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxSizing: 'border-box',
                ...(isFullMode ? {
                    position: 'fixed',
                    top: '20px',
                    left: '24px',
                    right: '24px',
                    bottom: '20px',
                    width: 'calc(100vw - 48px)',
                    height: 'calc(100vh - 40px)',
                    zIndex: 99999,
                    margin: 0,
                } : {
                    position: 'relative',
                    width: '100%',
                })
            }}>
                {/* Table Control Header */}
                <div style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: '#fafbfc',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Full View Mode Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleFullMode}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: isFullMode ? '#4f46e5' : '#ffffff',
                                color: isFullMode ? '#ffffff' : '#334155',
                                border: `1px solid ${isFullMode ? '#4338ca' : '#cbd5e1'}`,
                                borderRadius: '6px',
                                padding: '7px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isFullMode ? '0 1px 3px rgba(79, 70, 229, 0.3)' : '0 1px 2px rgba(0,0,0,0.03)',
                                flexShrink: 0
                            }}
                            title={isFullMode ? "Roll back to original position (Esc)" : "Full Mode View (Floats with surrounding space)"}
                        >
                            {isFullMode ? (
                                <LuMinimize2 size={16} strokeWidth={2} />
                            ) : (
                                <LuMaximize2 size={16} strokeWidth={2} />
                            )}
                            <span>{isFullMode ? 'Exit Full View' : 'Full View'}</span>
                        </button>

                        {/* Mega Menu Button inside Table Header - ONLY visible in Full View mode */}
                        {isFullMode && (
                            <button
                                type="button"
                                onClick={() => setIsMegaMenuOpen(prev => !prev)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: isMegaMenuOpen ? '#4f46e5' : '#ffffff',
                                    color: isMegaMenuOpen ? '#ffffff' : '#334155',
                                    border: `1px solid ${isMegaMenuOpen ? '#4338ca' : '#cbd5e1'}`,
                                    borderRadius: '6px',
                                    padding: '7px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isMegaMenuOpen ? '0 1px 3px rgba(79, 70, 229, 0.3)' : '0 1px 2px rgba(0,0,0,0.03)',
                                    flexShrink: 0
                                }}
                                title="Open Mega Menu (Browse all 50+ modules and features)"
                            >
                                <LuLayoutGrid size={15} strokeWidth={1.8} />
                                <span>Mega Menu</span>
                                <BiChevronDown size={14} style={{ transform: isMegaMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                            </button>
                        )}

                        {/* Column Search Input */}
                        {showQuickFilter && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '7px 14px',
                                width: '280px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}>
                                <BiSearch size={18} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    placeholder="Search all columns..."
                                    onChange={onQuickFilterChanged}
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        width: '100%',
                                        fontSize: '13px',
                                        fontWeight: 400,
                                        color: '#0f172a',
                                        background: 'transparent'
                                    }}
                                />
                            </div>
                        )}

                        {/* Horizontal Scroll Hint - ONLY appears if actual horizontal scroll exists */}
                        {horizontalScrollToggle && hasHorizontalScroll && (
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                color: '#475569',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                whiteSpace: 'nowrap'
                            }}>
                                <BiInfoCircle size={14} color="#6366f1" />
                                <span>Hold <strong>Shift + Scroll</strong> to move horizontally</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Reset Column Sizes Button */}
                        <button
                            type="button"
                            onClick={resetColumnLayout}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            title="Reset column widths to fit content"
                        >
                            <LuRotateCcw size={13} />
                            <span>Reset Widths</span>
                        </button>

                        {extraHeaderActions}

                        {showExportButtons && (
                            <>
                                <button
                                    onClick={onExportCsv}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#334155',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    title="Export to CSV"
                                >
                                    <BiDownload size={14} /> CSV
                                </button>
                                <button
                                    onClick={onExportExcel}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: '#4f46e5',
                                        border: '1px solid #4338ca',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    title="Export to Excel (Enterprise)"
                                >
                                    <BiDownload size={14} /> Excel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* AG Grid Container: has explicit height in normal mode and flex: 1 in Full View mode */}
                <div 
                    ref={gridContainerRef} 
                    style={{ 
                        width: '100%',
                        padding: isFullMode ? '12px 16px 16px 16px' : '0',
                        background: isFullMode ? '#f8fafc' : '#ffffff',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        ...(isFullMode ? {
                            flex: 1,
                            minHeight: 0,
                        } : {
                            height: height || '680px',
                        })
                    }}
                >
                    <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0 }}>
                        <AgGridReact
                            ref={gridRef}
                            theme={gridTheme}
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            autoSizeStrategy={autoSizeStrategy}
                            onGridReady={onGridReady}
                            onFirstDataRendered={onFirstDataRendered}
                            onGridSizeChanged={(params) => {
                                checkHorizontalScroll();
                                if (gridOptions?.onGridSizeChanged) gridOptions.onGridSizeChanged(params);
                            }}
                            onColumnResized={(params) => {
                                saveColumnState();
                                checkHorizontalScroll();
                                if (gridOptions?.onColumnResized) gridOptions.onColumnResized(params);
                            }}
                            onColumnMoved={(params) => {
                                saveColumnState();
                                if (gridOptions?.onColumnMoved) gridOptions.onColumnMoved(params);
                            }}
                            onColumnPinned={(params) => {
                                saveColumnState();
                                if (gridOptions?.onColumnPinned) gridOptions.onColumnPinned(params);
                            }}
                            onColumnVisible={(params) => {
                                saveColumnState();
                                checkHorizontalScroll();
                                if (gridOptions?.onColumnVisible) gridOptions.onColumnVisible(params);
                            }}
                            onSortChanged={(params) => {
                                saveColumnState();
                                if (gridOptions?.onSortChanged) gridOptions.onSortChanged(params);
                            }}
                            sideBar={sideBar}
                            statusBar={statusBar}
                            loading={loading}
                            pagination={true}
                            paginationPageSize={25}
                            paginationPageSizeSelector={[10, 25, 50, 100, 250]}
                            rowSelection={rowSelection}
                            enableRangeSelection={true}
                            animateRows={true}
                            onRowClicked={onRowClicked}
                            {...gridOptions}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default AgGridTable;
