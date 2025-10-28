import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';

export const RulesView: React.FC = () => {
    const { rules, updateRules, loading } = useSports();
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

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
        setContent(rules);
        setIsEditing(false);
        setError('');
    };

    if (loading) {
        return <div className="text-center text-text-secondary">Loading rules...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-4xl font-extrabold">Official Game Rules</h1>
                {currentUser && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-highlight hover:bg-teal-400 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Edit Rules
                    </button>
                )}
            </div>

            <div className="bg-secondary p-6 sm:p-8 rounded-lg shadow-lg">
                {isEditing ? (
                    <div className="space-y-4">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-96 bg-primary p-3 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight"
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
                    <div className="text-text-primary leading-relaxed whitespace-pre-line">
                        {content}
                    </div>
                )}
            </div>
             {!isEditing && (
                 <div className="mt-8 text-center text-sm text-text-secondary">
                    <p>These are the official rules for all tournaments. For any clarifications, please contact the association officials.</p>
                </div>
             )}
        </div>
    );
};
