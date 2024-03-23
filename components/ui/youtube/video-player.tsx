'use client'
import React from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({ videoData }) => {
    // Helper function to generate the YouTube video URL
    const getYouTubeVideoURL = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;
     const getYouTubeBestMomentURL = (videoId,start,end) => `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1`

    return (
        <div className='youtTubeRoot'>
            {videoData.slice(0, 5).map((video, index) => (
                <div key={index} style={{ display: 'inline-block', margin: '10px' }}>

                    <a href={getYouTubeVideoURL(video.videoId)} target="_blank" rel="noopener noreferrer"
                       style={{
                           color: '#0077cc',
                           textDecoration: 'underline',
                           maxWidth: `260px`,
                           display: 'block',
                           whiteSpace: 'nowrap',
                           overflow: 'hidden',
                           textOverflow: 'ellipsis',
                       }}>
                        {video.title}
                        </a>

                    <div
                        style={{
                            width: '260px',
                            height: '200px',
                            backgroundImage: `url(${video.thumbnailUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                        }}
                    >
                        <ReactPlayer
                            url={getYouTubeBestMomentURL(video.videoId,video.start,video.end)}
                            width="100%"
                            height="100%"
                            playing={false}
                            style={{ position: 'absolute', top: 0, left: 0 }}
                        />
                    </div>

                </div>
            ))}
        </div>
    );
};

export default VideoPlayer;