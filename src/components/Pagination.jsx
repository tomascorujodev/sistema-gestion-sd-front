import { ChevronLeft, ChevronRight } from 'lucide-react';

// Devuelve las páginas a mostrar con elipsis: 1 … 4 5 6 … 18
function getPageItems(page, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) items.push('start-ellipsis');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < totalPages - 1) items.push('end-ellipsis');
    items.push(totalPages);
    return items;
}

export default function Pagination({
    page,
    totalPages,
    totalRecords,
    pageSize,
    pageSizeOptions = [10, 20, 50, 100],
    onPageChange,
    onPageSizeChange,
    standalone = false
}) {
    if (!totalRecords) return null;

    const pages = Math.max(totalPages, 1);
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalRecords);

    return (
        <nav className={`pagination${standalone ? ' pagination--standalone' : ''}`} aria-label="Paginación">
            <div className="pagination__summary">
                <span>
                    Mostrando <strong>{from}–{to}</strong> de <strong>{totalRecords}</strong>
                </span>
                {onPageSizeChange && (
                    <select
                        className="pagination__size"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        aria-label="Registros por página"
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size} por página</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="pagination__mobile-status">
                <strong>Página {page} de {pages}</strong>
                <span>Mostrando {from}–{to} de {totalRecords}</span>
            </div>

            <div className="pagination__pages">
                <button
                    type="button"
                    className="page-btn page-btn--nav page-btn--prev"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                >
                    <ChevronLeft />
                </button>
                {getPageItems(page, pages).map(item => (
                    typeof item === 'number' ? (
                        <button
                            key={item}
                            type="button"
                            className={`page-btn page-btn--number${item === page ? ' active' : ''}`}
                            onClick={() => onPageChange(item)}
                            aria-current={item === page ? 'page' : undefined}
                        >
                            {item}
                        </button>
                    ) : (
                        <span key={item} className="pagination__ellipsis">…</span>
                    )
                ))}
                <button
                    type="button"
                    className="page-btn page-btn--nav page-btn--next"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= pages}
                    aria-label="Página siguiente"
                >
                    <ChevronRight />
                </button>
            </div>
        </nav>
    );
}
