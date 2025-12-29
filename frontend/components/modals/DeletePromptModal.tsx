import api from "../../utils/api";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";

export default function DeleteEdgeModal({ srcNodeName, destNodeName, onCloseDelete, onDeleteSuccess }: { srcNodeName: string, destNodeName: string, onCloseDelete: Function, onDeleteSuccess: Function; }) {
    const handleDelete = async () => {
        const response = await api.graph.deleteEdge(srcNodeName, destNodeName);
        console.log(response);
        onDeleteSuccess();
        onCloseDelete();
    };

    return (
        <div className="modal-overlay">
            <section className="warning-modal-container">
                <ModalHeader title="Warning" onClose={onCloseDelete} />
                <p>This action will permanently delete edge</p>
                <p className="delete-filename">{srcNodeName} → {destNodeName}</p>
                <ModalFooter submitLabel="Delete" submitStyle="warning" onClose={onCloseDelete} onSubmit={handleDelete} />
            </section>
        </div >
    );
}