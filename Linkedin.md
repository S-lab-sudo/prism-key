# 🚀 Just Launched: PrismKey – A Zero-Knowledge Security Suite

I’m excited to share my latest engineering project, **PrismKey** – a secure Password Vault and Gmail Permutator built with **Next.js 15** and **React 19**.

This wasn’t just about building a UI; it was about architecting a **security-first application** where user data privacy is absolute. I implemented a **Zero-Knowledge Architecture**, meaning encryption happens entirely in the browser. The server never sees the master password or raw data.

### 🛠️ Technical Highlights:

- **Client-Side Encryption**: Implemented **AES-GCM 256-bit encryption** using the Web Crypto API.
- **Secure Key Derivation**: Used **PBKDF2** with 100,000 iterations to derive keys from the master password.
- **True Randomness**: Built a password generator using **Rejection Sampling** (not just `Math.random()`) to eliminate modulo bias and ensure cryptographic uniformity.
- **Optimistic UI & Sync**: Engineered a custom sync engine with **Zustand** that handles offline operations and synchronizes encrypted payloads with **Supabase**.
- **Test-Driven Reliability**: Wrote a comprehensive **Vitest** suite achieving 100% coverage on critical security modules.

### 💻 The Stack:

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State**: Zustand + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth)
- **Testing**: Vitest + React Testing Library
- **Styling**: Tailwind CSS + Shadcn/UI

The focus was on creating something that isn't just functional, but **architecturally sound** and **accessible** (WCAG 2.1 Level A compliant).

Check it out live here: [INSERT YOUR LIVE URL HERE]

#NextJS #TypeScript #WebSecurity #Cryptography #React19 #SoftwareEngineering #OpenSource
