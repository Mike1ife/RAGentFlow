import { ChevronLeft } from "lucide-react";
import * as Select from "@radix-ui/react-select";

export default function DropdownMenu({ title, value, placeholder, options, onSelect, disabled = false }: { title: string, value: string, placeholder: string, options: string[], onSelect: Function, disabled?: boolean; }) {
    const selectedIndex = value ? `${options.indexOf(value)}` : "";

    return (
        <div className="input-row">
            {title && <span>{title}:</span>}
            <Select.Root value={selectedIndex} disabled={disabled} onValueChange={(value) => onSelect(options[parseInt(value)])}>
                <Select.Trigger className="select-trigger">
                    <Select.Value placeholder={placeholder} />
                    <Select.Icon className="select-icon">
                        <ChevronLeft size={16} />
                    </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                    <Select.Content className="select-content" position="popper">
                        <Select.Viewport className="select-viewport">
                            {options.map((value, index) => (
                                <Select.Item
                                    key={index}
                                    value={`${index}`}
                                    className="select-item"
                                >
                                    <Select.ItemText>{value}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </div>
    );
}