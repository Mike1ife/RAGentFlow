import ModalHeader from "./ModalHeader";

export default function FullContentModal({ title, content, onClose }: { title: string, content: string, onClose: Function; }) {
    return (
        <div className="modal-overlay">
            <section className="full-content-container">
                <ModalHeader title={title} onClose={onClose} />
                <div className="full-content-body">
                    <span>{content}</span>
                </div>
            </section>
        </div>
    );
}