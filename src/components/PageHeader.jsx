import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// breadcrumb: [{ label, to? }, ...] — el último ítem es la página actual
export default function PageHeader({ title, subtitle, breadcrumb, actions }) {
    return (
        <div className="page-header">
            <div className="page-header__titles">
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav className="breadcrumb" aria-label="Ubicación">
                        {breadcrumb.map((item, i) => {
                            const isLast = i === breadcrumb.length - 1;
                            return (
                                <span key={item.label} style={{ display: 'contents' }}>
                                    {isLast ? (
                                        <span className="breadcrumb__current" aria-current="page">{item.label}</span>
                                    ) : item.to ? (
                                        <Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link>
                                    ) : (
                                        <span>{item.label}</span>
                                    )}
                                    {!isLast && <ChevronRight />}
                                </span>
                            );
                        })}
                    </nav>
                )}
                <h1>{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="header-actions">{actions}</div>}
        </div>
    );
}
