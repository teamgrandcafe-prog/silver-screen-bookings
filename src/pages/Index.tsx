import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Film, Ticket, User, LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();

        setIsAdmin(!!roleData);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Film className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">CineMax</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")}>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl md:text-7xl font-bold text-foreground">
            Experience Cinema
            <span className="block text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">
              Like Never Before
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Book your favorite movies, select the perfect seats, and enjoy an unforgettable
            cinematic experience at CineMax Theater.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-[0_0_30px_hsl(var(--cinema-red)/0.4)] hover:shadow-[0_0_50px_hsl(var(--cinema-red)/0.6)] transition-all"
              onClick={() => navigate("/movies")}
            >
              <Ticket className="h-5 w-5 mr-2" />
              Browse Movies
            </Button>
            {!user && (
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate("/auth")}
              >
                Create Account
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-primary transition-colors">
              <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Film className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Latest Movies</h3>
              <p className="text-muted-foreground">
                Watch the newest blockbusters and indie films
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-primary transition-colors">
              <div className="bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy Booking</h3>
              <p className="text-muted-foreground">
                Select seats and book tickets in seconds
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-primary transition-colors">
              <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Premium Experience</h3>
              <p className="text-muted-foreground">
                Comfortable seats and state-of-the-art screens
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
