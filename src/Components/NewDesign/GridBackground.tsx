export default function GridBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#0a0a0a]">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2b1f41] to-[#0a0a0a]" />

      {/* Perspective grid container - positioned to align with content */}
      <div 
        className="absolute inset-0 flex items-center justify-center" 
        style={{ 
          perspective: '1200px',
          perspectiveOrigin: 'center 45%' 
        }}
      >
        {/* Main grid plane */}
        <div 
          className="absolute animate-perspectiveGridForward"
          style={{
            width: '400%',
            height: '600%',
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(80deg) translateZ(0px)',
            opacity: 0.5,
            backgroundPosition: 'center center'
          }}
        />
        
        {/* Secondary grid layer for depth */}
        <div 
          className="absolute animate-perspectiveGridForwardSlow"
          style={{
            width: '400%',
            height: '600%',
            backgroundImage: `
              linear-gradient(to right, rgba(147,51,234,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(147,51,234,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(80deg) translateZ(-80px)',
            opacity: 0.3,
            backgroundPosition: 'center center'
          }}
        />
      </div>
    </div>
  );
}
