import { useState } from "react";
import ModalFooter from "./ModalFooter";
import ModalHeader from "./ModalHeader";
import AgentIcon from "../items/AgentIcon";
import type { validTabs } from "../../types/tab";

export default function TutorialsModal({ currentTab, onClose }: { currentTab: validTabs, onClose: Function; }) {
    const [currentPage, setCurrentPage] = useState<number>(0);
    const tutorialPages = pages[currentTab];

    const nextPage = () => {
        setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        setCurrentPage(currentPage - 1);
    };

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === tutorialPages.length - 1;

    const renderFooter = () => {
        const cancelLabel = isFirstPage ? "Cancel" : "Previous";
        const cancelFunction = isFirstPage ? () => onClose() : prevPage;
        const submitLabel = isLastPage ? "Close" : "Next";
        const submitFunction = isLastPage ? () => onClose() : nextPage;

        return <ModalFooter cancelLabel={cancelLabel} submitLabel={submitLabel} submitStyle="confirm" onClose={cancelFunction} onSubmit={submitFunction} />;
    };

    return (
        <div className="modal-overlay">
            <section className="tutorial-modal-container">
                <ModalHeader title="Getting Started" onClose={onClose} />

                <div className="tutorial-modal-body">
                    <h3>{tutorialPages[currentPage].title}</h3>
                    {tutorialPages[currentPage].content}
                </div>

                {renderFooter()}
            </section>
        </div >
    );
}

const overviewPage = [
    {
        title: "Welcome to RAGentFlow",
        content: (
            <>
                <p>Build and visualize multi-agent RAG workflows in minutes!</p>
                <p>This tutorial will guide you through the main concepts and how to create your first agent network.</p>
                <h4>What you'll learn:</h4>
                <ul>
                    <li>Upload documents for RAG context</li>
                    <li>Create different types of agents</li>
                    <li>Connect agents with conditional logic</li>
                    <li>Test your workflow with queries</li>
                </ul>
                <div className="tutorial-note">
                    <span>📍 </span>
                    <span className="tutorial-tip">The tutorial content adapts to your current tab. Visit each tab and click the <span className="tutorial-button blue">Tutorial</span> button to learn about its specific features!</span>
                </div>
            </>
        ),
    },
    {
        title: "Run Simulation",
        content: (
            <>
                <p>Test your workflow with the simulation modal:</p>
                <ol>
                    <li>Click <span className="tutorial-button blue">🚀 Start RAG & MAS Simulation</span></li>
                    <li><strong>Validation modal</strong> shows:
                        <ul>
                            <li>✅ Requirements check</li>
                            <li>⚠️ Warnings (if any)</li>
                        </ul>
                    </li>
                    <li>Click <span className="tutorial-button blue">Next</span> to proceed</li>
                    <li><strong>Query</strong>: Enter your test question</li>
                    <li>Click <span className="tutorial-button blue">Submit</span> to run</li>
                </ol>
                <div className="tutorial-tip">
                    💡 The validation ensures your workflow is properly configured before running
                </div>
            </>
        )
    }
];

const filePage = [
    {
        title: "Upload Documents",
        content: (
            <>
                <p>Start by uploading PDF documents that your agents will use as knowledge base.</p>
                <ol>

                    <li>Click <span className="tutorial-button blue">Upload</span> and select a PDF (max 3MB)</li>
                    <li>Your document will be automatically processed</li>
                </ol>
                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Upload documents relevant to your use case (FAQs, manuals, policies)</span>
                </div>
            </>
        )
    },
    {
        title: "Explore Document Chunks",
        content: (
            <>
                <p>Understand how RAG works by viewing document chunks:</p>
                <ol>
                    <li>Click <span className="tutorial-button green">View</span> on any uploaded file</li>
                    <li>See how your document is split into chunks</li>
                    <li>Click on any chunk to see:
                        <ul>
                            <li>Full content</li>
                            <li>Embedding visualization (heatmap)</li>
                            <li>Similar chunks in the document</li>
                        </ul>
                    </li>
                </ol>
                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Chunks are the building blocks of RAG - smaller pieces make retrieval more precise</span>
                </div>
            </>
        )
    },
    {
        title: "Test Similarity Search",
        content: (
            <>
                <p>See how RAG finds relevant information:</p>
                <ol>
                    <li>With a file selected, enter a query in the search box</li>
                    <li>Click <span className="tutorial-button blue">Rank</span> to see similarity scores</li>
                    <li>Chunks are now sorted by relevance to your query</li>
                    <li>Higher scores = more relevant to your question</li>
                </ol>
                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">This is how agents will find context when answering queries!</span>
                </div>
            </>
        )
    }
];

