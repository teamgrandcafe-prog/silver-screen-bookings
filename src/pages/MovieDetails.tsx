import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Film } from "lucide-react";
import { toast } from "sonner";

interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string | null;
  duration_minutes: number;
  rating: string;
  genre: string;
}

interface Showtime {
  id: string;
  start_time: string;
  price: number;
  screen_number: number;
}

const MovieDetails = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      const { data: movieData, error: movieError } = await supabase
        .from("movies")
        .select("*")
        .eq("id", movieId)
        .single();

      if (movieError) throw movieError;
      setMovie(movieData);

      const { data: showtimesData, error: showtimesError } = await supabase
        .from("showtimes")
        .select("*")
        .eq("movie_id", movieId)
        .gte("start_time", new Date().toISOString())
        .order("start_time");

      if (showtimesError) throw showtimesError;
      setShowtimes(showtimesData || []);
    } catch (error: any) {
      toast.error("Failed to load movie details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Movie not found</p>
          <Button onClick={() => navigate("/movies")}>Back to Movies</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate("/movies")} className="mb-6">
          Back to Movies
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Film className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{movie.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded">
                  {movie.rating}
                </span>
                <span className="text-accent">{movie.genre}</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{movie.duration_minutes} min</span>
                </div>
              </div>
              <p className="text-foreground leading-relaxed">{movie.description}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Select Showtime</h2>
              {showtimes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No showtimes available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {showtimes.map((showtime) => (
                    <Card key={showtime.id} className="hover:border-primary transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {new Date(showtime.start_time).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-2xl font-bold text-primary">
                          {new Date(showtime.start_time).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Screen {showtime.screen_number}
                          </span>
                          <span className="text-lg font-semibold text-accent">
                            ${showtime.price}
                          </span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => navigate(`/seats/${showtime.id}`)}
                        >
                          Select Seats
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
