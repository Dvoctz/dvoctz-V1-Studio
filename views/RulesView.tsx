
import React, { useState, useEffect, useMemo } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';

// Helper component to highlight search terms within text
const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-500 text-black font-bold px-0.5 rounded">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

export const RulesView: React.FC = () => {
    const { updateRules } = useSports();
    const { data: rules, loading } = useEntityData('rules');
    const { userProfile } = useAuth();
    
    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (rules) {
            setContent(rules);
        }
    }, [rules]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await updateRules(content);
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save rules.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setContent(rules || '');
        setIsEditing(false);
        setError('');
    };
    
    // Filter logic
    const displayedParagraphs = useMemo(() => {
        const rawContent = isEditing ? content : (rules || '');
        // Split by double newline to identify paragraphs, or single newline if prefer line-by-line
        const paragraphs = rawContent.split(/\n+/).filter(p => p.trim().length > 0);
        
        if (!searchTerm.trim()) return paragraphs;

        return paragraphs.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [rules, content, isEditing, searchTerm]);

    const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'content_editor';

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-4xl font-extrabold">Official Game Rules</h1>
                {canEdit && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-highlight hover:bg-teal-400 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Edit Rules
                    </button>
                )}
            </div>
            
            {/* Search Bar */}
            <div className="mb-8">
                <div className="bg-secondary p-4 rounded-lg shadow-lg">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search rules (e.g., 'rotation', 'timeouts', 'scoring')..."
                            className="w-full bg-primary p-3 pl-10 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight transition-colors placeholder-text-secondary"
                            aria-label="Search rules"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-secondary p-6 sm:p-8 rounded-lg shadow-lg min-h-[400px]">
                {loading ? (
                     <div className="space-y-4 animate-pulse">
                        <div className="h-6 bg-accent rounded w-3/4"></div>
                        <div className="h-4 bg-accent rounded w-full"></div>
                        <div className="h-4 bg-accent rounded w-5/6"></div>
                        <div className="h-4 bg-accent rounded w-full"></div>
                    </div>
                ) : isEditing ? (
                    <div className="space-y-4">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-96 bg-primary p-3 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight font-mono text-sm"
                            placeholder="Enter the official game rules here. Use double newlines to create separate paragraphs."
                            aria-label="Game rules editor"
                        />
                        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-highlight hover:bg-teal-400 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Rules'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-text-primary leading-relaxed space-y-4">
                        {displayedParagraphs.length > 0 ? (
                            displayedParagraphs.map((paragraph, idx) => (
                                <p key={idx} className="border-b border-accent/20 pb-2 last:border-0 last:pb-0">
                                    <HighlightedText text={paragraph} highlight={searchTerm} />
                                </p>
                            ))
                        ) : (
                            <div className="text-center py-10 text-text-secondary">
                                <p className="text-lg">No rules found matching "{searchTerm}"</p>
                                <button onClick={() => setSearchTerm('')} className="mt-2 text-highlight hover:underline">Clear Search</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
