
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
                    <span key={i} className="bg-[#D4AF37] text-black font-black px-1 mx-0.5 rounded shadow-sm">{part}</span>
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
        <div className="animate-fade-in-up max-w-5xl mx-auto">
            <div className="text-center mb-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-highlight/10 rounded-full blur-[80px] pointer-events-none"></div>
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary uppercase tracking-tighter drop-shadow-md mb-4 flex items-center justify-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Official Rules
                </h1>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-secondary mb-6">Regulations, guidelines, and bylaws.</p>
                {canEdit && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-primary/80 hover:bg-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:text-primary text-[#D4AF37] font-black uppercase text-xs tracking-widest py-3 px-8 rounded-full transition-all duration-300 shadow-glow relative overflow-hidden group inline-flex items-center gap-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                         </svg>
                        Edit Rulebook
                    </button>
                )}
            </div>
            
            {/* Search Bar */}
            <div className="mb-10 max-w-2xl mx-auto">
                <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary group-focus-within:text-highlight transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search rules (e.g., 'rotation', 'timeouts')..."
                        className="w-full bg-secondary/80 p-4 pl-12 rounded-full border border-accent/50 focus:ring-2 focus:ring-highlight focus:border-highlight transition-all outline-none font-medium shadow-inner"
                        aria-label="Search rules"
                    />
                </div>
            </div>

            <div className="bg-secondary/40 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-xl border border-accent/30 min-h-[500px]">
                {loading ? (
                     <div className="space-y-6 animate-pulse">
                        <div className="h-8 bg-accent/40 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-accent/30 rounded w-full"></div>
                        <div className="h-4 bg-accent/30 rounded w-5/6"></div>
                        <div className="h-4 bg-accent/30 rounded w-full"></div>
                        <div className="h-4 bg-accent/30 rounded w-4/6 mt-12"></div>
                    </div>
                ) : isEditing ? (
                    <div className="space-y-6">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-[500px] bg-primary/80 p-6 rounded-2xl text-text-primary border border-highlight/50 focus:ring-2 focus:ring-highlight focus:border-highlight font-mono text-sm shadow-inner outline-none break-words whitespace-pre-wrap leading-relaxed"
                            placeholder="Enter the official game rules here. Use double newlines to create separate paragraphs."
                            aria-label="Game rules editor"
                        />
                        {error && <p className="text-red-400 text-center font-medium bg-red-900/20 py-3 rounded-lg border border-red-900/50">{error}</p>}
                        <div className="flex justify-end gap-4 pt-4 border-t border-accent/30">
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="bg-primary hover:bg-slate-700 border border-accent text-white font-bold py-3 px-8 rounded-full transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#D4AF37] hover:bg-yellow-400 border border-yellow-500 text-primary font-black py-3 px-10 rounded-full transition-colors disabled:opacity-50 shadow-glow uppercase tracking-widest text-xs flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-text-primary leading-loose space-y-8 text-lg font-medium max-w-4xl mx-auto">
                        {displayedParagraphs.length > 0 ? (
                            displayedParagraphs.map((paragraph, idx) => {
                                // Super crude attempt to see if a line is a header (short, uppercase, or starts with #)
                                const isHeader = paragraph.length < 100 && (paragraph === paragraph.toUpperCase() || paragraph.startsWith('#'));
                                
                                return (
                                    <p key={idx} className={`border-l-2 border-accent/20 pl-6 ${isHeader ? 'text-2xl font-black text-white uppercase tracking-wider !border-highlight !pl-4 mt-12' : 'text-slate-300'}`}>
                                        <HighlightedText text={paragraph.replace(/^#+\s*/, '')} highlight={searchTerm} />
                                    </p>
                                );
                            })
                        ) : (
                            <div className="text-center py-20 bg-primary/20 rounded-2xl border border-white/5">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-accent mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                                 </svg>
                                <p className="text-xl font-medium tracking-wide">No rules found matching "{searchTerm}"</p>
                                <button onClick={() => setSearchTerm('')} className="mt-6 border border-accent/50 text-text-secondary hover:text-white hover:border-white px-6 py-2 rounded-full text-sm uppercase tracking-widest font-bold transition-all">Clear Search</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
