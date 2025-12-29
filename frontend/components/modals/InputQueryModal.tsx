import { useState } from "react";
import ModalFooter from "./ModalFooter";
import ModalHeader from "./ModalHeader";

export default function InputQueryModal({ onClose, onPrevious, onStart }: { onClose: Function, onPrevious: Function, onStart: Function; }) {
    const [query, setQuery] = useState<string>("");

    return (
        <div className="modal-overlay">
            <section className="validation-modal-container">
                <ModalHeader title="Query" onClose={onClose} />
                <div className="validation-modal-body">
                    <textarea className="query-text-area" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <ModalFooter cancelLabel="Previous" submitLabel="Submit" submitStyle="confirm" onClose={onPrevious} onSubmit={() => { onStart(query); }} isDisabled={query.trim().length == 0} />
            </section>
        </div >
    );
}