import { useState } from 'react';
import InvoiceUpload from '../components/InvoiceUpload';
import PendingInvoices from '../components/PendingInvoices';
import PaymentModal from '../components/PaymentModal';
import Orders from './Orders';
import Shortages from './Shortages';
import { FileText, ClipboardList, Clock, AlertTriangle } from 'lucide-react';

export default function Suppliers() {
    const [activeTab, setActiveTab] = useState('facturas'); // facturas, pedidos, pendientes, faltantes
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
    const [refreshPendingTrigger, setRefreshPendingTrigger] = useState(0);

    // State to pass to Shortages when switching from Invoice Upload
    const [shortageInvoice, setShortageInvoice] = useState(null);

    const handlePayAction = (invoice) => {
        setSelectedInvoiceForPayment(invoice);
        setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        setRefreshPendingTrigger(prev => prev + 1);
    };

    const handleAddShortage = (invoice) => {
        setShortageInvoice(invoice);
        setActiveTab('faltantes');
    };

    const tabs = [
        { id: 'facturas', label: 'Carga de Facturas', icon: <FileText size={18} /> },
        { id: 'pedidos', label: 'Pedidos Proveedores', icon: <ClipboardList size={18} /> },
        { id: 'pendientes', label: 'Proveedores Pendientes', icon: <Clock size={18} /> },
        { id: 'faltantes', label: 'Faltantes', icon: <AlertTriangle size={18} /> },
    ];

    return (
        <div className="container">
            <div className="page-header">
                <h1>Gestión de Proveedores</h1>
                <p>Administración unificada de compras, pagos y faltantes</p>
            </div>

            <div className="tabs-container">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.icon}
                        <span style={{ marginLeft: '0.5rem' }}>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'facturas' && (
                    <InvoiceUpload
                        onSuccess={() => setRefreshPendingTrigger(prev => prev + 1)}
                        onAddShortage={handleAddShortage}
                    />
                )}

                {activeTab === 'pedidos' && (
                    <Orders isSubComponent={true} />
                )}

                {activeTab === 'pendientes' && (
                    <PendingInvoices
                        key={refreshPendingTrigger}
                        onPayAction={handlePayAction}
                    />
                )}

                {activeTab === 'faltantes' && (
                    <Shortages
                        isSubComponent={true}
                        initialInvoice={shortageInvoice}
                    />
                )}
            </div>

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                invoice={selectedInvoiceForPayment}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
