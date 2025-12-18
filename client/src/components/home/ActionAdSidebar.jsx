import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, ShieldCheck, ArrowRight, Heart, ThumbsUp, Activity } from 'lucide-react';
import Button from '../common/Button';

/**
 * Report Issue Call-to-Action Ad
 * Encourages users to report new issues
 */
export const ReportIssueAd = () => (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white shadow-lg overflow-hidden relative animate-shimmer group hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Plus size={80} className="animate-float" />
        </div>
        <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                Spot a problem?
            </h3>
            <p className="text-primary-100 text-sm mb-4 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
                Be the change in your community. Report issues like potholes, garbage, or streetlights in seconds.
            </p>
            <Link to="/report">
                <Button className="w-full bg-white text-primary-600 hover:bg-primary-50 border-none shadow-md hover:shadow-lg transition-all">
                    Report Issue Now
                </Button>
            </Link>
        </div>
    </div>
);

/**
 * Trending Issues Ad
 * Shows what's happening nearby
 */
export const TrendingAd = () => (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 shadow-sm hover:border-dark-500 transition-colors group">
        <div className="flex items-center gap-2 mb-3 text-amber-500">
            <div className="relative">
                <TrendingUp size={20} className="relative z-10" />
                <div className="absolute inset-0 bg-amber-500/30 blur-md rounded-full animate-pulse-glow"></div>
            </div>
            <h3 className="font-semibold text-white">Trending Nearby</h3>
            <span className="ml-auto flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
        </div>
        <div className="space-y-3">
            {[
                { loc: "Gandhi Nagar", count: 12 },
                { loc: "Civil Lines", count: 8 },
                { loc: "Market Area", count: 5 }
            ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm group-hover:translate-x-1 transition-transform" style={{ transitionDelay: `${i * 50}ms` }}>
                    <span className="text-dark-200">📍 {item.loc}</span>
                    <span className="text-primary-400 font-medium">{item.count} active</span>
                </div>
            ))}
        </div>
        <Link to="/map" className="mt-4 text-xs text-dark-400 hover:text-white transition-colors flex items-center justify-center gap-1 group-hover:text-primary-400">
            View Live Heatmap <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </Link>
    </div>
);

/**
 * Trust & Impact Ad
 * Builds confidence in the platform
 */
export const TrustAd = () => (
    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-5 hover:bg-emerald-900/20 transition-colors duration-500">
        <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 text-emerald-400 relative">
                <ShieldCheck size={24} className="relative z-10" />
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-20"></div>
            </div>
            <h3 className="font-bold text-white mb-1">Your Voice Matters</h3>
            <p className="text-dark-300 text-xs mb-3">
                <span className="text-emerald-400 font-bold">1,240+</span> issues resolved this month by citizens like you.
            </p>
        </div>
    </div>
);

/**
 * Success Story Ad (Before/After)
 * Proves the system works
 */
export const SuccessStoryAd = () => {
    const [showAfter, setShowAfter] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowAfter(prev => !prev);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden group cursor-pointer hover:border-dark-600 transition-colors shadow-lg hover:shadow-emerald-900/10">
            <div className="relative h-40 bg-dark-900 overflow-hidden">
                {/* Before Image Placeholder */}
                <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex flex-col items-center justify-center bg-gradient-to-br from-red-900/40 to-dark-900 ${showAfter ? 'opacity-0' : 'opacity-100'}`}>
                    <Activity size={48} className="text-red-500/50 mb-2" />
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded border border-red-500/30 backdrop-blur-sm">
                        BEFORE
                    </span>
                    <p className="text-dark-400 text-[10px] mt-2">Broken Drainage</p>
                </div>

                {/* After Image Placeholder */}
                <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/40 to-dark-900 ${showAfter ? 'opacity-100' : 'opacity-0'}`}>
                    <ShieldCheck size={48} className="text-emerald-500/50 mb-2" />
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded border border-emerald-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        AFTER
                    </span>
                    <p className="text-emerald-400/70 text-[10px] mt-2">Fixed in 48h</p>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-dark-700">
                    <div
                        className={`h-full bg-emerald-500 transition-all duration-[3000ms] ease-linear ${showAfter ? 'w-full' : 'w-0'}`}
                    ></div>
                </div>
            </div>

            <div className="p-3 bg-dark-800/80 backdrop-blur">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span>Success Story of the Week</span>
                </div>
                <h4 className="text-white text-sm font-medium leading-tight">
                    "This road was fixed within 2 days of reporting!"
                </h4>
            </div>
        </div>
    );
};

// ... existing SupportAd code or export structure remains


/**
 * Support Issue Ad
 * Encourages engagement (upvoting)
 */
export const SupportAd = () => (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-1 relative overflow-hidden">
        <div className="p-4">
            <div className="text-xs font-bold text-primary-400 tracking-wider uppercase mb-2">
                Needs Support
            </div>
            <h4 className="text-white font-medium mb-2 line-clamp-2">
                Road requires urgent repair near Public School
            </h4>
            <div className="flex items-center gap-4 text-xs text-dark-300 mb-3">
                <span className="flex items-center gap-1">
                    <ThumbsUp size={12} /> 24 supporters
                </span>
                <span>•</span>
                <span>2h ago</span>
            </div>
            <Button size="sm" variant="outline" className="w-full">
                Support This Issue
            </Button>
        </div>
    </div>
);

/**
 * Main Sidebar Container
 */
const ActionAdSidebar = () => {
    return (
        <div className="space-y-4 w-[300px] sticky top-4">
            <ReportIssueAd />
            <TrendingAd />
            <TrustAd />
            <SuccessStoryAd />
            {/* <SupportAd /> */}

            <div className="text-center pt-4">
                <p className="text-[10px] text-dark-500">
                    © 2024 NagarSathi. Making cities better together.
                </p>
            </div>
        </div>
    );
};

export default ActionAdSidebar;