const graphPage = [
    {
        title: "Agent Types",
        content: (
            <>
                <p>RAGentFlow provides 4 types of agents:</p>
                <div className="agent-type-explain">
                    <AgentIcon agentType="responder" size={25} />
                    <h4>Responder</h4>
                </div>
                <p>Generates responses using RAG context and custom prompts</p>

                <div className="agent-type-explain">
                    <AgentIcon agentType="classifier" size={25} />
                    <h4>Classifier</h4>
                </div>
                <p>Routes queries to different paths based on categories</p>

                <div className="agent-type-explain">
                    <AgentIcon agentType="gatekeeper" size={25} />
                    <h4>Gatekeeper</h4>
                </div>
                <p>Makes yes/no decisions (e.g., "Is this urgent?")</p>

                <div className="agent-type-explain">
                    <AgentIcon agentType="scorer" size={25} />
                    <h4>Scorer</h4>
                </div>
                <p>Assigns numeric scores (e.g., complexity: 0-10)</p>
            </>
        )
    },
    {
        title: "Building Your Workflow",
        content: (
            <>
                <h4>Adding Agents (Nodes)</h4>
                <ol>
                    <li>Click <span className="tutorial-button gray">+</span> at the bottom of the agent list</li>
                    <li>In the modal, provide:
                        <ul>
                            <li><strong>Name</strong>: Unique identifier for your agent</li>
                            <li><strong>Type</strong>: Select from the 4 agent types</li>
                            <li><strong>Configuration</strong>: Based on agent type</li>
                        </ul>
                    </li>
                    <li>Click <strong>Add</strong> to create the agent</li>
                </ol>

                <h4>Connecting Agents (Edges)</h4>
                <ol>
                    <li>Click <span className="tutorial-button blue">Add Edge</span></li>
                    <li>Select <strong>Source</strong>: Must be a decision agent (not responder)</li>
                    <li>Select <strong>Destination</strong>: Any agent</li>
                    <li>Define <strong>Condition</strong>: When this path should be taken</li>
                </ol>

                <div className="tutorial-example">
                    <span>📌 </span>
                    <span>Example: Classifier "intent" = "billing" → Billing Responder</span>
                </div>
            </>
        )
    },
    {
        title: "Interactive Graph Management",
        content: (
            <>
                <p>The graph is fully interactive - click elements to manage them:</p>

                <h4>Node Interactions</h4>
                <ul>
                    <li><strong>Click a node</strong>: View agent details in side panel</li>
                    <li><strong>Edit</strong>: Modify agent configuration</li>
                    <li><strong>Delete</strong>: Remove agent (if not entry point)</li>
                    <li><strong>Set Entry</strong>: Make this agent the starting point</li>
                </ul>

                <h4>Edge Interactions</h4>
                <ul>
                    <li><strong>Click an edge</strong>: View connection details</li>
                    <li><strong>Edit</strong>: Change conditions</li>
                    <li><strong>Delete</strong>: Remove connection</li>
                </ul>

                <h4>Entry Point</h4>
                <p>The <span className="tutorial-button entry">Entry</span> badge shows where queries begin. This should typically be a decision agent that routes to different agents.</p>

                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Use pan & zoom to navigate large graphs!</span>
                </div>
            </>
        )
    },
];

