export default function Logo({ className = 'h-8', onClick }) {
  return (
    <img 
      src="/landingpage.png" 
      alt="ROBOAGENT" 
      className={`${className} cursor-pointer object-contain`} 
      onClick={onClick}
    />
  );
}
