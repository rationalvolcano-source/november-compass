import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Gift, Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
  itemCount: number;
}

export const PaymentDialog = ({ 
  open, 
  onOpenChange, 
  onPaymentSuccess, 
  itemCount 
}: PaymentDialogProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const VALID_COUPON = "FREE100%";
  const PRICE = 99;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === VALID_COUPON) {
      setCouponApplied(true);
      toast({
        title: "Coupon Applied!",
        description: "You get 100% off! Click 'Download Free' to continue.",
      });
    } else {
      toast({
        title: "Invalid Coupon",
        description: "The coupon code is not valid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFreeDownload = () => {
    onPaymentSuccess();
    onOpenChange(false);
    setCouponCode("");
    setCouponApplied(false);
  };

  const handlePayWithRazorpay = async () => {
    setIsProcessing(true);

    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const options = {
      key: "rzp_test_1234567890abcde", // Demo key - replace with real key
      amount: PRICE * 100, // Amount in paise
      currency: "INR",
      name: "Current Affairs Pocket PDF",
      description: `PDF Download - ${itemCount} Items`,
      handler: function (response: any) {
        console.log("Payment successful:", response);
        toast({
          title: "Payment Successful!",
          description: "Your PDF is now ready to download.",
        });
        onPaymentSuccess();
        onOpenChange(false);
        setCouponCode("");
        setCouponApplied(false);
        setIsProcessing(false);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      notes: {
        itemCount: itemCount.toString(),
      },
      theme: {
        color: "#0891b2",
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      toast({
        title: "Payment Error",
        description: "Could not initialize payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Download PDF
          </DialogTitle>
          <DialogDescription>
            Complete payment to download your curated PDF with {itemCount} news items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price Display */}
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
            {couponApplied ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl text-muted-foreground line-through">₹{PRICE}</span>
                <span className="text-4xl font-bold text-green-500">₹0</span>
                <Badge className="bg-green-500">100% OFF</Badge>
              </div>
            ) : (
              <p className="text-4xl font-bold text-primary">₹{PRICE}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">One-time payment • Instant download</p>
          </div>

          {/* Coupon Section */}
          <div className="space-y-3">
            <Label htmlFor="coupon" className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Have a coupon code?
            </Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponApplied}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={couponApplied || !couponCode.trim()}
              >
                {couponApplied ? <Check className="h-4 w-4" /> : "Apply"}
              </Button>
            </div>
            {couponApplied && (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Coupon "{VALID_COUPON}" applied successfully!
              </p>
            )}
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3">
            {couponApplied ? (
              <Button
                onClick={handleFreeDownload}
                className="w-full h-12 text-lg bg-green-500 hover:bg-green-600"
              >
                <Check className="h-5 w-5 mr-2" />
                Download Free
              </Button>
            ) : (
              <Button
                onClick={handlePayWithRazorpay}
                disabled={isProcessing}
                className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay ₹{PRICE} with UPI / Card
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Secure Payment
            </span>
            <span>•</span>
            <span>UPI Enabled</span>
            <span>•</span>
            <span>Razorpay Secured</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Extend window type for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}
