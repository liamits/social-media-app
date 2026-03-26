import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { API } from '../../../utils/api';
import TagSelector from '../../../components/common/TagSelector';
import EmojiPickerBtn from '../../../components/common/EmojiPickerBtn';
import './CreatePostModal.css';

function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef();

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    
    const newFiles = [...files, ...selectedFiles].slice(0, 10); // Limit to 10
    setFiles(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
    setError('');
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    if (currentIndex >= newFiles.length) setCurrentIndex(Math.max(0, newFiles.length - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const imageUrls = [];

      // 1. Upload each image to Cloudinary
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const uploadRes = await fetch(API.upload, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.message || 'Upload failed');
        imageUrls.push(uploadJson.data?.url);
      }

      // 2. Create post with images array
      const postRes = await fetch(API.posts.base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          images: imageUrls,
          caption,
          location,
          tags: tags.map(t => t._id)
        }),
      });
      const postJson = await postRes.json();
      if (!postRes.ok) throw new Error(postJson.message || 'Failed to create post');

      onSuccess(postJson.data);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreviews([]);
    setFiles([]);
    setCaption('');
    setLocation('');
    setTags([]);
    setError('');
    setCurrentIndex(0);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <button className="close-modal" onClick={handleClose}><X size={24} color="white" /></button>
      <div className="create-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Create new post</h3>
          {previews.length > 0 && (
            <button className="share-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sharing...' : 'Share'}
            </button>
          )}
        </header>

        <div className="modal-body">
          {previews.length === 0 ? (
            <div
              className="upload-placeholder"
              onClick={() => fileInputRef.current.click()}
            >
              <ImageIcon size={48} strokeWidth={1} />
              <p>Select photos to share</p>
              <button className="select-btn" type="button">Select from computer</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="post-creation-container">
              <div className="image-preview-carousel">
                <img src={previews[currentIndex]} alt="Preview" />
                {previews.length > 1 && (
                  <>
                    <button className="nav-btn prev" onClick={() => setCurrentIndex(c => (c > 0 ? c - 1 : c))}>
                      <ChevronLeft size={20} />
                    </button>
                    <button className="nav-btn next" onClick={() => setCurrentIndex(c => (c < previews.length - 1 ? c + 1 : c))}>
                      <ChevronRight size={20} />
                    </button>
                    <div className="carousel-dots">
                      {previews.map((_, i) => (
                        <span key={i} className={`dot ${i === currentIndex ? 'active' : ''}`} />
                      ))}
                    </div>
                  </>
                )}
                <button className="remove-preview" onClick={() => removeFile(currentIndex)}><X size={16} /></button>
                <button className="add-more-btn" onClick={() => fileInputRef.current.click()}>
                  <Plus size={20} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </button>
              </div>
              <div className="post-details">
                <div className="caption-wrapper">
                  <textarea
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    maxLength={2200}
                  />
                  <EmojiPickerBtn onEmojiSelect={(emoji) => setCaption(prev => prev + emoji)} />
                </div>
                <input
                  type="text"
                  placeholder="Add location"
                  className="location-input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
                <TagSelector selectedTags={tags} onTagsChange={setTags} />
                {error && <p className="error-text">{error}</p>}
                <p className="image-count">{previews.length}/10 photos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatePostModal;
