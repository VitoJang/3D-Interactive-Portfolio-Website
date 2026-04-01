import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import './App.css'
import { initThree, disposeThree, setModalOpen, startEnterAnimation, type MoveInput } from './three/scene'
import screenRotateIcon from './assets/screen-rotate.svg'
import gsap from 'gsap'
import githubLogo from './assets/github_logo.svg'
import linkedinLogo from './assets/linkedin_logo.svg'
import instaLogo from './assets/insta_logo.svg'

// Images
const dappa1 = '/images/DAPPA/dappa_1.png'
const dappa3 = '/images/DAPPA/dappa_3.png'
const dappaClip = '/images/DAPPA/dappaclip.png'
const dfdsystem1 = '/images/Projects/DFDSystem_1.png'
const dfdsystem2 = '/images/Projects/DFDSystem_2.png'
const nnfl1 = '/images/Projects/NNFL1.png'
const nnfl2 = '/images/Projects/NNFL2.png'
const nnfl3 = '/images/Projects/NNFL3.png'
const bf1 = '/images/Projects/bf1.png'
const bf2 = '/images/Projects/bf2.png'
const crm1 = '/images/Projects/crm1.png'
const crm2 = '/images/Projects/crm2.png'
const crm3 = '/images/Projects/crm3.png'
const folio1 = '/images/Projects/folio1.png'
const folio2 = '/images/Projects/folio2.png'
const folio3 = '/images/Projects/folio3.png'

type ModalLink = { label: string; url: string; icon?: string }

type ModalEntry = {
  title: string
  subtitle?: string
  tech?: string
  description?: React.ReactNode
  images?: string[]
  links?: ModalLink[]
}

