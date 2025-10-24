import React from 'react';

// Reusable UI Components
export const AdminSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
    </div>
);

export const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean; type?: 'button' | 'submit' }> = ({ onClick, children, className = 'bg-highlight hover:bg-teal-400', disabled = false, type = "button" }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-300 ${className} disabled:bg-gray-500 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight" />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight" />
);

export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary">{children}</label>
);

export const FormModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-accent flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0-0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-sm">
        <strong>Error:</strong> {message}
    </div>
);
