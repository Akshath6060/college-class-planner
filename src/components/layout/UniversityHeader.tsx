import { GraduationCap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UniversityHeaderProps {
  onSignOut?: () => void;
  showSignOut?: boolean;
}

export function UniversityHeader({ onSignOut, showSignOut = true }: UniversityHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-primary text-primary-foreground border-b-4 border-[hsl(35,80%,55%)]">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <div className="p-2 bg-[hsl(35,80%,55%)] rounded-full">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              University Timetable
            </h1>
            <p className="text-xs text-primary-foreground/70">Academic Schedule Management System</p>
          </div>
        </div>
        {showSignOut && onSignOut && (
          <Button 
            variant="ghost" 
            onClick={onSignOut}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}
      </div>
    </header>
  );
}
