'use client';

import { NavBar } from '@/components/landing/NavBar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import Script from 'next/script';

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Your App',
        description: 'Your app helps you manage and optimize your workflow with ' +
          'powerful features and intuitive interface.',
        url: 'https://your-domain.com',
        potentialAction: {
          '@type': 'SearchAction',
          'target': 'https://your-domain.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        name: 'Your Company',
        url: 'https://your-domain.com',
        logo: 'https://your-domain.com/logo.png',
        sameAs: [
          'https://twitter.com/yourapp',
          'https://linkedin.com/company/yourapp',
          'https://github.com/yourapp'
        ]
      },
      {
        '@type': 'Product',
        name: 'Your App',
        description: 'Professional workflow management solution',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '9',
          highPrice: '99',
          offerCount: '3',
        }
      }
    ]
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
      >
        {JSON.stringify(jsonLd)}
      </Script>
      <div className="min-h-screen bg-white dark:bg-gray-900 scroll-smooth overflow-x-hidden">
        <NavBar />
        <main className="snap-y snap-mandatory">
          <section className="h-screen flex items-center snap-start">
            <HeroSection />
          </section>
          <section id="features" className="h-screen flex items-center justify-center">
            <FeaturesSection />
          </section>
          <section id="pricing" className="min-h-screen flex flex-col justify-start snap-start pt-16">
            <PricingSection />
          </section>
          <section className="h-screen flex items-center snap-start">
            <CTASection />
          </section>
          <section className="min-h-screen flex items-center py-20">
            <FAQSection />
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
} 