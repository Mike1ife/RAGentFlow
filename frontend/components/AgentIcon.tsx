import { Calculator, Circle, CircleUserRound, CircleX, Shapes } from "lucide-react";

export default function AgentIcon({ agentType, size }: { agentType: string, size: number; }) {
    switch (agentType) {
        case "responder":
            return <CircleUserRound color="royalblue" size={size} />;
        case "classifier":
            return <Shapes color="blueviolet" size={size} />;
        case "gatekeeper":
            return <CircleX color="darkolivegreen" size={size} />;
        case "scorer":
            return <Calculator color="firebrick" size={size} />;
        default:
            return <Circle color="orange" size={size} />;
    }
}