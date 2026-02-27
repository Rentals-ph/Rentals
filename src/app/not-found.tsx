'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NotFound() {
    const router = useRouter()
    const [countdown, setCountdown] = useState(5)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (countdown === 0) {
            if (window.history.length > 1) {
                router.back()
            } else {
                router.push('/')
            }
            return
        }
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown, router])

    const handleGoBack = () => {
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push('/')
        }
    }

    const progress = ((5 - countdown) / 5) * 100
    const circumference = 2 * Math.PI * 36

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500;600&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .nf-root {
                    min-height: 100vh;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: 'DM Sans', sans-serif;
                    position: relative;
                    overflow: hidden;
                    padding: 24px;
                }

                /* Grid background */
                .nf-root::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px);
                    background-size: 48px 48px;
                    pointer-events: none;
                }

                /* Orange glow bottom-left */
                .blob-orange {
                    position: absolute;
                    bottom: -160px;
                    left: -120px;
                    width: 520px;
                    height: 520px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(246,140,30,0.12) 0%, transparent 65%);
                    pointer-events: none;
                }

                /* Blue glow top-right */
                .blob-blue {
                    position: absolute;
                    top: -140px;
                    right: -100px;
                    width: 480px;
                    height: 480px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(32,94,215,0.10) 0%, transparent 65%);
                    pointer-events: none;
                }

                .nf-card {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    max-width: 520px;
                    background: #ffffff;
                    border: 1px solid rgba(0,0,0,0.07);
                    border-radius: 28px;
                    padding: 52px 48px 44px;
                    text-align: center;
                    box-shadow:
                        0 8px 40px rgba(32,94,215,0.08),
                        0 1px 3px rgba(0,0,0,0.05);
                    opacity: 0;
                    transform: translateY(24px);
                    animation: cardIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards;
                }

                @keyframes cardIn {
                    to { opacity: 1; transform: translateY(0); }
                }

                /* House icon + 404 */
                .nf-hero {
                    position: relative;
                    margin-bottom: 28px;
                }

                .nf-404 {
                    font-family: 'Syne', sans-serif;
                    font-size: 110px;
                    font-weight: 800;
                    line-height: 1;
                    letter-spacing: -6px;
                    background: linear-gradient(135deg, #f68c1e 0%, #f8aa50 40%, #205ED7 80%, #5B8EEE 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    position: relative;
                }

                /* Decorative door on the zero */
                .nf-404-sub {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    color: rgba(0,0,0,0.30);
                    margin-top: -4px;
                    margin-bottom: 0;
                }

                .divider-line {
                    width: 48px;
                    height: 2px;
                    background: linear-gradient(90deg, #f68c1e, #205ED7);
                    border-radius: 2px;
                    margin: 20px auto;
                }

                .nf-logo {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 20px;
                }

                .nf-heading {
                    font-family: 'Syne', sans-serif;
                    font-size: 22px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 10px;
                    letter-spacing: -0.3px;
                }

                .nf-desc {
                    font-size: 14.5px;
                    color: #6b7280;
                    line-height: 1.75;
                    margin-bottom: 32px;
                }

                /* Countdown */
                .nf-timer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    background: #f8faff;
                    border: 1px solid rgba(32,94,215,0.10);
                    border-radius: 16px;
                    padding: 16px 20px;
                    margin-bottom: 28px;
                }

                .nf-timer-ring {
                    flex-shrink: 0;
                }

                .nf-timer-text {
                    text-align: left;
                }

                .nf-timer-text strong {
                    display: block;
                    font-family: 'Syne', sans-serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 2px;
                }

                .nf-timer-text span {
                    font-size: 12.5px;
                    color: #9ca3af;
                }

                /* Actions */
                .nf-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .btn-primary {
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #f68c1e 0%, #e07a0a 100%);
                    color: #fff;
                    border-radius: 12px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14.5px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
                    box-shadow: 0 4px 20px rgba(246,140,30,0.35);
                    letter-spacing: 0.01em;
                }
                .btn-primary:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 28px rgba(246,140,30,0.45);
                }
                .btn-primary:active {
                    transform: translateY(0);
                }

                .btn-ghost {
                    display: block;
                    width: 100%;
                    padding: 14px 24px;
                    background: transparent;
                    color: #205ED7;
                    border-radius: 12px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14.5px;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1.5px solid rgba(32,94,215,0.5);
                    text-decoration: none;
                    transition: background 0.2s, border-color 0.2s, color 0.2s;
                    letter-spacing: 0.01em;
                }
                .btn-ghost:hover {
                    background: rgba(32,94,215,0.10);
                    border-color: #205ED7;
                    color: #5B8EEE;
                }

                /* Floating house deco */
                .deco-house {
                    position: absolute;
                    opacity: 0.06;
                    pointer-events: none;
                    animation: float 6s ease-in-out infinite;
                }
                .deco-house-1 {
                    top: 8%;
                    left: 4%;
                    font-size: 100px;
                    animation-delay: 0s;
                }
                .deco-house-2 {
                    bottom: 10%;
                    right: 5%;
                    font-size: 72px;
                    animation-delay: -3s;
                }
                .deco-house-3 {
                    top: 40%;
                    left: 1%;
                    font-size: 48px;
                    animation-delay: -1.5s;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-14px); }
                }

                /* Progress arc animation */
                .arc-progress {
                    transition: stroke-dashoffset 1s linear;
                }

                @media (max-width: 480px) {
                    .nf-card { padding: 40px 28px 36px; }
                    .nf-404 { font-size: 88px; letter-spacing: -4px; }
                }
            `}</style>

            <div className="nf-root">
                <div className="blob-orange" />
                <div className="blob-blue" />

                {/* Floating decorative houses */}
                <div className="deco-house deco-house-1">🏠</div>
                <div className="deco-house deco-house-2">🏡</div>
                <div className="deco-house deco-house-3">🏘</div>

                <div className="nf-card">
                    {/* Logo */}
                    <div className="nf-logo">
                        <Image
                            src="/assets/logos/rentals-logo-hero-13c7b5.png"
                            alt="Rentals.ph"
                            width={200}
                            height={60}
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>

                    {/* 404 hero */}
                    <div className="nf-hero">
                        <div className="nf-404">404</div>
                        <p className="nf-404-sub">Error · Not Found</p>
                    </div>

                    <div className="divider-line" />

                    <h1 className="nf-heading">This property doesn't exist</h1>
                    <p className="nf-desc">
                        The page you're looking for may have been moved,<br />
                        deleted, or never existed. Let's get you home.
                    </p>

                    {/* Countdown timer */}
                    <div className="nf-timer">
                        <div className="nf-timer-ring">
                            <svg width="52" height="52" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="5" />
                                <circle
                                    className="arc-progress"
                                    cx="40" cy="40" r="36"
                                    fill="none"
                                    stroke="url(#arcGrad)"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${circumference}`}
                                    strokeDashoffset={`${circumference * (1 - progress / 100)}`}
                                    transform="rotate(-90 40 40)"
                                />
                                <defs>
                                    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#f68c1e" />
                                        <stop offset="100%" stopColor="#205ED7" />
                                    </linearGradient>
                                </defs>
                                <text x="40" y="40" textAnchor="middle" dominantBaseline="central" fill="#111827" fontSize="22" fontWeight="700" fontFamily="Syne, sans-serif">
                                    {countdown}
                                </text>
                            </svg>
                        </div>
                        <div className="nf-timer-text">
                            <strong>Redirecting soon</strong>
                            <span>Going back in {countdown} second{countdown !== 1 ? 's' : ''}…</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="nf-actions">
                        <button onClick={handleGoBack} className="btn-primary">
                            ← Go Back Now
                        </button>
                        <Link href="/" className="btn-ghost">
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}