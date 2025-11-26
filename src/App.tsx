import React, { useState, useRef } from 'react';
import RouteForm, { RouteFormData } from './components/RouteForm';
import ImageSlideshow from './components/ImageSlideshow';
import { geocodeAddress, getRouteCoordinates, getMapillaryImagesBatch } from './services/api';
import { generateEvenlySpacedPoints, distance } from './utils/calculations';
import './App.css';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
}

const App: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '',
  });
  const [showSlideshow, setShowSlideshow] = useState(false);
  const cancelDownloadRef = useRef(false);

  const parseCoordinateInput = (input: string): string => {
    // Check if it's already in coordinate format
    const trimmed = input.trim();
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((s) => s.trim());
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          // Validate lat/lon ranges
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            // Input is lat,lon - convert to lon,lat for OSRM
            console.log(`Parsed coordinates: lat=${lat}, lon=${lon} -> OSRM format: ${lon},${lat}`);
            return `${lon},${lat}`;
          } else {
            throw new Error(`Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180. Got: ${lat},${lon}`);
          }
        }
      }
    }
    return input; // Return as-is for geocoding
  };

  const isCoordinates = (input: string): boolean => {
    const trimmed = input.trim();
    // Must contain exactly one comma
    const parts = trimmed.split(',');
    if (parts.length !== 2) return false;
    
    // Both parts must be valid numbers
    const first = parseFloat(parts[0].trim());
    const second = parseFloat(parts[1].trim());
    
    if (isNaN(first) || isNaN(second)) return false;
    
    // Check if they're in valid lat/lon ranges
    // Could be lat,lon or lon,lat format
    const isLatLon = first >= -90 && first <= 90 && second >= -180 && second <= 180;
    const isLonLat = second >= -90 && second <= 90 && first >= -180 && first <= 180;
    
    return isLatLon || isLonLat;
  };

  const handleFormSubmit = async (formData: RouteFormData) => {
    setLoadingState({ isLoading: true, progress: 0, message: 'Processing route...' });
    setImages([]);
    setCoordinates([]);
    setShowSlideshow(false);
    cancelDownloadRef.current = false; // Reset cancel flag for new download

    try {
      // Parse or geocode origin and destination
      setLoadingState({ isLoading: true, progress: 10, message: 'Geocoding origin...' });
      let originCoords: string;
      if (isCoordinates(formData.origin)) {
        originCoords = parseCoordinateInput(formData.origin);
        console.log('Origin is coordinates:', originCoords);
      } else {
        console.log('Geocoding origin address:', formData.origin);
        originCoords = await geocodeAddress(formData.origin);
      }
      console.log('Origin coords (lon,lat):', originCoords);

      setLoadingState({ isLoading: true, progress: 20, message: 'Geocoding destination...' });
      let destCoords: string;
      if (isCoordinates(formData.destination)) {
        destCoords = parseCoordinateInput(formData.destination);
        console.log('Destination is coordinates:', destCoords);
      } else {
        console.log('Geocoding destination address:', formData.destination);
        destCoords = await geocodeAddress(formData.destination);
      }
      console.log('Destination coords (lon,lat):', destCoords);

      // Get route coordinates
      setLoadingState({ isLoading: true, progress: 30, message: 'Fetching route...' });
      const routeCoords = await getRouteCoordinates(originCoords, destCoords);

      if (routeCoords.length === 0) {
        alert('No route found between these locations');
        setLoadingState({ isLoading: false, progress: 0, message: '' });
        return;
      }

      // Generate evenly spaced points along the route (default 50m spacing)
      // This ensures we get images at regular intervals instead of clustering
      setLoadingState({ isLoading: true, progress: 30, message: 'Generating evenly spaced waypoints...' });
      const spacedPoints = generateEvenlySpacedPoints(routeCoords, 50); // 50 meters between points
      
      console.log(`Route has ${routeCoords.length} points, generated ${spacedPoints.length} evenly spaced waypoints`);

      // Fetch images for each waypoint
      const fetchedImages: string[] = [];
      const fetchedCoordinates: [number, number][] = [];
      const usedImageIds = new Set<string>();
      const usedImageLocations: [number, number][] = [];
      const minImageDistanceKm = 0.03; // 30 meters minimum between images

      // Prepare all points with their headings
      const pointsToFetch = spacedPoints.map(({ coord, bearing }) => {
        return { coord, heading: bearing };
      });

      // Show slideshow immediately with empty images - it will display loading state
      setShowSlideshow(true);
      
      // Fetch images in batches of 10 for much faster processing
      setLoadingState({
        isLoading: true,
        progress: 35,
        message: `Fetching images in parallel batches...`,
      });

      const batchSize = 10;
      for (let i = 0; i < pointsToFetch.length; i += batchSize) {
        // Check if download was cancelled
        if (cancelDownloadRef.current) {
          console.log('Download cancelled by user');
          break;
        }
        
        const batch = pointsToFetch.slice(i, i + batchSize);
        const batchResults = await getMapillaryImagesBatch(batch, batchSize);
        
        // Process batch results
        batchResults.forEach((imageData, idx) => {
          if (imageData && !usedImageIds.has(imageData.id)) {
            const [imgLon, imgLat] = imageData.geometry.coordinates;
            const imageCoord: [number, number] = [imgLat, imgLon];
            
            let tooClose = false;
            for (const usedLocation of usedImageLocations) {
              if (distance(imageCoord, usedLocation) < minImageDistanceKm) {
                tooClose = true;
                break;
              }
            }
            
            if (!tooClose) {
              fetchedImages.push(imageData.thumbUrl);
              fetchedCoordinates.push(imageCoord);
              usedImageIds.add(imageData.id);
              usedImageLocations.push(imageCoord);
            }
          }
        });

        // Update images progressively as they're fetched
        setImages([...fetchedImages]);
        setCoordinates([...fetchedCoordinates]);

        const progress = 35 + Math.floor(((i + batch.length) / pointsToFetch.length) * 65);
        setLoadingState({
          isLoading: true,
          progress,
          message: `Fetched ${Math.min(i + batchSize, pointsToFetch.length)}/${pointsToFetch.length} images (${fetchedImages.length} unique)`,
        });
      }

      setLoadingState({ isLoading: false, progress: 100, message: 'Complete!' });
    } catch (error) {
      console.error('Error generating route:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoadingState({ isLoading: false, progress: 0, message: '' });
    }
  };

  const handleCloseSlideshow = () => {
    cancelDownloadRef.current = true;
    setShowSlideshow(false);
    setLoadingState({ isLoading: false, progress: 0, message: '' });
  };

  return (
    <div className={`App ${showSlideshow ? 'slideshow-active' : ''}`}>
      {!showSlideshow ? (
        <RouteForm onSubmit={handleFormSubmit} isLoading={loadingState.isLoading} />
      ) : (
        <ImageSlideshow 
          images={images} 
          coordinates={coordinates} 
          onClose={handleCloseSlideshow}
          isLoading={loadingState.isLoading}
          loadingMessage={loadingState.message}
        />
      )}
    </div>
  );
};

export default App;