// ── Modal Content ──
const modalContent: Record<string, ModalEntry> = {
  // ── Career Highway ──
  'DAPPA': {
    title: 'DAPPA',
    subtitle: 'Junior Frontend Developer | Hybrid | Summer Hill, Sydney\nMarch 2024 ~ May 2025',
    tech: 'React Native, TypeScript, NextJS, Xcode, Plasmo',
    description: <>
      DAPPA is a fashion-tech startup building an AI-powered <strong>Virtual Try-On (VTON)</strong> platform. I joined as a <strong>Junior Frontend Developer</strong> and contributed to the initial launch and ongoing development of the DAPPA App on iOS and Android, as well as the DAPPA Clip Chrome Extension.
      <ul className="modal-description-list">
        <li>Contributed to the launch of the DAPPA App and Chrome Extension (DAPPA Clip), accumulating over <strong>1,000 registered active users</strong> and nearly <strong>5,000 outfit generations</strong> from the AI VTON model within 4 weeks.</li>
        <li>Developed <strong>30+ Figma design screens</strong> using React Native and Redux, collaborating closely with UI/UX and implementing RESTful APIs through weekly agile sprints.</li>
        <li>Integrated <strong>Google Analytics/Tags</strong> monitoring <strong>2,000+ metrics weekly</strong> on user behaviours, providing data-driven insights to improve designs and user flows.</li>
        <li>Supported B2B efforts by developing a <strong>SaaS marketing website</strong> built within a week.</li>
      </ul>
    </>,
    images: [dappa1, dappa3, dappaClip],
    links: [
      { label: 'Instagram', url: 'https://www.instagram.com/dappa.fashion/?hl=en', icon: instaLogo },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/dappafashion/posts/?feedView=all', icon: linkedinLogo },
    ],
  },
  'Intern': {
    title: 'MarketLyfe (now known as CasePilot)',
    subtitle: 'Software Engineer Intern | Full-time | Ultimo, Sydney\nJune 2023 ~ Dec 2023',
    tech: 'Vue, JavaScript, Ionic, Firebase, PiniaJS',
    description: <>
      MarketLyfe (now known as CasePilot) was a trusted e-commerce platform that enabled sellers and businesses to list and sell products securely online, tackling scams across online marketplaces. I joined as a <strong>Software Engineer Intern</strong> working full-time on their admin web application and assisting in further developing the e-commerce platform.
      <ul className="modal-description-list">
        <li>Transitioned the e-commerce admin web application codebase from <strong>Options API</strong> to <strong>Composition API</strong> in VueJS for a more scalable architecture, and refactored old features/components.</li>
        <li>Participated in collaborative development on <strong>GitHub</strong> through extensive code reviews and engaged in system design meetings with the UI/UX team.</li>
      </ul>
    </>,
    images: [
      '/images/MarketLyfe/marketlyfe1.JPG',
      '/images/MarketLyfe/marketlyfe2.jpg'
    ],
    links: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/casepilot-ai/posts/?feedView=all', icon: linkedinLogo },
    ],
  },

  // ── Project Highway ──
  'Project_One': {
    title: 'Real Estate CRM Dashboard with ML Lead Generation',
    subtitle: 'Software Development Studio UTS (Distinction) | Mar 2024 – Apr 2024',
    tech: 'React, JavaScript, Java, Python, MongoDB, Spring Boot',
    description: <>
      Worked with a real-estate startup client company in a software studio subject, where we delivered a <strong>distinction</strong> grade project as a CRM-style MVP dashboard for real estate agents using <strong>lead handling, ML-assisted prioritisation</strong> using <strong>Random Forest/GBM models</strong>, and <strong>marketing insights</strong> shown through charts and tables.
      <ul className="modal-description-list">
        <li>Led as <strong>Team Lead</strong>, <strong>Scrum Master</strong>, and <strong>Full Stack Developer</strong>, facilitating agile sprints and client meetings to translate requirements into deliverables with Jira as the project tracking tool.</li>
        <li>Collaborated with the ML engineer to visualise lead generation results and model parameters through interactive data charts using <strong>ChartJS</strong>.</li>
        <li>Assisted in deploying our <strong>Spring Boot</strong> backend to <strong>AWS Elastic Beanstalk</strong> with <strong>MongoDB</strong> as the database.</li>
      </ul>
    </>,
    images: [crm1, crm2, crm3],
    links: [
      { label: 'GitHub', url: 'https://github.com/VitoJang/Real-Estate-ML-Lead-Generated-CRM-Dashboard', icon: githubLogo },
    ]
  },
  'Project_Two': {
    title: '3D Portfolio Website (VitoFolio)',
    subtitle: 'Personal Project | 2026',
    tech: 'React, TypeScript, Three.js, Blender, Vite',
    description: <>
      An interactive <strong>3D portfolio website</strong> called <strong>"VitoFolio"</strong>, the very site you're exploring right now! Features a controllable and animated cat character (inspired by my cat), a fully custom low-poly <strong>Blender-designed</strong> island map, and interactive clickable objects to explore more about me, my projects, and my career.
      <ul className="modal-description-list">
        <li>Built a low-poly 3D scene with <strong>Three.js</strong> and integrated character object collision physics via <strong>Octree</strong> collision, <strong>raycasting</strong> for interactable objects, smooth camera animations, and implemented WASD/Arrow keys camera-relative movement.</li>
        <li>Designed and modelled the entire island environment and character, including its walking animation, in <strong>Blender</strong>.</li>
      </ul>
    </>,
    images: [folio1, folio2, folio3],
    links: [
      { label: 'GitHub', url: 'https://github.com/VitoJang/VitoFolio', icon: githubLogo },
    ]
  },
  'Project_Three': {
    title: 'Social Media Ranking Algorithm (BirdFeed)',
    subtitle: 'Software Innovation Studio UTS (Distinction) | Sep 2024 – Oct 2024',
    tech: 'Flutter, Dart, Android Studio, Firebase',
    description: <>
      Onboarded a startup called <strong>WingMate</strong> as a Frontend Developer to create a feature called <strong>"BirdFeed"</strong>, a social media feature for bird enthusiasts that implements a <strong>ranking algorithm</strong> to match users by interest and deliver personalised feed content. Delivered a <strong>distinction</strong> graded project.
      <ul className="modal-description-list">
        <li>Contributed to translating <strong>Figma</strong> designs into functional MVP screens using <strong>Flutter</strong> and <strong>Dart</strong>.</li>
        <li>Conducted <strong>UX testing</strong> and resolved relevant bugs to improve overall user experience.</li>
      </ul>
    </>,
    images: [bf1, bf2],
  },
  'Project_Four': {
    title: 'Autonomous Navigation for Hospital Delivery Robots',
    subtitle: 'Neural Network and Fuzzy Logic UTS | March 2026 – Current',
    tech: 'Python, PyTorch',
    description: <>
      An undergoing project aimed to train an autonomous navigation system for hospital delivery robots under a <strong>2D simulation</strong> environment alongside a simulated <strong>LiDAR sensors</strong>.
      <ul className="modal-description-list">
        <li>Train a <strong>Mixture-of-Experts (MoE)</strong> architecture model using <strong>imitation learning</strong> for an accurate autonomous navigation performance.</li>
        <li>Create complex 2D simulation environments with random obstacles and <strong>two expert policies</strong> (one for navigating around obstacles and one for navigating to the goal), where they are then used to train the <strong>MoE model</strong>.</li>
      </ul>
    </>,
    images: [nnfl1, nnfl3, nnfl2],
    // links: [
    //   { label: 'GitHub', url: '#', icon: githubLogo },
    // ]
  },
  'Project_Five': {
    title: 'CNN Driver Fatigue Detection System',
    subtitle: 'Engineering Capstone UTS | Mar 2026 – Current',
    tech: 'Python, MobileNetV2, TensorFlow',
    description: <>
      An engineering capstone project aimed to design and evaluate <strong>deep learning (CNN)</strong> and <strong>computer vision</strong> techniques <strong>(Mediapipe Face Mesh)</strong> to detect fatigue and drowsiness in drivers with high accuracy and real-time performance, after exploring and identifying gaps in existing research.
      <ul className="modal-description-list">
        <li>Trained a <strong>MobileNetV2</strong>-based CNN model using <strong>TensorFlow</strong> for real-time drowsiness classification.</li>
        <li>Used <strong>Mediapipe Face Mesh</strong> to extract facial landmarks and calculate both the <strong>mouth aspect ratio (MAR)</strong> and <strong>eye aspect ratio (EAR)</strong> to detect drowsiness.</li>
        <li>Implemented a hybrid model architecture with a <strong>CNN</strong> and <strong>LSTM</strong> to detect fatigue and drowsiness in drivers.</li>
        <li>Utilised <strong>scikit-learn</strong> to evaluate metrics (<strong>confusion matrix, accuracy, precision, recall, F1 score, and area under the ROC curve</strong>) and real-time model performance evaluation (<strong>FPS, latency, and accuracy</strong>) through <strong>OpenCV</strong>.</li>
      </ul>
    </>,
    images: [dfdsystem1, dfdsystem2],
    // links: [
    //   { label: 'GitHub', url: '#', icon: githubLogo },
    // ]
  },

  // ── About Me Street ──
  'Board_Games': {
    title: 'Board Games',
    description: 'I believe board/card games or games night are one of the best ways to spend time with your family and friends (with the sole exception of sports, of course), that being said, some of my favourites are the yearly Monopoly sessions and weekly Poker nights!',
    images: [
      '/images/AboutMe/games1.jpg',
      '/images/AboutMe/games2.jpg',
      '/images/AboutMe/games3.jpg',
      '/images/AboutMe/games4.jpg',
      '/images/AboutMe/games5.jpg',
      '/images/AboutMe/games6.jpg',
      '/images/AboutMe/games7.jpg'
    ],
  },
  'Cat': {
    title: 'Cat',
    description: 'As you can tell... I love cats. I have a 9 year old female Calico "Pumpkin", and our recently adopted 3 year old male Ragdoll "Mandu" (guess which one is my favourite).',
    images: [
      '/images/AboutMe/cat1.jpg',
      '/images/AboutMe/cat2.jpg',
      '/images/AboutMe/cat3.jpg',
      '/images/AboutMe/cat6.jpg',
      '/images/AboutMe/cat4.jpg',
      '/images/AboutMe/cat5.jpg',
      '/images/AboutMe/cat7.jpg'
    ],
  },
  'Sports': {
    title: 'Sports',
    description: 'Outside of my room, you will see me playing all sorts of sports and phyiscal activities. Soccer, badminton, pickleball, oztag, snowboarding, pickleball, golf, these are just some of the sports I play throughout the year. My favourite at the moment is tennis, a sport I recently picked up and have been getting humbled on.',
    images: [
      '/images/AboutMe/sports1.jpg',
      '/images/AboutMe/sports2.jpg',
      '/images/AboutMe/sports3.jpg',
      '/images/AboutMe/sports4.jpg',
      '/images/AboutMe/sports5.jpg',
      '/images/AboutMe/sports6.jpg',
      '/images/AboutMe/sports7.JPG',
      '/images/AboutMe/sports8.jpg'
    ],
  },
  'Travel': {
    title: 'Travel',
    description: 'Like every other gen-z out there, I love to travelling and exploring new places, cultures, and most importantly, food!',
    images: [
      '/images/AboutMe/travel1.jpg',
      '/images/AboutMe/travel2.jpg',
      '/images/AboutMe/travel3.JPG',
      '/images/AboutMe/travel4.jpg',
      '/images/AboutMe/travel5.jpg',
      '/images/AboutMe/travel6.jpg',
      '/images/AboutMe/travel7.jpg',
      '/images/AboutMe/travel8.jpg',
      '/images/AboutMe/travel9.JPG',
      '/images/AboutMe/travel10.jpg',
      '/images/AboutMe/travel11.jpg',
      '/images/AboutMe/travel12.jpg'
    ],
  },
  'TV': {
    title: 'TV',
    description: 'Vidoe games have always been a part of life since I was a kid, and will continue to do so. I started from Kart Rider and Minecraft, and have been playing a variety of games since then. As of today, I am playing Teamfight Tactics (TFT) and Spiderman 2.',
    images: [
      '/images/AboutMe/video_games1.jpg',
      '/images/AboutMe/video_games2.jpg',
      '/images/AboutMe/video_games3.jpg',
      '/images/AboutMe/video_games4.jpg',
    ],
  },
  'UTS': {
    title: 'University of Technology Sydney',
    subtitle: 'Bachelor of Software Engineering (Honours) | Feb 2022 – May 2026',
    description:
      <>
        <p>
          I am a <strong>final year Software Engineering student</strong> at the University of Technology Sydney, with a focus on full-stack development, machine learning, and software project management. Currently have a <strong>Distinction average WAM of 79.41</strong> (GPA of 6.07).
        </p>
        <ul className="modal-description-list">
          <li className="modal-description-role">
            <div className="modal-ssa-title-row">
              <strong>UTS Social Sports Association (SSA)</strong>
              <a
                className="modal-ssa-insta-link"
                href="https://www.instagram.com/ssa_uts/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <img src={instaLogo} alt="" className="modal-ssa-insta-icon" />
                @ssa_uts
              </a>
            </div>
            <div className="modal-ssa-role-line">
              <strong>External Vice President</strong>
              {' · '}
              Jan 2023 – Jan 2025
              {' | '}
              <strong>Club Advisor</strong>
              {' · '}
              Jan 2025 – 2026
            </div>
          </li>
          <li>
            Initiated, negotiated, and <strong>secured sponsorships</strong> with key partners including <strong>Domino&apos;s (Pyrmont/CBD)</strong>, <strong>SupplyBase</strong>, <strong>Skillry</strong>, <strong>Aptus Sport</strong>, <strong>SportAll</strong>, and <strong>RedBull Australia</strong>.
          </li>
          <li>
            Grew SSA&apos;s community to over <strong>600 members</strong> by organising inclusive social sporting events <strong>throughout my 2-year tenure</strong>.
          </li>
          <li>
            <strong>Nominated</strong> for <strong>SSA&apos;s Club Person of the Year 2024</strong>.
          </li>
          <li>
            Established and <strong>organised SSA&apos;s sub-committee</strong> and facilitated a smooth transition of roles during the <strong>Annual General Meeting (AGM)</strong> for the year <strong>2025</strong>.
          </li>
          <li>
            <strong>Nominated</strong> for <strong>SSA&apos;s Club Advisor</strong> for <strong>2025</strong>.
          </li>
        </ul>
      </>,
    images: [
      '/images/UTS/ssa1.jpg',
      '/images/UTS/ssa2.JPEG',
      '/images/UTS/ssa3.jpg',
      '/images/UTS/ssa4.jpg',
      '/images/UTS/ssa5.JPG',
      '/images/UTS/ssa6.JPG',
      '/images/UTS/ssa7.JPG',
      '/images/UTS/ssa8.JPG'
    ],
  },
}

