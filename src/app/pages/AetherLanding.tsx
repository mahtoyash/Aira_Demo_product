import React from 'react';
import Hero from '../landing_components/Hero';
import TransitionLayer from '../landing_components/TransitionLayer';
import ProductSection from '../landing_components/ProductSection';
import DifferencesSection from '../landing_components/DifferencesSection';
import HowItWorksSection from '../landing_components/HowItWorksSection';
import PhysicalSpecsSection from '../landing_components/PhysicalSpecsSection';
import TeamShowcase from '../landing_components/TeamShowcase';

export function AetherLanding() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <TransitionLayer />
      <ProductSection />
      <DifferencesSection />
      <HowItWorksSection />
      <PhysicalSpecsSection />
      <TeamShowcase />
    </main>
  );
}
