import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Trash2, Eye, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SavedTimetable {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTimetables();
    }
  }, [user]);

  const fetchTimetables = async () => {
    const { data, error } = await supabase
      .from('timetables')
      .select('id, name, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load timetables');
    } else {
      setTimetables(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('timetables').delete().eq('id', id);
    setDeletingId(null);

    if (error) {
      toast.error('Failed to delete timetable');
    } else {
      setTimetables((prev) => prev.filter((t) => t.id !== id));
      toast.success('Timetable deleted');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Timetable Generator</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Timetables</h2>
          <Button onClick={() => navigate('/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : timetables.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No timetables yet</h3>
              <p className="text-muted-foreground mb-4">Create your first timetable to get started</p>
              <Button onClick={() => navigate('/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Timetable
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetables.map((timetable) => (
              <Card key={timetable.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{timetable.name}</CardTitle>
                  <CardDescription>
                    Updated {format(new Date(timetable.updated_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/view/${timetable.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(timetable.id)}
                      disabled={deletingId === timetable.id}
                    >
                      {deletingId === timetable.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
