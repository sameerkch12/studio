import PincodeDashboard from "@/components/PincodeDashboard";
import { Pincodes } from "@/lib/types";

export default function CharodaPage() {
    return (
        <PincodeDashboard 
            pincode={Pincodes.CHARODA}
            pincodeName="Charoda"
        />
    )
}
