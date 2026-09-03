'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, FileDigit, Activity } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { WalletConnectButton } from '@/components/auth/WalletConnectButton';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function Home() {
  const features = [
    { icon: <Shield className="w-8 h-8 text-primary" />, title: 'Zero-Trust Architecture', desc: 'Default-deny security model backed by on-chain policies.' },
    { icon: <Lock className="w-8 h-8 text-primary" />, title: 'Decentralized Identity', desc: 'Cryptographically secure DIDs mapped to organizational roles.' },
    { icon: <FileDigit className="w-8 h-8 text-primary" />, title: 'Asset Tokenization', desc: 'Secure digital assets bound by dynamic smart contract logic.' },
    { icon: <Activity className="w-8 h-8 text-primary" />, title: 'Immutable Audit Trail', desc: 'Every state change is cryptographically hashed and indexed.' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative px-4 overflow-hidden min-h-[90vh]">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Cyber Security Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden dark:opacity-100 opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff33_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff33_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <motion.div 
          initial={{ y: "-100%" }}
          animate={{ y: "200%" }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 w-full h-[3px] bg-primary/60 shadow-[0_0_20px_rgba(0,240,255,1)]"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10 relative">
        
        {/* Left Column: Hero Text */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start gap-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium tracking-wide shadow-glow">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            SYSTEM ONLINE & SECURED
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
          >
            BEL Secure<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Chain</span>
          </motion.h1>
          
          <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
            Bharat Electronics Limited defence-grade decentralized identity and access management. Protect national digital assets with unbreakable on-chain rules.
          </p>

          <WalletConnectButton />
        </motion.div>

        {/* Right Column: Features Bento Box */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative perspective-1000"
        >
          {features.map((f, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                rotateX: 5, 
                rotateY: -5,
                boxShadow: "0px 10px 30px rgba(0, 240, 255, 0.2)"
              }}
              className="bg-card/40 backdrop-blur-md border border-primary/20 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-all"
            >
              {/* Hover sweep effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-3 bg-primary/10 rounded-lg w-fit border border-primary/20 group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all"
              >
                {f.icon}
              </motion.div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
              
              {/* Corner tech accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-50 rounded-tl-lg"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-50 rounded-br-lg"></div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
