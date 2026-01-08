import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Trash2, Eye, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { UniversityHeader } from '@/components/layout/UniversityHeader';

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
      <UniversityHeader onSignOut={handleSignOut} />

      <main className="container mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-8 p-6 bg-card rounded-lg border-2 border-border">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Academic Schedules
          </h2>
          <p className="text-muted-foreground">
            Manage your course timetables, assign faculty, and generate optimized schedules.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            My Timetables
          </h3>
          <Button onClick={() => navigate('/create')} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Create New Schedule
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : timetables.length === 0 ? (
          <Card className="text-center py-12 border-2 border-dashed">
            <CardContent>
              <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Schedules Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first academic timetable to organize courses, faculty assignments, and class timings.
              </p>
              <Button onClick={() => navigate('/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetables.map((timetable) => (
              <Card key={timetable.id} className="hover:shadow-lg transition-all border-2 hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{timetable.name}</CardTitle>
                  <CardDescription>
                    Last updated: {format(new Date(timetable.updated_at), 'MMMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
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

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-muted-foreground text-sm border-t">
        <p>© 2025 University Timetable System. All rights reserved.</p>
      </footer>
    </div>
  );
}
