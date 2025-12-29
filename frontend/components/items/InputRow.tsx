export default function InputRow({ title, placeholder, value, onChange }: { title: string, placeholder: string, value: string, onChange: Function; }) {
    return (
        <div className="input-row">
            <span>{title}:</span>
            <div className="input-container">
                <input
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)} />
            </div>
        </div>
    );
}