import React from 'react';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import TechStack from '../components/TechStack';
import Flow from '../components/Flow';
import Developers from '../components/Developers';
import Footer from '../components/Footer';

const Landing = () => {
  return (
    <div className="w-[min(1100px,90%)] mx-auto font-sans">
      <Nav />
      <Hero />
      <Stats />
      <TechStack />
      <Flow />
      <Developers />
      <Footer />
    </div>
  );
};

export default Landing;
