'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { useTrustChain } from '@/hooks/useTrustChain';
import { useAccount } from 'wagmi';
import axios from 'axios';

interface MintAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MintAssetModal({ isOpen, onClose }: MintAssetModalProps) {
  const { address } = useAccount();
  const { mintAsset, isMintPending: isPending } = useTrustChain();
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState('');
  const [classification, setClassification] = React.useState('TOP_SECRET');
  const [uploading, setUploading] = React.useState(false);
  const [ipfsUri, setIpfsUri] = React.useState<string | null>(null);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !address) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('classification', classification);

      // Upload to secure backend storage and generate SHA-256 hash
      const token = localStorage.getItem('auth_token');
      const res = await axios.post('http://localhost:3001/api/assets/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const uri = res.data.metadataHash;
      setIpfsUri(uri);

      // Mint on-chain using the secure hash
      mintAsset(address, uri);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => {
        onClose();
        setFile(null);
        setName('');
        setIpfsUri(null);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [isSuccess, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-card border border-muted/80 dark:border-white/10 p-5 sm:p-6 shadow-2xl rounded-2xl flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b border-muted/60 dark:border-white/5 pb-3">
              <h2 className="text-base sm:text-lg font-bold font-heading text-foreground">
                Mint Confidential Asset (NFT)
              </h2>
              <button 
                onClick={onClose} 
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                </motion.div>
                <h3 className="text-base font-bold text-foreground">Asset Secured on Chain!</h3>
                <p className="text-muted-foreground mt-1 break-all text-xs font-mono">URI: {ipfsUri}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Asset Name</label>
                  <input 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    type="text" 
                    className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Swathi Radar Phase-III Blueprint"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Classification Level</label>
                  <select 
                    value={classification}
                    onChange={e => setClassification(e.target.value)}
                    className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="TOP_SECRET">TOP_SECRET</option>
                    <option value="SECRET">SECRET</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Confidential Payload</label>
                  <div 
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center mt-1 transition-all ${file ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50 bg-muted/20'}`}
                  >
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <UploadCloud className={`w-8 h-8 mb-1.5 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-medium text-foreground truncate max-w-full">
                        {file ? file.name : 'Click to select or drag document'}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">PDF, CAD, ZIP (Encrypted on upload)</span>
                    </label>
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs font-mono">{error.message}</p>}

                <div className="flex justify-end gap-2 pt-2 border-t border-muted/60 dark:border-white/5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl border border-muted text-muted-foreground text-xs font-mono font-medium hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!file || !name || uploading || isPending}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-mono font-medium text-xs hover:bg-primary/90 shadow-sm disabled:opacity-50"
                  >
                    {uploading || isPending ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {uploading ? 'Encrypting & Pinning...' : 'Confirming on Chain...'}
                      </span>
                    ) : (
                      'Mint Tokenized Asset'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
