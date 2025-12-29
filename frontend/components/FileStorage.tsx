import "./styles/FileStorage.css";
import { useEffect, useState } from "react";
import api from "../utils/api";
import type { Chunk, ChunkFile } from "../types/file";
import { SquareSplitVertical } from "lucide-react";
import UploadFileModal from "./modals/UploadFileModal";
import ChunkDetailModal from "./modals/ChunkDetailModal";
import WarningModal from "./modals/WarningModal";

export const renderPDFIcon = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none">
            <path
                stroke="#D5D7DA"
                strokeWidth="1.5"
                d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
            />
            <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
            <rect width="26" height="16" x="1" y="18" fill="#D92D20" rx="2" />
            <path
                fill="#fff"
                d="M4.832 30v-7.273h2.87q.826 0 1.41.316.582.314.887.87.31.555.31 1.279t-.313 1.278q-.313.555-.906.863-.59.309-1.427.309h-1.83V26.41h1.581q.444 0 .732-.153.29-.156.433-.43.145-.276.145-.635 0-.363-.145-.632a.97.97 0 0 0-.433-.423q-.291-.153-.74-.153H6.37V30zm9.053 0h-2.578v-7.273h2.6q1.095 0 1.889.437.791.433 1.218 1.246.43.814.43 1.947 0 1.136-.43 1.953a2.95 2.95 0 0 1-1.226 1.253q-.795.437-1.903.437m-1.04-1.317h.976q.682 0 1.147-.242.47-.244.703-.756.238-.516.238-1.328 0-.807-.238-1.318a1.54 1.54 0 0 0-.7-.753q-.465-.24-1.146-.241h-.98zM18.582 30v-7.273h4.816v1.268H20.12v1.733h2.958v1.268H20.12V30z"
            />
        </svg>

    );
};

