import React, { useState, useEffect } from 'react';

// Este componente solo maneja el estado del texto que se está editando.
export default function CommentEditForm({ 
    initialText, 
    onSave, 
    onCancel, 
    placeholder 
}) {
    const [editText, setEditText] = useState(initialText);

    useEffect(() => {
        setEditText(initialText);
    }, [initialText]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(editText);
    };

    return (
        <form onSubmit={handleSubmit} className="comment-form edit-form">
            <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={placeholder}
                required
            />
            <button type="submit" className="submit-button" title="Guardar edición">
                <i className='bx bx-paper-plane'></i> 
            </button>
            <button type="button" onClick={onCancel} className="cancel-button" title="Cancelar edición">
                <i className='bx bx-x'></i> 
            </button>
        </form>
    );
}