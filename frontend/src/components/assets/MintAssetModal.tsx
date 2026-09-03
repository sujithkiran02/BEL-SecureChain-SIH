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
  // We use the toast notifications from useTrustChain for success states, 
  // but we can track local success via IPFS uri check for now
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState('');
  const [classification, setClassification] = React.useState('Confidential');
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

      // Upload to IPFS (Mock)
      const res = await axios.post('/api/assets/upload', formData);
      const uri = res.data.uri;
      setIpfsUri(uri);

      // Mint on-chain
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
      // Reset form after 2 seconds on success
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-panel p-6 border-primary/20 shadow-[0_0_40px_rgba(0,240,255,0.1)] rounded-xl scrollbar-thin scrollbar-thumb-primary/20"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="text-primary text-glow">Mint Digital Asset</span>
            </h2>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground">Asset Secured!</h3>
                <p className="text-muted-foreground mt-2 break-all text-sm">URI: {ipfsUri}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Asset Name</label>
                  <input 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    type="text" 
                    className="w-full bg-background/50 border border-muted rounded-md px-4 py-2 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. Project Apollo Schematic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Classification Level</label>
                  <select 
                    value={classification}
                    onChange={e => setClassification(e.target.value)}
                    className="w-full bg-background/50 border border-muted rounded-md px-4 py-2 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="Confidential">Confidential</option>
                    <option value="Secret">Secret</option>
                    <option value="Top Secret">Top Secret</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Secure Document</label>
                  <div 
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50 bg-background/20'}`}
                  >
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <UploadCloud className={`w-10 h-10 mb-2 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">
                        {file ? file.name : 'Click or Drag & Drop'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">PDF, DOCX, ZIP up to 50MB</span>
                    </label>
                  </div>
                </div>

                {error && <p className="text-destructive text-sm">{error.message}</p>}

                <button
                  type="submit"
                  disabled={!file || !name || uploading || isPending}
                  className="w-full relative overflow-hidden group bg-primary/10 border border-primary/50 text-primary font-bold py-3 px-6 rounded-md transition-all hover:bg-primary/20 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {uploading || isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> {uploading ? 'Encrypting & Pinning...' : 'Confirming on Chain...'}</>
                    ) : (
                      'Mint Tokenized Asset'
                    )}
                  </span>
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
