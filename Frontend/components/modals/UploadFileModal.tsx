import { useRef, useState } from "react";
import { CloudUpload, FileCheck } from "lucide-react";
import api from "../../utils/api";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";

export default function UploadFileModal({ onCloseUpload, onUploadSuccess }: { onCloseUpload: Function, onUploadSuccess: Function; }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        const file = e.target.files?.[0];

        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError("Please select a PDF file");
            setSelectedFile(null);
            return;
        }

        const maxSize = 3 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("File size must be less than 3MB");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError("");

        try {
            const response = await api.file.uploadFile(selectedFile);
            console.log(response);
            onUploadSuccess();
            onCloseUpload();
        } catch (err: any) {
            setError(err.message || "Failed to upload file. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        console.log(bytes);
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
        else return Math.round(bytes / 1048576) + ' MB';
    };

    return (
        <div className="modal-overlay">
            <section className="upload-modal-container">
                <ModalHeader title="Upload PDF File" onClose={onCloseUpload} />

                <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                    <CloudUpload size={52} />
                    <p>Click to select a PDF file</p>
                    <p className="upload-hint">Max file size: 3MB</p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {selectedFile && (
                    <div className="selected-file">
                        <div className="file-info">
                            <FileCheck size={20} />
                            <span>{selectedFile.name}</span>
                            <span className="file-size">({formatFileSize(selectedFile.size)})</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <ModalFooter submitLabel={uploading ? 'Uploading...' : 'Upload'} submitStyle="confirm" onClose={onCloseUpload} onSubmit={handleUpload} isDisabled={!selectedFile || uploading} />
            </section>
        </div>
    );
}