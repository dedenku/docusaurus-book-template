import React, { useState } from 'react';
import styles from './YouTubeEmbed.module.css';

export default function YouTubeEmbed({
    videoId,
    title = "Video Pembelajaran",
    description,
    autoplay = false,
    startTime = 0
}) {
    const [isLoaded, setIsLoaded] = useState(false);

    const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startTime}${autoplay ? '&autoplay=1' : ''}`;
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const handleClick = () => {
        setIsLoaded(true);
    };

    return (
        <div className={styles.videoContainer}>
            <div className={styles.videoWrapper}>
                {!isLoaded ? (
                    <div
                        className={styles.thumbnail}
                        onClick={handleClick}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && handleClick()}
                        aria-label={`Play video: ${title}`}
                    >
                        <img src={thumbUrl} alt={title} />
                        <div className={styles.playButton}>
                            <svg width="68" height="48" viewBox="0 0 68 48">
                                <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path>
                                <path d="M 45,24 27,14 27,34" fill="#fff"></path>
                            </svg>
                        </div>
                    </div>
                ) : (
                    <iframe
                        src={embedUrl}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className={styles.iframe}
                    />
                )}
            </div>

            {description && (
                <div className={styles.description}>
                    {description}
                </div>
            )}
        </div>
    );
}