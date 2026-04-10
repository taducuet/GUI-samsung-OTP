/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Key, ShieldCheck, Clock, Copy, RefreshCw, Info, ExternalLink } from 'lucide-react';
import { getOTP, getExpireMinutes } from '@/src/lib/otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function App() {
  const [inputKey, setInputKey] = useState('yzcxo');
  const [otp, setOtp] = useState('');
  const [expireMinutes, setExpireMinutes] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateOTP = async () => {
    if (!inputKey.trim()) {
      toast.error('Please enter a valid key');
      return;
    }
    setIsRefreshing(true);
    try {
      const newOtp = await getOTP(inputKey);
      setOtp(newOtp);
      setExpireMinutes(getExpireMinutes(inputKey));
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate OTP');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    calculateOTP();
    // Refresh every minute to keep OTP and expiration accurate
    const interval = setInterval(calculateOTP, 60000);
    return () => clearInterval(interval);
  }, [inputKey]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const isNumericKey = /^\d+$/.test(inputKey);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-zinc-700 selection:text-white p-4 md:p-8 flex flex-col items-center justify-center">
      <Toaster position="top-center" theme="dark" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl border border-zinc-800 mb-4">
            <Smartphone className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Samsung Service</h1>
          <p className="text-zinc-500 text-sm italic font-serif">OTP Decoder Tool</p>
        </div>

        {/* Main Card */}
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="border-bottom border-zinc-800/50 pb-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-zinc-300 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Authentication
              </CardTitle>
              <Badge variant="outline" className="bg-zinc-950 text-zinc-400 border-zinc-800 font-mono text-[10px] uppercase tracking-widest">
                {isNumericKey ? 'OneUI 8.0' : 'Legacy Mode'}
              </Badge>
            </div>
            <CardDescription className="text-zinc-500 text-xs">
              {isNumericKey 
                ? 'Numeric key detected. Using OneUI 8.0 logic.' 
                : 'Alphanumeric key detected. Using Legacy logic.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inputKey" className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Input Key
              </Label>
              <div className="relative">
                <Input
                  id="inputKey"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-zinc-700 h-12 font-mono text-lg tracking-wider pl-4 pr-12"
                  placeholder="Enter key (e.g. yzcxo)"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 h-10 w-10 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  onClick={calculateOTP}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Generated OTP
              </Label>
              <AnimatePresence mode="wait">
                <motion.div
                  key={otp}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative group"
                >
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-2 group-hover:border-zinc-700 transition-colors">
                    <span className="text-5xl font-bold tracking-tighter text-white font-mono">
                      {otp}
                    </span>
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      Verified Secure
                    </div>
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-none h-8 px-4 text-xs"
                      onClick={() => copyToClipboard(otp)}
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires in</span>
              </div>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-none font-mono">
                {expireMinutes}m
              </Badge>
            </div>
          </CardContent>

          <CardFooter className="bg-zinc-950/30 border-t border-zinc-800/50 py-4 px-6">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-zinc-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] leading-relaxed text-zinc-500 uppercase tracking-tight">
                  Instructions: Dial <span className="text-zinc-300">*#9900#</span>, select <span className="text-zinc-300">Silent Log</span>, check the <span className="text-zinc-300">Key</span>, and enter it above.
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Info */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="h-px w-12 bg-zinc-800" />
          <a 
            href="https://github.com/taducuet/samsung_service_mode_otp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors text-[10px] uppercase tracking-[0.2em]"
          >
            Source Code <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
