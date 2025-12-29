export default function ModalHeader({ title, onClose }: { title: string, onClose: Function; }) {
    return (
        <header className="modal-header">
            <h3>{title}</h3>
            <button onClick={() => onClose()}>×</button>
        </header>
    );
}