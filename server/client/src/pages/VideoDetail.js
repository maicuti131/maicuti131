import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  VideoPlayer,
  VideoInfo,
  CommentsSection,
  LikeButton,
  ShareButton,
  ReportModal
} from '../components';

const VideoDetail = ({ user }) => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`/videos/${id}`);
        setVideo(res.data);
        setComments(res.data.comments);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchVideo();
    
    // Track view
    if (user) {
      axios.post(`/videos/${id}/view`);
    }
  }, [id, user]);

  const handleLike = async () => {
    if (!user) return;
    try {
      await axios.post(`/videos/${id}/like`);
      const res = await axios.get(`/videos/${id}`);
      setVideo(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    try {
      await axios.post(`/videos/${id}/comment`, { text: commentText });
      const res = await axios.get(`/videos/${id}`);
      setComments(res.data.comments);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportSubmit = async () => {
    try {
      await axios.post(`/videos/${id}/report`, { reason: reportReason });
      setShowReportModal(false);
      setReportReason('');
      alert('Báo cáo của bạn đã được gửi');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!video) return <div>Video không tồn tại</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-3/4">
          <VideoPlayer url={video.videoUrl} />
          
          <VideoInfo 
            video={video} 
            user={user} 
            onLike={handleLike} 
            onReport={() => setShowReportModal(true)}
          />
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Bình luận ({comments.length})</h3>
            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Thêm bình luận..."
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <button
                  type="submit"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Gửi
                </button>
              </form>
            )}
            <CommentsSection comments={comments} />
          </div>
        </div>
        
        <div className="lg:w-1/4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Video liên quan</h3>
            {/* Related videos list */}
          </div>
        </div>
      </div>
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reason={reportReason}
        onReasonChange={setReportReason}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
};

export default VideoDetail;
