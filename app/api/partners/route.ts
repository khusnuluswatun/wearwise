import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// Helper to geocode address using Nominatim (OpenStreetMap)
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "WearWise/1.0",
      },
    });
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get("type");
    const userAddress = searchParams.get("userAddress");
    const userId = searchParams.get("userId"); // for partner to fetch own profile

    // Map input type to standardized database values
    let type = rawType;
    if (rawType) {
      const typeMap: Record<string, string> = {
        "tempat donasi": "donasi",
        "tempat recycle": "recycle",
        "umkm": "upcycle",
        "donate": "donasi",
        "donation": "donasi",
      };
      type = typeMap[rawType.toLowerCase()] || rawType.toLowerCase();
    }

    const whereClause: any = {};
    if (type) {
      if (type === "donasi" || type === "donate") {
        whereClause.type = { in: ["donasi", "donate", "tempat donasi", "donation"] };
      } else if (type === "recycle") {
        whereClause.type = { in: ["recycle", "tempat recycle"] };
      } else if (type === "upcycle") {
        whereClause.type = { in: ["upcycle", "umkm"] };
      } else {
        whereClause.type = type;
      }
    }
    if (userId) whereClause.userId = userId;

    const partners = await prisma.partner.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    let result = partners.map(p => ({
      ...p,
      distance: null as number | null,
    }));

    // If userAddress is provided, we sort by distance
    if (userAddress) {
      const userCoords = await geocode(userAddress);

      if (userCoords) {
        for (let i = 0; i < result.length; i++) {
          const p = result[i];
          
          // If partner has no lat/lng, try to geocode it (on-the-fly fallback)
          let pLat = p.latitude;
          let pLng = p.longitude;
          
          if ((!pLat || !pLng) && p.address) {
            const pCoords = await geocode(p.address);
            if (pCoords) {
              pLat = pCoords.lat;
              pLng = pCoords.lng;
              
              // We could save this back to DB optionally to avoid future geocoding
              // await prisma.partner.update({ where: { id: p.id }, data: { latitude: pLat, longitude: pLng } });
            }
          }

          if (pLat && pLng) {
            result[i].distance = calculateDistance(userCoords.lat, userCoords.lng, pLat, pLng);
          }
        }

        // Sort by distance (asc)
        result.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch partners" },
      { status: 500 }
    );
  }
}
