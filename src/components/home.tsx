import React from "react";
import ProfessionalWebGISApp from "./ProfessionalWebGISApp";

/**
 * Home Component - Wrapper for ProfessionalWebGISApp
 * 
 * This component serves as a simple wrapper that loads the main ProfessionalWebGISApp
 * component which contains all the advanced features including PostgreSQL persistence,
 * AI Assistant, and comprehensive data visualization capabilities.
 * 
 * @component
 */

interface HomeProps {
  /** Optional CSS class name for styling */
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className = "" }) => {
  console.log('🏠 Home component mounted - loading ProfessionalWebGISApp...');
  
  return <ProfessionalWebGISApp />;
};

Home.displayName = 'Home';

export default Home;