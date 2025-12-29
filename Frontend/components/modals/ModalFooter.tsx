export default function ModalFooter({ cancelLabel = "Cancel", submitLabel, submitStyle, onClose, onSubmit, isDisabled = false }: { cancelLabel?: string, submitLabel: string, submitStyle: string, onClose: Function, onSubmit: Function, isDisabled?: boolean; }) {
    return (
        <footer className="modal-footer">
            <button className="modal-footer-cancel" onClick={() => onClose()}>
                {cancelLabel}
            </button>
            <button
                className={`modal-footer-submit ${submitStyle}`}
                onClick={() => onSubmit()}
                disabled={isDisabled}>
                {submitLabel}
            </button>
        </footer>
    );
}