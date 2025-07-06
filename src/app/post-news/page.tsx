// app/post-news/page.tsx
'use client'; // This component uses client-side interactivity (useState, FormData, fetch)

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PostNewsPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState('');
    const [images, setImages] = useState<FileList | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            if (e.target.files.length > 3) {
                alert("You can upload a maximum of 3 images.");
                e.target.value = ''; // Clear selection
                setImages(null);
                return;
            }
            setImages(e.target.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage(null);
        setIsError(false);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('date', date);

        if (images) {
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i]); // Append each image file
            }
        }

        try {
            const response = await fetch('/api/news', {
                method: 'POST',
                body: formData, // FormData automatically sets Content-Type header
            });

            if (response.ok) {
                const result = await response.json();
                setSubmitMessage('News posted successfully!');
                // Clear form fields
                setTitle('');
                setContent('');
                setDate('');
                setImages(null);
                // Optionally redirect after a short delay
                setTimeout(() => {
                    router.push('/community-news');
                }, 2000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to post news.');
            }
        } catch (error: any) {
            console.error('Error posting news:', error);
            setSubmitMessage(`Error: ${error.message || 'Something went wrong.'}`);
            setIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={formStyles.container}>
            <h1 style={formStyles.heading}>Post New Community News/Announcement</h1>

            <form onSubmit={handleSubmit} style={formStyles.form}>
                <div style={formStyles.formGroup}>
                    <label htmlFor="newsDate" style={formStyles.label}>Date:</label>
                    <input
                        type="date"
                        id="newsDate"
                        name="newsDate"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        style={formStyles.input}
                    />
                </div>

                <div style={formStyles.formGroup}>
                    <label htmlFor="newsTitle" style={formStyles.label}>Title:</label>
                    <input
                        type="text"
                        id="newsTitle"
                        name="newsTitle"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter news title"
                        required
                        style={formStyles.input}
                    />
                </div>

                <div style={formStyles.formGroup}>
                    <label htmlFor="newsContent" style={formStyles.label}>Content:</label>
                    <textarea
                        id="newsContent"
                        name="newsContent"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your news or announcement details here..."
                        required
                        style={formStyles.textarea}
                    />
                </div>

                <div style={formStyles.formGroup}>
                    <label htmlFor="newsImages" style={formStyles.label}>Images (up to 3):</label>
                    <input
                        type="file"
                        id="newsImages"
                        name="newsImages"
                        accept="image/*"
                        multiple // Allow multiple file selection
                        onChange={handleImageChange}
                        style={formStyles.fileInput}
                    />
                    <small style={formStyles.smallText}>You can select up to 3 image files (JPG, PNG, GIF).</small>
                    {images && images.length > 0 && (
                        <div style={formStyles.imagePreviewContainer}>
                            <p>Selected Images:</p>
                            <ul>
                                {Array.from(images).map((file, index) => (
                                    <li key={index} style={formStyles.imagePreviewItem}>{file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {submitMessage && (
                    <p style={isError ? formStyles.errorMessage : formStyles.successMessage}>
                        {submitMessage}
                    </p>
                )}

                <div style={formStyles.buttons}>
                    <button type="submit" disabled={isSubmitting} style={formStyles.submitButton}>
                        {isSubmitting ? 'Posting...' : 'Submit Announcement'}
                    </button>
                    <button type="button" onClick={() => router.back()} style={formStyles.backButton}>
                        Back to News
                    </button>
                </div>
            </form>
        </div>
    );
}

// Basic Inline Styles for the form
const formStyles: { [key: string]: React.CSSProperties } = {
    container: {
        fontFamily: 'Arial, sans-serif',
        margin: '20px auto',
        maxWidth: '800px',
        padding: '30px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    heading: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px',
        fontSize: '2em',
    },
    formGroup: {
        marginBottom: '25px',
    },
    label: {
        display: 'block',
        marginBottom: '10px',
        fontWeight: 'bold',
        color: '#555',
        fontSize: '1.1em',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontSize: '1em',
        boxSizing: 'border-box',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontSize: '1em',
        minHeight: '180px',
        resize: 'vertical',
        boxSizing: 'border-box',
    },
    fileInput: {
        padding: '8px 0',
    },
    smallText: {
        display: 'block',
        fontSize: '0.9em',
        color: '#777',
        marginTop: '5px',
    },
    imagePreviewContainer: {
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '5px',
    },
    imagePreviewItem: {
        listStyle: 'disc',
        marginLeft: '20px',
        color: '#444',
    },
    buttons: {
        textAlign: 'center',
        marginTop: '35px',
    },
    submitButton: {
        padding: '14px 30px',
        fontSize: '1.2em',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: '#28a745', // Green
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        margin: '0 10px',
        transition: 'background-color 0.3s ease',
    },
    backButton: {
        padding: '14px 30px',
        fontSize: '1.2em',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: '#6c757d', // Grey
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        margin: '0 10px',
        transition: 'background-color 0.3s ease',
    },
    submitButtonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed',
    },
    successMessage: {
        color: '#28a745', // Green
        textAlign: 'center',
        marginTop: '20px',
        fontWeight: 'bold',
    },
    errorMessage: {
        color: '#dc3545', // Red
        textAlign: 'center',
        marginTop: '20px',
        fontWeight: 'bold',
    },
};