const aboutMeTitleKeys = new Set(['TV', 'Sports', 'Travel', 'Cat', 'Board_Games'])
/** Modals that use the horizontal image belt (About Me + UTS SSA photos) */
const beltGalleryModalKeys = new Set([...aboutMeTitleKeys, 'UTS'])

function ImageLightboxContent({
  src,
  onImgClick,
}: {
  src: string
  onImgClick: (e: MouseEvent<HTMLImageElement>) => void
}) {
  const [ready, setReady] = useState(false)
  return (
    <>
      {!ready && (
        <div className="image-lightbox-loading" aria-live="polite">
          <span className="image-lightbox-spinner" aria-hidden="true" />
          <span className="image-lightbox-loading-text">Loading image…</span>
        </div>
      )}
      <img
        src={src}
        alt=""
        className={`image-lightbox-image${ready ? ' image-lightbox-image--visible' : ''}`}
        onClick={onImgClick}
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
      />
    </>
  )
}

function ModalImageButton({
  src,
  onOpen,
  buttonClassName = '',
  imgClassName = 'modal-image',
  tabIndex,
}: {
  src: string
  onOpen: (src: string) => void
  buttonClassName?: string
  imgClassName?: string
  tabIndex?: number
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <button
      type="button"
      className={`modal-image-button ${buttonClassName} ${loaded ? 'modal-image-button--loaded' : ''}`.trim()}
      onClick={() => onOpen(src)}
      {...(tabIndex !== undefined ? { tabIndex } : {})}
      aria-label="Open image preview"
    >
      <span className="modal-image-loading-skeleton" aria-hidden="true" />
      <img
        src={src}
        alt=""
        className={`${imgClassName} modal-image-with-loader`.trim()}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </button>
  )
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const moveInputRef = useRef<MoveInput>({ x: 0, y: 0 })
  const aboutMeBeltViewportRef = useRef<HTMLDivElement | null>(null)
  const aboutMeBeltTrackRef = useRef<HTMLDivElement | null>(null)
  const aboutMeBeltFirstSetRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [worldLoadProgress, setWorldLoadProgress] = useState(0)
  const [entered, setEntered] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [pointerCursor, setPointerCursor] = useState(false)
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })


  // Check if the device is a mobile device using touch input
  const isMobileOS =
    typeof window !== 'undefined' &&
    (('ontouchstart' in window) ||
      (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 0)

  // Block portrait on phones to give users a better experience
  const [showRotateHint, setShowRotateHint] = useState(() => {
    if (!isMobileOS || typeof window === 'undefined') return false
    const isPortrait = window.innerHeight >= window.innerWidth
    const isPhoneSized = window.innerWidth < 768
    return isPortrait && isPhoneSized
  })

  const beltGalleryImages = useMemo(() => {
    if (!activeModal || !beltGalleryModalKeys.has(activeModal)) return []
    return modalContent[activeModal]?.images ?? []
  }, [activeModal])

  const realGltfProgressRef = useRef(0)
  const worldLoadTickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update the rotate hint based on the window size
  useEffect(() => {
    if (!isMobileOS) return
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const isPortrait = window.innerHeight >= window.innerWidth
      const isPhoneSized = window.innerWidth < 768
      setShowRotateHint(isPortrait && isPhoneSized)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize as EventListener)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize as EventListener)
    }
  }, [isMobileOS])

  // Update the world load progress based on the GLTF download progress
  useEffect(() => {
    if (!loading) return

    const start = performance.now()
    realGltfProgressRef.current = 0

    const tick = () => {
      const elapsedSec = (performance.now() - start) / 1000
      const k = 0.18
      const asymptotic = 0.99 * (1 - Math.exp(-elapsedSec * k))
      const fromNetwork = Math.min(0.99, realGltfProgressRef.current * 0.99)
      const next = Math.min(0.99, Math.max(asymptotic, fromNetwork, 0.03))
      setWorldLoadProgress(next)
    }

    tick()
    worldLoadTickRef.current = window.setInterval(tick, 80)

    return () => {
      if (worldLoadTickRef.current !== null) {
        clearInterval(worldLoadTickRef.current)
        worldLoadTickRef.current = null
      }
    }
  }, [loading])

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return

    const cleanup = initThree({
      canvas: canvasRef.current,
      onLoadProgress: (ratio) => {
        realGltfProgressRef.current = Math.max(realGltfProgressRef.current, ratio)
      },
      onLoaded: () => {
        if (worldLoadTickRef.current !== null) {
          clearInterval(worldLoadTickRef.current)
          worldLoadTickRef.current = null
        }
        setWorldLoadProgress(1)
        window.setTimeout(() => setLoading(false), 420)
      },
      onHotspotClick: (id) => setActiveModal(id),
      onCursorChange: (isPointer) => setPointerCursor(isPointer),
      getMoveInput: isMobileOS ? () => moveInputRef.current : undefined,
    })

    return () => {
      cleanup()
      disposeThree()
    }
  }, [isMobileOS])

  const handleEnter = useCallback(() => {
    setEntered(true)
    startEnterAnimation()
  }, [])
  const handleCloseModal = useCallback(() => {
    setActiveModal(null)
    setActiveImage(null)
    setModalOpen(false)
  }, [])
  const handleCloseImage = useCallback(() => {
    setActiveImage(null)
  }, [])

  useEffect(() => {
    if (activeModal) setModalOpen(true)
  }, [activeModal])

  useEffect(() => {
    if (!activeImage) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveImage(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeImage])

  useLayoutEffect(() => {
    if (!activeModal || !beltGalleryModalKeys.has(activeModal)) return
    if (beltGalleryImages.length === 0) return
    if (!aboutMeBeltViewportRef.current || !aboutMeBeltTrackRef.current || !aboutMeBeltFirstSetRef.current) return

    const viewportEl = aboutMeBeltViewportRef.current
    const trackEl = aboutMeBeltTrackRef.current
    const firstSetEl = aboutMeBeltFirstSetRef.current

    const basePixelsPerSecond = 70

    const beltTweenRef: { current: gsap.core.Tween | null } = { current: null }

    const createTween = () => {
      const firstSetWidth = firstSetEl.getBoundingClientRect().width
      if (firstSetWidth <= 0) return

      const trackStyles = window.getComputedStyle(trackEl)
      const rawGap = trackStyles.columnGap || trackStyles.gap || '0px'
      const trackGap = Number.parseFloat(rawGap) || 0
      const loopWidth = firstSetWidth + trackGap

      beltTweenRef.current?.kill()
      gsap.set(trackEl, { x: 0 })

      const duration = loopWidth / basePixelsPerSecond
      beltTweenRef.current = gsap.to(trackEl, {
        x: `-=${loopWidth}`,
        duration,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: (x) => `${gsap.utils.wrap(-loopWidth, 0, parseFloat(x))}px`,
        },
      })
    }

    createTween()

    let stopTimer: number | null = null
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()

      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
      if (delta === 0) return

      const dir = delta > 0 ? 1 : -1
      const boostedScale = Math.min(4.5, 1 + Math.abs(delta) / 180)

      const tween = beltTweenRef.current
      if (!tween) return
      tween.timeScale(dir * boostedScale)

      if (stopTimer !== null) window.clearTimeout(stopTimer)
      stopTimer = window.setTimeout(() => {
        const t = beltTweenRef.current
        if (!t) return
        gsap.to(t, { timeScale: 1, duration: 0.6, ease: 'power2.out' })
      }, 140)
    }

    const resizeObserver = new ResizeObserver(() => {
      createTween()
    })
    resizeObserver.observe(firstSetEl)

    viewportEl.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      viewportEl.removeEventListener('wheel', handleWheel)
      resizeObserver.disconnect()
      if (stopTimer !== null) window.clearTimeout(stopTimer)
      beltTweenRef.current?.kill()
    }
  }, [activeModal, beltGalleryImages])

  return (
    <>
      {/* Full-viewport Three.js canvas */}
      <div id="experience">
        <canvas
          ref={canvasRef}
          id="experience-canvas"
          style={{ cursor: pointerCursor ? 'pointer' : 'default' }}
        />
      </div>

      {/* Rotate device hint for users holding portrait mode */}
      {showRotateHint && (
        <div className="rotate-hint-overlay">
          <div className="rotate-hint-card">
            <img src={screenRotateIcon} alt="" className="rotate-hint-icon" />
            <p className="rotate-hint-text">
              For the best view of the island and overall experience, rotate your phone to landscape.
            </p>
          </div>
        </div>
      )}

      {/* Loading / enter screen */}
      <div className={`loading-screen${entered ? ' fade-out' : ''}`}>
        {loading ? (
          <div className="loading-screen-content">
            <p className="loading-text">Loading world…</p>
            <div
              className="loading-progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(worldLoadProgress * 100)}
              aria-label="World loading progress"
            >
              <div
                className="loading-progress-fill"
                style={
                  {
                    '--load-pct': `${Math.max(2, worldLoadProgress * 100)}%`,
                  } as CSSProperties
                }
              />
            </div>
          </div>
        ) : !entered ? (
          <button className="enter-button" type="button" onClick={handleEnter}>
            Enter World!
          </button>
        ) : null}
        {!entered && (
          <div className="instructions">~ use WASD or arrow keys to move ~</div>
        )}
      </div>

      {/* Mobile joystick */}
      {entered && isMobileOS && (
        <div
          className="joystick-container"
          onTouchStart={(e) => {
            const touch = e.touches[0]
            if (!touch) return
            const target = e.currentTarget
            const rect = target.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = touch.clientX - cx
            const dy = touch.clientY - cy
            const radius = rect.width / 2
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            const clamped = Math.min(len, radius)
            const nx = (dx / len) * (clamped / radius)
            const ny = (dy / len) * (clamped / radius)
            moveInputRef.current = { x: nx, y: -ny }
            setJoystickPos({ x: nx, y: ny })
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0]
            if (!touch) return
            const target = e.currentTarget
            const rect = target.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = touch.clientX - cx
            const dy = touch.clientY - cy
            const radius = rect.width / 2
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            const clamped = Math.min(len, radius)
            const nx = (dx / len) * (clamped / radius)
            const ny = (dy / len) * (clamped / radius)
            moveInputRef.current = { x: nx, y: -ny }
            setJoystickPos({ x: nx, y: ny })
          }}
          onTouchEnd={() => {
            moveInputRef.current = { x: 0, y: 0 }
            setJoystickPos({ x: 0, y: 0 })
          }}
          onTouchCancel={() => {
            moveInputRef.current = { x: 0, y: 0 }
            setJoystickPos({ x: 0, y: 0 })
          }}
        >
          <div className="joystick-base">
            <div
              className="joystick-knob"
              style={{
                transform: `translate(${joystickPos.x * 32}px, ${joystickPos.y * 32}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Modal for interactive objects */}
      {activeModal && modalContent[activeModal] && (
        <div
          className="modal-container"
          onClick={(e) => e.nativeEvent.stopImmediatePropagation()}
        >
          <div className="modal-bg-overlay" onClick={handleCloseModal} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-wrapper">
              <div className="modal-header">
                <div>
                  <h1 className="modal-title">
                    {aboutMeTitleKeys.has(activeModal) ? 'About me' : modalContent[activeModal].title}
                  </h1>
                  {modalContent[activeModal].subtitle && (
                    <p className="modal-subtitle">
                      {modalContent[activeModal].subtitle!.split('\n').map((line, i) => (
                        <span key={i}>{line}{i === 0 && <br />}</span>
                      ))}
                    </p>
                  )}
                </div>
                <button
                  className="modal-exit-button"
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Close"
                >
                  &#x2715;
                </button>
              </div>
              {(modalContent[activeModal].tech || modalContent[activeModal].links) && (
                <div className="modal-tech-row">
                  {modalContent[activeModal].tech && (
                    <div className="modal-tech">{modalContent[activeModal].tech}</div>
                  )}
                  {modalContent[activeModal].links && modalContent[activeModal].links!.length > 0 && (
                    <div className="modal-links">
                      {modalContent[activeModal].links!.map((link, i) => (
                        <a
                          key={i}
                          className="modal-link-button"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.icon && <img src={link.icon} alt="" className="modal-link-icon" />}
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="modal-content-wrapper">
                {modalContent[activeModal].description && (
                  <div className="modal-project-description">
                    {modalContent[activeModal].description}
                  </div>
                )}

                {modalContent[activeModal].images && modalContent[activeModal].images!.length > 0 && (
                  beltGalleryModalKeys.has(activeModal) ? (
                    <div className="modal-image-gallery-aboutme-belt" ref={aboutMeBeltViewportRef}>
                      <div className="modal-image-gallery-aboutme-belt-track" ref={aboutMeBeltTrackRef}>
                        <div className="modal-image-gallery-aboutme-belt-set" ref={aboutMeBeltFirstSetRef}>
                          {beltGalleryImages.map((src, i) => (
                            <ModalImageButton
                              key={`belt-primary-${src}-${i}`}
                              src={src}
                              onOpen={setActiveImage}
                              buttonClassName="modal-image-button-aboutme"
                              imgClassName="modal-image"
                            />
                          ))}
                        </div>

                        <div className="modal-image-gallery-aboutme-belt-set" aria-hidden="true">
                          {beltGalleryImages.map((src, i) => (
                            <ModalImageButton
                              key={`belt-clone-${src}-${i}`}
                              src={src}
                              onOpen={setActiveImage}
                              buttonClassName="modal-image-button-aboutme"
                              imgClassName="modal-image"
                              tabIndex={-1}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="modal-image-gallery">
                      {modalContent[activeModal].images!.map((src, i) => (
                        <ModalImageButton
                          key={i}
                          src={src}
                          onOpen={setActiveImage}
                        />
                      ))}
                    </div>
                  )
                )}
                {modalContent[activeModal].images && modalContent[activeModal].images!.length === 0 && (
                  <div className="modal-image-placeholder">Images coming soon</div>
                )}

              </div>
            </div>
          </div>
          {activeImage && (
            <div className="image-lightbox" onClick={handleCloseImage}>
              <button
                type="button"
                className="image-lightbox-close"
                onClick={handleCloseImage}
                aria-label="Close image preview"
              >
                &#x2715;
              </button>
              <ImageLightboxContent
                key={activeImage}
                src={activeImage}
                onImgClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default App
