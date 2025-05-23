import React from "react";

interface ToggleProps {
    checked: boolean;
    onChange: (val: boolean) => void;
    label?: string;
}

const ToggleSwitch: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
    return (
        <div className="flex items-center gap-2 mb-2">
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition duration-200"></div>
                <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow-md peer-checked:translate-x-[16px] transition duration-200"></div>
            </label>
            {/* {label && <span className="text-sm">{label}</span>} */}
        </div>
    );
};

export default ToggleSwitch;
