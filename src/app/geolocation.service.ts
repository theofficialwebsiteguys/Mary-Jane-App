import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  // Fast reject (cheap)
  private readonly NYBounds = {
    north: 45.02,
    south: 40.49,
    west: -79.80,
    east: -71.85,
  };

  // ✅ VERIFIED NY MultiPolygon (simplified Census boundary)
  private readonly NYPolygons: [number, number][][] = [
    // ---- Mainland NY ----
    [
      [-73.657336,40.985171],
      [-73.727775,41.100696],
      [-73.482709,41.21276],
      [-73.550961,41.295422],
      [-73.487314,42.049638],
      [-73.508142,42.086257],
      [-73.264957,42.74594],
      [-73.278673,42.83341],
      [-73.246821,43.52578],
      [-73.302076,43.624364],
      [-73.42791,43.634428],
      [-73.350593,43.771939],
      [-73.43774,44.045006],
      [-73.390805,44.189072],
      [-73.311025,44.27424],
      [-73.306707,44.500334],
      [-73.381848,44.589316],
      [-73.379452,44.83801],
      [-73.343124,45.01084],
      [-74.146814,44.9915],
      [-74.683973,44.99969],
      [-74.826578,45.01585],
      [-74.972463,44.983402],
      [-75.241303,44.866958],
      [-75.505903,44.705081],
      [-75.76623,44.515851],
      [-75.912985,44.368084],
      [-76.161833,44.280777],
      [-76.164265,44.239603],
      [-76.312647,44.199044],
      [-76.366972,44.100409],
      [-76.280677,43.959683],
      [-76.208009,43.977348],
      [-76.127285,43.897889],
      [-76.299065,43.839213],
      [-76.229268,43.804135],
      [-76.196596,43.649761],
      [-76.235834,43.529256],
      [-76.410636,43.523159],
      [-76.630774,43.413356],
      [-76.69836,43.344436],
      [-76.952174,43.270692],
      [-77.111866,43.287945],
      [-77.391015,43.276363],
      [-77.534184,43.234569],
      [-77.756931,43.337361],
      [-77.976438,43.369159],
      [-78.488857,43.374763],
      [-78.634346,43.357624],
      [-79.070469,43.262454],
      [-79.011563,42.985256],
      [-78.93236,42.955857],
      [-78.853455,42.783958],
      [-79.04886,42.689158],
      [-79.148723,42.553672],
      [-79.351989,42.48892],
      [-79.429119,42.42838],
      [-79.761951,42.26986],
      [-79.761374,41.999067],
      [-78.874759,41.997559],
      [-77.83203,41.998524],
      [-76.343722,41.998346],
      [-75.359579,41.999445],
      [-75.257825,41.862154],
      [-75.170565,41.871608],
      [-75.053431,41.752538],
      [-75.074626,41.607905],
      [-74.981652,41.479945],
      [-74.740932,41.43116],
      [-74.694914,41.357423],
      [-74.301994,41.172594],
      [-73.90268,40.997297],
      [-73.929006,40.889578],
      [-74.013784,40.756601],
      [-74.042412,40.624847],
      [-73.940591,40.542896],
      [-73.774928,40.590759],
      [-73.575357,40.573723],
      [-73.319257,40.635795],
      [-73.20844,40.630884],
      [-72.39585,40.86666],
      [-71.87391,41.052278],
      [-71.959595,41.071237],
      [-72.095456,40.991349],
      [-72.162898,41.053187],
      [-72.260515,41.042065],
      [-72.356087,41.133635],
      [-72.585327,40.997587],
      [-72.774104,40.965314],
      [-73.118331,40.978071],
      [-73.229285,40.905121],
      [-73.485365,40.946397],
      [-73.713674,40.870099],
      [-73.781369,40.794907],
      [-73.756776,40.912599],
      [-73.657336,40.985171]
    ],

    // ---- Staten Island ----
    [
      [-74.144428,40.53516],
      [-74.053125,40.603678],
      [-74.086485,40.648601],
      [-74.20058,40.631448],
      [-74.250188,40.496703],
      [-74.144428,40.53516]
    ]
  ];

  constructor() {}

  async isUserInNewYork(): Promise<boolean> {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') return false;

      const { coords } = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      // 1️⃣ fast bounding-box reject
      if (!this.isInsideBoundingBox(coords.latitude, coords.longitude)) {
        return false;
      }

      // 2️⃣ check against ANY NY polygon
      const point: [number, number] = [
        coords.longitude,
        coords.latitude
      ];

      return this.NYPolygons.some(polygon =>
        this.isPointInPolygon(point, polygon)
      );

    } catch (error) {
      console.error('Geolocation error:', error);
      return false;
    }
  }

  private isInsideBoundingBox(lat: number, lng: number): boolean {
    return (
      lat >= this.NYBounds.south &&
      lat <= this.NYBounds.north &&
      lng >= this.NYBounds.west &&
      lng <= this.NYBounds.east
    );
  }

  // Ray-casting
  private isPointInPolygon(
    point: [number, number],
    polygon: [number, number][]
  ): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect =
        (yi > y) !== (yj > y) &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }
}
