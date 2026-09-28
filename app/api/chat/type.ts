export type productFromAPI = {
  product_id: string;
  title: string;
  price: string;
  extracted_price: number;
  source: string;
  rating: number;
  reviews: number;
  thumbnail: string;
  product_link: string;
  source_icon: string;
};
export type resultData = {
  title: string;
  content: string;
  url: string;
};
export type WeatherResponse = {
  location: {
    name: string;
    region: string;
    country: string;
  };
  temperature: number;
  feelsLike: number;
  condition: {
    text: string;
    icon: string;
  };
  humidity: number;
  wind: {
    speed: number;
    direction: string;
  };
  precipitation: number;
  rainChance: number;
  visibility: number;
  uvIndex: number;
  isDay: number;
  lastUpdated: string;
};
