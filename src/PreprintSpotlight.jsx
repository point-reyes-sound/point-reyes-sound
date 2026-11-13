import { useState, useRef } from "react";
import "./PreprintSpotlight.css";

const CAROUSEL_SLIDES = [
  {
    id: "qbescf",
    imageSrc: "/assets/preprint/QBESCF-slide1.png",
    alt: "QBE-SCF",
    arxivUrl: "https://arxiv.org/abs/2608.14979"
  },
  {
    id: "qbeck",
    imageSrc: "/assets/preprint/QBECK-slide2.png",
    alt: "Q-BECK",
    arxivUrl: "https://arxiv.org/abs/2611.17245"
  }
];

export default function PreprintSpotlight() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartXRef = useRef(null);
  const didDragRef = useRef(false);

  const goToSlide = (nextIdx) => {
    const clamped = Math.max(0, Math.min(CAROUSEL_SLIDES.length - 1, nextIdx));
    setActiveIdx(clamped);
  };

  const handlePointerDown = (e) => {
    // Do not hijack clicks on links or buttons
    if (e.target.closest("a, button")) return;
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || dragStartXRef.current === null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 6) {
      didDragRef.current = true;
    }
    setDragOffsetPx(deltaX);
  };

  const finishDrag = () => {
    if (!isDragging) return;
    const threshold = 55;
    if (dragOffsetPx < -threshold && activeIdx < CAROUSEL_SLIDES.length - 1) {
      setActiveIdx((prev) => prev + 1);
    } else if (dragOffsetPx > threshold && activeIdx > 0) {
      setActiveIdx((prev) => prev - 1);
    }
    dragStartXRef.current = null;
    setIsDragging(false);
    setDragOffsetPx(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      goToSlide(activeIdx + 1);
    } else if (e.key === "ArrowLeft") {
      goToSlide(activeIdx - 1);
    }
  };

  const currentSlide = CAROUSEL_SLIDES[activeIdx];

  return (
    <div
      className="research-carousel-stage"
      id="preprint"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Research Preprints Carousel"
    >
      <div className="research-carousel-shell">
        <button
          type="button"
          className={`research-nav-arrow prev ${activeIdx === 0 ? "is-disabled" : ""}`}
          onClick={() => goToSlide(activeIdx - 1)}
          disabled={activeIdx === 0}
          aria-label="Previous slide"
        >
          &#8249;
        </button>

        <div
          className={`research-carousel-viewport ${isDragging ? "is-dragging" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onPointerLeave={finishDrag}
        >
          <div
            className={`research-carousel-track ${isDragging ? "no-transition" : ""}`}
            style={{
              transform: `translate3d(calc(-${activeIdx * 100}% + ${dragOffsetPx}px), 0, 0)`
            }}
          >
            {CAROUSEL_SLIDES.map((slide) => (
              <div key={slide.id} className="research-slide-item">
                <div className="research-slide-frame">
                  <img
                    src={slide.imageSrc}
                    alt={slide.alt}
                    className="research-slide-img"
                    draggable={false}
                    loading="eager"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`research-nav-arrow next ${
            activeIdx === CAROUSEL_SLIDES.length - 1 ? "is-disabled" : ""
          }`}
          onClick={() => goToSlide(activeIdx + 1)}
          disabled={activeIdx === CAROUSEL_SLIDES.length - 1}
          aria-label="Next slide"
        >
          &#8250;
        </button>
      </div>

      <div className="research-carousel-footer">
        <a
          href={currentSlide.arxivUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="research-read-paper-btn"
        >
          Read Paper
        </a>

        <div className="research-dots-nav" role="tablist" aria-label="Carousel Slides">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIdx}
              aria-label={slide.alt}
              className={`research-dot-btn ${idx === activeIdx ? "active" : ""}`}
              onClick={() => goToSlide(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
