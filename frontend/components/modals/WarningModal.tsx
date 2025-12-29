import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";

export default function WarningModal({ action, target, label, onClose, handler }: { action: string, target?: string, label: string, onClose: Function, handler: Function; }) {
    return (
        <div className="modal-overlay">
            <section className="warning-modal-container">
                <ModalHeader title="Warning" onClose={onClose} />
                <p>This action will permanently {action}</p>
                {target && <p className="delete-target">{target}</p>}
                <ModalFooter submitLabel={label} submitStyle="warning" onClose={onClose} onSubmit={handler} />
            </section>
        </div >
    );
}