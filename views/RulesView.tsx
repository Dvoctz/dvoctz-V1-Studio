import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from '@google/genai';

export const RulesView: React.FC = () => {
    const { rules, updateRules, loading } = useSports();
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // State for AI Q&A
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [askError, setAskError] = useState('');

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
    
    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setIsAsking(true);
        setAnswer('');
        setAskError('');
        
        try {
            const apiKey = (window as any).GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("Missing API Key");
            }
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Here are the official rules:\n---\n${rules}\n---\nBased ONLY on the rules provided, please answer the following question: "${question}"`,
                config: {
                    systemInstruction: "You are an expert on the rules of this sport. Your role is to answer questions based strictly and solely on the provided rules text. If the answer cannot be found in the text, you must state that the information is not available in the provided rules. Do not infer or invent information outside of the text.",
                }
            });
            
            setAnswer(response.text);

        } catch (err: any) {
            console.error("Error calling Gemini API:", err);
            if (err.message && (err.message.includes("API Key must be set") || err.message.includes("API key not valid") || err.message.includes("Missing API Key"))) {
                setAskError("The Gemini API key is missing or invalid. An administrator must set the `VITE_API_KEY` environment variable in the application's hosting settings (e.g., Vercel). The app may need to be redeployed for the change to take effect.");
            } else {
                setAskError(err.message || "An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsAsking(false);
        }
    };

    const handleClear = () => {
        setQuestion('');
        setAnswer('');
        setAskError('');
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
            
            <div className="mb-12">
                 <div className="bg-secondary p-6 sm:p-8 rounded-lg shadow-lg">
                     <h2 className="text-2xl font-bold mb-4 text-white">Ask a Question</h2>
                    <p className="text-text-secondary mb-4">Have a question about the rules? Ask our AI assistant for a clarification based on the official text below.</p>
                    <form onSubmit={handleAskQuestion} className="space-y-4">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="w-full h-24 bg-primary p-3 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight transition-colors"
                            placeholder="e.g., How many players are allowed on the court at one time?"
                            aria-label="Ask a question about the rules"
                            disabled={isAsking}
                        />
                        <div className="flex items-center justify-end space-x-4">
                            {(answer || askError) && (
                                <button type="button" onClick={handleClear} disabled={isAsking} className="text-sm text-text-secondary hover:text-white transition-colors">Clear</button>
                            )}
                            <button
                                type="submit"
                                disabled={!question.trim() || isAsking}
                                className="bg-highlight hover:bg-teal-400 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isAsking ? 'Thinking...' : 'Ask Question'}
                            </button>
                        </div>
                    </form>
                     
                     {isAsking && (
                        <div className="text-center p-4 mt-4 text-text-secondary">
                            <p>Generating answer, please wait...</p>
                        </div>
                     )}
                     
                     {askError && (
                         <div className="mt-4 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md">
                             <strong>Error:</strong> {askError}
                         </div>
                     )}

                     {answer && !isAsking && (
                         <div className="mt-6 pt-6 border-t border-accent">
                             <h3 className="text-xl font-semibold text-white mb-2">Answer:</h3>
                             <div className="bg-primary p-4 rounded-md text-text-primary leading-relaxed whitespace-pre-line">
                                 {answer}
                             </div>
                         </div>
                     )}
                 </div>
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
                    <div className="text-text-primary leading-relaxed whitespace-pre-line prose prose-invert max-w-none">
                        {content}
                    </div>
                )}
            </div>
        </div>
    );
};