export function FileStorage() {
    const [fileList, setFileList] = useState<ChunkFile[]>([]);
    const [selectedViewFile, setSelectedViewFile] = useState<string>("");
    const [selectedDeleteFile, setSelectedDeleteFile] = useState<string>("");
    const [queryValue, setQueryValue] = useState<string>("");
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [selectedChunk, setSelectedChunk] = useState<Chunk>();
    const [similarChunks, setSimilarChunks] = useState<Chunk[]>([]);

    const [showUploadFile, setShowUploadFile] = useState<boolean>(false);
    const [showClearFile, setShowClearFile] = useState<boolean>(false);
    const [showDeleteFile, setShowDeleteFile] = useState<boolean>(false);
    const [showChunkDetail, setShowChunkDetail] = useState<boolean>(false);

    useEffect(() => {
        loadFileList();
    }, []);

    const loadFileList = async () => {
        const data = await api.file.getFileList();
        setFileList(data);
    };

    const loadChunks = async (fileName: string) => {
        const data = await api.file.getChunks(fileName);
        setChunks(data);
    };

    const handleRank = async () => {
        const data = await api.file.getScoredChunks(selectedViewFile, queryValue);
        setChunks(data);
    };

    const handleShowChunkDetail = async (index: number) => {
        const data = await api.file.getSimilarChunks(selectedViewFile, index);
        setSimilarChunks(data);
        setSelectedChunk(chunks.at(index));
        setShowChunkDetail(true);
    };

    const onCloseUpload = () => {
        setShowUploadFile(false);
    };

    const onCloseClear = () => {
        setShowClearFile(false);
    };

    const handleClear = async () => {
        const response = await api.file.clearFile();
        console.log(response);
        setSelectedViewFile("");
        setSelectedDeleteFile("");
        setQueryValue("");
        setChunks([]);
        loadFileList();
        onCloseClear();
    };

    const onCloseDelete = () => {
        setSelectedDeleteFile("");
        setShowDeleteFile(false);
    };

    const handleDelete = async () => {
        const response = await api.file.deleteFile(selectedDeleteFile);
        console.log(response);
        if (selectedViewFile == selectedDeleteFile) {
            setSelectedViewFile("");
            setChunks([]);
        }
        loadFileList();
        onCloseDelete();
    };

    const onCloseChunkDetail = () => {
        setShowChunkDetail(false);
        setSelectedChunk(undefined);
        setSimilarChunks([]);
    };

    const renderFiles = () => {
        const handleView = async (fileName: string) => {
            setSelectedViewFile(fileName);
            loadChunks(fileName);
        };

        const onClickDelete = async (fileName: string) => {
            setSelectedDeleteFile(fileName);
            setShowDeleteFile(true);
        };

        return (
            <div>
                {
                    fileList.length == 0 ? (
                        <span className="list-empty">No files yet</span>
                    ) : (
                        <div className="file-list">
                            {fileList.map((file: ChunkFile) =>
                                <div key={file.name} className="file-row">
                                    {renderPDFIcon()}
                                    <div>
                                        <p className="filename">{file.name}</p>
                                        <p className="timestamp">Upload at {file.createdAt}</p>
                                    </div>
                                    <div className="file-row-button">
                                        <button onClick={() => handleView(file.name)}>View</button>
                                        <button className="file-delete-button" onClick={() => onClickDelete(file.name)}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            </div>
        );
    };

    const renderChunks = () => {
        if (chunks.length === 0) {
            return <span className="list-empty">No file selected</span>;
        }

        return (
            <div className="chunk-row-container">
                {
                    chunks.map((chunk: Chunk, index: number) => (
                        <div key={chunk.index + 1} className="chunk-row" onClick={() => handleShowChunkDetail(index)}>
                            <div className="chunk-content">
                                <SquareSplitVertical size={50} />
                                <div className="chunk-info">
                                    <h4>Chunk #{chunk.index + 1}</h4>
                                    <span>Content: {chunk.content.length > 100 ? chunk.content.slice(0, 100) + "......" : chunk.content}</span>
                                </div>
                            </div>
                            <div className="chunk-score">
                                <h5>Score</h5>
                                <p>{chunk.score == null ? "--" : chunk.score}</p>
                            </div>
                        </div>
                    ))
                }
            </div>
        );
    };

    return (
        <main className="file-page-container">
            <section className="file-container">
                <header className="file-header">
                    <h3>File List</h3>
                    <div className="file-header-button">
                        <button onClick={() => setShowUploadFile(true)}>Upload</button>
                        <button className="clear-button" onClick={() => setShowClearFile(true)}>Clear</button>
                    </div>
                </header>
                {renderFiles()}
            </section>
            <section className="chunk-container">
                <header className="chunk-header">
                    <div className="chunk-header-title">
                        <h3>Chunks</h3>
                        {selectedViewFile && <p className="chunk-file-name">{selectedViewFile}</p>}
                    </div>
                    {selectedViewFile &&
                        <div className="chunk-header-content-query">
                            <input type="text" placeholder="Enter a query" onChange={(e) => setQueryValue(e.target.value)} />
                            <button disabled={queryValue.length == 0} onClick={() => handleRank()}>Rank</button>
                        </div>
                    }
                    {selectedViewFile &&
                        <h4>Total Chunks: {chunks.length}</h4>
                    }
                </header>
                {renderChunks()}
            </section>

            {showUploadFile && <UploadFileModal key={showUploadFile ? "open" : "close"} onCloseUpload={onCloseUpload} onUploadSuccess={loadFileList} />}
            {showClearFile && <WarningModal key={showClearFile ? "open" : "close"} action="delete all files" label="Clear" onClose={onCloseClear} handler={handleClear} />}
            {showDeleteFile && <WarningModal key={showDeleteFile ? "open" : "close"} action="delete" target={selectedDeleteFile} label="Delete" onClose={onCloseDelete} handler={handleDelete} />}
            {showChunkDetail && selectedChunk && <ChunkDetailModal key={showChunkDetail ? "open" : "close"} chunk={selectedChunk} similarChunks={similarChunks} onCloseChunkDetail={onCloseChunkDetail} />}
        </main>
    );
}




