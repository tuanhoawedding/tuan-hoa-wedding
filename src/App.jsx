import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

// ActScene Component for Pinned Scroll Scrubbing Video
function ActScene({ id, videoSrc, title, subtitle, alignRight }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const content = contentRef.current;

    if (!section || !video || !content) return;

    // Priming function to load first frame and prevent freeze/stale rendering on mobile
    const primeVideoAction = () => {
      video.play().then(() => {
        video.pause();
        video.currentTime = 0.01;
      }).catch((e) => console.log('Mobile video priming blocked:', e));
    };

    const onLoadedMetadata = () => {
      video.currentTime = 0.01;
      primeVideoAction();
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    if (video.readyState >= 1) {
      onLoadedMetadata();
    }

    // Prime again on first user interaction to ensure mobile browsers allow it
    const handleTouchPrime = () => {
      primeVideoAction();
      window.removeEventListener('touchstart', handleTouchPrime);
    };
    window.addEventListener('touchstart', handleTouchPrime);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=140%',
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (video.duration) {
            const targetTime = self.progress * video.duration;
            // Seek only when difference is substantial to avoid decoder overload
            if (Math.abs(video.currentTime - targetTime) > 0.02) {
              video.currentTime = targetTime;
            }
          }
        }
      }
    });

    // Zoom out video slightly from 1.12 to 1.0
    tl.to(video, {
      scale: 1.0,
      ease: 'none'
    }, 0);

    // Fade in text in middle, fade out at end
    tl.fromTo(content, 
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: 0.35 },
      0.08
    );
    
    tl.to(content, 
      { opacity: 0, y: -35, duration: 0.35 },
      0.80
    );

    return () => {
      window.removeEventListener('touchstart', handleTouchPrime);
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, [videoSrc]);

  return (
    <section ref={sectionRef} id={id} className="act-scene">
      <div className="act-video-wrap">
        <video
          ref={videoRef}
          className="act-video"
          src={videoSrc}
          muted
          playsInline
          preload="auto"
        />
      </div>
      <div className={`act-overlay ${alignRight ? 'align-right' : ''}`}>
        <div ref={contentRef} className="act-content">
          <h2 className="act-title">{title}</h2>
          <p className="act-subtitle">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [burgerActive, setBurgerActive] = useState(false);
  const heroVideoRef = useRef(null);
  
  // Mascot state
  const [mascotText, setMascotText] = useState('Chào mừng bạn đến với Tuan Hoa Wedding! Hãy cùng tôi khám phá hành trình tình yêu nhé! ✨');
  const [mascotPose, setMascotPose] = useState('present'); // present, run, jump
  const [speechVisible, setSpeechVisible] = useState(true);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  // Time remaining count for Final CTA (Countdown of 60 days program / special promo)
  const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 8, minutes: 45, seconds: 30 });

  // 1. Autoplay loop fix for Hero Video on Mobile
  useEffect(() => {
    const heroVideo = heroVideoRef.current;
    if (!heroVideo) return;

    heroVideo.muted = true;
    heroVideo.playsInline = true;
    heroVideo.loop = true;

    const playVideo = () => {
      heroVideo.play().catch((e) => console.log('Hero video autoplay blocked:', e));
    };

    playVideo();

    // Re-play on pause, visibility change, and first touch
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        playVideo();
      }
    };

    const handleFirstTouch = () => {
      playVideo();
      window.removeEventListener('touchstart', handleFirstTouch);
    };

    heroVideo.addEventListener('pause', playVideo);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('touchstart', handleFirstTouch);

    return () => {
      heroVideo.removeEventListener('pause', playVideo);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  // 2. Main Scroll & GSAP setup
  useEffect(() => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Bind link clicks to Lenis ScrollTo
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        e.preventDefault();
        const id = anchor.getAttribute('href');
        if (id === '#') return;
        const targetElement = document.querySelector(id);
        if (targetElement) {
          lenis.scrollTo(targetElement);
          setBurgerActive(false);
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    // Scroll event for navbar styling
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);

    // ScrollTrigger to track active section & update Mascot Speech Bubble
    const sections = [
      { id: 'hero', text: 'Chào mừng bạn đến với Tuan Hoa Wedding! Hãy cùng tôi khám phá hành trình tình yêu nhé! ✨', pose: 'present' },
      { id: 'problems', text: 'Bạn có đang lo lắng về cuốn album ảnh cưới của mình bị rập khuôn? Đừng lo nhé! 🤔', pose: 'present' },
      { id: 'chapter-1', text: 'Chương I: Ghi dấu buổi chụp hình lãng mạn giữa đại dương hùng vĩ... 🌊', pose: 'run' },
      { id: 'about', text: 'Anh Tuấn Hoa là linh hồn nghệ thuật đứng sau hàng ngàn album cưới độc bản! 📸', pose: 'present' },
      { id: 'comparison', text: 'Xem sự khác biệt vượt trội khi bạn chọn dịch vụ Luxury độc bản của chúng tôi.', pose: 'present' },
      { id: 'chapter-2', text: 'Chương II: Nơi những tác phẩm váy cưới độc bản tôn vinh vóc dáng nàng thơ... 👑', pose: 'run' },
      { id: 'services', text: 'Chúng tôi đáp ứng trọn gói: Chụp ảnh cưới, Váy cưới thiết kế, Makeup và Học viện đào tạo chuyên sâu.', pose: 'present' },
      { id: 'chapter-3', text: 'Chương III: Trực tiếp lưu trữ những giọt nước mắt hạnh phúc trong ngày thành đôi... 🌾', pose: 'run' },
      { id: 'testimonials', text: 'Đọc những dòng chia sẻ chân thành từ các cặp đôi đã trao gửi niềm tin cho Tuan Hoa.', pose: 'present' },
      { id: 'chapter-4', text: 'Chương IV: Đỉnh cao viên mãn của một đám cưới trong mơ và sự chắp cánh đam mê... 🌅', pose: 'run' },
      { id: 'pricing', text: 'Xem bảng giá 3 gói chụp VIP và chọn gói cưới phù hợp nhất với ngân sách của bạn nhé!', pose: 'present' },
      { id: 'faq', text: 'Tôi đã giải đáp sẵn các thắc mắc phổ biến về trang phục, makeup và lịch chụp ở đây. 💡', pose: 'present' },
      { id: 'contact', text: 'Nhận ngay khuyến mãi 30% khi để lại thông tin đăng ký tư vấn ngày hôm nay! 🎁', pose: 'jump' },
    ];

    const triggers = [];
    sections.forEach((sec) => {
      const trigger = ScrollTrigger.create({
        trigger: `#${sec.id}`,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          setMascotText(sec.text);
          setMascotPose(sec.pose);
        },
        onEnterBack: () => {
          setMascotText(sec.text);
          setMascotPose(sec.pose);
        }
      });
      triggers.push(trigger);
    });

    // Global Scroll Progress Bar
    const progressTrigger = ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
          progressBar.style.width = `${self.progress * 100}%`;
        }
      }
    });
    triggers.push(progressTrigger);

    window.__ST = ScrollTrigger;

    // Countdown Timer logic
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => {
      lenis.destroy();
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('scroll', handleScroll);
      triggers.forEach(t => t.kill());
      clearInterval(interval);
    };
  }, []);

  // Mascot click triggers speech bubble toggle
  const handleMascotClick = () => {
    setSpeechVisible(!speechVisible);
  };

  // Auto show speech bubble on change
  useEffect(() => {
    setSpeechVisible(true);
    const timer = setTimeout(() => setSpeechVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [mascotText]);

  // Mascot Image Map based on Pose
  const getMascotImage = () => {
    if (mascotPose === 'run') return './img/ivy-run.png';
    if (mascotPose === 'jump') return './img/ivy-jump.png';
    return './img/ivy-present.png'; // default
  };

  return (
    <>
      {/* Scroll Progress Indicator */}
      <div className="scroll-progress-bar"></div>

      {/* Navigation Header */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <a href="#hero" className="logo">
            <div className="logo-icon">TH</div>
            <span className="logo-text">TUAN HOA</span>
          </a>
          
          <ul className={`nav-links ${burgerActive ? 'active' : ''}`}>
            <li><a href="#problems">Nỗi Lo Cưới</a></li>
            <li><a href="#chapter-1">Chương I</a></li>
            <li><a href="#about">Founder</a></li>
            <li><a href="#chapter-2">Chương II</a></li>
            <li><a href="#services">Dịch Vụ</a></li>
            <li><a href="#chapter-3">Chương III</a></li>
            <li><a href="#testimonials">Cặp Đôi</a></li>
            <li><a href="#chapter-4">Chương IV</a></li>
            <li><a href="#pricing">Báo Giá</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#contact" className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Liên Hệ</a></li>
          </ul>

          <div className="burger" onClick={() => setBurgerActive(!burgerActive)}>
            <span style={{ transform: burgerActive ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: burgerActive ? '0' : '1' }}></span>
            <span style={{ transform: burgerActive ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero">
        <video
          ref={heroVideoRef}
          className="hero-video"
          src="./video/v1-hero-loop.mp4"
          muted
          playsInline
        />
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1 className="hero-title">
            <span className="grad-gold-text">TUAN HOA WEDDING</span>
          </h1>
          <p className="hero-sub">
            PHOTO • MAKE UP • BRIDAL • ACADEMY
            <br />
            Lưu giữ câu chuyện tình yêu bằng ngôn ngữ điện ảnh và nghệ thuật thời trang độc bản.
          </p>
          <div className="hero-ctas">
            <a href="#contact" className="btn btn-primary">Nhận Tư Vấn Độc Quyền</a>
            <a href="#pricing" className="btn btn-outline">Khám Phá Các Gói Cưới</a>
          </div>
        </div>
        <div className="scroll-hint" onClick={() => window.__lenis?.scrollTo('#problems')}>
          <span>Cuộn Để Bắt Đầu</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* The Trap / Problems Section */}
      <section id="problems" className="problems section-padding">
        <div className="container">
          <h2 className="section-title">Ngày Cưới Cận Kề, Nhưng Bạn Có Đang Lo Lắng?</h2>
          <p className="section-desc">Việc chuẩn bị cho album ảnh cưới hoàn hảo đang khiến bạn bối rối vì những rập khuôn công nghiệp ngoài kia?</p>
          
          <div className="grid-3">
            <div className="problem-card">
              <div className="problem-num">01</div>
              <h3 className="problem-title">Tạo dáng đơ cứng & Rập khuôn</h3>
              <p className="problem-body">Hàng trăm cặp đôi chung một góc chụp, một kiểu tạo dáng công nghiệp làm mất đi cá tính riêng và cảm xúc tự nhiên.</p>
            </div>
            
            <div className="problem-card">
              <div className="problem-num">02</div>
              <h3 className="problem-title">Chi phí phát sinh mập mờ</h3>
              <p className="problem-body">Các chi phí "phụ thu" phát sinh từ váy VIP, makeup, đi lại, vé vào cổng địa điểm làm ngân sách của bạn tăng vọt ngoài tầm kiểm soát.</p>
            </div>
            
            <div className="problem-card">
              <div className="problem-num">03</div>
              <h3 className="problem-title">Váy cưới & Makeup lỗi thời</h3>
              <p className="problem-body">Trang phục cũ kỹ, makeup quá đậm làm bạn già đi và không tôn lên được vẻ đẹp tự nhiên, kiêu sa vốn có của cô dâu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter I — Khởi Đầu (Island Video Scrub) */}
      <ActScene
        id="chapter-1"
        videoSrc="./video/v2-island.mp4"
        title="Chương I — Khởi Đầu"
        subtitle="Nơi câu chuyện tình yêu được ghi lại bằng những khung hình đong đầy xúc cảm giữa thiên nhiên hùng vĩ."
      />

      {/* Founder & Stats Section */}
      <section id="about" className="about section-padding">
        <div className="container">
          <div className="founder-wrapper">
            <div className="founder-img-wrap">
              <img src="./img/founder-phong-menly.jpg" alt="Founder Tuan Hoa" className="founder-img" />
              <div className="founder-label">
                <p className="founder-tag">Founder & Art Director</p>
                <h4 className="founder-name">Tuấn Hoa</h4>
              </div>
            </div>
            
            <div className="founder-content">
              <h2 className="founder-philosophy">"Mỗi bức ảnh cưới là một tác phẩm điện ảnh độc bản tôn vinh tình yêu."</h2>
              <p className="founder-bio">
                Với hơn 10 năm kinh nghiệm trong ngành cưới nghệ thuật, Founder Tuấn Hoa cùng đội ngũ luôn hướng tới triết lý bắt trọn khoảnh khắc chân thật và lãng mạn nhất. Chúng tôi không chụp ảnh theo quy trình công nghiệp, chúng tôi ghi lại ký ức trường tồn bằng tư duy điện ảnh và sự chỉnh chu cao cấp nhất.
              </p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">10+</div>
                  <div className="stat-label">Năm Kinh Nghiệm</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">5000+</div>
                  <div className="stat-label">Cặp Đôi Hài Lòng</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">03</div>
                  <div className="stat-label">Chi Nhánh VIP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="comparison section-padding">
        <div className="container">
          <h2 className="section-title">Sự Khác Biệt Tại TUAN HOA WEDDING</h2>
          <p className="section-desc">Chúng tôi mang lại giải pháp hoàn mỹ thay thế cho các gói chụp truyền thống.</p>
          
          <div className="comp-grid">
            <div className="comp-column">
              <h3 className="comp-col-title">Studio Phổ Thông</h3>
              <ul className="comp-list">
                <li>
                  <span className="comp-icon">✕</span>
                  <span>Chụp rập khuôn tại studio dựng sẵn, không có câu chuyện riêng.</span>
                </li>
                <li>
                  <span className="comp-icon">✕</span>
                  <span>Váy cưới đại trà, hạn chế mẫu váy cao cấp hoặc phụ thu thêm tiền.</span>
                </li>
                <li>
                  <span className="comp-icon">✕</span>
                  <span>Phong cách makeup cố định, không tùy biến theo gương mặt.</span>
                </li>
                <li>
                  <span className="comp-icon">✕</span>
                  <span>Nhiều chi phí phát sinh mập mờ trong quá trình di chuyển.</span>
                </li>
              </ul>
            </div>
            
            <div className="comp-column featured">
              <h3 className="comp-col-title">Tuan Hoa Luxury System</h3>
              <ul className="comp-list">
                <li>
                  <span className="comp-icon">✓</span>
                  <span>Concept độc bản, lên kịch bản chụp riêng theo câu chuyện tình yêu.</span>
                </li>
                <li>
                  <span className="comp-icon">✓</span>
                  <span>Kho váy cưới thiết kế VIP độc quyền luôn cập nhật xu hướng mới nhất.</span>
                </li>
                <li>
                  <span className="comp-icon">✓</span>
                  <span>Trang điểm bởi các Makeup Artist danh tiếng hàng đầu Thanh Hóa.</span>
                </li>
                <li>
                  <span className="comp-icon">✓</span>
                  <span>Chi phí trọn gói rõ ràng, cam kết không phát sinh bất kỳ khoản phụ thu nào.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter II — Lộng Lẫy (Gown Detail Video Scrub) */}
      <ActScene
        id="chapter-2"
        videoSrc="./video/v3-gown.mp4"
        title="Chương II — Lộng Lẫy"
        subtitle="Mỗi cô dâu là một nàng thơ kiêu sa, tỏa sáng trong những chiếc váy cưới thiết kế độc bản."
        alignRight={true}
      />

      {/* Services Grid */}
      <section id="services" className="services program section-padding">
        <div className="container">
          <h2 className="section-title">Trải Nghiệm Dịch Vụ Đỉnh Cao</h2>
          <p className="section-desc">Hệ sinh thái dịch vụ cưới toàn diện, chuyên nghiệp phục vụ trọn vẹn mọi yêu cầu của bạn.</p>
          
          <div className="modules-grid">
            <div className="module-card">
              <div className="module-meta">
                <span className="module-code">Artistic Shooting</span>
                <span className="module-duration">Pre-wedding / Wedding Day</span>
              </div>
              <h3 className="module-title">Dịch Vụ Nhiếp Ảnh Cưới</h3>
              <p className="module-desc">Chụp ảnh Pre-Wedding tại các địa điểm hùng vĩ và phóng sự cưới giàu cảm xúc, bắt trọn từng khoảnh khắc tự nhiên.</p>
              <ul className="module-features">
                <li>Lên ý tưởng concept cá nhân hóa</li>
                <li>Hỗ trợ trang thiết bị ánh sáng điện ảnh</li>
                <li>Chỉnh sửa màu sắc nước ảnh sang trọng</li>
              </ul>
            </div>

            <div className="module-card">
              <div className="module-meta">
                <span className="module-code">Bridal Couture</span>
                <span className="module-duration">Luxury Collection</span>
              </div>
              <h3 className="module-title">Váy Cưới Thiết Kế VIP</h3>
              <p className="module-desc">Sở hữu những chiếc váy cưới lộng lẫy nhất, may đo từ chất liệu ren Pháp, pha lê Swarovski cao cấp nâng niu vóc dáng.</p>
              <ul className="module-features">
                <li>Hơn 200 mẫu váy thiết kế độc quyền</li>
                <li>Thử váy không giới hạn cùng stylist</li>
                <li>May đo theo số đo cơ thể cô dâu</li>
              </ul>
            </div>

            <div className="module-card">
              <div className="module-meta">
                <span className="module-code">Premium Makeup</span>
                <span className="module-duration">High Fashion Style</span>
              </div>
              <h3 className="module-title">Trang Điểm Cô Dâu VIP</h3>
              <p className="module-desc">Phong cách trang điểm trong suốt, mướt mịn chuẩn Hàn hoặc kiêu sa phương Tây làm tôn lên đường nét thanh tú tự nhiên.</p>
              <ul className="module-features">
                <li>Mỹ phẩm chính hãng cao cấp (Chanel, Dior)</li>
                <li>Makeup thử trước ngày cưới</li>
                <li>Chăm sóc da chuyên sâu trước trang điểm</li>
              </ul>
            </div>

            <div className="module-card">
              <div className="module-meta">
                <span className="module-code">Academy Elite</span>
                <span className="module-duration">Professional Training</span>
              </div>
              <h3 className="module-title">Học Viện Đào Tạo Chuyên Nghiệp</h3>
              <p className="module-desc">Nơi chắp cánh cho đam mê nghệ thuật. Đào tạo học viên makeup nghệ thuật và nhiếp ảnh gia cưới chuyên nghiệp hàng đầu.</p>
              <ul className="module-features">
                <li>Giáo trình thực chiến 100%</li>
                <li>Founder trực tiếp đứng lớp chỉ dạy</li>
                <li>Cấp chứng chỉ & hỗ trợ việc làm sau khóa học</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter III — Khoảnh Khắc (Steppe Video Scrub) */}
      <ActScene
        id="chapter-3"
        videoSrc="./video/v4-steppe.mp4"
        title="Chương III — Khoảnh Khắc"
        subtitle="Lưu giữ trọn vẹn những giọt nước mắt hạnh phúc, lời hẹn thề thiêng liêng ngày chung đôi."
      />

      {/* Testimonials & Proof Marquee */}
      <section id="testimonials" className="testimonials section-padding">
        <div className="container">
          <h2 className="section-title">Chia Sẻ Từ Các Cặp Đôi Hạnh Phúc</h2>
          <p className="section-desc">Hơn 5000+ cặp đôi đã trao trọn niềm tin cho Tuan Hoa Wedding và sở hữu album ký ức tuyệt vời.</p>
          
          <div className="testimonials-grid">
            <div className="test-card">
              <span className="quote-icon">“</span>
              <p className="test-body">Mình rất lo lắng vì cả hai vợ chồng đều đơ trước ống kính. Nhưng anh Tuấn Hoa và ê kíp hướng dẫn vô cùng tự nhiên. Album cưới như một bộ phim điện ảnh thực thụ!</p>
              <div className="test-author">
                <img src="./img/ivy-present.png" alt="Avatar" className="author-avatar" />
                <div className="author-info">
                  <h4>Minh Trí & Thu Thảo</h4>
                  <p>Pre-wedding tại Nha Trang</p>
                </div>
              </div>
            </div>

            <div className="test-card">
              <span className="quote-icon">“</span>
              <p className="test-body">Chiếc váy cưới dòng Royal tại showroom quá lộng lẫy, mặc lên ai cũng khen sang trọng. Makeup mướt mịn suốt cả ngày dài không hề bị mốc. Cảm ơn Tuan Hoa Wedding!</p>
              <div className="test-author">
                <img src="./img/ivy-jump.png" alt="Avatar" className="author-avatar" />
                <div className="author-info">
                  <h4>Khánh Linh</h4>
                  <p>Cô dâu ngày cưới - Showroom Vân Du</p>
                </div>
              </div>
            </div>

            <div className="test-card">
              <span className="quote-icon">“</span>
              <p className="test-body">Khóa học nhiếp ảnh tại Academy do chính anh Tuấn Hoa dạy đã thay đổi hoàn toàn tư duy làm nghề của mình. Hiện tại mình đã có thể tự lập studio riêng.</p>
              <div className="test-author">
                <img src="./img/ivy-run.png" alt="Avatar" className="author-avatar" />
                <div className="author-info">
                  <h4>Hoàng Sơn</h4>
                  <p>Cựu học viên khóa K15</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal auto-scroll proof wall */}
        <div className="proof-marquee" style={{ marginTop: '80px' }}>
          <div className="marquee-content">
            <div className="marquee-item"><span>#TuanHoaWedding</span> Tác phẩm nghệ thuật cưới</div>
            <div className="marquee-item"><span>5000+</span> Cặp đôi thành đôi trọn vẹn</div>
            <div className="marquee-item"><span>#LuxuryBridal</span> Váy cưới thiết kế độc bản</div>
            <div className="marquee-item"><span>10+</span> Năm dẫn đầu xu hướng ảnh cưới</div>
            <div className="marquee-item"><span>#TuanHoaWedding</span> Tác phẩm nghệ thuật cưới</div>
            <div className="marquee-item"><span>5000+</span> Cặp đôi thành đôi trọn vẹn</div>
            <div className="marquee-item"><span>#LuxuryBridal</span> Váy cưới thiết kế độc bản</div>
            <div className="marquee-item"><span>10+</span> Năm dẫn đầu xu hướng ảnh cưới</div>
          </div>
        </div>
      </section>

      {/* Academy & Community showcase */}
      <section className="academy-showcase section-padding">
        <div className="container">
          <div className="showcase-grid">
            <div className="showcase-content">
              <h3 className="text-gold">Học Viện Nghệ Thuật Wedding Độc Bản</h3>
              <p>
                Không chỉ là một studio chụp ảnh cưới, TUAN HOA ACADEMY là cái nôi đào tạo ra những chuyên gia makeup và nhiếp ảnh gia cưới chuyên nghiệp. Chúng tôi cung cấp các khóa học thực chiến chuyên sâu từ cơ bản đến nâng cao, cam kết vững tay nghề ngay sau khi tốt nghiệp.
              </p>
              <a href="#contact" className="btn btn-primary">Tìm Hiểu Khóa Học</a>
            </div>
            <div>
              <img src="./img/community.jpg" alt="Academy Class" className="showcase-img" />
            </div>
          </div>
        </div>
      </section>

      {/* Chapter IV — Viên Mãn (Palace Sunset Video Scrub) */}
      <ActScene
        id="chapter-4"
        videoSrc="./video/v5-temple.mp4"
        title="Chương IV — Viên Mãn"
        subtitle="Hạnh phúc tròn đầy, ký ức kết tinh thành những di sản nghệ thuật trường tồn cùng thời gian."
        alignRight={true}
      />

      {/* Pricing / Packages Section */}
      <section id="pricing" className="pricing section-padding">
        <div className="container">
          <h2 className="section-title">Bảng Giá Các Gói Cưới VIP</h2>
          <p className="section-desc">Đa dạng lựa chọn gói cưới cao cấp phù hợp với mong muốn và câu chuyện của bạn.</p>
          
          <div className="pricing-grid">
            <div className="price-card">
              <div className="price-level">Luxury Collection</div>
              <div className="price-amount">15.9Tr</div>
              <div className="price-description">Phù hợp chụp ảnh Pre-Wedding nghệ thuật ngoại cảnh nội thành Thanh Hóa.</div>
              <ul className="price-features">
                <li>01 Album cưới 30 trang cao cấp</li>
                <li>02 Váy cưới VIP ngoại cảnh</li>
                <li>Makeup trọn gói ngày chụp</li>
                <li>02 Ảnh cổng phóng lớn 60x90</li>
              </ul>
              <a href="#contact" className="btn btn-outline" style={{ marginTop: 'auto' }}>Chọn Gói Luxury</a>
            </div>

            <div className="price-card featured">
              <span className="badge-featured">Recommended</span>
              <div className="price-level">Royal Collection</div>
              <div className="price-amount">28.9Tr</div>
              <div className="price-description">Gói chụp trọn gói tối ưu bao gồm cả Pre-Wedding tại các resort/bãi biển lớn và váy cưới ngày cưới chính.</div>
              <ul className="price-features">
                <li>01 Album Royal 40 trang đặc biệt</li>
                <li>03 Váy cưới thiết kế VIP ngày chụp</li>
                <li>01 Váy cưới chính Royal ngày cưới</li>
                <li>Ekip di chuyển riêng trọn gói</li>
                <li>Makeup ngày chụp & ngày cưới</li>
              </ul>
              <a href="#contact" className="btn btn-primary" style={{ marginTop: 'auto' }}>Chọn Gói Royal</a>
            </div>

            <div className="price-card">
              <div className="price-level">Diamond Collection</div>
              <div className="price-amount">45.0Tr</div>
              <div className="price-description">Đỉnh cao xa hoa. Thiết kế concept chụp riêng biệt toàn quốc và sở hữu váy cưới may đo độc bản.</div>
              <ul className="price-features">
                <li>Album da bò cao cấp cỡ cực lớn</li>
                <li>May đo váy cưới Diamond mới 100%</li>
                <li>Art Director Tuấn Hoa trực tiếp bấm máy</li>
                <li>Ekip đi tỉnh xa (Đà Lạt/Sapa/Phú Quốc)</li>
                <li>Quay video cinematic pre-wedding</li>
              </ul>
              <a href="#contact" className="btn btn-outline" style={{ marginTop: 'auto' }}>Chọn Gói Diamond</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="faq section-padding">
        <div className="container">
          <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
          <p className="section-desc">Chúng tôi giải đáp nhanh những băn khoăn của bạn trước ngày chụp hình.</p>
          
          <div className="faq-list">
            <div className={`faq-item ${activeFaq === 0 ? 'active' : ''}`}>
              <button className="faq-question" onClick={() => setActiveFaq(activeFaq === 0 ? null : 0)}>
                <span>Q: Đi chụp ngoại cảnh có bị giới hạn thời gian hay địa điểm không?</span>
                <span className="faq-toggle">+</span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  A: Tùy thuộc vào gói dịch vụ bạn chọn. Gói Luxury sẽ giới hạn chụp trong ngày tại Thanh Hóa. Đối với gói Royal và Diamond, ê kíp sẽ đồng hành cùng bạn không giới hạn thời gian chụp trong ngày để lấy được những khoảnh khắc hoàng hôn hay bình minh đẹp nhất.
                </div>
              </div>
            </div>

            <div className={`faq-item ${activeFaq === 1 ? 'active' : ''}`}>
              <button className="faq-question" onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}>
                <span>Q: Khoảng bao lâu trước ngày cưới thì chúng mình nên đi chụp ảnh?</span>
                <span className="faq-toggle">+</span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  A: Để album cưới và các sản phẩm phóng lớn được chỉnh sửa, thiết kế in ấn hoàn hảo nhất, bạn nên đặt lịch chụp trước ngày cưới từ 1.5 đến 2 tháng.
                </div>
              </div>
            </div>

            <div className={`faq-item ${activeFaq === 2 ? 'active' : ''}`}>
              <button className="faq-question" onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}>
                <span>Q: Gói chụp đã bao gồm phương tiện di chuyển và vé vào cổng chưa?</span>
                <span className="faq-toggle">+</span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  A: Tất cả các gói cưới Royal và Diamond của Tuan Hoa Wedding đều đã bao gồm trọn gói xe di chuyển riêng cho cặp đôi cùng ê kíp và vé vào các điểm tham quan. Chúng tôi cam kết tuyệt đối không phát sinh phụ thu.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA & Contact Form */}
      <section id="contact" className="final-cta section-padding">
        <div className="container">
          <div className="final-cta-content">
            <h2 className="final-cta-title">Khởi Đầu Hành Trình Hạnh Phúc</h2>
            <p className="final-cta-desc">Để lại thông tin để đặt lịch tư vấn và nhận ngay voucher giảm giá 30% cho gói cưới Royal trong tháng này!</p>
            
            <div className="countdown">
              <div className="countdown-box">
                <div className="countdown-num">{timeLeft.days}</div>
                <div className="countdown-label">Ngày</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-num">{timeLeft.hours}</div>
                <div className="countdown-label">Giờ</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-num">{timeLeft.minutes}</div>
                <div className="countdown-label">Phút</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-num">{timeLeft.seconds}</div>
                <div className="countdown-label">Giây</div>
              </div>
            </div>

            {/* Simple Contact Form */}
            <form onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn! Thông tin đăng ký đã được gửi đi. Showroom TUAN HOA WEDDING sẽ liên hệ với bạn trong vòng 24h.'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <input type="text" placeholder="Tên của bạn..." required style={{ padding: '16px', borderRadius: '30px', border: '1px solid var(--border-dark)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }} />
              <input type="tel" placeholder="Số điện thoại liên hệ..." required style={{ padding: '16px', borderRadius: '30px', border: '1px solid var(--border-dark)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }} />
              <button type="submit" className="btn btn-primary">Đăng Ký Tư Vấn Ngay</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-about">
            <h3>TUAN HOA WEDDING</h3>
            <p>PHOTO • MAKE UP • BRIDAL • ACADEMY</p>
            <p>Kiến tạo những tác phẩm nghệ thuật cưới độc bản mang ngôn ngữ điện ảnh chân thật và đầy xúc cảm.</p>
          </div>

          <div className="footer-links">
            <h4>Hành Trình</h4>
            <ul>
              <li><a href="#problems">Nỗi Lo Cưới</a></li>
              <li><a href="#about">Về Founder</a></li>
              <li><a href="#services">Dịch Vụ</a></li>
              <li><a href="#pricing">Gói Cước VIP</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Liên Hệ Showrooms</h4>
            <ul>
              <li><strong>Hotlines:</strong> 0963 758 883 - 0965 758 883</li>
              <li><strong>Showroom 1:</strong> Phố Cát - Vân Du - Thanh Hoá (Flagship)</li>
              <li><strong>Showroom 2:</strong> 158 khu 2 - Kim Tân - Thanh Hoá (Bridal & Academy)</li>
              <li><strong>Showroom 3:</strong> TMN - Khu 2 - Vân Du - Thanh Hoá (Studio)</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 TUAN HOA WEDDING. All rights reserved. Designed for Luxury Experience.</p>
        </div>
      </footer>

      {/* Chibi Mascot Guide Ivy */}
      <div className="mascot-ivy" onClick={handleMascotClick}>
        <div className={`mascot-speech ${speechVisible ? 'visible' : ''}`}>
          {mascotText}
        </div>
        <img className="mascot-img" src={getMascotImage()} alt="Mascot Ivy" />
      </div>
    </>
  );
}

export default App;
