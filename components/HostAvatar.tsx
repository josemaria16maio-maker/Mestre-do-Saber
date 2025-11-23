import React from 'react';

interface HostAvatarProps {
  isSpeaking: boolean;
  emotion: 'neutral' | 'happy' | 'serious';
}

const HostAvatar: React.FC<HostAvatarProps> = ({ isSpeaking, emotion }) => {
  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-4">
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full blur-lg opacity-50 transition-colors duration-500 ${
        emotion === 'happy' ? 'bg-yellow-400' : emotion === 'serious' ? 'bg-red-500' : 'bg-blue-500'
      }`}></div>
      
      <div className="relative w-full h-full bg-gray-200 rounded-full overflow-hidden border-4 border-gray-100 shadow-xl flex items-center justify-center bg-gradient-to-b from-slate-300 to-slate-400">
        {/* Simple CSS Avatar representation */}
        <div className="flex flex-col items-center mt-4">
            {/* Hair */}
            <div className="w-20 h-8 bg-gray-700 rounded-t-full mb-[-5px] z-10"></div>
            {/* Face */}
            <div className="w-16 h-16 bg-[#f1c27d] rounded-full flex flex-col items-center justify-center relative">
                {/* Eyes */}
                <div className="flex space-x-4 mt-[-5px]">
                    <div className={`w-2 h-2 bg-black rounded-full transition-all ${emotion==='serious' ? 'h-1' : ''}`}></div>
                    <div className={`w-2 h-2 bg-black rounded-full transition-all ${emotion==='serious' ? 'h-1' : ''}`}></div>
                </div>
                {/* Mouth */}
                <div className={`mt-3 bg-black transition-all duration-100
                    ${isSpeaking ? 'w-6 h-3 rounded-full animate-pulse' : 'w-4 h-1 rounded-sm'}
                    ${emotion === 'happy' && !isSpeaking ? 'w-6 h-3 border-b-2 border-black bg-transparent rounded-b-full' : ''}
                `}></div>
            </div>
            {/* Suit */}
            <div className="w-24 h-12 bg-slate-900 mt-[-5px] relative flex justify-center">
                <div className="w-4 h-8 bg-white mt-1 clip-path-triangle"></div>
                <div className="w-2 h-4 bg-red-600 absolute top-4"></div>
            </div>
        </div>
      </div>
      
      {/* Microphone Icon */}
      <div className="absolute bottom-0 right-0 bg-gray-800 p-2 rounded-full border border-gray-600">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

export default HostAvatar;