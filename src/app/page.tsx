'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Command, ShieldCheck, ArrowRight, Zap, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const features = [
    {
      href: '/permutator',
      title: 'Gmail Permutator',
      description: 'Generate thousands of valid aliases from a single Gmail address using bitwise dot injection.',
      icon: Command,
      color: 'text-blue-500',
      delay: 0.1
    },
    {
      href: '/vault',
      title: 'Password Vault',
      description: 'Zero-trust, client-side encryption for your credentials. Data never leaves your browser.',
      icon: ShieldCheck,
      color: 'text-green-500',
      delay: 0.2
    }
  ];

  return (
    <div className="flex flex-col gap-12 py-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <motion.h1 
          className="text-4xl md:text-6xl font-extrabold tracking-tight lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Identity Refraction & Security
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          PrismKey provides advanced tools to manage your digital footprint. 
          Generate aliases to track spam, and secure your keys offline.
        </motion.p>
      </section>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full px-4">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href} className="group">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: feature.delay }}
              className="h-full"
            >
              <Card className="h-full border-muted/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <feature.icon className={`w-10 h-10 ${feature.color}`} />
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Stats / Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full px-4 text-center">
          <div className="p-6 rounded-2xl bg-muted/20 border border-white/5">
             <div className="flex justify-center mb-4"><Zap className="w-6 h-6 text-yellow-500" /></div>
             <h3 className="font-semibold text-lg">Instant logic</h3>
             <p className="text-sm text-muted-foreground">0ms processing delay using Server Actions.</p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/20 border border-white/5">
             <div className="flex justify-center mb-4"><Lock className="w-6 h-6 text-purple-500" /></div>
             <h3 className="font-semibold text-lg">Zero Trust</h3>
             <p className="text-sm text-muted-foreground">Passwords generated via Web Crypto API.</p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/20 border border-white/5">
             <div className="flex justify-center mb-4"><Command className="w-6 h-6 text-blue-500" /></div>
             <h3 className="font-semibold text-lg">Bitwise Algo</h3>
             <p className="text-sm text-muted-foreground">Optimized permutation for max efficiency.</p>
          </div>
      </div>
    </div>
  );
}