const promptPage = [
    {
        title: "Understanding Prompts",
        content: (
            <>
                <p>Prompts define how your Responder agents behave and respond to queries.</p>

                <h4>Why Prompts Matter</h4>
                <ul>
                    <li>Control agent personality and tone</li>
                    <li>Define specific goals and constraints</li>
                    <li>Ensure consistent responses</li>
                    <li>Integrate RAG context effectively</li>
                </ul>

                <h4>Prompt Templates</h4>
                <p>RAGentFlow offers three template types:</p>
                <ul>
                    <li><strong>Guided</strong>: Simple fill-in-the-blank format</li>
                    <li><strong>Structured</strong>: Separate sections for detailed control</li>
                    <li><strong>Raw</strong>: Complete freedom for advanced users</li>
                </ul>

                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Start with Guided templates if you're new to prompt engineering!</span>
                </div>
            </>
        )
    },
    {
        title: "Creating and Managing Prompts",
        content: (
            <>
                <h4>Create New Prompt</h4>
                <ol>
                    <li>Click <span className="tutorial-button blue">+ New</span></li>
                    <li>Select a template type from the dropdown</li>
                    <li>Fill in the required fields:
                        <ul>
                            <li><strong>Guided</strong>: Persona, Goal, Style</li>
                            <li><strong>Structured</strong>: System Header, Persona Block, Style Block</li>
                            <li><strong>Raw</strong>: Complete system prompt</li>
                        </ul>
                    </li>
                    <li>Toggle <strong>RAG Context</strong> to include document knowledge</li>
                    <li>Click <span className="tutorial-button blue">Save</span> and give it a name</li>
                </ol>

                <h4>Edit Existing Prompt</h4>
                <ol>
                    <li>Click on any prompt in the list</li>
                    <li>Modify the fields in the workspace</li>
                    <li>Preview changes in real-time on the right</li>
                    <li>Click <span className="tutorial-button blue">Save</span> to update</li>
                </ol>

                <h4>RAG Context Toggle</h4>
                <p>When enabled, the prompt automatically includes retrieved document chunks. Use this when:</p>
                <ul>
                    <li>Agents need to answer based on uploaded documents</li>
                    <li>Accuracy from source material is critical</li>
                    <li>You want fact-based responses</li>
                </ul>
            </>
        )
    },
    {
        title: "🔵 Guided Template",
        content: (
            <>
                <p><br />
                    Best for: Customer service, simple Q&A bots<br /></p>
                <h4>Example:</h4>
                <p><strong>Persona:</strong> Friendly customer service representative for TechCorp</p>
                <p><strong>Goal:</strong> Help customers with billing inquiries and payment issues</p>
                <p><strong>Style:</strong> Professional yet warm, use simple language, always offer next steps</p>

                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Assign prompts to Responder agents in the Graph tab!</span>
                </div>
            </>
        )
    },
    {
        title: "🟢 Structured Template",
        content: (
            <>
                <p><br />Best for: Complex behaviors, multi-step reasoning<br /></p>
                <h4>Example:</h4>
                <p><strong>System Header:</strong><br />
                    You are an AI assistant for a medical clinic. Prioritize patient privacy and accuracy.</p>

                <p><strong>Persona Block:</strong><br />
                    - Role: Medical appointment coordinator<br />
                    - Experience: 10 years in healthcare administration<br />
                    - Expertise: Scheduling, insurance verification, patient communication</p>

                <p><strong>Style Block:</strong><br />
                    - Always verify patient identity before discussing appointments<br />
                    - Use clear, non-technical language<br />
                    - End responses with clear action items<br />
                    - Express empathy for health concerns</p>

                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Assign prompts to Responder agents in the Graph tab!</span>
                </div>
            </>
        )
    },
    {
        title: "🔴 Raw Template",
        content: (
            <>
                <p><br />Best for: Advanced users, precise control<br /></p>
                <h4>Example:</h4>
                <p><strong>Raw System Prompt:</strong></p>
                <p>
                    You are a senior software architect reviewing code submissions.<br /><br />

                    Core Principles:<br />
                    1. Prioritize code readability and maintainability<br />
                    2. Consider performance implications<br />
                    3. Ensure security best practices<br />
                    4. Follow SOLID principles<br /><br />

                    Review Process:<br />
                    - First, identify the purpose of the code<br />
                    - Check for potential bugs or edge cases<br />
                    - Suggest improvements with specific examples<br />
                    - Rate severity: Critical, Major, Minor, Suggestion<br /><br />

                    Always provide constructive feedback with code examples when possible.
                </p>

                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Assign prompts to Responder agents in the Graph tab!</span>
                </div>
            </>
        )
    },
];

