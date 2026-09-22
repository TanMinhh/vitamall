import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { iconsForLeafpad } from "../../assets/assets";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

type LiveLocation = {
    lat?: number;
    lng?: number;
} | null;

type OrderData = {
    status: string;
    shippingAddress?: {
        lat?: number;
        lng?: number;
    };
};

const cartoBasemapUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_BASEMAP_API_KEY || "cb1_3lfe_1_114b0eb761926e117f8be17f"}`;
const district7Center: [number, number] = [10.7371, 106.7204];

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);

    return null;
}

export default function LiveMap({ order, liveLocation }: { order: OrderData; liveLocation: LiveLocation }) {

    // Custom delivery truck icon
    const truckIcon = new L.Icon({
        iconUrl: iconsForLeafpad.truck,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });

    // Destination pin icon
    const destinationIcon = new L.Icon({
        iconUrl: iconsForLeafpad.destination,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const hasLiveLocation = !!liveLocation && typeof liveLocation.lat === "number" && typeof liveLocation.lng === "number" && liveLocation.lat !== 0;
    const hasDestination = !!order.shippingAddress && typeof order.shippingAddress.lat === "number" && typeof order.shippingAddress.lng === "number";
    const mapCenter: [number, number] = hasLiveLocation
        ? [liveLocation!.lat as number, liveLocation!.lng as number]
        : hasDestination
            ? [order.shippingAddress!.lat as number, order.shippingAddress!.lng as number]
            : district7Center;

    return (
        <>
            {order.status !== "Delivered" && order.status !== "Cancelled" && (
                <div className="rounded-2xl overflow-hidden border border-app-border relative z-0" style={{ height: 280 }}>
                    {hasLiveLocation ? (
                        <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%", zIndex: 0 }} zoomControl={false} className="relative z-0">
                            <TileLayer
                                url={cartoBasemapUrl}
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            <Marker position={[liveLocation!.lat as number, liveLocation!.lng as number]} icon={truckIcon}>
                                <Popup>Delivery Partner</Popup>
                            </Marker>
                            {hasDestination && (
                                <Marker position={[order.shippingAddress!.lat as number, order.shippingAddress!.lng as number]} icon={destinationIcon}>
                                    <Popup>Delivery Address</Popup>
                                </Marker>
                            )}
                            <MapUpdater center={mapCenter} />
                        </MapContainer>
                    ) : hasDestination ? (
                        <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%", zIndex: 0 }} zoomControl={false} className="relative z-0">
                            <TileLayer
                                url={cartoBasemapUrl}
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            <Marker position={[order.shippingAddress!.lat as number, order.shippingAddress!.lng as number]} icon={destinationIcon}>
                                <Popup>Delivery Address</Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }} zoomControl={false} className="relative z-0">
                            <TileLayer
                                url={cartoBasemapUrl}
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            <Marker position={district7Center} icon={destinationIcon}>
                                <Popup>District 7, Ho Chi Minh City</Popup>
                            </Marker>
                        </MapContainer>
                    )}
                </div>
            )}
        </>
    )
}
