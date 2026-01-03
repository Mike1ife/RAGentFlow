export default function TextAreaRow({ title, placeholder, value, onChange }: { title: string, placeholder: string, value: string, onChange: Function; }) {
    return (
        <div className="input-row">
            <span>{title}:</span>
            <div className="textarea-container">
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={1}
                />
            </div>
        </div>
    );
}