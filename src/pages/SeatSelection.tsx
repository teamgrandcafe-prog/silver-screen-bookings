import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Armchair, Monitor } from "lucide-react";

interface Seat {
  id: string;
  seat_number: string;
  row_letter: string;
  is_booked: boolean;
}

interface Showtime {
  id: string;
  price: number;
  start_time: string;
  movies: {
    title: string;
  };
}

const SeatSelection = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchSeatsAndShowtime();
  }, [showtimeId]);

  const fetchSeatsAndShowtime = async () => {
    try {
      const { data: showtimeData, error: showtimeError } = await supabase
        .from("showtimes")
        .select("*, movies(title)")
        .eq("id", showtimeId)
        .single();

      if (showtimeError) throw showtimeError;
      setShowtime(showtimeData);

      const { data: seatsData, error: seatsError } = await supabase
        .from("seats")
        .select("*")
        .eq("showtime_id", showtimeId)
        .order("row_letter")
        .order("seat_number");

      if (seatsError) throw seatsError;
      setSeats(seatsData || []);
    } catch (error: any) {
      toast.error("Failed to load seats");
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatId: string, isBooked: boolean) => {
    if (isBooked) return;

    const newSelected = new Set(selectedSeats);
    if (newSelected.has(seatId)) {
      newSelected.delete(seatId);
    } else {
      newSelected.add(seatId);
    }
    setSelectedSeats(newSelected);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSeats.size === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    setBooking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to book tickets");
        navigate("/auth");
        return;
      }

      const totalAmount = selectedSeats.size * (showtime?.price || 0);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: session.user.id,
          showtime_id: showtimeId,
          total_amount: totalAmount,
          customer_name: customerName,
          customer_email: customerEmail,
          status: "confirmed",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const seatUpdates = Array.from(selectedSeats).map((seatId) =>
        supabase
          .from("seats")
          .update({ is_booked: true, booking_id: bookingData.id })
          .eq("id", seatId)
      );

      await Promise.all(seatUpdates);

      toast.success("Booking confirmed!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.row_letter]) {
      acc[seat.row_letter] = [];
    }
    acc[seat.row_letter].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading seats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Select Your Seats</CardTitle>
                <p className="text-muted-foreground">
                  {showtime?.movies?.title} -{" "}
                  {showtime &&
                    new Date(showtime.start_time).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-8 flex justify-center">
                  <div className="bg-gradient-to-b from-accent to-transparent w-full max-w-md h-3 rounded-t-full flex items-start justify-center">
                    <Monitor className="h-6 w-6 text-accent-foreground -mt-1" />
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedSeats).map(([row, rowSeats]) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="text-foreground font-semibold w-8">{row}</span>
                      <div className="flex gap-2 flex-wrap">
                        {rowSeats.map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => toggleSeat(seat.id, seat.is_booked)}
                            disabled={seat.is_booked}
                            className={`
                              p-2 rounded transition-all
                              ${
                                seat.is_booked
                                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                                  : selectedSeats.has(seat.id)
                                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--cinema-red)/0.5)]"
                                  : "bg-card border border-border hover:border-primary hover:bg-card/80"
                              }
                            `}
                          >
                            <Armchair className="h-6 w-6" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-6 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-card border border-border rounded"></div>
                    <span className="text-foreground">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded"></div>
                    <span className="text-foreground">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted rounded"></div>
                    <span className="text-foreground">Booked</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selected Seats:</span>
                      <span className="text-foreground font-medium">
                        {selectedSeats.size}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per seat:</span>
                      <span className="text-foreground">${showtime?.price}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-foreground">Total:</span>
                      <span className="text-primary">
                        ${(selectedSeats.size * (showtime?.price || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={booking || selectedSeats.size === 0}
                  >
                    {booking ? "Processing..." : "Confirm Booking"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