const resultPage = [
    {
        title: "About Results",
        content: (
            <>
                <p>The Result tab shows how your query flows through the agent network and what decisions were made.</p>

                <h4>Three Main Sections</h4>
                <ul>
                    <li><strong>Traces</strong>: Step-by-step execution history</li>
                    <li><strong>Graph</strong>: Visual flow with highlighted path</li>
                    <li><strong>Details</strong>: In-depth information for each step</li>
                </ul>

                <h4>What You'll See</h4>
                <ul>
                    <li>Which documents were retrieved for context</li>
                    <li>How each agent processed the query</li>
                    <li>Decision reasoning at each step</li>
                    <li>Final response generation</li>
                </ul>

                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Results are only available after running a simulation!</span>
                </div>
            </>
        )
    },
    {
        title: "Analyzing Traces",
        content: (
            <>
                <h4>Document Retrieval (RAG)</h4>
                <p>Click the <strong>RAG</strong> trace to see:</p>
                <ul>
                    <li>Which chunks were retrieved</li>
                    <li>Similarity scores for each chunk</li>
                    <li>Relevance scores after reranking</li>
                    <li>Actual content used as context</li>
                </ul>

                <h4>Agent Traces</h4>
                <p>Each agent in the execution path shows:</p>
                <ul>
                    <li><strong>Decision Agents</strong>: Output value, reasoning, next node</li>
                    <li><strong>Responder Agents</strong>: Full prompt used, generated response</li>
                </ul>

                <div className="trace-example">
                    <span>📊 </span>
                    <span>Example: Classifier → "intent" = "billing" → Billing Responder</span>
                </div>
            </>
        )
    },
    {
        title: "Debugging Workflows",
        content: (
            <>
                <h4>Interactive Exploration</h4>
                <ol>
                    <li><strong>Click any trace</strong> to see detailed information</li>
                    <li><strong>Graph highlights</strong> show the path taken (blue edges)</li>
                    <li><span className="tutorial-view-full-content"><strong>View Full Content</strong></span> links show complete prompts and chunks</li>
                </ol>

                <h4>Common Issues to Check</h4>
                <ul>
                    <li><strong>Wrong routing?</strong> Check classifier categories or conditions</li>
                    <li><strong>Poor responses?</strong> Review retrieved chunks and prompts</li>
                    <li><strong>Unexpected path?</strong> Verify edge conditions and values</li>
                </ul>

                <h4>Tips for Improvement</h4>
                <ul>
                    <li>If chunks aren't relevant, try different queries or documents</li>
                    <li>If routing is wrong, adjust agent decision logic</li>
                    <li>If responses are poor, refine prompts or add context</li>
                </ul>

                <div>
                    <span>💡 </span>
                    <span className="tutorial-tip">Use results to iteratively improve your workflow!</span>
                </div>
            </>
        )
    }
];

const pages: Record<validTabs, any[]> = {
    "overview": overviewPage,
    "files": filePage,
    "graph": graphPage,
    "prompt": promptPage,
    "result": resultPage
}

