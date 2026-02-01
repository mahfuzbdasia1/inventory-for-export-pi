
import React from 'react';
import { Showroom } from '../types';
import { MapPin, Phone, User, ExternalLink, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ShowroomsListProps {
  showrooms: Showroom[];
  setSelectedShowroomId: (id: string) => void;
}

const ShowroomsList: React.FC<ShowroomsListProps> = ({ showrooms, setSelectedShowroomId }) => {
  const navigate = useNavigate();

  const handleViewStock = (showroomId: string) => {
    setSelectedShowroomId(showroomId);
    navigate('/inventory', { state: { filterShowroom: showroomId } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Branch Showrooms</h1>
        <Link 
          to="/settings" 
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Settings size={18} />
          Branch Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showrooms.map(s => (
          <div key={s.id} className="wp-card rounded-md overflow-hidden group hover:border-blue-500 transition-colors">
            <div className="h-32 bg-gray-200 relative">
              <img src={`https://picsum.photos/seed/${s.id}/400/200`} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-bold text-lg drop-shadow-md">{s.name}</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="mt-0.5 text-blue-600" />
                  <span>{s.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} className="text-blue-600" />
                  <span>+880-17XX-XXXXXX</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} className="text-blue-600" />
                  <span>Manager: S. Rahman</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded">ACTIVE</span>
                <button 
                  onClick={() => handleViewStock(s.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline"
                >
                  View Stock Details
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowroomsList;
