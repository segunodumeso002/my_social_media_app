import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImageToS3 } from '../utils/storage';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    
    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const uploaded = await uploadImageToS3(imageFile, 'posts', setUploadProgress);
        imageUrl = uploaded.url;
      }

      const newPost = await api.createPost(content.trim(), imageUrl);
      onPostCreated(newPost);
      setContent('');
      handleRemoveImage();
      toast.success('Post created');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to create post');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="3"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {imagePreview && (
          <div className="mt-3 rounded-lg border border-gray-200 p-3">
            <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="text-xs text-gray-600 mt-2">Uploading image: {uploadProgress}%</p>
            )}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="mt-2 text-sm text-red-500 hover:text-red-600"
            >
              Remove photo
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <button type="button" onClick={handleChoosePhoto} className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
            <Image size={20} />
            <span>Photo</span>
          </button>
          <button
            type="submit"
            disabled={loading || (!content.trim() && !imageFile)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
